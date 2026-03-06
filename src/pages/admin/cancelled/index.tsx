import React, { useEffect, useState, useCallback } from "react"
import { Box, Typography, Button, CircularProgress, TableCell } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { getUserData, formatDateToDDMMYYYY } from "@/utills/utills"
import Loader from "@/component/common_component/loader"
import { toast } from "react-toastify"
import { orderService } from "@/services/order.service"
import BasicTable from "@/component/common_component/Table/themetable"
import moment from "moment"

interface Column {
    id: string;
    label: string;
    align?: "left" | "center" | "right";
}

const columns: Column[] = [
    { id: "orderNumber", label: "Order No." },
    { id: "party", label: "Party" },
    { id: "followUpStaff", label: "Followup Staff" },
    { id: "cancelReason", label: "Cancel Reason" },
    { id: "cancelledAt", label: "Cancelled At" },
]

type CancelledOrderRow = {
    _id: string
    orderNumber: string
    party: {
        partyName: string
    }
    followUp?: {
        staff?: {
            firstName: string
            lastName: string
        }
    }
    cancelRemarks: string
    cancelledAt: string
}

type TableRowData = {
    id: string
    orderNumber: string
    partyName: string
    followUpStaff: string
    cancelReason: string
    cancelledAt: string
}

const CancelledOrdersPage = () => {
    const dispatch = useAppDispatch()
    const { loading } = useAppSelector((state) => state.orders)
    const userData = getUserData()

    const [cancelledOrders, setCancelledOrders] = useState<any[]>([])
    const [downloadingExcel, setDownloadingExcel] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1
    })

    const canViewGlobal = userData?.role?.permissions?.all_orders?.view_global
    const canViewOwn = userData?.role?.permissions?.all_orders?.view_own

    const fetchCancelledOrders = useCallback(async (page = pagination.page, pageSize = pagination.pageSize) => {
        setDownloading(true)
        try {
            // Use the existing getAllOrders API with status filter and pagination
            const response = await orderService.getAllOrders({ 
                status: ["Cancelled"],
                page,
                limit: pageSize
            })
            
            if (response.success && response.data) {
                setCancelledOrders(response.data as any[])
                
                // Update pagination info from response
                if (response.pagination) {
                    setPagination({
                        page: response.pagination.page,
                        pageSize: response.pagination.limit,
                        totalCount: response.pagination.total,
                        totalPages: response.pagination.totalPages
                    })
                }
            }
        } catch (error: any) {
            console.error("Error fetching cancelled orders:", error)
            toast.error(error.message || "Failed to fetch cancelled orders")
        } finally {
            setDownloading(false)
        }
    }, [pagination.page, pagination.pageSize])

    useEffect(() => {
        fetchCancelledOrders()
    }, [fetchCancelledOrders])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
        fetchCancelledOrders(newPage, pagination.pageSize)
    }

    const handleDownloadCancelledExcel = async () => {
        if (downloadingExcel) return

        setDownloadingExcel(true)
        try {
            const blob = await orderService.exportCancelledOrdersToExcel()

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            const fileName = `Cancelled_Orders_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`
            link.setAttribute('download', fileName)

            document.body.appendChild(link)
            link.click()

            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Cancelled orders Excel downloaded successfully!')
        } catch (error: any) {
            console.error('Cancelled orders export failed:', error)
            toast.error(error.message || 'Failed to download cancelled orders Excel')
        } finally {
            setDownloadingExcel(false)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return formatDateToDDMMYYYY(dateString)
    }

    // Transform orders data for table
    const rowData = cancelledOrders.map((order: any) => ({
        id: order._id || "",
        orderNumber: order.orderNumber || "N/A",
        partyName: order.party?.partyName || "N/A",
        followUpStaff: order.followUp?.staff
            ? `${order.followUp.staff.firstName} ${order.followUp.staff.lastName}`
            : "Not Assigned",
        cancelReason: order.cancelRemarks || "No reason provided",
        cancelledAt: formatDate(order.cancelledAt),
    }))

    const renderRow = (row: TableRowData, index: number) => {
        return (
            <>
                <TableCell>
                    <Typography fontSize="14px" color="#6B7280">
                        {row.orderNumber}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography fontSize="14px" color="#6B7280">
                        {row.partyName}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography fontSize="14px" color="#6B7280">
                        {row.followUpStaff}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography fontSize="14px" color="#6B7280" sx={{ maxWidth: 200 }} noWrap title={row.cancelReason}>
                        {row.cancelReason}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography fontSize="14px" color="#6B7280">
                        {row.cancelledAt}
                    </Typography>
                </TableCell>
            </>
        )
    }

    if (!canViewGlobal && !canViewOwn) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography variant="h6" color="error">
                    You don't have permission to view this page.
                </Typography>
            </Box>
        )
    }

    if (loading || downloading) {
        return <Loader />
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    Cancelled Orders
                </Typography>
                <Button
                    variant="contained"
                    startIcon={downloadingExcel ? <CircularProgress size={20} color="inherit" /> : null}
                    onClick={handleDownloadCancelledExcel}
                    disabled={downloadingExcel}
                >
                    {downloadingExcel ? "Downloading..." : "Download Excel"}
                </Button>
            </Box>

            {cancelledOrders.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                    <Typography variant="body1" color="text.secondary">
                        No cancelled orders found.
                    </Typography>
                </Box>
            ) : (
                <BasicTable
                    tableHeader={columns}
                    rowData={rowData}
                    renderRow={renderRow}
                    showDatePicker={false}
                    showSearch={false}
                    showFillter={false}
                    loading={loading || downloading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}
        </Box>
    )
}

export default CancelledOrdersPage