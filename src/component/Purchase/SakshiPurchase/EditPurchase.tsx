import React from "react";
import NewPurchase from "@/pages/admin/purchase/add-purchase";

const EditSakshiPurchasePage: React.FC = ({ id }: any) => {
    return <NewPurchase isEditMode={true} purchaseId={id as string} />;
};

export default EditSakshiPurchasePage;