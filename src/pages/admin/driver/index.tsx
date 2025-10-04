import BasicTable from '@/component/common_component/Table/themetable';
import { useAppDispatch, useAppSelector } from '@/store'
import { getAllQPOrdersThunk } from '@/store/slices/qpOrderSlice'
import { TableCell } from '@mui/material';
import React, { useEffect, useMemo } from 'react'

const columns = [
    { id: "orderNo", label: "Order No"},
    { id: "partyName", label: "Party Name"},
    { id: "market", label: "Market"},
    { id: "area", label: "Area"},
    { id: "noOfBox", label: "No of Box"},
    { id: "status", label: "Order Status"},
    { id: "driver", label: "Driver"},
    { id: "deliveryStatus", label: "Delivery Status"},
    { id: "loadingTime", label: "Loading Time"},
    { id: "deliveryTime", label: "Delivery Time"},
    { id: "totalTime", label: "Total Time"},
];

const QPOrdersPage = () => {
    const dispatch = useAppDispatch()
    const { orders, loading, error, totalCount, pagination } = useAppSelector((state) => state.qpOrders)
    console.log("DEBUG : QPOrdersPage : orders:", orders);

    useEffect(() => {
        dispatch(getAllQPOrdersThunk())
    }, [])

    // Function to calculate loading time (loadingStartDate to deliveryStartTime)
    const calculateLoadingTime = (order) => {
        const { loadingStartDate, deliveryStartTime } = order;
        
        if (loadingStartDate && deliveryStartTime) {
            const startTime = new Date(loadingStartDate);
            const endTime = new Date(deliveryStartTime);
            return formatTimeDifference(startTime, endTime);
        }
        
        // If loading started but delivery hasn't started yet
        if (loadingStartDate && !deliveryStartTime) {
            const startTime = new Date(loadingStartDate);
            const currentTime = new Date();
            return formatTimeDifference(startTime, currentTime) + " (Loading)";
        }
        
        return "N/A";
    };

    // Function to calculate delivery time (deliveryStartTime to deliveryEndTime)
    const calculateDeliveryTime = (order) => {
        const { deliveryStartTime, deliveryEndTime } = order;
        
        if (deliveryStartTime && deliveryEndTime) {
            const startTime = new Date(deliveryStartTime);
            const endTime = new Date(deliveryEndTime);
            return formatTimeDifference(startTime, endTime);
        }
        
        // If delivery started but not ended yet
        if (deliveryStartTime && !deliveryEndTime) {
            const startTime = new Date(deliveryStartTime);
            const currentTime = new Date();
            return formatTimeDifference(startTime, currentTime) + " (In Transit)";
        }
        
        return "N/A";
    };

    // Function to calculate total time (loadingStartDate to deliveryEndTime)
    const calculateTotalTime = (order) => {
        const { loadingStartDate, deliveryEndTime } = order;
        
        if (loadingStartDate && deliveryEndTime) {
            const startTime = new Date(loadingStartDate);
            const endTime = new Date(deliveryEndTime);
            return formatTimeDifference(startTime, endTime);
        }
        
        // If process is still ongoing
        if (loadingStartDate && !deliveryEndTime) {
            const startTime = new Date(loadingStartDate);
            const currentTime = new Date();
            return formatTimeDifference(startTime, currentTime) + " (Ongoing)";
        }
        
        return "N/A";
    };

    // Helper function to format time difference
    const formatTimeDifference = (startTime, endTime) => {
        const diffInMs = endTime - startTime;
        
        if (diffInMs < 0) {
            return "Invalid Time";
        }
        
        const diffInSeconds = Math.floor(diffInMs / 1000);
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Filter and format orders
    const formattedOrders = useMemo(() => {
        return orders
            .filter(order => order.status === "Completed")
            .map(order => ({
                id: order._id,
                orderNo: order.orderNo,
                partyName: `${order.party?.partyName} - ${order.party?.address.unitNo} - ${order.party?.address.marketName.marketName} - ${order.party?.address.area.area}` || "N/A",
                market: order.party?.address.marketName.marketName,
                area: order.party?.address.area.area,
                noOfBox: order.noOfPieces || "N/A",
                status: order.status || "N/A",
                driverEmail: order.driver?.email ? order.driver.email.split("@")[0] : "Not Started Delivery",
                deliveryStatus: order.deliveryStatus || "N/A",
                loadingTime: calculateLoadingTime(order),
                deliveryTime: calculateDeliveryTime(order),
                totalTime: calculateTotalTime(order),
                _id: order._id,
                // Keep original dates for reference
                loadingStartDate: order.loadingStartDate,
                deliveryStartTime: order.deliveryStartTime,
                deliveryEndTime: order.deliveryEndTime
            }));
    }, [orders]);

    const renderRow = (order, index) => {
        return (
            <>
                <TableCell>
                    QP-{order.orderNo}
                </TableCell>
                <TableCell>
                    {order.partyName}
                </TableCell>
                <TableCell>
                    {order.market}
                </TableCell>
                <TableCell>
                    {order.area}
                </TableCell>
                <TableCell>
                    {order.noOfBox}
                </TableCell>
                <TableCell>
                    {order.status}
                </TableCell>
                <TableCell>
                    {order.driverEmail}
                </TableCell>
                <TableCell>
                    {order.deliveryStatus}
                </TableCell>
                <TableCell>
                    {order.loadingTime}
                </TableCell>
                <TableCell>
                    {order.deliveryTime}
                </TableCell>
                <TableCell>
                    {order.totalTime}
                </TableCell>
            </>
        );
    };

    return (
        <BasicTable
            tableHeader={columns}
            rowData={formattedOrders}
            renderRow={renderRow}
            title="Completed Orders"
            showSearch={true}
            showDatePicker={false}
        />
    );
}

export default QPOrdersPage