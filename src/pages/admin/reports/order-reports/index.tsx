import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    TableCell,
    Tabs,
    Tab,
    Card,
    CardContent,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BasicTable from '@/component/common_component/Table/themetable';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService } from '@/services/reportService';
import ThemeSelect from '@/component/common_component/themeselect';
import ThemeButton from '@/component/common_component/themebutton';

interface OrderReportData {
    id: string;
    orderNumber: string;
    assignDate: string;
    partyName: string;
    size: string;
    itemName: string;
    remark: string;
    qty: number;
    num: string;
    status: string;
    isPendingMoreThan3Days?: boolean;
    printer: string;
    binder: string;
    booklet: string;
}

const OrderReportsPage = () => {
    const [tabValue, setTabValue] = useState(0);
    const [orderType, setOrderType] = useState('printer');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [pendingOrders, setPendingOrders] = useState<OrderReportData[]>([]);
    const [completedOrders, setCompletedOrders] = useState<OrderReportData[]>([]);
    const defaultStartDate = moment().subtract(30, 'days').toDate();
    const defaultEndDate = moment().toDate();
    const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
    const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);
    const [dateRange, setDateRange] = useState({
        startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
        endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
    });

    useEffect(() => {
        fetchData();
    }, [tabValue, orderType, dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (tabValue === 0) {
                // Pending Orders
                const response = await reportService.getPendingOrders(orderType);
                if (response.success && response.data) {
                    setPendingOrders(response.data);
                } else {
                    setPendingOrders([]);
                }
            } else {
                // Completed Orders
                const response = await reportService.getCompletedOrders(
                    orderType,
                    dateRange.startDate,
                    dateRange.endDate
                );
                if (response.success && response.data) {
                    setCompletedOrders(response.data);
                } else {
                    setCompletedOrders([]);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setPendingOrders([]);
            setCompletedOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

    const handleOrderTypeChange = (event: any) => setOrderType(event);

    const handleApplyDateRange = () => {
        if (startDate && endDate) {
            setDateRange({
                startDate: moment(startDate).format('YYYY-MM-DD'),
                endDate: moment(endDate).format('YYYY-MM-DD'),
            });
        }
    };

    const handleClearDateRange = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setDateRange({
            startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
            endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
        });
    };

    // Date change handlers for DateRangePicker callbacks
    const handleStartDateChange = (value: string) => setStartDate(value ? new Date(value) : null);
    const handleEndDateChange = (value: string) => setEndDate(value ? new Date(value) : null);

    const handleExportToExcel = async () => {
        setExporting(true);
        try {
            let blob: Blob;
            let filename: string;

            if (tabValue === 0) {
                blob = await reportService.exportPendingOrdersToExcel(orderType);
                const typeLabel = orderType === 'printer' ? 'Printer' : orderType === 'binder' ? 'Binder' : 'Booklet Binder';
                filename = `Pending_${typeLabel}_Orders_${moment().format('DDMMYYYY_HHmm')}.xlsx`;
            } else {
                blob = await reportService.exportCompletedOrdersToExcel(
                    orderType,
                    // dateRange.startDate,
                    // dateRange.endDate
                );
                const typeLabel = orderType === 'printer' ? 'Printer' : orderType === 'binder' ? 'Binder' : 'Booklet Binder';
                filename = `Completed_${typeLabel}_Orders_${moment().format('DDMMYYYY_HHmm')}.xlsx`;
            }

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Export failed:', error);
            alert(error.message || 'Failed to export Excel file');
        } finally {
            setExporting(false);
        }
    };

    const getOrderTypeLabel = () => {
        return orderType === 'printer' ? 'Printer' : orderType === 'binder' ? 'Binder' : 'Booklet Binder';
    };

    const displayedOrders = tabValue === 0 ? pendingOrders : completedOrders;
    const isDateRangeChanged = !(
        moment(startDate).isSame(defaultStartDate, 'day') &&
        moment(endDate).isSame(defaultEndDate, 'day')
    );

    const renderRow = (row: OrderReportData) => {
        // Check if row should be highlighted (yellow for pending > 3 days)
        const isHighlighted = tabValue === 0 && row.isPendingMoreThan3Days;

        return (
            <>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.orderNumber}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.assignDate}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.partyName}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.size}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.itemName}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.remark}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.qty}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.num}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{row.status}</TableCell>
                <TableCell sx={{ bgcolor: isHighlighted ? '#FFFF00' : 'inherit' }}>{orderType === "printer" ? row.printer : orderType === "binder" ? row.binder : row.booklet}</TableCell>
            </>
        );
    };

    const columns = [
        { id: 'orderNumber', label: 'Order No' },
        { id: 'assignDate', label: 'Assign Date' },
        { id: 'partyName', label: 'Party Name' },
        { id: 'size', label: 'Size' },
        { id: 'itemName', label: 'Item Name' },
        { id: 'remark', label: 'Remark' },
        { id: 'qty', label: 'Qty' },
        { id: 'num', label: 'Num' },
        { id: 'status', label: 'Status' },
        { id: orderType === "printer" ? 'printer' : orderType === "binder" ? 'binder' : 'booklet', label: orderType === "printer" ? 'Printer' : orderType === "binder" ? 'Binder' : 'Booklet' },
    ];

    const OrderType = [
        { value: "printer", label: "Printer" },
        { value: "binder", label: "Binder" },
        { value: "booklet-binder", label: "Booklet Binder" },
    ];
    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                Order Reports
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <ThemeSelect
                            label="Select Order Type"
                            sx={{ width: "200px", mt: -2.5 }}
                            value={OrderType.find(item => item.value === orderType)}
                            placeholder="Select Order Type"
                            options={OrderType}
                            onChange={(_, v) => handleOrderTypeChange(v ? v.value : "")}
                            disabled={loading}
                        />

                        {tabValue === 1 && (
                            <>
                                <DateRangePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onStartDateChange={handleStartDateChange}
                                    onEndDateChange={handleEndDateChange}
                                    sx={{ flexGrow: 1, maxWidth: 400 }}
                                />
                                <ThemeButton onClick={handleApplyDateRange}>
                                    Apply
                                </ThemeButton>
                                {isDateRangeChanged && (
                                    <ThemeButton onClick={handleClearDateRange}>
                                        Clear
                                    </ThemeButton>
                                )}
                            </>
                        )}

                        <ThemeButton
                            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                            onClick={handleExportToExcel}
                            disabled={loading || exporting}
                        >
                            {exporting ? 'Exporting...' : 'Download Excel'}
                        </ThemeButton>
                    </Box>
                </CardContent>
            </Card>

            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label={`Pending ${getOrderTypeLabel()} Orders`} />
                <Tab label={`Completed ${getOrderTypeLabel()} Orders`} />
            </Tabs>

            {tabValue === 1 && (
                <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
                    Date Range: {moment(startDate).format('DD/MM/YYYY')} - {moment(endDate).format('DD/MM/YYYY')}
                </Typography>
            )}

            {tabValue === 0 && (
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                    * Orders highlighted in yellow are pending for more than 3 days
                </Typography>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && displayedOrders.length === 0 && (
                <Typography textAlign="center" mt={4} color="text.secondary">
                    No {tabValue === 0 ? 'pending' : 'completed'} {getOrderTypeLabel().toLowerCase()} orders found.
                </Typography>
            )}

            {!loading && displayedOrders.length > 0 && (
                <BasicTable
                    tableHeader={columns}
                    rowData={displayedOrders}
                    showDatePicker={false}
                    showSearch={true}
                    showFillter={false}
                    renderRow={renderRow}
                />
            )}
        </Box>
    );
};

export default OrderReportsPage;