import React, { useEffect } from "react";
import { Box, Button, TableCell } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getPrinterOrdersThunk } from "@/store/slices/orderSlice";
import { useRouter } from "next/router";

interface Column {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
}

const tableHeader: Column[] = [
  { id: "party", label: "Party" },
  { id: "date", label: "Date" },
  { id: "size", label: "Size" },
  { id: "itemName", label: "Item Name" },
  { id: "number", label: "Number" },
  { id: "printerRemarks", label: "Remarks" },
  { id: "status", label: "Status", align: "center" as const },
  { id: "action", label: "Action", align: "center" as const },
];
// Status color mapping for printer status (only 3 statuses now)
const getPrinterStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return { bg: "#E9D7FE", color: "#6941C6" }; // Purple
    case "In Progress":
      return { bg: "#FEF0C7", color: "#B54708" }; // Orange
    case "Done":
      return { bg: "#D1FADF", color: "#027A48" }; // Green
    default:
      return { bg: "#F2F4F7", color: "#667085" }; // Gray (default)
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const { bg, color } = getPrinterStatusColor(status);
  return (
    <Box
      sx={{
        backgroundColor: bg,
        color,
        fontSize: "12px",
        fontWeight: 500,
        borderRadius: "8px",
        px: 1.5,
        py: 0.5,
        display: "inline-block",
        textAlign: "center",
        width: "fit-content",
      }}
    >
      {status}
    </Box>
  );
};

interface PrinterTaskProps {
  tasks: any;
}

const PrinterTask: React.FC<PrinterTaskProps> = ({ tasks }) => {
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  const router = useRouter();

  const handleStartTask = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/updateStatus`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          printerStatus: "In Progress",
        }),
      });

      if (response.ok) {
        // Refresh the tasks list
        dispatch(getPrinterOrdersThunk());
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  const handleUpdateStatus = async (
    orderId: string,
    statusType: string,
    status: string
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType, // 'printer', 'binder', or 'bookletBinder'
          status, // 'Pending', 'In Progress', or 'Done'
        }),
      });

      if (response.ok) {
        // Refresh the tasks list
        dispatch(getPrinterOrdersThunk()); // Or getBinderOrdersThunk(), etc.
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  useEffect(() => {
    dispatch(getPrinterOrdersThunk());
  }, [dispatch]);

  const handleRowClick = (orderId: string) => {
    router.push(`/admin/printer-task/view?id=${orderId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Transform orders data for table
  const rowData = tasks.map((order: any) => ({
    id: order._id,
    party: order.party?.partyName || "N/A",
    date: new Date(order.createdAt).toLocaleDateString(),
    size: order.size || "N/A",
    itemName: order.productItem?.itemName || "N/A",
    number: order.number || "N/A",
    printerRemarks: order.printerRemarks || "N/A",
    status: order.printerStatus || "Pending",
  }));

  const renderRow = (row: (typeof rowData)[number], index: number) => (
    <>
      <TableCell
        onClick={() => handleRowClick(row.id)}
        sx={{
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        {row.party}
      </TableCell>
      <TableCell>{row.date}</TableCell>
      <TableCell>{row.size}</TableCell>
      <TableCell>{row.itemName}</TableCell>
      <TableCell>{row.number}</TableCell>
      <TableCell>{row.printerRemarks}</TableCell>
      <TableCell align="center">
        <StatusBadge status={row.status} />
      </TableCell>
      <TableCell align="center">
        {row.status === "Pending" && (
          <Button
            onClick={() => handleUpdateStatus(row.id, "printer", "In Progress")}
          >
            Start Task
          </Button>
        )}
      </TableCell>
    </>
  );

  return (
    <BasicTable
      tableHeader={tableHeader}
      rowData={rowData}
      renderRow={renderRow}
      showDatePicker={false}
      showSearch={false}
      showFillter={false}
    />
  );
};

export default PrinterTask;
