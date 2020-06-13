import React from 'react';
import withObservables from '@nozbe/with-observables';
import { ListItem, Left, Text, Icon, Body, Right } from '../../../../../core';
import { StyleSheet } from 'react-native';
import { formatNumber } from '../../../../../utils';
import { Item, PriceGroup } from '../../../../../models';

interface CategoryItemRowOuterProps {
  item: Item;
  isActive: boolean;
  onPressItem: (i: Item, mCount: number) => void;
  price: number
  currency: string
}

interface CategoryItemRowInnerProps {
  modifierCount: any;
}

const CategoryItemRowInner: React.FC<CategoryItemRowOuterProps & CategoryItemRowInnerProps> = ({
  isActive,
  item,
  modifierCount,
  onPressItem,
  price,
  currency
}) => {
  const onPress = () => onPressItem(item, modifierCount);

  return (
    <ListItem style={isActive && styles.activeRow} icon key={item.id} onPress={onPress}>
      <Left>
        <Text>{item.name}</Text>
      </Left>
      <Body>{modifierCount > 0 ? <Icon name="ios-arrow-forward" /> : null}</Body>
      <Right>
        <Text style={{ color: 'grey' }}>{formatNumber(price, currency)}</Text>
      </Right>
    </ListItem>
  );
};

export const CategoryItemRow = withObservables<CategoryItemRowOuterProps, CategoryItemRowInnerProps>(['item'], ({ item }) => ({
  modifierCount: item.modifiers.observeCount(),
}))(CategoryItemRowInner);

const styles = StyleSheet.create({
  activeRow: {
    backgroundColor: '#cde1f9',
  },
});
