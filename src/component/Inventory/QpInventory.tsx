import React, { useState, useEffect } from 'react';
import { Box, Button, Stack, TableCell, Chip } from '@mui/material';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa6';
import { MdPeople } from 'react-icons/md';
import BasicTable from '@/component/common_component/Table/themetable';
import ThemeTabs, { TabItem } from '@/component/common_component/themetabs';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllInventoryThunk } from '@/store/slices/inventorySlice';

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
    const { allInventory } = useAppSelector(state => state.inventory);
    const permissions = user.role.permissions;
    const paperKeys = ['deckal', 'gsm', 'bf', 'color']
    const boxKeys = ['boxSize', 'boxGSM', 'ply', 'isKantan', 'deckal'];

    const [subData, setSubData] = useState<any>([])
    const [allSubData, setAllSubData] = useState<any>([])
    const [detailOpen, setDetailOpen] = useState<any>(null)
    const [activeWardTab, setActiveWardTab] = useState<WardTab>(WardTab.INWARD);
    const [activeMainTab, setActiveMainTab] = useState<InventoryCategory>(InventoryCategory.FACTORY);
    const [activeMaterialTab, setActiveMaterialTab] = useState(MaterialCategory.BOX);

    const handleRowClick = (data: any) => detailOpen !== null ? null : setDetailOpen(data)

    const formatedInventory = allInventory.map((item: any) => ({
        ...item,
        boxSize: `${item?.boxLength} x ${item?.boxWidth} x ${item?.boxHeight}`,
        boxGSM: `${item?.paper1GSM || ""} - ${item?.paper2GSM || ""} - ${item?.paper3GSM || ""}`,
        usedBox: item?.usedBox || 0,
        // Normalize deckal in the formatted data
        deckal: normalizeDeckal(item?.deckal)
    }))

    const getPermissionWiseInventory = () => {
        if (permissions?.inventory?.view_global) return formatedInventory;
        else if (permissions?.inventory?.view_own)
            return formatedInventory?.filter(
                (item) =>
                    item.forCompany?._id === user?.id
            );
        return [];
    };

    useEffect(() => {
        dispatch(getAllInventoryThunk());
    }, []);

    const handleMainTabChange = (_: React.SyntheticEvent, newValue: any) => {
        setActiveMainTab(newValue as InventoryCategory);
        if (newValue.toLowerCase() === 'godown') setActiveMaterialTab("box")
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
    const calculateInventoryStats = (filteredInventory: any[]) => {
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
    };

    const tableConfigs: Record<any, { header: any[]; render: (row: any) => any }> = {
        kantan: {
            header: [
                { id: "kantanName", label: "KANTAN NAME" },
                { id: "reel", label: "REEL" },
                { id: "date", label: "DATE" },
            ],
            render: (row) => (
                <>
                    <TableCell>{row.kantan?.kantanName || "N/A"}</TableCell>
                    <TableCell>{row.reel || "N/A"}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                </>
            ),
        },
        box: {
            header: [
                { id: "boxType", label: "TYPE" },
                { id: "lwh", label: "SIZE" },
                { id: "gsm", label: "GSM" },
                { id: "deckal", label: "DECKAL" },
                { id: "balance", label: "BALANCE" },
                { id: "pending", label: "PENDING ORDERS" },
                { id: "available", label: "AVAILABLE" },
                { id: "ply", label: "PLY" },
                { id: "kantan", label: "KANTAN" },
                detailOpen !== null && { id: "pcs", label: "PCS" },
                detailOpen !== null && { id: "used", label: "USED" },
                detailOpen !== null && { id: "date", label: "DATE" },
            ].filter(Boolean),
            render: (row) => {
                const type = row?.inventoryType?.toLowerCase();
                const category = row?.category;

                let keys: string[] = [];
                if (type === "box") keys = boxKeys;
                else if (type === "paper") keys = paperKeys;

                // ✅ Filter all inventory matching this row's key combination
                const filteredInventory = formatedInventory?.filter((item: any) =>
                    item?.inventoryType?.toLowerCase() === type &&
                    item?.category === category &&
                    keys?.every((key) => {
                        // Special handling for deckal to use normalized values
                        if (key === 'deckal') {
                            return normalizeDeckal(item[key]) === normalizeDeckal(row[key]);
                        }
                        return item[key] === row[key];
                    })
                );

                // ✅ Calculate stats
                const { balance, pendingOrders, availableForNewOrders } = calculateInventoryStats(filteredInventory);

                return (
                    <>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.boxType || "Box"}
                        </TableCell>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.boxSize}
                        </TableCell>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.boxGSM}
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
                            {row?.ply}
                        </TableCell>
                        <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: "pointer" }}>
                            {row?.isKantan ? "yes" : "no"}
                        </TableCell>
                        
                        {detailOpen !== null && (
                            <>
                                <TableCell sx={{ cursor: "pointer" }}>{row?.quantity}</TableCell>
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
                { id: "paper", label: "PAPER" },
                { id: "deckal", label: "DECKAL" },
                { id: "gsm", label: "GSM" },
                { id: "bf", label: "bf" },
                { id: "color", label: "color" },
                detailOpen !== null && { id: "kg", label: "kg" },
                { id: "date", label: "DATE" },
            ].filter(Boolean),
            render: (row) => (
                <>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>Paper</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{normalizeDeckal(row?.deckal)}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.gsm || "N/A"}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.bf || "N/A"}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.color || "N/A"}</TableCell>
                    {detailOpen !== null ? <TableCell sx={{ cursor: 'pointer' }}>{row?.kg}</TableCell> : null}
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                </>
            ),
        },
    };

    const getUniqueByKeys = (inventoryType: any, category: any) => {
        if (!inventoryType) return [];

        const type = inventoryType.toString().toLowerCase().trim();

        let keys: string[] = [];
        if (type === 'box') keys = boxKeys;
        else if (type === 'paper') keys = paperKeys;
        else if (type === 'kantan') keys = [];

        const inventoryList = getPermissionWiseInventory?.();
        if (!Array.isArray(inventoryList)) return [];

        const filtered = inventoryList?.filter(
            (item: any) =>
                item?.inventoryType?.toLowerCase().trim() === type &&
                item?.category === category
        );  

        const seen = new Set();
        return filtered?.filter((item: any) => {
            // Create normalized key values for proper grouping
            const keyValue = keys?.map((k) => {
                if (k === 'deckal') {
                    // Use normalized deckal value for grouping
                    return normalizeDeckal(item?.[k]);
                }
                return item?.[k] ?? '';
            }).join('|');
            
            if (seen.has(keyValue)) return false;
            seen.add(keyValue);
            return true;
        });
    }

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
                    return item[key] === detailOpen[key];
                })
            );

            setAllSubData(filteredInventory)
            setSubData(filteredInventory.filter((item) => item.type.toLowerCase() === activeWardTab.toLowerCase()));
        }
    }, [detailOpen, formatedInventory, activeWardTab]);

    // Calculate overall stats for the detail view
    const getDetailStats = () => {
        if (!allSubData || allSubData.length === 0) {
            return { balance: 0, pendingOrders: 0, availableForNewOrders: 0 };
        }
        return calculateInventoryStats(allSubData);
    };

    const detailStats = getDetailStats();

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

            {detailOpen === null ? <BasicTable
                tableHeader={tableConfigs[activeMaterialTab].header}
                rowData={getUniqueByKeys(activeMaterialTab, activeMainTab)}
                renderRow={tableConfigs[activeMaterialTab].render}
            /> : <BasicTable
                tableHeader={tableConfigs[activeMaterialTab].header}
                rowData={subData}
                renderRow={tableConfigs[activeMaterialTab].render}
            />}

            {detailOpen !== null ? <Button variant='outlined' onClick={() => setDetailOpen(null)}> ← Back</Button> : null}
        </>
    );
};

export default QpInventoryPage;