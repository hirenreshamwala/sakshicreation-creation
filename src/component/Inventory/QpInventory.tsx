"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Box, Button, Stack, TableCell, Chip } from '@mui/material';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa6';
import { MdPeople } from 'react-icons/md';
import CustomTable2 from "@/component/common_component/Table/CustomTable2";
import ThemeTabs, { TabItem } from '@/component/common_component/themetabs';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllInventoryForQualitThunk, getInventoryFilterOptionsThunk } from '@/store/slices/inventorySlice';
import { toast } from 'react-toastify';
import Loader from '../common_component/loader';

enum InventoryCategory {
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

const MaterialCategory = {
    BOX: "box",
    KANTAN: "kantan",
    PAPER: "paper",
    WIRE: "wire",
    GLUE: "glue",
}

// Helper function to normalize deckal values
const normalizeDeckal = (deckalValue: any): string => {
    if (deckalValue === null || deckalValue === undefined || deckalValue === '' || deckalValue === 'no') {
        return 'no';
    }
    return String(deckalValue);
};

const QpInventoryPage = () => {
    const dispatch = useAppDispatch();
    const { user }: any = useAppSelector((state) => state.auth)
    const { allInventory, loading, filterOptions } = useAppSelector(state => state.inventory); // Added filterOptions from state
    const permissions = user.role.permissions;
    const paperKeys = ['deckal', 'gsm', 'bf', 'color']
    const boxKeys = ['boxSize', 'boxGSM', 'ply', 'isKantan', 'deckal'];

    const [subData, setSubData] = useState<any>([])
    const [allSubData, setAllSubData] = useState<any>([])
    const [detailOpen, setDetailOpen] = useState<any>(null)
    const [activeWardTab, setActiveWardTab] = useState<WardTab>(WardTab.INWARD);
    const [activeMainTab, setActiveMainTab] = useState<InventoryCategory>(InventoryCategory.FACTORY);
    const [activeMaterialTab, setActiveMaterialTab] = useState(MaterialCategory.BOX);

    // Filter states - similar to PaymentFolderPage
    const [isLoadingData, setIsLoadingData] = useState(false);
    // Filter options states - Now synced with redux state
    const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
    const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
    // Use redux filterOptions directly
    const filterOptionsData = useMemo(() => filterOptions, [filterOptions]);

    // Current filter state - similar to PaymentFolderPage
    const [currentFilterState, setCurrentFilterState] = useState<any>({
        page: 1,
        pageSize: 10,
        search: "",
        filters: {
            category: [activeMainTab], // Initial category filter from tab
            inventoryType: [activeMaterialTab], // ✅ Added initial inventoryType filter
            type: [], // Initial for "All" ward
        },
        includeCounts: true,
        isPagination: true,
        startDate: null,
        endDate: null,
    });
    const [appliedFilterState, setAppliedFilterState] = useState<any>({});

    const isMounted = useRef(false);

    const handleRowClick = (data: any) => {
        if (detailOpen !== null) return null;
        setCurrentFilterState(prev => ({ ...prev, page: 1 })); // Reset page to 1 when entering detail view
        setDetailOpen(data);
    };

    const formatedInventory = useMemo(() => allInventory.map((item: any) => ({
        ...item,
        boxSize: `${item?.boxLength || ''} x ${item?.boxWidth || ''} x ${item?.boxHeight || ''}`.trim() || 'N/A',
        boxGSM: `${item?.paper1GSM || ""} - ${item?.paper2GSM || ""} - ${item?.paper3GSM || ""}`.replace(/ - $/, ''),
        usedBox: item?.usedBox || 0,
        // Normalize deckal in the formatted data
        deckal: normalizeDeckal(item?.deckal)
    })), [allInventory]);

    const getPermissionWiseInventory = useCallback(() => {
        if (permissions?.inventory?.view_global) return formatedInventory;
        else if (permissions?.inventory?.view_own)
            return formatedInventory?.filter(
                (item) =>
                    item.forCompany?._id === user?.id
            );
        return [];
    }, [formatedInventory, permissions, user]);

    // Update filters for main tab (category)
    useEffect(() => {
        setCurrentFilterState(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                category: [activeMainTab]
            },
            page: 1
        }));
    }, [activeMainTab]);

    // ✅ Added: Update filters for material tab (inventoryType)
    useEffect(() => {
        setCurrentFilterState(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                inventoryType: [activeMaterialTab]
            },
            page: 1
        }));
    }, [activeMaterialTab]);

    // Load inventory with filters (similar to loadPaymentFolders)
    const loadInventory = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const params = {
                ...currentFilterState,
                filters: {
                    ...currentFilterState.filters,
                },
                isPagination: false, // Fetch all for grouping, but filters applied server-side
                includeCounts: true
            };
            await dispatch(getAllInventoryForQualitThunk(params));
        } catch (err: any) {
            console.error("❌ Error loading inventory:", err);
            toast.error(err.message || "Failed to load inventory");
        } finally {
            setIsLoadingData(false);
        }
    }, [dispatch, currentFilterState]);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            loadInventory();
            setAppliedFilterState(currentFilterState);
        }
    }, [loadInventory]);

    // Load filter options - Now dispatches thunk
    const loadFilterOptions = async (field: string) => {
        setLoadingFilterOptions(true);
        try {
            await dispatch(getInventoryFilterOptionsThunk({ field, filters: currentFilterState.filters })).unwrap();
            // Options will be set in redux state via slice
        } catch (error: any) {
            console.error(`Error loading inventory filter options for ${field}:`, error);
            toast.error(`Failed to load filter options for ${field}`);
        } finally {
            setLoadingFilterOptions(false);
        }
    };

    // Handle filter field selection
    const handleFilterFieldSelect = useCallback(async (field: string | null) => {
        setSelectedFilterField(field);
        if (field && !filterOptionsData[field]) { // Check if options not loaded
            try {
                await loadFilterOptions(field);
            } catch (error) {
                console.error("Error loading inventory filter options:", error);
                toast.error(`Failed to load options for ${field}`);
            }
        }
        return Promise.resolve();
    }, [filterOptionsData, loadFilterOptions]);

    // Handle filter changes
    const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
        setCurrentFilterState((prev: any) => ({
            ...prev,
            filters: newFilters,
            page: 1,
        }));
    }, []);

    // Effect to load inventory when filters change
    useEffect(() => {
        const isSame = JSON.stringify(appliedFilterState) === JSON.stringify(currentFilterState);
        if (!isSame) {
            const timer = setTimeout(() => {
                loadInventory();
                setAppliedFilterState(currentFilterState);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [currentFilterState, appliedFilterState, loadInventory]);

    const handleMainTabChange = (_: React.SyntheticEvent, newValue: any) => {
        setActiveMainTab(newValue as InventoryCategory);
        if (newValue.toLowerCase() === 'godown') setActiveMaterialTab(MaterialCategory.BOX)
    }

    const handleWardTabChange = (_: React.SyntheticEvent, newValue: string | number) => setActiveWardTab(newValue as WardTab);

    const materialTabs: TabItem[] = [
        { label: "Box", value: MaterialCategory.BOX },
        ...(activeMainTab.toLowerCase() !== "godown"
            ? [
                { label: "Paper", value: MaterialCategory.PAPER },
                { label: "Kantan", value: MaterialCategory.KANTAN },
            ]
            : []),
    ];

    const handleMaterialTabChange = (_: React.SyntheticEvent, newValue: string | number) => setActiveMaterialTab(newValue as any);

    // Calculate balance and pending orders for a specific inventory group
    const calculateInventoryStats = useCallback((filteredInventory: any[]) => {
        if (!filteredInventory || !Array.isArray(filteredInventory)) {
            return { balance: 0, pendingOrders: 0, availableForNewOrders: 0 };
        }

        let totalInward = 0;
        let totalOutward = 0;
        let totalUsed = 0;

        filteredInventory.forEach((item: any) => {
            const qty = Number(item?.quantity) || 0;
            const used = Number(item?.usedBox) || 0;

            if (item?.type === "inward") {
                totalInward += qty;
                totalUsed += used;
            } else if (item?.type === "outward") {
                totalOutward += qty;
            }
        });

        const balance = totalInward - totalOutward;
        const pendingOrders = totalUsed;
        const availableForNewOrders = balance - pendingOrders;

        return {
            balance,
            pendingOrders,
            availableForNewOrders: Math.max(0, availableForNewOrders)
        };
    }, []);

    const tableConfigs: Record<any, { header: any[]; render: (row: any, index: number) => any }> = {
        kantan: {
            header: [
                { id: "kantanName", label: "KANTAN NAME", value: 'kantanName' },
                { id: "reel", label: "REEL", value: 'reel' },
                { id: "date", label: "DATE", value: null }, // Derived, no filter
            ],
            render: (row, index) => (
                <>
                    <TableCell>{row.kantan?.kantanName || "N/A"}</TableCell>
                    <TableCell>{row.reel || "N/A"}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                </>
            ),
        },
        box: {
            header: [
                { id: "lwh", label: "SIZE", value: 'boxSize' },
                { id: "gsm", label: "GSM", value: 'boxGSM' },
                { id: "ply", label: "PLY", value: 'ply' },
                { id: "deckal", label: "DECKAL", value: 'deckal' },
                { id: "balance", label: "BALANCE", value: null },
                { id: "pending", label: "DELIVERY ORDERS", value: null },
                { id: "available", label: "AVAILABLE", value: null },
                { id: "kantan", label: "KANTAN", value: 'isKantan' },
                detailOpen !== null && { id: "pcs", label: "PCS" },
                detailOpen !== null && { id: "used", label: "USED" },
                detailOpen !== null && { id: "date", label: "DATE" },
            ].filter(Boolean),
            render: (row, index) => {
                const type = row?.inventoryType?.toLowerCase();
                const category = row?.category;

                let keys: string[] = [];
                if (type === "box") keys = boxKeys;
                else if (type === "paper") keys = paperKeys;
                // Filter all inventory matching this row's key combination
                const filteredInventory = getPermissionWiseInventory()?.filter((item: any) =>
                    item?.inventoryType?.toLowerCase() === type &&
                    item?.category === category &&
                    keys?.every((key) => {
                        // Special handling for deckal to use normalized values
                        if (key === 'deckal') {
                            return normalizeDeckal(item[key]) === normalizeDeckal(row[key]);
                        }
                        // ✅ Handle empty strings properly
                        const itemVal = item[key] ?? '';
                        const rowVal = row[key] ?? '';
                        return String(itemVal).trim() === String(rowVal).trim();
                    })
                ) || [];

                // ✅ Calculate stats
                const { balance, pendingOrders, availableForNewOrders } = calculateInventoryStats(filteredInventory);

                return (
                    <>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.boxSize || 'N/A'}
                        </TableCell>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.boxGSM || 'N/A'}
                        </TableCell>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.ply || 'N/A'}
                        </TableCell>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {normalizeDeckal(row?.deckal)}
                        </TableCell>

                        {/* Balance Column */}
                        <TableCell sx={{
                            fontWeight: 600,
                            color: balance > 0 ? "green" : "red"
                        }}>
                            {detailOpen ? row.quantity : balance}
                        </TableCell>

                        {/* Pending Orders Column */}
                        <TableCell sx={{
                            fontWeight: 600,
                            color: pendingOrders > 0 ? "orange" : "gray"
                        }}>
                            {detailOpen ? row.usedBox || 0 : pendingOrders}
                        </TableCell>

                        {/* Available Column */}
                        <TableCell sx={{
                            fontWeight: 600,
                            color: availableForNewOrders > 0 ? "blue" : "red"
                        }}>
                            {detailOpen ? (row.quantity - (row.usedBox || 0)) : availableForNewOrders}
                        </TableCell>


                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.isKantan ? "yes" : "no"}
                        </TableCell>

                        {detailOpen !== null && (
                            <>
                                <TableCell sx={{ cursor: "pointer" }}>{row?.quantity || 0}</TableCell>
                                <TableCell sx={{ cursor: "pointer" }}>{row?.usedBox || 0}</TableCell>
                                <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                            </>
                        )}
                    </>
                );
            },
        },
        wire: {
            header: [
                { id: "type", label: "TYPE" },
                { id: "kg", label: "KG" },
                { id: "date", label: "DATE" },
            ],
            render: (row) => (
                <>
                    <TableCell>{row.wireType || "Wire"}</TableCell>
                    <TableCell>{row.kg || "N/A"}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                </>
            ),
        },
        glue: {
            header: [
                { id: "type", label: "TYPE" },
                { id: "kg", label: "KG" },
                { id: "date", label: "DATE" },
            ],
            render: (row) => (
                <>
                    <TableCell>{row.glueType || "Glue"}</TableCell>
                    <TableCell>{row.kg || "N/A"}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                </>
            ),
        },
        paper: {
            header: [
                { id: "paper", label: "PAPER", value: null },
                { id: "deckal", label: "DECKAL", value: 'deckal' },
                { id: "gsm", label: "GSM", value: 'gsm' },
                { id: "bf", label: "BF", value: 'bf' }, // Fixed: Capitalize label for clarity
                { id: "color", label: "COLOR", value: 'color' }, // Fixed: Capitalize label for clarity
                detailOpen !== null && { id: "kg", label: "KG", value: 'kg' },
                { id: "date", label: "DATE", value: null },
            ].filter(Boolean),
            render: (row, index) => (
                <>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>Paper</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{normalizeDeckal(row?.deckal)}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.gsm || "N/A"}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.bf || "N/A"}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.color || "N/A"}</TableCell>
                    {detailOpen !== null ? <TableCell sx={{ cursor: 'pointer' }}>{row?.kg || 0}</TableCell> : null}
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                </>
            ),
        },
    };

    const getUniqueByKeys = useCallback((inventoryType: any, category: any) => {
        if (!inventoryType) return [];

        const type = inventoryType.toString().toLowerCase().trim();

        let keys: string[] = [];
        if (type === 'box') keys = boxKeys;
        else if (type === 'paper') keys = paperKeys;
        else if (type === 'kantan') keys = [];
        const inventoryList = getPermissionWiseInventory();
        if (!Array.isArray(inventoryList)) return [];

        const filtered = inventoryList?.filter(
            (item: any) =>
                item?.inventoryType?.toLowerCase().trim() === type &&
                item?.category === category
        );

        const seen = new Set();
        const uniqueItems: any[] = [];
        filtered?.forEach((item: any) => {
            // Create normalized key values for proper grouping
            const keyValue = keys?.map((k) => {
                if (k === 'deckal') {
                    // Use normalized deckal value for grouping
                    return normalizeDeckal(item?.[k]);
                }
                const val = item?.[k] ?? '';
                return String(val).trim();
            }).join('|');

            if (!seen.has(keyValue)) {
                seen.add(keyValue);
                // ✅ Create a representative row for the group (use first item or aggregate if needed)
                uniqueItems.push({
                    ...item,
                    // Ensure formatted fields are set
                    boxSize: item.boxSize || `${item?.boxLength || ''} x ${item?.boxWidth || ''} x ${item?.boxHeight || ''}`.trim() || 'N/A',
                    boxGSM: item.boxGSM || `${item?.paper1GSM || ""} - ${item?.paper2GSM || ""} - ${item?.paper3GSM || ""}`.replace(/ - $/, ''),
                    deckal: normalizeDeckal(item?.deckal)
                });
            }
        });
        return uniqueItems;
    }, [getPermissionWiseInventory]);

    useEffect(() => {
        if (detailOpen !== null) {
            const { inventoryType, category } = detailOpen;
            const type = inventoryType?.toLowerCase();

            let keys: string[] = [];
            if (type === 'box') keys = boxKeys;
            else if (type === 'paper') keys = paperKeys;
            else keys = [];

            const filteredInventory = formatedInventory?.filter((item: any) =>
                item?.inventoryType?.toLowerCase() === type &&
                item?.category === category &&
                keys.every((key) => {
                    // Use normalized comparison for deckal
                    if (key === 'deckal') {
                        return normalizeDeckal(item[key]) === normalizeDeckal(detailOpen[key]);
                    }
                    // ✅ Handle empty strings properly
                    const itemVal = item[key] ?? '';
                    const detailVal = detailOpen[key] ?? '';
                    return String(itemVal).trim() === String(detailVal).trim();
                })
            ) || [];

            setAllSubData(filteredInventory)
            setSubData(filteredInventory.filter((item) => item.type.toLowerCase() === activeWardTab.toLowerCase()));
        }
    }, [detailOpen, formatedInventory, activeWardTab]);

    // Calculate overall stats for the detail view
    const getDetailStats = useCallback(() => {
        if (!allSubData || allSubData.length === 0) {
            return { balance: 0, pendingOrders: 0, availableForNewOrders: 0 };
        }
        return calculateInventoryStats(allSubData);
    }, [allSubData, calculateInventoryStats]);

    const detailStats = getDetailStats();

    // For CustomTable2 - dynamic based on detailOpen
    const currentTableConfig = tableConfigs[activeMaterialTab];
    const groupedRows = useMemo(() => detailOpen === null ? getUniqueByKeys(activeMaterialTab, activeMainTab) : subData, [detailOpen, getUniqueByKeys, activeMaterialTab, activeMainTab, subData]);
    const totalRows = groupedRows.length; // Client-side total for grouped pagination

    // ✅ FIX: Client-side pagination slicing for both grouped and detail views
    // In detail view, perhaps disable pagination or show all - but since user says pagination right, keep it
    const displayRows = useMemo(() => {
        const { page, pageSize } = currentFilterState;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return groupedRows.slice(startIndex, endIndex);
    }, [groupedRows, currentFilterState.page, currentFilterState.pageSize]);

    // Loading check
    if (loading || isLoadingData) {
        return <div><Loader /></div>;
    }

    return (
        <>
            <Box
                sx={{
                    mt: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                {detailOpen === null ? <Box>
                    <ThemeTabs
                        value={activeMainTab}
                        onChange={handleMainTabChange}
                        tabs={mainTabs}
                    />
                </Box> : null}

                {detailOpen !== null ? <Box>
                    <ThemeTabs
                        value={activeWardTab}
                        onChange={handleWardTabChange}
                        tabs={wardTabs}
                    />
                </Box> : null}

                {detailOpen === null ? <Box>
                    <ThemeTabs
                        value={activeMaterialTab}
                        onChange={handleMaterialTabChange}
                        tabs={materialTabs}
                    />
                </Box> : null}
            </Box>

            {detailOpen !== null ? (
                <Stack sx={{ m: 1 }} spacing={1}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            label={`Balance: ${detailStats.balance}`}
                            color={detailStats.balance > 0 ? "success" : "error"}
                            variant="outlined"
                        />
                        <Chip
                            label={`Pending Orders: ${detailStats.pendingOrders}`}
                            color={detailStats.pendingOrders > 0 ? "warning" : "default"}
                            variant="outlined"
                        />
                        <Chip
                            label={`Available: ${detailStats.availableForNewOrders}`}
                            color={detailStats.availableForNewOrders > 0 ? "primary" : "error"}
                            variant="outlined"
                        />
                    </Box>
                </Stack>
            ) : null}
            <CustomTable2
                showDatePicker={true}
                tableHeader={currentTableConfig.header}
                rowData={displayRows} // ✅ Use sliced displayRows
                renderRow={(row, index) => currentTableConfig.render(row, index)}
                title={`Inventory - ${activeMaterialTab.toUpperCase()}`}
                showFillter={true}
                showSearch={true}
                showExcelDownload={false} // Add if needed
                // excelHeaders and excelData if needed
                totalRows={totalRows} // Full total for pagination
                setCurrentFilterState={setCurrentFilterState}
                currentFilterState={currentFilterState}
                onFilterFieldSelect={handleFilterFieldSelect}
                selectedFilterField={selectedFilterField}
                filterOptionsData={filterOptionsData}
                loadingFilterOptions={loadingFilterOptions}
                onFiltersChange={handleFiltersChange}
            />
            {detailOpen !== null ? <Button variant='outlined' onClick={() => setDetailOpen(null)}> ← Back</Button> : null}
        </>
    );
};

export default QpInventoryPage;