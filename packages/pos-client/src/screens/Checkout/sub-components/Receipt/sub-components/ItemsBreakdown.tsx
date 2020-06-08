import { groupBy } from 'lodash';
import { Separator, Text, ListItem } from '../../../../../core';
import React from 'react';
import { capitalize } from 'lodash';
import { ItemBreakdown } from './ItemBreakdown';
import { BillItem } from '../../../../../models';

export const ItemsBreakdown: React.FC<{
  items: BillItem[];
  readonly: boolean;
  // selected: BillItem;
  onSelect: (bI: BillItem) => void;
}> = ({ items, readonly, onSelect }) => {
  if (!items) {
    return null;
  }

  const billItemGroups: Record<string, BillItem[]> = groupBy(items, item => item.priceGroupId);

  return (
    <>
      <Separator bordered>
        <Text>Items</Text>
      </Separator>
      {Object.values(billItemGroups).map(itemGroup => {
        return [
          <ListItem itemHeader first>
            <Text>{capitalize(itemGroup[0].priceGroupName)}</Text>
          </ListItem>,
          ...itemGroup.map(item => (
            <ItemBreakdown item={item} readonly={readonly} onSelect={onSelect} />
          )),
        ];
      })}
    </>
  );
};
