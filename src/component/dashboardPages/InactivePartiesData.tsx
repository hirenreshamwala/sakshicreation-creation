import React, { useEffect, useMemo, useState } from "react";
import { Box, TableCell, Button, Popover, List, ListItem, ListItemText, IconButton, Tooltip } from "@mui/material";
import { useAppSelector } from "@/store";
import Request from "@/services/axios";
import BasicTable from "../common_component/Table/themetable";
import Loader from "../common_component/loader";
import * as XLSX from "xlsx";
import { FiDownload } from "react-icons/fi";

interface InactivePartiesDataProps {
    activeTab: number;
    companyName: string;
}

const InactivePartiesData: React.FC<InactivePartiesDataProps> = ({
    activeTab,
    companyName,
}) => {
    const { user } = useAppSelector((state) => state.auth);
    const [inactiveData, setInactiveData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDays, setSelectedDays] = useState(30);
    const [partyTypeFilter, setPartyTypeFilter] = useState('Customer'); // 'All', 'New Party', 'Customer'
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const presets = [
        { value: 30, label: 'Last 30 Days' },
        { value: 60, label: 'Last 60 Days' },
        { value: 90, label: 'Last 90 Days' },
    ];

    const id = open ? 'date-popover' : undefined;

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handlePresetSelect = (value: number) => {
        setSelectedDays(value); // triggers useEffect
        handleClose();
    };

    const handlePartyTypeChange = (type: string) => {
        setPartyTypeFilter(type);
    };

    // Filtered data based on partyTypeFilter
    const filteredData = inactiveData.filter((row) => {
        if (partyTypeFilter === 'All') return true;
        if (partyTypeFilter === 'New Party') return row.partyTag === 'NEW';
        if (partyTypeFilter === 'Customer') return row.partyTag === 'CUSTOMER';
        return true;
    });

    const formatLastOrderDate = (date: string | null) => {
        if (!date) {
            return "NEW PARTY";
        }

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };

    // Excel डाउनलोड के लिए डेटा तैयार करें
    const prepareExcelData = useMemo(() => {
        return filteredData.map((row) => {
            if (companyName === 'Sakshi') {
                return {
                    'Party': row.partyName || 'N/A',
                    'Address': `${row.address?.unitNo || ''} - ${row.address?.marketName || ''} - ${row.address?.area || ''} - ${row.address?.pincode || ''}`,
                    'Created By': `${row.createdBy?.firstName || ''} ${row.createdBy?.lastName || ''}`,
                    'Last Order Date': formatLastOrderDate(row.actualLastOrderDate),
                    'Last Order Number': row?.lastOrderId?.orderNumber || "-",
                    'Item Name': row?.lastOrderId?.productItem?.itemName || "-",
                    'Quantity': row?.lastOrderId?.qty || "-",
                    'Amount': row?.lastOrderId?.finalAmount?.toFixed(2) || "-",
                };
            } else if (companyName === 'QP') {
                return {
                    'Party': row.partyName || 'N/A',
                    'Address': `${row.address?.unitNo || ''} - ${row.address?.marketName || ''} - ${row.address?.area || ''} - ${row.address?.pincode || ''}`,
                    'Created By': `${row.createdBy?.firstName || ''} ${row.createdBy?.lastName || ''}`,
                    'Last Order Date': formatLastOrderDate(row.actualLastOrderDate),
                    'Last Order Number': `QP-${row?.lastOrderId?.orderNo || 'N/A'}`,
                    'Ply': row?.lastOrderId?.orderdata?.ply || 'N/A',
                    'Size': `${row?.lastOrderId?.orderdata?.length || 'N/A'} x ${row?.lastOrderId?.orderdata?.width || 'N/A'} x ${row?.lastOrderId?.orderdata?.height || 'N/A'}`,
                    'Deckal': row?.lastOrderId?.orderdata?.deckal || 'N/A',
                    'GSM': `${row?.lastOrderId?.orderdata?.paper1GSM || 'N/A'} - ${row?.lastOrderId?.orderdata?.paper2GSM || 'N/A'} - ${row?.lastOrderId?.orderdata?.paper3GSM || 'N/A'}`,
                    'Piece No': row?.lastOrderId?.noOfPieces || 'N/A',
                    'Amount': row?.lastOrderId?.amount || 'N/A',
                };
            }
            return {};
        });
    }, [filteredData, companyName]);

    // Excel हेडर्स तैयार करें
    const excelHeaders = useMemo(() => {
        if (companyName === 'Sakshi') {
            return ['Party', 'Address', 'Created By', 'Last Order Date', 'Last Order Number', 'Item Name', 'Quantity', 'Amount'];
        } else if (companyName === 'QP') {
            return ['Party', 'Address', 'Created By', 'Last Order Date', 'Last Order Number', 'Ply', 'Size', 'Deckal', 'GSM', 'Piece No', 'Amount'];
        }
        return [];
    }, [companyName]);

    // Excel डाउनलोड फंक्शन
    const handleExcelDownload = () => {
        if (prepareExcelData.length === 0) return;

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(prepareExcelData);

        // Add headers to the worksheet
        XLSX.utils.sheet_add_aoa(worksheet, [excelHeaders], { origin: "A1" });

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inactive Parties");

        // Download file
        const fileName = `Inactive_Parties_${companyName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // Conditional columns based on companyName
    const getColumns = () => {
        if (companyName === 'Sakshi') {
            return [
                { id: 'partyName', label: 'Party' },
                { id: 'address', label: 'Address' },
                { id: 'createdBy', label: 'Created By' },
                { id: 'lastroderDate', label: 'Last order Date' },
                { id: 'lastordernumber', label: 'Last Order Number' },
                { id: 'name', label: 'Item Name' },
                { id: 'qty', label: 'Quantity' },
                { id: 'amount', label: 'Amount' },
            ];
        } else if (companyName === 'QP') {
            return [
                { id: 'partyName', label: 'Party' },
                { id: 'address', label: 'Address' },
                { id: 'createdBy', label: 'Created By' },
                { id: 'lastOrderDate', label: 'Last Order Date' },
                { id: 'lastorderNumber', label: 'Last Order Number' },
                { id: 'ply', label: 'Ply' },
                { id: 'size', label: 'Size' },
                { id: 'deckal', label: 'Deckal' },
                { id: 'gsm', label: 'GSM' },
                { id: 'pieceNo', label: 'Piece No' },
                { id: 'amount', label: 'Amount' },
            ];
        }
        return [];
    };

    // Inactive parties ke liye API endpoint
    const getInactiveEndpoint = () => {
        if (companyName === 'Sakshi') {
            return '/api/report/getscinactive-parties';
        } else if (companyName === 'QP') {
            return '/api/report/getqpinactive-parties';
        }
        return '';
    };

    // Inactive parties data fetch karein
    const fetchInactiveData = async () => {
        const endpoint = getInactiveEndpoint();
        if (!endpoint || !user?.id) return;

        setLoading(true);
        try {
            const BaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8383';
            const body = { days: selectedDays };
            const res = await Request.post(`${BaseURL}${endpoint}`, body);

            if (res.data.success) {
                setInactiveData(res.data.data || []);
            } else {
                setInactiveData([]);
            }
        } catch (err) {
            console.error("Error fetching inactive parties data:", err);
            setInactiveData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchInactiveData();
        }
    }, [activeTab, companyName, selectedDays]);

    const handleNewcClick = (partyName) => {
        const url = `/admin/all-orders?&party=${partyName}&c=${companyName}`;
        window.open(url, '_blank');
    };

    // Conditional renderRow based on companyName
    const renderRow = (row: any) => {
        if (companyName === 'Sakshi') {
            return (<>
                <TableCell onClick={() => handleNewcClick(row._id)} sx={{ cursor: 'pointer' }}>{row.partyName || 'N/A'}</TableCell>
                <TableCell>{`${row.address.unitNo} - ${row.address.marketName} - ${row.address.area} - ${row.address.pincode}`}</TableCell>
                <TableCell>{`${row.createdBy.firstName} ${row.createdBy.lastName}`}</TableCell>
                <TableCell>{formatLastOrderDate(row.actualLastOrderDate)}</TableCell>
                <TableCell>{`${row?.lastOrderId?.orderNumber || "-"}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.productItem?.itemName || "-"}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.qty || "-"}`}</TableCell>
                <TableCell>
                    {row?.lastOrderId?.finalAmount
                        ? `${row?.lastOrderId?.finalAmount?.toFixed(2)}`
                        : "-"}
                </TableCell>
            </>);
        } else if (companyName === 'QP') {
            return (<>
                <TableCell onClick={() => handleNewcClick(row._id)} sx={{ cursor: 'pointer' }}>{row.partyName || 'N/A'}</TableCell>
                <TableCell>{`${row.address.unitNo} - ${row.address.marketName} - ${row.address.area} - ${row.address.pincode}`}</TableCell>
                <TableCell>{`${row.createdBy.firstName} ${row.createdBy.lastName}`}</TableCell>
                <TableCell>{formatLastOrderDate(row.actualLastOrderDate)}</TableCell>
                <TableCell>{`QP-${row?.lastOrderId?.orderNo || 'N/A'}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.orderdata?.ply || 'N/A'}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.orderdata?.length || 'N/A'} x ${row?.lastOrderId?.orderdata?.width || 'N/A'} x ${row?.lastOrderId?.orderdata?.height || 'N/A'}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.orderdata?.deckal || 'N/A'}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.orderdata?.paper1GSM || 'N/A'} - ${row?.lastOrderId?.orderdata?.paper2GSM || 'N/A'} - ${row?.lastOrderId?.orderdata?.paper3GSM || 'N/A'}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.noOfPieces || 'N/A'}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.amount || 'N/A'}`}</TableCell>
            </>);
        }
        return null;
    };

    const columns = getColumns();
    const displayText = presets.find(p => p.value === selectedDays)?.label || 'Last 30 Days';

    return (
        <Box sx={{ p: 2 }}>
            <Box
                sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                {/* Date Picker (Left) */}
                <Box>
                    <Button
                        aria-describedby={id}
                        variant="outlined"
                        onClick={handleClick}
                        sx={{ minWidth: 200, justifyContent: "flex-start" }}
                    >
                        {displayText}
                    </Button>
                    <Popover
                        id={id}
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    >
                        <Box sx={{ p: 2, width: 200 }}>
                            <List>
                                {presets.map((preset) => (
                                    <ListItem
                                        button
                                        key={preset.value}
                                        onClick={() => handlePresetSelect(preset.value)}
                                        selected={selectedDays === preset.value}
                                    >
                                        <ListItemText primary={preset.label} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Popover>
                </Box>

                {/* Right side: Party Type Filter + Excel Download */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Party Type Filter */}
                    <Box>
                        <Button
                            variant={partyTypeFilter === 'Customer' ? "contained" : "outlined"}
                            onClick={() => handlePartyTypeChange('Customer')}
                            sx={{ mr: 1 }}
                        >
                            Customer
                        </Button>
                        <Button
                            variant={partyTypeFilter === 'New Party' ? "contained" : "outlined"}
                            onClick={() => handlePartyTypeChange('New Party')}
                            sx={{ mr: 1 }}
                        >
                            New Party
                        </Button>
                        <Button
                            variant={partyTypeFilter === 'All' ? "contained" : "outlined"}
                            onClick={() => handlePartyTypeChange('All')}
                        >
                            All
                        </Button>
                    </Box>

                    {/* Excel Download Button */}
                    {filteredData.length > 0 && (
                        <Tooltip title="Download as Excel">
                            <IconButton
                                onClick={handleExcelDownload}
                                sx={{
                                    border: "1px solid #D0D5DD",
                                    borderRadius: 2,
                                    p: 1,
                                    color: "#667085",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                title="Download as Excel"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="16"
                                    width="16"
                                    viewBox="0 0 384 512"
                                // style={{ marginRight: "8px" }}
                                >
                                    <path
                                        fill="#667085"
                                        d="M224 136V0H24C10.7 0 0 10.7 0 24v464c13.3 0 24
                                                   10.7 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 
                                                   0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 
                                                   8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 
                                                   405.5 192 373 192 373c-6.4 14.8-10 20-36.6 
                                                   68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 
                                                   0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 
                                                   .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 
                                                   6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 
                                                   6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 
                                                   10.6-6.3H274c9.5-.1 15.2 10.4 10.1 
                                                   18.4zM384 121.9v6.1H256V0h6.1c6.4 0 
                                                   12.5 2.5 17 7l97.9 98c4.5 4.5 7 
                                                   10.6 7 16.9z"
                                    />
                                </svg>
                                {/* <Typography fontSize={12}>Download excel</Typography>  */}
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {loading ? (
                <Loader />
            ) : filteredData.length > 0 ? (
                <BasicTable
                    showDatePicker={false}
                    showFillter={false}
                    showSearch={false}
                    showExcelDownload={false} // BasicTable का एक्सेल डाउनलोड बंद करें
                    title={`Inactive Parties - ${companyName}`}
                    tableHeader={columns}
                    rowData={filteredData}
                    renderRow={renderRow}
                />
            ) : (
                <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>
                    No inactive parties data for {companyName}
                </Box>
            )}
        </Box>
    );
};

export default InactivePartiesData;