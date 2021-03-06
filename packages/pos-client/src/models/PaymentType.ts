import { Model, tableSchema } from '@nozbe/watermelondb';
import { field, nochange } from '@nozbe/watermelondb/decorators';

export class PaymentType extends Model {
  static table = 'payment_types';

  @nochange @field('name') name: string;

  static associations = {
    bill_payments: { type: 'has_many', foreignKey: 'payment_type_id' },
  };
}

export const paymentTypeSchema = tableSchema({
  name: 'payment_types',
  columns: [{ name: 'name', type: 'string' }],
});
