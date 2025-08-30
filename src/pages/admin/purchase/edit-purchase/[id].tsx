import React from "react";
import { useRouter } from "next/router";
import NewPurchase from "@/pages/admin/purchase/add-purchase";

const EditPurchasePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  return <NewPurchase isEditMode={true} purchaseId={id as string} />;
};

export default EditPurchasePage;