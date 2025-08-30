"use client"

import { useEffect } from "react"
import { Box, Button, TableCell } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { useAppDispatch, useAppSelector } from "@/store"
import { getBookletBinderThunk } from "@/store/slices/orderSlice"
import { useRouter } from "next/router"

interface Column {
  id: string
  label: string
  align?: "left" | "center" | "right"
}

const tableHeader: Column[] = [
  { id: "party", label: "Party" },
  { id: "date", label: "Date" },
  { id: "size", label: "Size" },
  { id: "itemName", label: "Item Name" },
  { id: "remarks", label: "Remarks" },
  { id: "status", label: "Status", align: "center" as const },
    { id: "action", label: "Action", align: "center" as const },

]

// Status color mapping for booklet binder status
const getBookletBinderStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return { bg: "#E9D7FE", color: "#6941C6" } // Purple
    case "In Progress":
      return { bg: "#FEF0C7", color: "#B54708" } // Orange
    case "Done":
      return { bg: "#D1FADF", color: "#027A48" } // Green
    default:
      return { bg: "#F2F4F7", color: "#667085" } // Gray (default)
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const { bg, color } = getBookletBinderStatusColor(status)
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
  )
}

interface BookletBinderTaskProps {
  tasks: any
}

const BookletBinderTask : React.FC<BookletBinderTaskProps> = ({ tasks }) => {
  const dispatch = useAppDispatch()
  const { orders, loading } = useAppSelector((state) => state.orders)
  const router = useRouter()

  useEffect(() => {
    dispatch(getBookletBinderThunk()) // Fetch orders for booklet binder
  }, [dispatch])
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
        dispatch(getBookletBinderThunk()); // Or getBinderOrdersThunk(), etc.
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  const handleRowClick = (orderId: string) => {
    router.push(`/admin/bookletbinder-task/view?id=${orderId}`)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  // Transform orders data for table
  const rowData = tasks.map((order) => ({
    id: order._id,
    party: order.party?.partyName || "N/A",
    date: new Date(order.createdAt).toLocaleDateString(),
    size: order.size || "N/A",
    itemName: order.productItem?.itemName || "N/A",
    remarks: order.bookletBinderRemarks || "N/A", // Use bookletBinderRemarks
    status: order.bookletBinderStatus || "Pending", // Use bookletBinderStatus
  }))

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
      <TableCell>{row.remarks}</TableCell>
      <TableCell align="center">
        <StatusBadge status={row.status} />
      </TableCell>
       <TableCell align="center">
        {row.status === "Pending" && (
          <Button
            onClick={() => handleUpdateStatus(row.id, "bookletBinder", "In Progress")}
          >
            Start Task
          </Button>
        )}
      </TableCell>
    </>
  )

  return (
    <BasicTable
      tableHeader={tableHeader}
      rowData={rowData}
      renderRow={renderRow}
      showDatePicker={false}
      showSearch={false}
      showFillter={false}
    />
  )
}

export default BookletBinderTask
