import React, { useState } from 'react';
import TabComponent from '@/component/Dialog/TabComponent';
import SakshiPurchasePage from '@/component/Purchase/SakshiPurchase';
import QpPurchasePage from '@/component/Purchase/QpPurchase';

const PurchasePage = () => {

  const [activeTab, setActiveTab] = useState(1);

  // console.log(activeTab, 'jshddhn')

  return (
    <>
      <TabComponent activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 0 ? <SakshiPurchasePage /> : <QpPurchasePage />}
    </>
  );
};

export default PurchasePage;