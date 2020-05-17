import { Model, Q } from '@nozbe/watermelondb';
import {
  relation,
  action,
  immutableRelation,
  nochange,
  lazy,
  field,
  children,
  readonly,
  date,
} from '@nozbe/watermelondb/decorators';

export const tNames = {
  modifiers: 'modifiers',
  price_groups: 'price_groups',
  item_prices: 'item_prices',
  modifier_prices: 'modifier_prices',
  payment_types: 'payment_types',
  modifier_items: 'modifier_items',
  discounts: 'discounts',
  organizations: 'organizations',
  printers: 'printers',
  categories: 'categories',
  item_printers: 'item_printers',
  items: 'items',
  billPayments: 'bill_payments',
  bills: 'bills',
  billDiscounts: 'bill_discounts',
  billPeriods: 'bill_periods',
  billItems: 'bill_items',
};

class Item extends Model {
  static table = tNames.items;

  @field('name') name;
  @field('category_id') categoryId;
  @field('modifier_id') modifierId;

  @relation(tNames.categories, 'category_id') category;
  @relation(tNames.modifiers, 'modifier_id') modifier;

  static associations = {
    [tNames.item_printers]: { type: 'has_many', foreignKey: 'item_id' },
    [tNames.modifiers]: { type: 'belongs_to', key: 'modifier_id' },
    [tNames.categories]: { type: 'belongs_to', key: 'category_id' },
  };

  // @ts-ignore
  @lazy printers = this.collections.get(tNames.printers).query(Q.on(tNames.item_printers, 'item_id', this.id));
}

class ItemPrinter extends Model {
  static table = tNames.item_printers;

  @field('item_id') itemId;
  @field('printerId') printerId;

  @relation(tNames.items, 'item_id') item;
  @relation(tNames.printers, 'printer_id') printer;

  static associations = {
    [tNames.items]: { type: 'belongs_to', key: 'item_id' },
    [tNames.printers]: { type: 'belongs_to', key: 'printer_id' },
  };
}

class Category extends Model {
  static table = tNames.categories;

  @children(tNames.items) items;

  @field('name') name;

  static associations = {
    [tNames.items]: { type: 'has_many', foreignKey: 'category_id' },
  };

  // getCategory = () => {
  //   return {
  //     name: this.name,
  //   };
  // };

  // updateCategory = async updatedCategory => {
  //   await this.update(category => {
  //     category.name = updatedCategory.name;
  //   });
  // };

  // deleteCategory = async () => {
  //   await this.markAsDeleted();
  // };
}

class Printer extends Model {
  static table = 'printers';

  @field('name') name;
  @field('type') type;
  @field('address') address;

  static associations = {
    [tNames.item_printers]: { type: 'has_many', foreignKey: 'printer_id' },
  };
  // @ts-ignore

  @lazy items = this.collections.get(tNames.items).query(Q.on(tNames.item_printers, 'printer_id', this.id));
}

class Modifier extends Model {
  static table = tNames.modifiers;

  @field('name') name;

  static associations = {
    [tNames.modifier_items]: { type: 'belongs_to', foreignKey: 'modifier_id' },
    [tNames.items]: { type: 'belongs_to', foreignKey: 'modifier_id' },
  };
}

class PriceGroup extends Model {
  static table = tNames.price_groups;

  @field('name') name;
}

class ItemPrice extends Model {
  static table = tNames.item_prices;

  @field('price') price;
  @field('price_group_id') priceGroupId;
  @field('item_id') itemId;

  @relation(tNames.price_groups, 'price_group_id') priceGroup;
  @relation(tNames.items, 'item_id') item;
}
class ModifierPrice extends Model {
  static table = tNames.modifier_prices;

  @field('price') price;
  @field('price_group_id') priceGroupId;
  @field('modifier_item_id') modifierItemId;

  @relation(tNames.price_groups, 'price_group_id') priceGroup;
  @relation(tNames.modifier_items, 'modifier_item_id') modifierItem;
}
class PaymentType extends Model {
  static table = tNames.payment_types;

  @nochange @field('name') name;

  static associations = {
    [tNames.billPayments]: { type: 'has_many', foreignKey: 'payment_type_id' },
  };
}

class ModifierItem extends Model {
  static table = tNames.modifier_items;

  @field('name') name;
  @field('modifier_id') modifierId;

  @relation(tNames.modifiers, 'modifier_id') modifier;
}

class Discount extends Model {
  static table = tNames.discounts;

  @field('name') name;
  @field('amount') amount;
  @field('is_percent') isPercent;
}

class Organization extends Model {
  static table = tNames.organizations;
}

// BILLS

class BillPeriod extends Model {
  static table = tNames.billPeriods;

  @readonly @date('created_at') createdAt;
  @date('closed_at') closedAt;

  static associations = {
    [tNames.bills]: { type: 'has_many', foreignKey: 'bill_period_id' },
  };
}

class BillPayment extends Model {
  static table = tNames.billPayments;

  @nochange @field('payment_type_id') paymentTypeId;
  @nochange @field('amount') amount;
  @nochange @field('is_change') isChange; // TODO: update to credit / debit

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  static associations = {
    [tNames.bills]: { type: 'belongs_to', key: 'bill_id' },
    [tNames.payment_types]: { type: 'belongs_to', key: 'payment_type_id' },
  };

  @immutableRelation(tNames.payment_types, 'payment_type_id') paymentType;
  @immutableRelation(tNames.bills, 'bill_id') bill;
}

class Bill extends Model {
  static table = tNames.bills;

  @field('reference') reference;
  @field('is_closed') isClosed;
  @nochange @field('bill_period_id') billPeriodId;
  @date('closed_at') closedAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @immutableRelation(tNames.billPeriods, 'bill_period_id') billPeriod;

  static associations = {
    [tNames.billPeriods]: { type: 'belongs_to', key: 'bill_period_id' },
    [tNames.billPayments]: { type: 'has_many', foreignKey: 'bill_id' },
    [tNames.billItems]: { type: 'has_many', foreignKey: 'bill_id' },
    [tNames.billDiscounts]: { type: 'has_many', foreignKey: 'bill_id' },
  };
}

class BillDiscount extends Model {
  static table = tNames.billDiscounts;

  @nochange @field('name') name;
  @nochange @field('bill_id') billId;
  @nochange @field('amount') amount;
  @nochange @field('is_percent') isPercent;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @immutableRelation(tNames.bills, 'bill_id') bill;

  static associations = {
    [tNames.bills]: { type: 'belongs_to', key: 'bill_id' },
  };
}

class BillItem extends Model {
  static table = tNames.billItems;
  @nochange @field('bill_id') billId;
  @nochange @field('name') name;
  @nochange @field('price') price;
  @nochange @field('price_group_name') priceGroupName;
  @nochange @field('modifier_name') modifierName;
  @nochange @field('modifier_id') modifierId;
  @nochange @field('category_name') categoryName;
  @nochange @field('category_id') categoryId;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @immutableRelation(tNames.bills, 'bill_id') bill;

  static associations = {
    [tNames.bills]: { type: 'belongs_to', key: 'bill_id' },
  };
}

export const models = [
  Item,
  ItemPrinter,
  Category,
  Printer,
  Modifier,
  ModifierItem,
  PriceGroup,
  ItemPrice,
  ModifierPrice,
  PaymentType,
  Discount,
  Organization,
  Bill,
  BillDiscount,
  BillItem,
  BillPayment,
  BillPeriod,
];

export const Models = {
  Item,
  ItemPrinter,
  Category,
  Printer,
  Modifier,
  ModifierItem,
  PriceGroup,
  ItemPrice,
  ModifierPrice,
  PaymentType,
  Discount,
  Organization,
  Bill,
  BillDiscount,
  BillItem,
  BillPayment,
  BillPeriod,
};
