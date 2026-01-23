import React, { useEffect, useState } from "react";
import TabComponent from "@/component/Dialog/TabComponent";
import SakshiPurchasePage from "@/component/Purchase/SakshiPurchase";
import QpPurchasePage from "@/component/Purchase/QpPurchase";
import { useRouter } from "next/router";

const PurchasePage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [activeTab, setActiveTab] = useState(0);

  // 🔹 Sync tab with query param
  useEffect(() => {
    if (router.isReady && id !== undefined) {
      const tab = parseInt(id as string, 10);
      setActiveTab(tab === 1 ? 1 : 0);
    }
  }, [router.isReady, id]);

  const handleSetActiveTab = (tab: number) => {
    setActiveTab(tab);
    router.push(
      {
        pathname: "/admin/purchase",
        query: { id: tab },
      },
      undefined,
      { shallow: true } // 👈 optional (better UX)
    );
  };

  return (
    <>
      <TabComponent
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
      />

      {router.isReady && activeTab && (activeTab === 0 ? <SakshiPurchasePage /> : <QpPurchasePage />)}
    </>
  );
};

export default PurchasePage;
