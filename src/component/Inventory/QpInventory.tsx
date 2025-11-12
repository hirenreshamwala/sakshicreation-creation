import React, { useState, useEffect } from 'react';
import { Box, Button, Stack, TableCell } from '@mui/material';
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
    KANTAN: "kantan",
    BOX: "box",
    WIRE: "wire",
    GLUE: "glue",
    PAPER: "paper",
}


const QpInventoryPage = () => {
    const dispatch = useAppDispatch();
    const { user }: any = useAppSelector((state) => state.auth)
    const { allInventory } = useAppSelector(state => state.inventory);
    const permissions = user.role.permissions;
    const paperKeys = ['deckal', 'gsm', 'bf', 'color']
    const boxKeys = ['paper3GSM', 'paper2GSM', 'paper1GSM', 'boxHeight', 'boxLength', 'boxWidth', 'ply', 'uom', 'length', 'width', 'height', 'isKantan'];

    const [subData, setSubData] = useState<any>([])
    const [allSubData, setAllSubData] = useState<any>([])
    const [detailOpen, setDetailOpen] = useState<any>(null)
    const [activeWardTab, setActiveWardTab] = useState<WardTab>(WardTab.INWARD);
    const [activeMainTab, setActiveMainTab] = useState<InventoryCategory>(InventoryCategory.GODOWN);
    const [activeMaterialTab, setActiveMaterialTab] = useState(MaterialCategory.PAPER);

    const handleRowClick = (data: any) => detailOpen !== null ? null : setDetailOpen(data)

    const getPermissionWiseInventory = () => {
        if (permissions?.inventory?.view_global) return allInventory;
        else if (permissions?.inventory?.view_own)
            return allInventory?.filter(
                (item) =>
                    item.forCompany?._id === user?.id
            );
        return [];
    };

    useEffect(() => {
        dispatch(getAllInventoryThunk());
    }, []);

    const handleMainTabChange = (_: React.SyntheticEvent, newValue: string | number) => setActiveMainTab(newValue as InventoryCategory);

    const handleWardTabChange = (_: React.SyntheticEvent, newValue: string | number) => setActiveWardTab(newValue as WardTab);

    const materialTabs: TabItem[] = [
        { label: "Kantan", value: MaterialCategory.KANTAN },
        { label: "Box", value: MaterialCategory.BOX },
        // { label: "Wire", value: MaterialCategory.WIRE },
        // { label: "Glue", value: MaterialCategory.GLUE },
        { label: "Paper", value: MaterialCategory.PAPER },
    ];

    const handleMaterialTabChange = (_: React.SyntheticEvent, newValue: string | number) => setActiveMaterialTab(newValue as any);

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
                { id: "deckal", label: "deckal" },
                { id: "qty", label: "QUANTITY" },
                { id: "ply", label: "PLY" },
                { id: "kantan", label: "kantan" },
                detailOpen !== null && { id: "pcs", label: "pcs" },
                { id: "date", label: "DATE" },
            ].filter(Boolean),
            render: (row) => (
                <>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.boxType || "Box"}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.boxLength} x {row?.boxWidth} x {row?.boxHeight}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.paper1GSM} - {row?.paper2GSM} - {row?.paper3GSM}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.deckal ? row?.deckal : "no"}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.quantity}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.ply}</TableCell>
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.isKantan ? "yes" : "no"}</TableCell>
                    {detailOpen !== null ? <TableCell sx={{ cursor: 'pointer' }}>{row?.quantity}</TableCell> : null}
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
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
                    <TableCell onClick={() => handleRowClick(row)} sx={{ cursor: 'pointer' }}>{row?.deckal || "N/A"}</TableCell>
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

        const type = inventoryType.toString().toLowerCase();

        let keys: string[] = [];
        if (type === 'box') keys = boxKeys;
        else if (type === 'paper') keys = paperKeys;
        else if (type === 'kantan') keys = [];

        const inventoryList = getPermissionWiseInventory?.();
        if (!Array.isArray(inventoryList)) return [];

        const filtered = inventoryList?.filter(
            (item: any) =>
                item?.inventoryType?.toLowerCase() === type &&
                item?.category === category
        );

        const seen = new Set();
        return filtered?.filter((item: any) => {
            const keyValue = keys?.map((k) => item?.[k] ?? '').join('|');
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

            const filteredInventory = allInventory?.filter((item: any) =>
                item?.inventoryType?.toLowerCase() === type &&
                item?.category === category &&
                keys.every((key) => item[key] === detailOpen[key])
            );

            setAllSubData(filteredInventory)
            setSubData(filteredInventory.filter((item) => item.type.toLowerCase() === activeWardTab.toLowerCase()));
        }
    }, [detailOpen, allInventory, activeWardTab]);

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

            {detailOpen !== null ? <Stack sx={{ m: 1 }}>
                Balance - {
                    allSubData?.reduce((sum: number, item: any) =>
                        sum + (item?.type === 'inward' ? item?.quantity || 0 : 0) -
                        (item?.type === 'outward' ? item?.quantity || 0 : 0), 0
                    )
                }
            </Stack> : null}

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