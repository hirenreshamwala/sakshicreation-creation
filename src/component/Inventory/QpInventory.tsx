import React, { useState, useEffect } from 'react';
import { Box, TableCell } from '@mui/material';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa6';
import { MdPeople } from 'react-icons/md';
import BasicTable from '@/component/common_component/Table/themetable';
import ThemeTabs, { TabItem } from '@/component/common_component/themetabs';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllInventoryThunk } from '@/store/slices/inventorySlice';
import { toast } from 'react-toastify';

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
    const { allInventory: inventory, error } = useAppSelector(state => state.inventory);
    const [activeMaterialTab, setActiveMaterialTab] = useState<MaterialCategory>(MaterialCategory.PAPER);
    const [activeMainTab, setActiveMainTab] = useState<InventoryCategory>(InventoryCategory.GODOWN);
    const [activeWardTab, setActiveWardTab] = useState<WardTab>(WardTab.INWARD);
    const permissions = user.role.permissions;
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
        dispatch(getAllInventoryThunk());
    }, []);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch({ type: 'inventory/clearError' });
        }
    }, [error, dispatch]);

    const handleMainTabChange = (_: React.SyntheticEvent, newValue: string | number) => {
        setActiveMainTab(newValue as InventoryCategory);
    };

    const handleWardTabChange = (_: React.SyntheticEvent, newValue: string | number) => {
        setActiveWardTab(newValue as WardTab);
    };

    enum MaterialCategory {
        KANTAN = "kantan",
        BOX = "box",
        WIRE = "wire",
        GLUE = "glue",
        PAPER = "paper",
    }

    const materialTabs: TabItem[] = [
        { label: "Kantan", value: MaterialCategory.KANTAN },
        { label: "Box", value: MaterialCategory.BOX },
        { label: "Wire", value: MaterialCategory.WIRE },
        { label: "Glue", value: MaterialCategory.GLUE },
        { label: "Paper", value: MaterialCategory.PAPER },
    ];

    const handleMaterialTabChange = (_: React.SyntheticEvent, newValue: string | number) => setActiveMaterialTab(newValue as MaterialCategory);

    const tableConfigs: Record<MaterialCategory, { header: any[]; render: (row: any) => JSX.Element }> = {
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
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                </>
            ),
        },
        box: {
            header: [
                { id: "boxType", label: "TYPE" },
                { id: "lwh", label: "SIZE" },
                { id: "gsm", label: "GSM" },
                { id: "qty", label: "QUANTITY" },
                { id: "date", label: "DATE" },
            ],
            render: (row) => (
                <>
                    <TableCell>{row.boxType || "Box"}</TableCell>
                    <TableCell>{row.boxLength} x {row.boxWidth} x {row.boxHeight}</TableCell>
                    <TableCell>{row.p1gsm?.gsm} - {row.p2gsm?.gsm} - {row.p3gsm?.gsm}</TableCell>
                    <TableCell>{row?.quantity}</TableCell>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                </>
            ),
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
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
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
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                </>
            ),
        },
        paper: {
            header: [
                { id: "paper", label: "PAPER" },
                { id: "gsm", label: "DECKAL" },
                { id: "size", label: "GSM" },
                { id: "qty", label: "KG" },
                { id: "date", label: "DATE" },
            ],
            render: (row) => (
                <>
                    <TableCell>{"Paper"}</TableCell>
                    <TableCell>{row?.p2gsm?.deckal || "N/A"}</TableCell>
                    <TableCell>{row.p2gsm?.gsm || "N/A"}</TableCell>
                    <TableCell>{row.quantity || "N/A"}</TableCell>
                    {/* <TableCell>{row.kg || "N/A"}</TableCell> */}
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                </>
            ),
        },
    };

    return (
        <>
            <Box mb={3}>
                <ThemeTabs
                    value={activeMainTab}
                    onChange={handleMainTabChange}
                    tabs={mainTabs}
                />
            </Box>
            <Box mb={3}>
                <ThemeTabs
                    value={activeWardTab}
                    onChange={handleWardTabChange}
                    tabs={wardTabs}
                />
            </Box>

            <Box py={2}>
                <ThemeTabs
                    value={activeMaterialTab}
                    onChange={handleMaterialTabChange}
                    tabs={materialTabs}
                />
            </Box>

            <BasicTable
                tableHeader={tableConfigs[activeMaterialTab].header}
                rowData={getPermissionWiseInventory().filter((item) =>
                    item.category?.trim().toLowerCase() === activeMainTab.trim().toLowerCase() &&
                    item.type?.trim().toLowerCase() === activeWardTab.trim().toLowerCase() &&
                    item.inventoryType?.trim().toLowerCase() === activeMaterialTab.trim().toLowerCase()
                )}
                renderRow={tableConfigs[activeMaterialTab].render}
            />

        </>
    );
};

export default QpInventoryPage;