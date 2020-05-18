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
import dayjs from 'dayjs';

export const tNames = {
  modifiers: 'modifiers',
  itemModifiers: 'item_modifiers',
  priceGroups: 'price_groups',
  itemPrices: 'item_prices',
  modifierPrices: 'modifier_prices',
  paymentTypes: 'payment_types',
  modifierItems: 'modifier_items',
  discounts: 'discounts',
  organizations: 'organizations',
  printers: 'printers',
  categories: 'categories',
  itemPrinters: 'item_printers',
  items: 'items',
  billPayments: 'bill_payments',
  bills: 'bills',
  billDiscounts: 'bill_discounts',
  billPeriods: 'bill_periods',
  billItems: 'bill_items',
  billItemModifiers: 'bill_item_modifiers',
  billItemModifierItems: 'bill_modifier_items',
};

class Item extends Model {
  static table = tNames.items;

  @field('name') name;
  @field('category_id') categoryId;

  @relation(tNames.categories, 'category_id') category;

  static associations = {
    [tNames.itemPrinters]: { type: 'has_many', foreignKey: 'item_id' },
    [tNames.itemModifiers]: { type: 'has_many', foreignKey: 'item_id' },
    [tNames.modifiers]: { type: 'belongs_to', key: 'modifier_id' },
    [tNames.categories]: { type: 'belongs_to', key: 'category_id' },
  };

  // @ts-ignore
  @lazy printers = this.collections.get(tNames.printers).query(Q.on(tNames.itemPrinters, 'item_id', this.id));
  @lazy modifiers = this.collections.get(tNames.modifiers).query(Q.on(tNames.itemModifiers, 'item_id', this.id));
}

class ItemModifier extends Model {
  static table = tNames.itemModifiers;

  @field('item_id') itemId;
  @field('modifier_id') modifierId;

  @relation(tNames.items, 'item_id') item;
  @relation(tNames.printers, 'modifier_id') modifierId;

  static associations = {
    [tNames.items]: { type: 'belongs_to', key: 'item_id' },
    [tNames.modifiers]: { type: 'belongs_to', key: 'modifier_id' },
  };
}

class ItemPrinter extends Model {
  static table = tNames.itemPrinters;

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

  @nochange @field('name') name;

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
    [tNames.itemPrinters]: { type: 'has_many', foreignKey: 'printer_id' },
  };
  // @ts-ignore

  @lazy items = this.collections.get(tNames.items).query(Q.on(tNames.itemPrinters, 'printer_id', this.id));
}

class Modifier extends Model {
  static table = tNames.modifiers;

  @field('name') name;

  static associations = {
    [tNames.itemModifiers]: { type: 'has_many', foreignKey: 'modifier_id' },
    [tNames.modifierItems]: { type: 'has_many', foreignKey: 'modifier_id' },
    [tNames.items]: { type: 'belongs_to', foreignKey: 'modifier_id' },
  };

  @children(tNames.modifierItems) modifierItems;
}

class PriceGroup extends Model {
  static table = tNames.priceGroups;

  @field('name') name;
}

class ItemPrice extends Model {
  static table = tNames.itemPrices;

  @field('price') price;
  @field('price_group_id') priceGroupId;
  @field('item_id') itemId;

  @relation(tNames.priceGroups, 'price_group_id') priceGroup;
  @relation(tNames.items, 'item_id') item;
}
class ModifierPrice extends Model {
  static table = tNames.modifierPrices;

  @field('price') price;
  @field('price_group_id') priceGroupId;
  @field('modifier_item_id') modifierItemId;

  @relation(tNames.priceGroups, 'price_group_id') priceGroup;
  @relation(tNames.modifierItems, 'modifier_item_id') modifierItem;
}
class PaymentType extends Model {
  static table = tNames.paymentTypes;

  @nochange @field('name') name;

  static associations = {
    [tNames.billPayments]: { type: 'has_many', foreignKey: 'payment_type_id' },
  };
}

class ModifierItem extends Model {
  static table = tNames.modifierItems;

  @field('name') name;
  @field('modifier_id') modifierId;

  @relation(tNames.modifiers, 'modifier_id') modifier;
}

class Discount extends Model {
  static table = tNames.discounts;

  @nochange @field('name') name;
  @nochange @field('amount') amount;
  @nochange @field('is_percent') isPercent;
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

  @children(tNames.bills) bills;

  @lazy openBills = this.bills.extend(Q.where('is_closed', Q.notEq(true)));

  createBill = async (params: { reference: number }) => {
    return this.collections.get(tNames.bills).create(bill => {
      bill.reference = params.reference;
      bill.isClosed = false;
      bill.billPeriodId = this.id;
    });
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
    [tNames.paymentTypes]: { type: 'belongs_to', key: 'payment_type_id' },
  };

  @immutableRelation(tNames.paymentTypes, 'payment_type_id') paymentType;
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

  @children(tNames.billPayments) payments;
  @children(tNames.discounts) discounts;
  @children(tNames.billItems) billItems;

  @action addPayment = async (p: { paymentTypeId: string; amount: number; isChange?: boolean }) => {
    this.collections.get(tNames.billPayments).create(payment => {
      payment.payment_type_id = p.paymentTypeId;
      payment.bill_id = this.id;
      payment.amount = p.amount;
      payment.is_change = p.isChange || false;
    });
  };

  @action addDiscount = async (p: { discountId: string; amount: number; isChange?: boolean }) => {
    this.collections.get(tNames.billDiscounts).create(discount => {
      discount.bill_id = this.id;
      discount.discount_id = p.discountId;
    });
  };

  // @action addItem = async(p: {itemId: string, })

  @action close = async () => {
    this.is_closed = true;
    this.closed_at = dayjs().unix();
  };
}

class BillDiscount extends Model {
  static table = tNames.billDiscounts;

  @nochange @field('bill_id') billId;
  @nochange @field('discount_id') discountId;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @immutableRelation(tNames.bills, 'bill_id') bill;
  @immutableRelation(tNames.discounts, 'discount_id') discount;

  static associations = {
    [tNames.bills]: { type: 'belongs_to', key: 'bill_id' },
    [tNames.discounts]: { type: 'belongs_to', key: 'discount_id' },
  };
}

class BillItem extends Model {
  static table = tNames.billItems;
  @nochange @field('bill_id') billId;
  @nochange @field('item_id') itemId;
  @nochange @field('item_name') name;
  @nochange @field('item_price') price;
  @nochange @field('price_group_name') priceGroupName;
  @nochange @field('price_group_id') priceGroupId;
  // @nochange @field('modifier_id') modifierId;
  // @nochange @field('modifier_name') modifierName;
  @nochange @field('category_id') categoryId;
  @nochange @field('category_name') categoryName;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @immutableRelation(tNames.bills, 'bill_id') bill;
  @immutableRelation(tNames.items, 'item_id') item;
  @immutableRelation(tNames.priceGroups, 'price_group_id') priceGroup;
  // @immutableRelation(tNames.modifiers, 'modifier_id') modifier;
  @immutableRelation(tNames.categories, 'category_id') category;
  @children(tNames.billItemModifierItems) modifierItems;
  @children(tNames.itemModifiers) modifiers;

  static associations = {
    [tNames.bills]: { type: 'belongs_to', key: 'bill_id' },
    [tNames.items]: { type: 'belongs_to', key: 'item_id' },
    [tNames.priceGroups]: { type: 'belongs_to', key: 'price_group_id' },
    [tNames.modifiers]: { type: 'belongs_to', key: 'modifier_id' },
    [tNames.categories]: { type: 'belongs_to', key: 'category_id' },
    [tNames.billItemModifierItems]: { type: 'has_many', foreignKey: 'bill_item_id' },
  };
}

class BillItemModifier extends Model {
  static table = tNames.billItemModifiers;

  @nochange @field('bill_item_id') billItem;
  @nochange @field('modifier_name') modifierName;
  @nochange @field('modifier_id') modifierId;

  @immutableRelation(tNames.modifiers, 'modifier_id') modifier;
  @immutableRelation(tNames.billItems, 'bill_item_id') billItem;

  static associations = {
    [tNames.billItems]: { type: 'belongs_to', key: 'bill_item_id' },
    [tNames.modifiers]: { type: 'belongs_to', key: 'modifier_id' },
  };
}

class BillItemModifierItem extends Model {
  static table = tNames.billItemModifierItems;

  @nochange @field('bill_item_id') billItem;
  @nochange @field('bill_item_modifier_id') modifier;
  @nochange @field('modifier_item_id') modifierItem;
  @nochange @field('modifier_item_price') modifierItemPrice;
  @nochange @field('modifier_item_name') modifierItemName;

  @immutableRelation(tNames.billItems, 'bill_item_id') billItem;
  @immutableRelation(tNames.modifierItems, 'modifier_item_id') modifierItem;

  static associations = {
    [tNames.billItems]: { type: 'belongs_to', key: 'bill_item_id' },
    [tNames.modifierItems]: { type: 'belongs_to', key: 'modifier_item_id' },
  };
}

export const models = [
  Item,
  ItemModifier,
  ModifierItem,
  ItemPrinter,
  Category,
  Printer,
  Modifier,
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
  BillItemModifierItem,
  BillItemModifier,
];

export const Models = {
  Item,
  ItemModifier,
  ModifierItem,
  ItemPrinter,
  Category,
  Printer,
  Modifier,
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
  BillItemModifierItem,
  BillItemModifier,
};
