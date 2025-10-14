import BasicTable from '@/component/common_component/Table/themetable';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllQPOrdersThunk } from '@/store/slices/qpOrderSlice';
import { TableCell } from '@mui/material';
import React, { useEffect, useMemo } from 'react';

const columns = [
  { id: "orderNo", label: "Order No" },
  { id: "partyName", label: "Party Name" },
  { id: "market", label: "Market" },
  { id: "area", label: "Area" },
  { id: "noOfBox", label: "No of Box" },
  { id: "status", label: "Order Status" },
  { id: "driver", label: "Driver" },
  { id: "driverName", label: "Driver Name" }, // ✅ new field
  { id: "date", label: "Date" },              // ✅ new field
  { id: "deliveryStatus", label: "Delivery Status" },
  { id: "loadingTime", label: "Loading Time" },
  { id: "deliveryTime", label: "Delivery Time" },
  { id: "totalTime", label: "Total Time" },
];

const QPOrdersPage = () => {
  const dispatch = useAppDispatch();
  const { orders } = useAppSelector((state) => state.qpOrders);
console.log(orders,"sdadadad")
  useEffect(() => {
    dispatch(getAllQPOrdersThunk());
  }, [dispatch]);

  const formatTimeDifference = (startTime, endTime) => {
    const diffInMs = endTime - startTime;
    if (diffInMs < 0) return "Invalid Time";

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateLoadingTime = (order) => {
    const { loadingStartDate, deliveryStartTime } = order;
    if (loadingStartDate && deliveryStartTime) {
      return formatTimeDifference(new Date(loadingStartDate), new Date(deliveryStartTime));
    }
    if (loadingStartDate && !deliveryStartTime) {
      return formatTimeDifference(new Date(loadingStartDate), new Date()) + " (Loading)";
    }
    return "N/A";
  };

  const calculateDeliveryTime = (order) => {
    const { deliveryStartTime, deliveryEndTime } = order;
    if (deliveryStartTime && deliveryEndTime) {
      return formatTimeDifference(new Date(deliveryStartTime), new Date(deliveryEndTime));
    }
    if (deliveryStartTime && !deliveryEndTime) {
      return formatTimeDifference(new Date(deliveryStartTime), new Date()) + " (In Transit)";
    }
    return "N/A";
  };

  const calculateTotalTime = (order) => {
    const { loadingStartDate, deliveryEndTime } = order;
    if (loadingStartDate && deliveryEndTime) {
      return formatTimeDifference(new Date(loadingStartDate), new Date(deliveryEndTime));
    }
    if (loadingStartDate && !deliveryEndTime) {
      return formatTimeDifference(new Date(loadingStartDate), new Date()) + " (Ongoing)";
    }
    return "N/A";
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => order.status === "Completed");
  }, [orders]);

  const renderRow = (order) => (
    <>
      <TableCell>QP-{order.orderNo}</TableCell>
      <TableCell>{order.party?.partyName || "N/A"}</TableCell>
      <TableCell>{order.party?.address?.marketName?.marketName || "N/A"}</TableCell>
      <TableCell>{order.party?.address?.area?.area || "N/A"}</TableCell>
      <TableCell>{order.noOfPieces || "N/A"}</TableCell>
      <TableCell>{order.status || "N/A"}</TableCell>

      {/* Existing driver (email username) */}
      <TableCell>{order.driver?.email?.split("@")[0] || "Not Assigned"}</TableCell>

      {/* ✅ New: Driver Full Name */}
<TableCell>
  {order.driver
    ? `${order.driver.firstName ?? ""} ${order.driver.lastName ?? ""}`.trim() || "N/A"
    : "N/A"}
</TableCell>



      {/* ✅ New: Date (formatted) */}
      <TableCell>
        {order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : "N/A"}
      </TableCell>

      <TableCell>{order.deliveryStatus || "N/A"}</TableCell>
      <TableCell>{calculateLoadingTime(order)}</TableCell>
      <TableCell>{calculateDeliveryTime(order)}</TableCell>
      <TableCell>{calculateTotalTime(order)}</TableCell>
    </>
  );

  return (
    <BasicTable
      tableHeader={columns}
      rowData={filteredOrders}
      renderRow={renderRow}
      title="Completed Orders"
      showSearch={true}
      showDatePicker={false}
    />
  );
};

export default QPOrdersPage;
