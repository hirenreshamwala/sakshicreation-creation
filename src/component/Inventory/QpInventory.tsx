import React, { useState, useEffect } from 'react';
import { Box, Select, MenuItem, Typography, Button, TableCell, SxProps, Theme } from '@mui/material';
import { FaArrowDown, FaArrowUp, FaChevronRight } from 'react-icons/fa6';
import { MdPeople } from 'react-icons/md';
import BasicTable from '@/component/common_component/Table/themetable';
import ThemeTabs, { TabItem } from '@/component/common_component/themetabs';
import { useAppDispatch, useAppSelector } from '@/store';
import { getInventoryByCategoryThunk, getInventorySummaryThunk } from '@/store/slices/inventorySlice';
import { getAllMaterialsThunk } from '@/store/slices/materialSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import { toast } from 'react-toastify';

enum InventoryCategory {
    PRINTER = 'printer',
    BINDER = 'binder',
    BOOKLET = 'booklet',
    FACTORY = 'factory',
    GODOWN = 'godown',
}

enum WardTab {
    INWARD = 'inward',
    OUTWARD = 'outward',
}

const mainTabs: TabItem[] = [
    { label: 'Factory', value: InventoryCategory.FACTORY, icon: <MdPeople /> },
    { label: 'Godown', value: InventoryCategory.GODOWN, icon: <MdPeople /> },
];

const wardTabs: TabItem[] = [
    { label: 'Inward', value: WardTab.INWARD, icon: <FaArrowDown size={14} /> },
    { label: 'Outward', value: WardTab.OUTWARD, icon: <FaArrowUp size={14} /> },
];

const styles = {
    filterContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: 2,
        columnGap: 4,
        mb: 2,
        alignItems: 'center',
    },
    backButton: {
        mt: 2,
    },
    tableActionIcon: {
        fontSize: 16,
        color: '#6b7280',
        marginLeft: 8,
        cursor: 'pointer',
    },
} satisfies Record<string, SxProps<Theme>>;

interface AggregatedInventory {
    printerId: string;
    printerName: string;
    materialId: string;
    materialName: string;
    materialSize: string;
    materialGSM: string;
    totalQuantity: number;
    lastPurchase: number;
    lastPurchaseDate: Date | null;
    usedQty: number;
    balance: number;
    purchases: any[];
}

const QpInventoryPage = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth)
    const { inventory, summary, loading, error } = useAppSelector(state => state.inventory);
    
    
    const { materials } = useAppSelector(state => state.materials);
    const { vendors } = useAppSelector(state => state.vendors);
    const [activeMainTab, setActiveMainTab] = useState<InventoryCategory>(InventoryCategory.GODOWN);
    const [activeWardTab, setActiveWardTab] = useState<WardTab>(WardTab.INWARD);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState<AggregatedInventory | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<string>('');
    const [selectedVendor, setSelectedVendor] = useState<string>('');
    const [selectedPrinterFilter, setSelectedPrinterFilter] = useState<string>('');
    const permissions = user.role.permissions;
    
    // console.log("DEBUG : QpInventoryPage : inventory:", inventory);
    const getPermissionWiseInventory = () => {
        if (permissions?.inventory?.view_global) {
            return inventory;
        } else if (permissions?.inventory?.view_own) {
            return inventory?.filter(
                (item) =>
                    item.forCompany?._id === user.id
            );
        }
        return [];
    };

    useEffect(() => {
        dispatch(getAllMaterialsThunk());
        dispatch(getAllVendorsThunk());
        dispatch(getInventoryByCategoryThunk(activeMainTab));
        dispatch(getInventorySummaryThunk(activeMainTab));
    }, [dispatch, activeMainTab]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch({ type: 'inventory/clearError' });
        }
    }, [error, dispatch]);

    const handleMainTabChange = (_: React.SyntheticEvent, newValue: string | number) => {
        setActiveMainTab(newValue as InventoryCategory);
        setShowDetails(false);
        setSelectedPrinter(null);
        setSelectedMaterial('');
        setSelectedVendor('');
        setSelectedPrinterFilter('');
    };

    const handleWardTabChange = (_: React.SyntheticEvent, newValue: string | number) => {
        setActiveWardTab(newValue as WardTab);
    };
    const aggregateInventory = (): AggregatedInventory[] => {
        const filtered = getPermissionWiseInventory().filter(item => item.type === activeWardTab);
        const aggregated: Record<string, AggregatedInventory> = {};

        // First pass: aggregate items based on current ward tab
        filtered.forEach(item => {
            if (!item.forCompany || !item.material) return;

            const key = `${item.forCompany._id}-${item.material._id}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    printerId: item.forCompany._id,
                    printerName: `${item.forCompany.firstName} ${item.forCompany.lastName}`,
                    materialId: item.material._id,
                    materialName: item.material.materialName,
                    materialSize: item.material.materialSize,
                    materialGSM: item.material.materialGSM,
                    totalQuantity: 0,
                    lastPurchase: 0,
                    lastPurchaseDate: null,
                    usedQty: 0,
                    balance: 0,
                    purchases: []
                };
            }

            // Add quantity based on type
            if (item.type === 'inward') {
                aggregated[key].totalQuantity += item.quantity;
                aggregated[key].purchases.push(item);

                // Track the most recent inward purchase
                const itemDate = new Date(item.date);
                if (!aggregated[key].lastPurchaseDate || itemDate > aggregated[key].lastPurchaseDate) {
                    aggregated[key].lastPurchaseDate = itemDate;
                    aggregated[key].lastPurchase = item.quantity;
                }
            } else if (item.type === 'outward') {
                aggregated[key].usedQty += item.quantity;
                aggregated[key].purchases.push(item);
            }
        });

        // Second pass: calculate total inward and outward for balance
        // Get all items for the category to calculate proper balance
        const allCategoryItems = getPermissionWiseInventory().filter(item => item.category === activeMainTab);

        Object.keys(aggregated).forEach(key => {
            const [printerId, materialId] = key.split('-');

            // Calculate total inward for this printer/material
            const totalInward = allCategoryItems
                .filter(item =>
                    item.type === 'inward' &&
                    item.forCompany?._id === printerId &&
                    item.material?._id === materialId
                )
                .reduce((sum, item) => sum + item.quantity, 0);

            // Calculate total outward for this printer/material
            const totalOutward = allCategoryItems
                .filter(item =>
                    item.type === 'outward' &&
                    item.forCompany?._id === printerId &&
                    item.material?._id === materialId
                )
                .reduce((sum, item) => sum + item.quantity, 0);

            // Update the aggregated data with proper calculations
            aggregated[key].totalQuantity = totalInward;
            aggregated[key].usedQty = totalOutward;
            aggregated[key].balance = totalInward - totalOutward;

            // For outward tab, we need to show the current outward records
            if (activeWardTab === 'outward') {
                // Find the most recent purchase for this material
                const lastPurchase = allCategoryItems
                    .filter(item =>
                        item.type === 'inward' &&
                        item.forCompany?._id === printerId &&
                        item.material?._id === materialId
                    )
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                if (lastPurchase) {
                    aggregated[key].lastPurchase = lastPurchase.quantity;
                    aggregated[key].lastPurchaseDate = new Date(lastPurchase.date);
                }
            }
        });

        return Object.values(aggregated);
    };
    const aggregatedData = aggregateInventory();

    const handleRowClick = (printerData: AggregatedInventory) => {
        setSelectedPrinter(printerData);
        setShowDetails(true);
    };

    const handleBackClick = () => {
        setShowDetails(false);
        setSelectedPrinter(null);
    };

    const filteredInventory = getPermissionWiseInventory().filter(item =>
        item.type === activeWardTab &&
        (!selectedMaterial || item.material?._id === selectedMaterial) &&
        (!selectedVendor || item.vendor?._id === selectedVendor) &&
        (!selectedPrinterFilter || item.forCompany?._id === selectedPrinterFilter)
    );

    const materialOptions = materials.map(material => ({
        value: material._id,
        label: `${material.materialName} (${material.materialGSM} GSM, ${material.materialSize})`
    }));

    const vendorOptions = vendors.map(vendor => ({
        value: vendor._id,
        label: vendor.name
    }));

    // Create unique printer options
    const printerOptions = Array.from(new Set(
        getPermissionWiseInventory()
            .filter(item => item.forCompany)
            .map(item => item.forCompany._id)
    )).map(printerId => {
        const printer = getPermissionWiseInventory().find(item => item.forCompany?._id === printerId)?.forCompany;
        return {
            value: printerId,
            label: printer ? `${printer.firstName} ${printer.lastName}` : 'Unknown'
        };
    });

    return (
        <>
            <Box mb={3}>
                <ThemeTabs
                    value={activeMainTab}
                    onChange={handleMainTabChange}
                    tabs={mainTabs}
                />
            </Box>

            {activeMainTab === InventoryCategory.FACTORY ? (
                <>
                    <Box py={2}>
                        <ThemeTabs
                            value={activeWardTab}
                            onChange={handleWardTabChange}
                            tabs={wardTabs}
                        />
                    </Box>
                    <BasicTable
                        tableHeader={[
                            { id: 'category', label: 'CATEGORY' },
                            { id: 'for', label: 'for' },
                            { id: 'date', label: 'DATE' },
                            { id: 'vendor', label: 'VENDOR' },
                        ]}
                        rowData={filteredInventory}
                        renderRow={(row) => (
                            <>
                                <TableCell>{row.category || 'N/A'}</TableCell>
                                <TableCell>{row?.for?.roleName || 'N/A'}</TableCell>
                                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                                <TableCell>{row.vendor?.name || 'N/A'}</TableCell>
                            </>
                        )}
                        showDatePicker={false}
                        showSearch={false}
                        showFillter={false}
                    />
                </>
            ) : (
                <>
                    <Box py={2}>
                        <ThemeTabs
                            value={activeWardTab}
                            onChange={handleWardTabChange}
                            tabs={wardTabs}
                        />
                    </Box>

                    {!showDetails ? (
                        <>
                            <Box sx={styles.filterContainer}>
                                <Select
                                    size="small"
                                    value={selectedMaterial}
                                    onChange={(e) => setSelectedMaterial(e.target.value)}
                                    sx={{ minWidth: 120 }}
                                    displayEmpty
                                >
                                    <MenuItem value="">All Materials</MenuItem>
                                    {materialOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Select
                                    size="small"
                                    value={selectedPrinterFilter}
                                    onChange={(e) => setSelectedPrinterFilter(e.target.value)}
                                    sx={{ minWidth: 120 }}
                                    displayEmpty
                                >
                                    <MenuItem value="">All Printers</MenuItem>
                                    {printerOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            <BasicTable
                                tableHeader={[
                                    { id: 'category', label: 'CATEGORY' },
                                    { id: 'for', label: 'for' },
                                    { id: 'date', label: 'DATE' },
                                    { id: 'vendor', label: 'VENDOR' },
                                ]}
                                rowData={aggregatedData.filter(item =>
                                    (!selectedMaterial || item.materialId === selectedMaterial) &&
                                    (!selectedPrinterFilter || item.printerId === selectedPrinterFilter)
                                )}
                                renderRow={(row) => (
                                    <>
                                        <TableCell>{row.category || 'N/A'}</TableCell>
                                        <TableCell>{row?.for?.roleName || 'N/A'}</TableCell>
                                        <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{row.vendor?.name || 'N/A'}</TableCell>
                                    </>
                                )}
                                showDatePicker={false}
                                showSearch={false}
                                showFillter={false}
                            />
                        </>
                    ) : (
                        <>
                            <Box sx={styles.filterContainer}>
                                {activeWardTab === WardTab.OUTWARD && (
                                    <>
                                        <Typography variant="body2" fontWeight={700}>
                                            USED QUANTITY - {selectedPrinter?.usedQty || 0}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            BALANCE - {selectedPrinter?.balance || 0}
                                        </Typography>
                                    </>
                                )}
                                {activeWardTab === WardTab.INWARD && (
                                    <Typography variant="body2" fontWeight={700}>
                                        LAST PURCHASE - {selectedPrinter?.lastPurchase || 0}
                                    </Typography>
                                )}
                            </Box>

                            <BasicTable
                                tableHeader={
                                    activeWardTab === WardTab.INWARD
                                        ? [
                                            { id: 'paper', label: 'PAPER' },
                                            { id: 'gsm', label: 'GSM' },
                                            { id: 'size', label: 'SIZE' },
                                            { id: 'qty', label: 'QTY' },
                                            { id: 'date', label: 'DATE IN WARD' },
                                            { id: 'vendor', label: 'VENDOR' },
                                        ]
                                        : [
                                            { id: 'paper', label: 'PAPER' },
                                            { id: 'gsm', label: 'GSM' },
                                            { id: 'size', label: 'SIZE' },
                                            { id: 'qty', label: 'QTY' },
                                            { id: 'date', label: 'DATE' },
                                            { id: 'order', label: 'ORDER ID' },
                                        ]
                                }
                                rowData={filteredInventory.filter(item =>
                                    item.forCompany?._id === selectedPrinter?.printerId &&
                                    item.material?._id === selectedPrinter?.materialId
                                )}
                                showDatePicker={false}
                                showSearch={false}
                                showFillter={false}
                                renderRow={(row) => (
                                    <>
                                        <TableCell>{row.category || 'N/A'}</TableCell>
                                        <TableCell>{row.material?.materialGSM || 'N/A'}</TableCell>
                                        <TableCell>{row.material?.materialSize || 'N/A'}</TableCell>
                                        <TableCell>{row.quantity}</TableCell>
                                        <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {activeWardTab === WardTab.INWARD ? (
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <span>{row.vendor?.name || 'N/A'}</span>
                                                    <FaChevronRight style={styles.tableActionIcon} />
                                                </Box>
                                            ) : (
                                                row.orderId || 'N/A'
                                            )}
                                        </TableCell>
                                    </>
                                )}
                            />

                            <Box sx={styles.backButton}>
                                <Button variant="outlined" onClick={handleBackClick} sx={{ textTransform: 'none' }}>
                                    Back to Inventory
                                </Button>
                            </Box>
                        </>
                    )}
                </>
            )}
        </>
    );
};

export default QpInventoryPage;