import React from "react";
import QpNewPurchase from "./AddPurchase";

const EditQpPurchasePage: React.FC = ({ id }: any) => {
    console.log('edit page ',id)
    return <QpNewPurchase isEditMode={true} purchaseId={id as string} />;
};

export default EditQpPurchasePage;