import {
  BillDiscountProps,
  BillItemProps,
  BillProps,
  PaymentTypeProps,
  BillPaymentProps,
  DiscountProps,
  CategoryProps,
} from '../services/schemas';
import { Collection } from 'realm';
import { flatten } from 'lodash';

// TODO fix tpyes
export const total = (p: { items; discounts }): number => {
  const amt = bill.items.reduce((acc, item) => {
    const mods = item.mods.reduce((acc, mod) => acc + mod.price, 0);
    return acc + mods + item.price;
  }, 0);
  return amt;
};

export const totalPayable: (bill: BillProps) => number = bill => {
  return total(bill) - totalDiscount(bill);
};

// TODO fix tpyes
export const balance = (bill: BillProps): number => {
  return total(bill) - totalDiscount(bill) - totalPayments(bill);
};

interface DiscountBreakdownItemProps extends BillDiscountProps {
  calculatedDiscount: number;
}
// fix types
export const discountBreakdown: (bill: BillProps) => DiscountBreakdownItemProps[] = bill => {
  let rollingTotal = total(bill);
  const arrDiscounts = bill.discounts.map(d => {
    const calculatedDiscount = d.isPercent ? Math.round(rollingTotal * (d.amount / 100)) : d.amount;
    rollingTotal = rollingTotal - calculatedDiscount;
    return {
      ...d,
      calculatedDiscount,
    };
  });
  return arrDiscounts;
};

export const discountBreakdownBills: (bills: Collection<BillProps>) => DiscountBreakdownItemProps[] = bills =>
  flatten(bills.map(bill => discountBreakdown(bill)));

export const billCategoryTotals: (bill: BillProps) => Record<string, number> = bill => {
  return bill.items.reduce(
    (acc, item) => ({
      ...acc,
      [item.categoryId]: (acc[item.categoryId] || 0) + totalBillItem(item),
    }),
    {},
  );
};

export const billsItemCount: (bills: Collection<BillProps>) => number = bills =>
  bills.map(bill => bill.items.length).reduce((acc, count) => acc + count);

export const billItemsCategoryTotals: (
  bills: Collection<BillProps>,
  categories: Collection<CategoryProps>,
) => Record<string, number> = (bills, categories) => {
  const itemCategoriesObject: Record<string, number> = categories.reduce(
    (acc, category) => ({ ...acc, [category._id]: 0 }),
    {},
  );

  const billCategoryBreakdowns = bills.map(bill => billCategoryTotals(bill));

  return billCategoryBreakdowns.reduce((acc, billBreakdown) => {
    return Object.keys(billBreakdown).reduce(
      (totals, categoryId) => ({ ...totals, [categoryId]: totals[categoryId] + billBreakdown[categoryId] }),
      { ...acc },
    );
  }, itemCategoriesObject);
};

export const discountBreakdownTotals = (bills: Collection<BillProps>, discounts: Collection<DiscountProps>) => {
  const discountTotalsObject: Record<string, number> = discounts.reduce(
    (acc, discount) => ({ ...acc, [discount._id]: 0 }),
    {},
  );

  const discountsBreakdown = discountBreakdownBills(bills);

  const totals = discountsBreakdown.reduce((acc, discount) => {
    return { ...acc, [discount.discountId]: acc[discount.discountId] + discount.calculatedDiscount };
  }, discountTotalsObject);
  return totals;
};

export const totalBillPaymentBreakdown: (
  payments: Collection<BillPaymentProps>,
  paymentTypes: Collection<PaymentTypeProps>,
) => Record<string, number> = (payments, paymentTypes) => {
  const paymentTypesObject: Record<string, number> = paymentTypes.reduce(
    (acc, paymentType) => ({ ...acc, [paymentType._id]: 0 }),
    {},
  );
  return payments.reduce((acc, payment) => {
    return { ...acc, [payment.paymentTypeId]: acc[payment.paymentTypeId] + payment.amount };
  }, paymentTypesObject);
};

export const totalBillsPaymentBreakdown: (
  bills: Collection<BillProps>,
  paymentTypes: Collection<PaymentTypeProps>,
) => Record<string, number> = (bills, paymentTypes) => {
  const paymentTypesObject: Record<string, number> = paymentTypes.reduce(
    (acc, paymentType) => ({ ...acc, [paymentType._id]: 0 }),
    {},
  );

  const paymentBreakdowns = bills.map(bill => totalBillPaymentBreakdown(bill.payments, paymentTypes));

  const totalPayments = paymentBreakdowns.reduce((acc, breakdown) => {
    return Object.keys(breakdown).reduce(
      (totals, typeId) => {
        return { ...totals, [typeId]: totals[typeId] + breakdown[typeId] };
      },
      { ...acc },
    );
  }, paymentTypesObject);

  return totalPayments;
};

export const totalBillItem = (item: BillItemProps) =>
  (item.mods?.reduce((acc, mod) => acc + mod.price, 0) || 0) + item.price;

export const totalDiscount: (bill: BillProps) => number = bill =>
  discountBreakdown(bill).reduce((acc, discount) => acc + discount.calculatedDiscount, 0);

export const totalBillsDiscount: (bills: BillProps[]) => number = bills =>
  bills.reduce((total, bill) => totalDiscount(bill), 0);

// TODO fix tpyes
export const totalPayments: (bill: BillProps) => number = bill => {
  const amt = bill.payments.reduce((acc, payment) => {
    return acc + payment.amount;
  }, 0);
  return amt;
};

export const formatNumber: (value: number, symbol?: string) => string = (value, symbol = '') =>
  `${symbol}${(value / 100).toFixed(2)}`;

// ****************
// ****************
// ****************
// ****************
// ****************

export const _totalDiscount = (total, discounts) => {
  return _discountBreakdown(total, discounts).reduce((acc, discount) => acc + discount.calculatedDiscount, 0);
};

export const _discountBreakdown = (total: number, discounts: any): DiscountBreakdownItemProps[] => {
  let rollingTotal = total;
  const arrDiscounts = discounts.map(d => {
    const calculatedDiscount = d.isPercent ? Math.round(rollingTotal * (d.amount / 100)) : d.amount;
    rollingTotal = rollingTotal - calculatedDiscount;
    return {
      ...d,
      calculatedDiscount,
    };
  });
  return arrDiscounts;
};

export const _total = async (items, discounts, payments): Promise<number> => {
  const totalsArray: any = await Promise.all(
    // TODO: fix type
    items.map(item => {
      return new Promise(async (res, rej) => {
        const modifierItems = await item.billItemModifierItems.fetch();
        const prices = modifierItems.reduce((out, mItem) => out + mItem.modifierItemPrice, item.itemPrice);
        res(prices);
      });
    }),
  );

  // console.log(' -- totalsArray', totalsArray);
  const totals = totalsArray.reduce((out, total) => out + total, 0);

  const totalDiscount = _totalDiscount(total, discounts);

  const totalPayments = _totalPayments(payments);

  // console.log('totals', totals);
  // console.log('totalDiscount', totalDiscount);
  // console.log('totalPayments', totalPayments);

  return totals - totalDiscount;
  // const amt = bill.items.reduce((acc, item) => {
  //   const mods = item.mods.reduce((acc, mod) => acc + mod.price, 0);
  //   return acc + mods + item.price;
  // }, 0);
  // return amt;
};

export const _totalPayments = (payments: any): number => {
  const amt = payments.reduce((acc, payment) => acc + payment.amount, 0);
  console.log('amt', amt);
  return amt;
};

export const _balance = async (items, discounts, payments): Promise<number> => {
  const totalPayable = await _total(items, discounts, payments);
  const totalPayments = _totalPayments(payments);
  return totalPayable - totalPayments;
};

// const fetchModifier

export const billSummary = async (
  items,
  discounts,
  payments,
): Promise<{ totalPayable: number; totalPayments: number; balance: number }> => {
  const totalPayable = await _total(items, discounts, payments);
  const totalPayments = _totalPayments(payments);
  return {
    totalPayable,
    totalPayments,
    balance: totalPayable - totalPayments,
  };
};
