import mongoose, { Schema } from 'mongoose';
import { tenantModel } from './utils/multiTenant';
import uuid from 'uuid';

export interface DiscountProps {
    _id?: string;
    name: string;
    amount: number;
    isPercent: boolean;
}

export const DISCOUNT_COLLECTION_NAME = 'discounts';

const DiscountSchema: Schema<DiscountProps> = new Schema(
    {
        _id: {
            type: String,
            alias: 'id',
            default: uuid,
        },
        name: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
        },
        isPercent: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true, collection: DISCOUNT_COLLECTION_NAME },
);

const Discount = tenantModel<DiscountProps>('Discount', DiscountSchema);

export { Discount };
