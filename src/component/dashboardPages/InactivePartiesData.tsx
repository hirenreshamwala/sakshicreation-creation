import React, { useEffect, useState } from "react";
import { Box, TableCell, Button, Popover, List, ListItem, ListItemText } from "@mui/material";
import { useAppSelector } from "@/store";
import Request from "@/services/axios";
import BasicTable from "../common_component/Table/themetable";
import Loader from "../common_component/loader";

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
        if (partyTypeFilter === 'New Party') return !row.lastOrderDate;
        if (partyTypeFilter === 'Customer') return !!row.lastOrderDate;
        return true;
    });

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
        if (!endpoint || !user.id) return;

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
        if (user.id) {
            fetchInactiveData();
        }
    }, [activeTab, companyName, selectedDays]);

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

    const handleNewcClick = (partyName) => {
        const url = `/admin/all-orders?&party=${partyName}&c=${companyName}`;
        window.open(url, '_blank');
    };

    // Conditional renderRow based on companyName
    const renderRow = (row: any) => {
        console.log("DEBUG : row:", row);
        if (companyName === 'Sakshi') {
            return (<>
                <TableCell onClick={() => handleNewcClick(row._id)} sx={{ cursor: 'pointer' }}>{row.partyName || 'N/A'}</TableCell>
                <TableCell>{`${row.address.unitNo} - ${row.address.marketName} - ${row.address.area} - ${row.address.pincode}`}</TableCell>
                <TableCell>{`${row.createdBy.firstName} ${row.createdBy.lastName}`}</TableCell>
                <TableCell>{formatLastOrderDate(row.lastOrderDate)}</TableCell>
                <TableCell>{`${row?.lastOrderId?.orderNumber || "New party"}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.productItem?.itemName || "New party"}`}</TableCell>
                <TableCell>{`${row?.lastOrderId?.qty || "New party"}`}</TableCell>
                <TableCell>
                    {row?.lastOrderId?.quotation?.length > 0 ?
                        (() => {
                            const lastQuotation = row.lastOrderId.quotation[row.lastOrderId.quotation.length - 1];
                            const unitPrice = parseFloat(lastQuotation.unitPrice) || 0;
                            const qty = parseFloat(lastQuotation.qty) || 0;
                            const gst = parseFloat(lastQuotation.gst) || 0;

                            const baseAmount = unitPrice * qty;
                            const gstAmount = (baseAmount * gst) / 100;
                            const totalAmount = baseAmount + gstAmount;

                            return `${totalAmount.toFixed(2)}`;
                        })()
                        : "New party"
                    }
                </TableCell>
            </>);
        } else if (companyName === 'QP') {
            return (<>
                <TableCell onClick={() => handleNewcClick(row._id)} sx={{ cursor: 'pointer' }}>{row.partyName || 'N/A'}</TableCell>
                <TableCell>{`${row.address.unitNo} - ${row.address.marketName} - ${row.address.area} - ${row.address.pincode}`}</TableCell>
                <TableCell>{`${row.createdBy.firstName} ${row.createdBy.lastName}`}</TableCell>
                <TableCell>{formatLastOrderDate(row.lastOrderDate)}</TableCell>
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

                {/* Party Type Filter (Right) */}
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
            </Box>

            {loading ? (
                <Loader />
            ) : filteredData.length > 0 ? (
                <BasicTable
                    showDatePicker={false}
                    showFillter={false}
                    showSearch={false}
                    title='Inactive Parties'
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