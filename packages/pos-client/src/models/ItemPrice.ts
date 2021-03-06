import { Model, Relation, tableSchema } from '@nozbe/watermelondb';
import { field, immutableRelation, nochange } from '@nozbe/watermelondb/decorators';
import { Item } from './Item';
import { PriceGroup } from './PriceGroup';

export class ItemPrice extends Model {
  static table = 'item_prices';

  @field('price') price?: number;
  @nochange @field('price_group_id') priceGroupId: string;
  @nochange @field('item_id') itemId: string;

  @immutableRelation('price_groups', 'price_group_id') priceGroup: Relation<PriceGroup>;
  @immutableRelation('items', 'item_id') item: Relation<Item>;

  static associations = {
    price_groups: { type: 'belongs_to', key: 'price_group_id' },
    items: { type: 'belongs_to', key: 'item_id' },
  };
}

export const itemPriceSchema = tableSchema({
  name: 'item_prices',
  columns: [
    { name: 'price', type: 'number', isOptional: true }, // record is created before price is set.
    { name: 'price_group_id', type: 'string' },
    { name: 'item_id', type: 'string', isIndexed: true },
  ],
});
