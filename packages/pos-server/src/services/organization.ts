import { InjectedDependencies, pull, push, SyncFns } from '.';
import { OrganizationProps, ORGANIZATION_COLLECTION_NAME } from '../models/Organization';
import { PAYMENT_TYPE_COLLECTION_NAME } from '../models/PaymentType';
import { toClientChanges } from '../utils/sync';
import { CommonServiceFns } from './product';

export type OrganizationService = CommonServiceFns<OrganizationProps> & SyncFns;

export type OrganizationClientProps = {
    id: string;
    name: string;
    email: string;
    phone: string;
    vat: string;
    addressLine1: string;
    addressLine2: string;
    addressCity: string;
    addressCounty: string;
    addressPostcode: string;
    defaultPriceGroupId: string;
    receiptPrinterId: string;
    currency: string;
    maxBills: number;
    shortNameLength: number;
    maxDiscounts: number;
    gracePeriodMinutes: number;
    categoryGridSize: number;
};

export const organizationFromClient = (organization: OrganizationClientProps): OrganizationProps => {
    const { id, name, email, phone, vat } = organization;

    return {
        id,
        name,
        email,
        phone,
        vat,
        settings: {
            defaultPriceGroupId: organization.defaultPriceGroupId,
            receiptPrinterId: organization.receiptPrinterId,
            currency: organization.currency,
            maxBills: organization.maxBills,
            shortNameLength: organization.shortNameLength,
            maxDiscounts: organization.maxDiscounts,
            gracePeriodMinutes: organization.gracePeriodMinutes,
            categoryGridSize: organization.categoryGridSize,
        },
        address: {
            line1: organization.addressLine1,
            line2: organization.addressLine2,
            city: organization.addressCity,
            county: organization.addressCounty,
            postcode: organization.addressPostcode,
        },
    };
};

export const organizationToClient = (organization: OrganizationProps): OrganizationClientProps => {
    const { _id, name, email, phone, vat, address, settings = {} } = organization;

    console.log('organization', organization);
    return {
        id: _id,
        name,
        email,
        phone,
        vat,
        defaultPriceGroupId: settings.defaultPriceGroupId,
        receiptPrinterId: settings.receiptPrinterId,
        currency: settings.currency,
        maxBills: settings.maxBills,
        shortNameLength: settings.shortNameLength,
        maxDiscounts: settings.maxDiscounts,
        gracePeriodMinutes: settings.gracePeriodMinutes,
        categoryGridSize: settings.categoryGridSize,
        addressLine1: address.line1,
        addressLine2: address.line2,
        addressCity: address.city,
        addressCounty: address.county,
        addressPostcode: address.postcode,
    };
};

export const organizationService = ({
    repositories: { organizationRepository, paymentTypeRepository },
    logger,
}: InjectedDependencies): OrganizationService => {
    const pullChanges = async ({ lastPulledAt }) => {
        const [organizations, paymentTypes] = await Promise.all([
            pull(organizationRepository, lastPulledAt),
            pull(paymentTypeRepository, lastPulledAt),
        ]);

        const changes = {
            ...toClientChanges({
                [ORGANIZATION_COLLECTION_NAME]: {
                    created: organizations.created.map(organizationToClient), // n/a
                    updated: organizations.updated.map(organizationToClient),
                    deleted: [], // n/a
                },
            }),
            ...toClientChanges({ [PAYMENT_TYPE_COLLECTION_NAME]: paymentTypes }),
        };

        console.log('changes', JSON.stringify(changes, null, 4));
        return changes;
    };

    const pushChanges = async ({ lastPulledAt, changes }) => {
        const _changes = {
            created: changes[ORGANIZATION_COLLECTION_NAME].created.map(organizationFromClient),
            updated: changes[ORGANIZATION_COLLECTION_NAME].updated.map(organizationFromClient),
            deleted: [],
        };

        // dont push payment type changes

        await push(organizationRepository, _changes, lastPulledAt);
    };

    return {
        ...organizationRepository, //TODO
        pullChanges,
        pushChanges,
    };
};
