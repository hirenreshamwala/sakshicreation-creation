import TabComponent from '@/component/Dialog/TabComponent';
import QpInventoryPage from '@/component/Inventory/QpInventory';
import SakshiInventoryPage from '@/component/Inventory/SakshiInventory';
import React, { useState, useEffect } from 'react';

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState(1);
  return (
    <>
      <TabComponent activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 0 ? <SakshiInventoryPage /> : <QpInventoryPage />}
    </>
  );
};

export default InventoryPage;