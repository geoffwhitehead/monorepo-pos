import React, { useContext } from 'react';
import { Container } from '../../core';
import { SidebarHeader } from '../../components/SidebarHeader/SidebarHeader';
import { SelectBill } from '../Checkout/sub-components/SelectBill/SelectBIll';
import { routes } from '../../navigators/SidebarNavigator';
import { BillPeriodContext } from '../../contexts/BillPeriodContext';

// TODO: move to org
const maxBills = 40;

export const Bills = ({ navigation }) => {
  const openDrawer = () => navigation.openDrawer();
  const { billPeriod } = useContext(BillPeriodContext);
  const onSelectBill = () => navigation.navigate(routes.checkout)

  return (
    <Container>
      <SidebarHeader title="Bills" onOpen={openDrawer} />
      <SelectBill billPeriod={billPeriod} onSelectBill={onSelectBill}/>
    </Container>
  );
};
