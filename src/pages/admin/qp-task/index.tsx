import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getAllQPOrdersThunk } from "@/store/slices/qpOrderSlice";
import DesignerOrdersList from "@/component/allorderdailog/DesignerOrdersList";
import PrinterOrdersList from "@/component/allorderdailog/PrinterOrdersList";
import BinderOrdersList from "@/component/allorderdailog/BinderOrdersList";

const OrdersList: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const role = user?.role?.roleName?.toLowerCase();

  if (role === "designer") {
    return <DesignerOrdersList />;
  } else if (role === "printer") {
    return <PrinterOrdersList />;
  } else if (role === "lamination") {
    return <BinderOrdersList />;
  }

  // Default fallback or access denied message
  return <div>Access Denied</div>;
};

export default OrdersList;