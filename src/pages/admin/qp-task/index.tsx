import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getAllQPOrdersThunk } from "@/store/slices/qpOrderSlice";
import BasicTable from "@/component/common_component/Table/themetable"; // Adjust path as needed
import { TableCell } from "@mui/material";
import Loader from "@/component/common_component/loader";
import { StatusCell } from "@/component/allorderdailog/StatusCell";

interface Order {
  _id: string;
  orderNo: number;
  companyName: { _id: string; companyName: string };
  party: { _id: string; partyName: string };
  status: string;
  printer: { _id: string; firstName: string; lastName: string };
  binder: { _id: string; firstName: string; lastName: string };
  designer: { _id: string; firstName: string; lastName: string };
  createdAt: string;
  varnish: boolean;
  lamination: boolean;
  laminationType: string;
  uv: boolean;
  uvType: string;
}

const OrdersList: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { orders, loading, error, totalCount, pagination } = useSelector(
    (state: RootState) => state.qpOrders
  );

  const [page, setPage] = useState(1);
  const designer = user?.role?.roleName === "Designer"
  const printer = user?.role?.roleName === "Printer"
  const binder = user?.role?.roleName === "Binder"
  // Filter orders where printer._id matches user?.id
  const filteredOrders = orders.filter((order: Order) => {
    if (designer) {
      return order.designer?._id === user?.id;
    }else if (printer) {
      return order.printer?._id === user?.id;
    } else if (binder) {
      return order.binder?._id === user?.id;
    }
    return false; // If neither printer nor binder, show all orders (or change this logic if needed)
  });

  useEffect(() => {
    if (user?.id) {
      // Dispatch with printerId for server-side filtering
      dispatch(getAllQPOrdersThunk());
    }
  }, [dispatch, user?.id, page]);

  // Define columns for BasicTable
  const columns = [
    { id: "orderNo", label: "Order Number" },
    { id: "companyName", label: "Company" },
    { id: "partyName", label: "Party" },
    { id: "varnish", label: "Varnish" },
    { id: "lamination", label: "Lamination" },
    { id: "uv", label: "UV" },
    { id: "status", label: "Status"},
  ];

  if (loading) return <Loader />

  return (
    <div>
      <BasicTable
        tableHeader={columns}
        rowData={filteredOrders}
        renderRow={(row: Order, index: number) => {
          return <>
            <TableCell>QP-{row.orderNo}</TableCell>
            <TableCell>{row.companyName.companyName}</TableCell>
            <TableCell>{row.party.partyName}</TableCell>
            <TableCell>{row.varnish ? "YES" : "NO"}</TableCell>
            <TableCell>{row.lamination ? row.laminationType : "NO"}</TableCell>
            <TableCell>{row.uv ? row.uvType : "NO"}</TableCell>
            <TableCell><StatusCell row={row}/></TableCell>
          </>;
        }}
        showDatePicker={false}
        showSearch={false}
        showFillter={false}
        showExcelDownload={false}
        totalCount={totalCount}
        onPageChange={(newPage: number) => setPage(newPage)} 
      />
    </div>
  );
};

export default OrdersList;