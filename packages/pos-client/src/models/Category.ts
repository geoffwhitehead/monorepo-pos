import { Model, Query, tableSchema } from '@nozbe/watermelondb';
import { children, field, nochange } from '@nozbe/watermelondb/decorators';
import { Item } from './Item';

export class Category extends Model {
  static table = 'categories';

  static associations = {
    items: { type: 'has_many', foreignKey: 'category_id' },
  };

  @children('items') items: Query<Item>;

  @nochange @field('name') name: string;
  @field('short_name') shortName: string;
  @field('color') color: string;
  @field('position_index') positionIndex: number;
}

export const categorySchema = tableSchema({
  name: 'categories',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'short_name', type: 'string' },
    { name: 'color', type: 'string' },
    { name: 'position_index', type: 'number' },
  ],
});
