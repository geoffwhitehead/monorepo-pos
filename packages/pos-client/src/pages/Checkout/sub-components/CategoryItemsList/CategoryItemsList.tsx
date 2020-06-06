import React, { useState, useContext } from 'react';
import { Text, Content, List, ListItem, Left, Icon, Body, Right } from '../../../../core';
import { SearchHeader } from '../../../../components/SearchHeader/SearchHeader';
import Modal from 'react-native-modal';
import { ModifierList } from './sub-components/ModifierList/ModifierList';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { PriceGroupContext } from '../../../../contexts/PriceGroupContext';
import { CurrentBillContext } from '../../../../contexts/CurrentBillContext';
import { CategoryItem } from './sub-components/CategoryItem';

interface CategoryItemsListProps {
  category: any;
  items: any[];
  modifiers: any[];
  route: any;
  navigation: any; // TODO: type this
}

const WrappedCategoryItems: React.FC<CategoryItemsListProps> = ({
  category,
  items,
  navigation,
}) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>();
  const { priceGroup } = useContext(PriceGroupContext);
  const { currentBill } = useContext(CurrentBillContext);

  const goBack = () => navigation.goBack();

  const searchFilter = (item: any, searchValue: string) =>
    item.name.toLowerCase().includes(searchValue.toLowerCase());

  const onSearchHandler = (value: string) => setSearchValue(value);
  const onCancelHandler = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const onSelectItem = async (item, modifierCount) => {
    if (modifierCount > 0) {
      setSelectedItem(item);
      setModalOpen(true);
    } else {
      const newItem = await currentBill.addItem({ item, priceGroup });
    }
  };

  return (
    <Content>
      <SearchHeader onChangeText={onSearchHandler} value={searchValue} />
      <Modal
        propagateSwipe
        isVisible={modalOpen}
        onBackButtonPress={onCancelHandler}
        onBackdropPress={onCancelHandler}
        animationInTiming={50}
        animationOutTiming={50}
        hideModalContentWhileAnimating={true}
        backdropTransitionInTiming={50}
        backdropTransitionOutTiming={50}
      >
        {modalOpen && (
          <ModifierList
            priceGroup={priceGroup}
            currentBill={currentBill}
            onClose={onCancelHandler}
            item={selectedItem}
            onPressItem={onSelectItem}
          />
        )}
      </Modal>

      <List>
        <ListItem itemHeader first>
          <Left>
            <Icon onPress={goBack} name="ios-arrow-back" />
            <Text style={{ fontWeight: 'bold' }}>{`${category ? category.name : 'All'} / Items`}</Text>
          </Left>
          <Body></Body>
          <Right />
        </ListItem>
        {items
          .filter(item => searchFilter(item, searchValue))
          .map(item => (
            <CategoryItem
              key={item.id}
              item={item}
              priceGroup={priceGroup}
              isActive={selectedItem === item}
              onPressItem={onSelectItem}
            />
          ))}
      </List>
    </Content>
  );
};

export const CategoryItems = withObservables<any, any>(['route'], ({ route }) => {

  const { category } = route.params;
  return {
    category: category.observe(),
    items: category.items.observe(),
  };
})(WrappedCategoryItems);

export const AllItems = withDatabase(
  withObservables<any, any>([], ({ database }) => ({
    items: database.collections
      .get('items')
      .query()
      .observe(),
  }))(WrappedCategoryItems),
);
