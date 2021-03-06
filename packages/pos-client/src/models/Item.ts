import { Model, Q, Query, Relation, tableSchema } from '@nozbe/watermelondb';
import { action, children, field, lazy, relation } from '@nozbe/watermelondb/decorators';
import { ItemModifier, PrinterGroup, tableNames } from '.';
import { Category } from './Category';
import { ItemPrice } from './ItemPrice';
import { Modifier } from './Modifier';
import { Printer } from './Printer';

type UpdateItemProps = {
  name: string;
  shortName: string;
  categoryId: string;
  printerGroupId: string;
  selectedModifiers: Modifier[];
  prices: { price: number | null; itemPrice: ItemPrice }[];
};

export const itemSchema = tableSchema({
  name: 'items',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'short_name', type: 'string' },
    { name: 'category_id', type: 'string', isIndexed: true },
    { name: 'printer_group_id', type: 'string' },
  ],
});

export class Item extends Model {
  static table = 'items';

  @field('name') name: string;
  @field('short_name') shortName: string;
  @field('category_id') categoryId: string;
  @field('printer_group_id') printerGroupId: string;

  @relation('categories', 'category_id') category: Relation<Category>;
  @relation('printer_groups', 'printer_group_id') printerGroup: Relation<PrinterGroup>;

  static associations = {
    item_modifiers: { type: 'has_many', foreignKey: 'item_id' },
    modifiers: { type: 'belongs_to', key: 'modifier_id' },
    categories: { type: 'belongs_to', key: 'category_id' },
    item_prices: { type: 'has_many', foreignKey: 'item_id' },
    printer_groups: { type: 'belongs_to', key: 'printer_group_id' },
  };

  @children('item_prices') prices: Query<ItemPrice>;
  @children('item_modifiers') itemModifiers: Query<ItemModifier>;

  @lazy printers = this.collections
    .get('printers')
    .query(Q.on('printer_groups_printers', 'printer_group_id', this.printerGroupId)) as Query<Printer>;
  @lazy modifiers = this.collections.get('modifiers').query(Q.on('item_modifiers', 'item_id', this.id)) as Query<
    Modifier
  >;

  @action remove = async () => {
    const [prices, itemModifiers] = await Promise.all([this.prices.fetch(), this.itemModifiers.fetch()]);

    const itemPricesToDelete = prices.map(price => price.prepareMarkAsDeleted());
    const itemModifiersToDelete = itemModifiers.map(itemModifier => itemModifier.prepareMarkAsDeleted());
    const itemToDelete = this.prepareMarkAsDeleted();

    const batched = [itemToDelete, ...itemPricesToDelete, ...itemModifiersToDelete];

    await this.database.batch(...batched);
  };

  @action updateItem = async ({
    name,
    shortName,
    categoryId,
    printerGroupId,
    prices,
    selectedModifiers,
  }: UpdateItemProps) => {
    const itemModifierCollection = this.database.collections.get<ItemModifier>(tableNames.itemModifiers);

    const itemModifiers = await this.itemModifiers.fetch();

    // delete all records from pivot table
    const itemModifiersToDelete = itemModifiers.map(itemModifier => itemModifier.prepareMarkAsDeleted());

    // create new pivot records for selected modifiers
    const itemModifiersToCreate = selectedModifiers.map(selectedModifier =>
      itemModifierCollection.prepareCreate(record => {
        record.modifier.set(selectedModifier);
        record.item.set(this);
      }),
    );

    const itemToUpdate = this.prepareUpdate(record => {
      Object.assign(record, { name, shortName, categoryId, printerGroupId });
    });

    const itemPricesToUpdate = prices.map(({ itemPrice, price }) =>
      itemPrice.prepareUpdate(record => {
        Object.assign(record, { price });
      }),
    );

    const batched = [itemToUpdate, ...itemPricesToUpdate, ...itemModifiersToCreate, ...itemModifiersToDelete];
    await this.database.batch(...batched);
  };
}
