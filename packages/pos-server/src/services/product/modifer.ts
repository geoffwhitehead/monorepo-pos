import { CommonServiceFns } from '.';
import { InjectedDependencies, pull, push } from '..';
import { ModifierProps, MODIFIER_COLLECTION_NAME } from '../../models/Modifier';
import { MODIFIER_ITEM_COLLECTION_NAME } from '../../models/ModifierItem';
import { MODIFIER_ITEM_PRICE_COLLECTION_NAME } from '../../models/ModifierItemPrice';
import { toClientChanges } from '../../utils/sync';

export type ModifierService = CommonServiceFns<ModifierProps>;

export const modifierService = ({
    repositories: { modifierRepository, modifierItemRepository, modifierItemPriceRepository },
    logger,
}: InjectedDependencies): ModifierService => {
    const findAll = async () => await modifierRepository.findAll();
    const create = async props => {
        const modifier = await modifierRepository.create(props);
        logger.info('modifier created');
        return modifier;
    };

    const findByIdAndUpdate = async (_id, props) => {
        const modifier = await modifierRepository.findByIdAndUpdate(_id, props);
        logger.info('modifier updated');

        return modifier;
    };

    const findOne = async props => {
        const modifier = await modifierRepository.findOne(props);
        return modifier;
    };

    const findById = async _id => modifierRepository.findById(_id);

    const pullChanges = async ({ lastPulledAt }) => {
        const [modifiers, modifierItems, modifierPrices] = await Promise.all([
            pull(modifierRepository, lastPulledAt),
            pull(modifierItemRepository, lastPulledAt),
            pull(modifierItemPriceRepository, lastPulledAt),
        ]);

        return toClientChanges({
            [MODIFIER_COLLECTION_NAME]: modifiers,
            [MODIFIER_ITEM_COLLECTION_NAME]: modifierItems,
            [MODIFIER_ITEM_PRICE_COLLECTION_NAME]: modifierPrices,
        });
    };

    const pushChanges = async ({ lastPulledAt, changes }) => {
        Promise.all([
            await push(modifierRepository, changes[MODIFIER_COLLECTION_NAME], lastPulledAt),
            await push(modifierItemRepository, changes[MODIFIER_ITEM_COLLECTION_NAME], lastPulledAt),
            await push(modifierItemPriceRepository, changes[MODIFIER_ITEM_PRICE_COLLECTION_NAME], lastPulledAt),
        ]);
    };

    return {
        findAll,
        create,
        findByIdAndUpdate,
        findOne,
        findById,
        insert: modifierRepository.insert,
        pullChanges,
        pushChanges,
    };
};
