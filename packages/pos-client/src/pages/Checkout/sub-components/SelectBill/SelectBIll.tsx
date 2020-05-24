import React, { useState, useContext } from 'react';
import { Text, Content, List, ListItem, Left, Body, Right, Button, Separator } from '../../../../core';
import { formatNumber, balance, total } from '../../../../utils';
import { BillProps } from '../../../../services/schemas';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { tNames } from '../../../../models';
import { Q } from '@nozbe/watermelondb';
import { CurrentBillContext } from '../../../../contexts/CurrentBillContext';
import { BillRowEmpty } from './BillRowEmpty';
import { BillRow } from './BillRow';
import { useDatabase } from '@nozbe/watermelondb/hooks';

interface SelectBillProps {
  openBills: any; // TODO: fix realm types
  maxBills: number;
  billPeriod: any;
  onSelectBill?: (bill: any) => void;
}

// TODO: fetch from org / state
const maxBills = 40; // TODO: move to org settings

export const WrappedSelectBill: React.FC<SelectBillProps> = ({ onSelectBill, openBills }) => {
  const { setCurrentBill } = useContext(CurrentBillContext);
  const [showOpen, setShowOpen] = useState<boolean>(false);

  const bills = openBills.reduce((acc, bill) => {
    acc[bill.reference - 1] = bill;
    return [...acc];
  }, Array(maxBills).fill(null));

  const _onSelectBill = (bill: BillProps) => {
    setCurrentBill(bill);
    onSelectBill && onSelectBill(bill);
  };

  const toggleOpenOnlyFilter = () => setShowOpen(!showOpen);
  const filterOpenOnly = bill => (showOpen ? bill : true);

  console.log('openBills', openBills);
  return (
    <Content>
      <List>
        <ListItem itemHeader first>
          <Left>
            <Text>Bills </Text>
          </Left>
          <Right>
            <Button active={true} info onPress={toggleOpenOnlyFilter}>
              <Text>Show open</Text>
            </Button>
          </Right>
        </ListItem>
        <ListItem itemHeader>
          <Left>
            <Text>State</Text>
          </Left>
          <Body>
            <Text>Balance</Text>
          </Body>
          <Right>
            <Text>Total</Text>
          </Right>
        </ListItem>
        {bills
          .filter(filterOpenOnly)
          .map((bill, index) =>
            bill ? (
              <BillRow key={bill.id} bill={bill} onSelectBill={_onSelectBill} />
            ) : (
              <BillRowEmpty key={index} reference={index + 1} billPeriod={billPeriod} onSelectBill={_onSelectBill} />
            ),
          )}
      </List>
    </Content>
  );
};

// const enhanceRelation = withObservables(['bp'], ({ bp }) => ({
//   bp,
//   openBills: bp.openBills.observe(),
// }));

const enhance = withObservables(['billPeriod'], ({ billPeriod }) => ({
  billPeriod,
  openBills: billPeriod.openBills,
}));

// const enhance = withObservables(['billPeriod'], ({ billPeriod, database }) => ({
//   bp: database.collections.get(tNames.billPeriods).findAndObserve(billPeriod.id),
// }));

export const SelectBill = enhance(WrappedSelectBill);

// export const enhanceBillPeriod = withDatabase(
//   withObservables(['billPeriod'], ({ billPeriod }) => ({
//     priceGroups: database.collections
//       .get(tNames.priceGroups)
//       .query()
//       .observe(),
//     openPeriods: database.collections
//       .get(tNames.billPeriods)
//       .query(Q.where('closed_at', Q.eq(null)))
//       .observe(),
//   }))(MainWrapped),
// );
