import { getItems } from '../api/item';
import { realm } from './Realm';
import { getCategories } from '../api/category';
import { getModifiers } from '../api/modifier';
import { getDiscounts } from '../api/discount';
import { getPaymentTypes } from '../api/paymentType';
import { getPrinters } from '../api/printer';
import { getPriceGroups, PriceGroupItemServerProps } from '../api/priceGroup';
import {
  DiscountSchema,
  ItemSchema,
  PaymentTypeSchema,
  PriceGroupItemProps,
  PrinterSchema,
  AddressSchema,
  OrganizationSchema,
} from './schemas';
import uuidv4 from 'uuid/v4';
import { getOrganization } from '../api/organization';

export const populate = async () => {
  try {
    const [
      items,
      categories,
      modifiers,
      discounts,
      paymentTypes,
      priceGroups,
      printers,
      organization,
    ] = await Promise.all([
      getItems(),
      getCategories(),
      getModifiers(),
      getDiscounts(),
      getPaymentTypes(),
      getPriceGroups(),
      getPrinters(),
      getOrganization(),
    ]);

    if (
      items.errors ||
      categories.errors ||
      modifiers.errors ||
      discounts.errors ||
      paymentTypes.errors ||
      priceGroups.errors ||
      printers.errors ||
      organization.errors
    ) {
      console.error('Failed to populate');
    }

    console.log('modifiers', modifiers);
    console.log('items', items);
    console.log('categories', categories);
    console.log('discounts', discounts);
    console.log('paymentTypes', paymentTypes);
    console.log('priceGroups', priceGroups);
    console.log('printers', printers);
    console.log('organization', organization);
    // TODO: remove after dev
    // realm.write(() => {
    //   realm.deleteAll();
    // });

    const resolvePriceGroup: (price: PriceGroupItemServerProps[]) => PriceGroupItemProps[] = price => {
      try {
        return price.map(priceGroup => {
          const pG = priceGroups.data.find(({ _id }) => _id === priceGroup.groupId);
          return {
            price: parseInt(priceGroup.price),
            groupId: pG,
          };
        });
      } catch (err) {
        throw Error(
          'Error trying to resolve a price group lookup, most likely the price group added to a modifier or item no longer exists',
        );
      }
    };

    // add ids, mongoose doesnt store them seperately on the server
    const remappedModifiers = modifiers.data.map(modifier => {
      return {
        ...modifier,
        mods: modifier.mods.map(mod => {
          return {
            ...mod,
            // TODO: might be better to create _ids on server and change data structure
            _id: uuidv4(),
            price: resolvePriceGroup(mod.price),
          };
        }),
      };
    });

    const { line1, line2 = '', county, city, postcode, _id, name, email, phone } = organization.data;

    const orgAddress = {
      _id: uuidv4(),
      line1,
      line2,
      city,
      county,
      postcode,
    };

    const org = {
      _id,
      name,
      email,
      phone,
    };

    realm.write(() => {
      realm.create(AddressSchema.name, orgAddress);
      realm.create(OrganizationSchema.name, org);
      printers.data.map(printer => realm.create(PrinterSchema.name, printer));
      paymentTypes.data.map(paymentType => realm.create(PaymentTypeSchema.name, paymentType));
      discounts.data.map(discount => realm.create(DiscountSchema.name, discount));
      items.data.map(item => {
        const i = {
          ...item,
          categoryId: categories.data.find(c => c._id === item.categoryId),
          modifierId: item.modifierId ? remappedModifiers.find(({ _id }) => _id === item.modifierId) : null,
          price: resolvePriceGroup(item.price),
        };
        realm.create(ItemSchema.name, i, true);
        // need to update item.category with object
      });
    });
  } catch (err) {
    console.log('ERROR ', err);
  }
};
