import {
  tableNames,
  PaymentType,
  Category,
  PriceGroup,
  Printer,
  Organization,
  PrinterGroup,
  PrinterGroupPrinter,
} from '../../models';
import { Model, Database } from '@nozbe/watermelondb';
import { getItems } from '../../api/item';
import { getCategories } from '../../api/category';
import { getModifiers } from '../../api/modifier';
import { getDiscounts } from '../../api/discount';
import { getPriceGroups } from '../../api/priceGroup';
import { getPrinters } from '../../api/printer';
import { getPaymentTypes } from '../../api/paymentType';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import catchFn from './catchFn';
import { getOrganization, OrganizationServerProps } from '../../api/organization';
import { getPrinterGroups } from '../../api/printerGroup';
import { resetDatabase } from '../../database';
import { okResponse } from '../../api';

export const populate = async (database: Database) => {
  // return;

  await resetDatabase()

  const responses = await Promise.all([
    getItems(), //0
    getCategories(),
    getModifiers(), //2
    getDiscounts(),
    getPriceGroups(), //4
    getPrinters(),
    getPaymentTypes(), //6
    getOrganization(),
    getPrinterGroups(), // 8
  ]);

  let toCreate = [];

  console.log('responses', responses);
 
  const categoriesCollection = database.collections.get<Category>(tableNames.categories);
  const priceGroupsCollection = database.collections.get<PriceGroup>(tableNames.priceGroups);
  const printersCollection = database.collections.get<Printer>(tableNames.printers);
  const paymentTypesCollection = database.collections.get<PaymentType>(tableNames.paymentTypes);
  const organizationCollection = database.collections.get<Organization>(tableNames.organizations);
  const printerGroupsCollection = database.collections.get<PrinterGroup>(tableNames.printerGroups);

  const paymentTypesToCreate = okResponse(responses[6]).map(({ _id, name }) =>
    paymentTypesCollection.prepareCreate(
      catchFn(paymentType => {
        paymentType._raw = sanitizedRaw({ id: _id }, paymentTypesCollection.schema);
        Object.assign(paymentType, { name });
      }),
    ),
  );
  toCreate.push(...paymentTypesToCreate);

  const categoriesToCreate = okResponse(responses[1]).map(({ _id, name, shortName }) =>
    categoriesCollection.prepareCreate(
      catchFn(category => {
        category._raw = sanitizedRaw({ id: _id }, categoriesCollection.schema);
        Object.assign(category, { name, shortName });
      }),
    ),
  );

  toCreate.push(...categoriesToCreate);

  const priceGroupsToCreate = okResponse(responses[4]).map(({ _id, name, isPrepTimeRequired }) =>
    priceGroupsCollection.prepareCreate(
      catchFn(priceGroup => {
        priceGroup._raw = sanitizedRaw({ id: _id }, priceGroupsCollection.schema);
        Object.assign(priceGroup, { name, isPrepTimeRequired });
      }),
    ),
  );
  toCreate.push(...priceGroupsToCreate);

  const printersToCreate = okResponse(responses[5]).map(
    ({ _id, name, type, address, printWidth, emulation, macAddress }) =>
      printersCollection.prepareCreate(
        catchFn(printer => {
          printer._raw = sanitizedRaw({ id: _id }, printersCollection.schema);
          Object.assign(printer, { name, type, address, printWidth: parseInt(printWidth), emulation, macAddress });
        }),
      ),
  );

  toCreate.push(...printersToCreate);

  const printerGroupsToCreate = okResponse(responses[8]).map(({ _id, name, printers: printerIds }) => {
    const printerGroupsPrintersCollection = database.collections.get<PrinterGroupPrinter>(
      tableNames.printerGroupsPrinters,
    );

    const printerGroupPrinterLinksToCreate = printerIds.map(printerId => {
      return printerGroupsPrintersCollection.prepareCreate(
        catchFn(printerGroupPrinter => {
          Object.assign(printerGroupPrinter, { printerGroupId: _id, printerId });
        }),
      );
    });

    const printerGroup = printerGroupsCollection.prepareCreate(
      catchFn(printerGroup => {
        printerGroup._raw = sanitizedRaw({ id: _id }, printerGroupsCollection.schema);
        Object.assign(printerGroup, { name });
      }),
    );

    toCreate.push(printerGroup, ...printerGroupPrinterLinksToCreate);
  });

  const organizationToCreate = organizationCollection.prepareCreate(organization => {
    const { _id, name, email, phone, vat, address: a, settings: s, syncId }: OrganizationServerProps = okResponse(responses[7]);

    organization._raw = sanitizedRaw({ id: _id }, organizationCollection.schema);

    Object.assign(organization, {
      name,
      email,
      phone,
      vat,
      addressLine1: a.line1,
      addressLine2: a.line2,
      addressCity: a.city,
      addressCounty: a.county,
      addressPostcode: a.postcode,
      ...s,
      syncId
    });
  });
  toCreate.push(organizationToCreate);

  const discountsToCreate = okResponse(responses[3]).map(({ _id, name, amount, isPercent }) => {
    const discountsCollection = database.collections.get<any & Model>(tableNames.discounts);
    return discountsCollection.prepareCreate(
      catchFn(discount => {
        discount._raw = sanitizedRaw({ id: _id }, discountsCollection.schema);
        Object.assign(discount, { name, amount, isPercent });
      }),
    );
  });

  toCreate.push(...discountsToCreate);

  okResponse(responses[0]).map(
    ({ _id: itemId, name, shortName, categoryId, price: itemPrices, modifiers, printerGroupId }) => {
      console.log('printerGroupId', printerGroupId)
      const itemsCollection = database.collections.get<any & Model>(tableNames.items);
      const itemPricesCollection = database.collections.get(tableNames.itemPrices);
      // const itemPrintersCollection = database.collections.get(tableNames.itemPrinters);
      const itemModifiersCollection = database.collections.get(tableNames.itemModifiers);

      const itemModifiersToCreate = modifiers.map(modifierId => {
        return itemModifiersCollection.prepareCreate(
          catchFn(_itemModifier => {
            Object.assign(_itemModifier, { itemId, modifierId });
          }),
        );
      });

      const itemPricesToCreate = itemPrices.map(itemPrice =>
        itemPricesCollection.prepareCreate(
          catchFn(_itemPrice => {
            _itemPrice._raw = sanitizedRaw({ id: itemPrice._id }, itemPricesCollection.schema);
            Object.assign(_itemPrice, {
              price: itemPrice.amount,
              priceGroupId: itemPrice.groupId,
              itemId,
            });
          }),
        ),
      );

      // const printerLinksToCreate = linkedPrinterIds.map(linkedPrinterId => {
      //   return itemPrintersCollection.prepareCreate(
      //     catchFn(_itemPrinter => {
      //       Object.assign(_itemPrinter, { itemId, printerId: linkedPrinterId });
      //     }),
      //   );
      // });

      const itemToCreate = itemsCollection.prepareCreate(
        catchFn(item => {
          item._raw = sanitizedRaw({ id: itemId }, itemsCollection.schema);
          Object.assign(item, { name, categoryId, shortName, printerGroupId });
        }),
      );

      toCreate.push(...itemModifiersToCreate, ...itemPricesToCreate, itemToCreate);
    },
  );

  okResponse(responses[2]).map(({ _id, name, items, maxItems, minItems }) => {
    const modifiersCollection = database.collections.get<any & Model>(tableNames.modifiers);
    const modifierItemsCollection = database.collections.get<any>(tableNames.modifierItems);
    const modifierPriceCollection = database.collections.get<any>(tableNames.modifierPrices);

    console.log('maxItems', maxItems);
    console.log('minItems', minItems);
    const modifier = modifiersCollection.prepareCreate(
      catchFn(modifier => {
        modifier._raw = sanitizedRaw({ id: _id }, modifiersCollection.schema);
        Object.assign(modifier, { name, maxItems, minItems });
      }),
    );

    items.map(mItem => {
      const modifierToCreate = modifierItemsCollection.prepareCreate(
        catchFn(newItem => {
          newItem._raw = sanitizedRaw({ id: mItem._id }, modifierItemsCollection.schema);
          Object.assign(newItem, { name: mItem.name, shortName: mItem.shortName, modifierId: _id });
        }),
      );

      const pricesToCreate = mItem.price.map(price =>
        modifierPriceCollection.prepareCreate(
          catchFn(newPrice => {
            newPrice._raw = sanitizedRaw({ id: price._id }, modifierPriceCollection.schema);
            Object.assign(newPrice, {
              price: price.amount,
              priceGroupId: price.groupId,
              modifierItemId: mItem._id,
            });
          }),
        ),
      );
      toCreate.push(modifierToCreate, ...pricesToCreate);
    });
    toCreate.push(modifier);
  });

  console.log('toCreate', toCreate);
  try {
    await database.action(async () => {
      await database.batch(...toCreate);
    });
  } catch (e) {
    console.log('ERRROR watermelon :', e);
  }

  console.log('------- CREATED');
  //   try {
  //     await database.action(async () => {
  //       const cats = await database.collections.get<CategoryProps & Model>('categories');
  //     });
  //   } catch (e) {
  //   }

  //   const itemsCollection = database.collections.get<ItemProps & Model>('items');
  //   const x = await database.action(async () => {
  //     const newItem = await itemsCollection.create(item => {
  //       item.name = 'test';
  //     });
  //   });
};
