import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Select, 
  MenuItem, 
  Typography, 
  Button, 
  TableCell, 
  SxProps, 
  Theme,
  CircularProgress 
} from '@mui/material';
import { FaArrowDown, FaArrowUp, FaChevronRight } from 'react-icons/fa6';
import { MdPeople } from 'react-icons/md';
import BasicTable from '@/component/common_component/Table/themetable';
import CustomTable2 from '@/component/common_component/Table/CustomTable2'; // Added for server-side pagination
import ThemeTabs, { TabItem } from '@/component/common_component/themetabs';
import { useAppDispatch, useAppSelector } from '@/store';
import { getInventoryByCategoryThunk, getInventorySummaryThunk } from '@/store/slices/inventorySlice';
import { getAllMaterialsThunk } from '@/store/slices/materialSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import { toast } from 'react-toastify';
import { formatDateToDDMMYYYY } from '@/utills/utills';

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
  { label: 'Printer', value: InventoryCategory.PRINTER, icon: <MdPeople /> },
  { label: 'Binder', value: InventoryCategory.BINDER, icon: <MdPeople /> },
  { label: 'Booklet', value: InventoryCategory.BOOKLET, icon: <MdPeople /> },
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
  tabsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    mb: 3,
    mt: 2,
    flexWrap: 'wrap',
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

const SakshiInventoryPage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { inventory, summary, loading, error } = useAppSelector(state => state.inventory);
  const { materials } = useAppSelector(state => state.materials);
  const { vendors } = useAppSelector(state => state.vendors);
  const [activeMainTab, setActiveMainTab] = useState<InventoryCategory>(InventoryCategory.PRINTER);
  const [activeWardTab, setActiveWardTab] = useState<WardTab>(WardTab.INWARD);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<AggregatedInventory | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedPrinterFilter, setSelectedPrinterFilter] = useState<string>('');
  const permissions = user.role.permissions;

  // Server-side pagination state (only used for FACTORY tab)
  const [currentFilterState, setCurrentFilterState] = useState<any>({
    page: 1,
    pageSize: 10,
    search: "",
    filters: {},
    includeCounts: true,
    isPagination: true, // Default true for FACTORY
    startDate: null,
    endDate: null,
  });
  const [appliedFilterState, setAppliedFilterState] = useState<any>({});
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const getPermissionWiseInventory = useCallback(() => {
    if (permissions?.inventory?.view_global) {
      return inventory;
    } else if (permissions?.inventory?.view_own) {
      return inventory?.filter(
        (item) => item.forCompany?._id === user?.id
      );
    }
    return [];
  }, [inventory, permissions?.inventory?.view_global, permissions?.inventory?.view_own, user?.id]);

  // Load inventory with optional pagination (full fetch for aggregation tabs, paginated for FACTORY)
  const loadInventory = useCallback(async () => {
    setIsLoadingData(true);
    try {
      let params: any = { category: activeMainTab };
      
      // For non-FACTORY (aggregation), fetch all data
      if (activeMainTab !== InventoryCategory.FACTORY) {
        params.isPagination = false; // Fetch all for client-side aggregation
      } else {
        // For FACTORY, use pagination params
        params = {
          ...currentFilterState,
          category: activeMainTab,
          type: activeWardTab, // Filter by type server-side
          isPagination: true,
          includeCounts: true,
        };
      }

      await dispatch(getInventoryByCategoryThunk(params));
      setIsInitialLoad(true);
    } catch (err: any) {
      console.error("❌ Error loading inventory:", err);
      toast.error(err.message || "Failed to load inventory");
    } finally {
      setIsLoadingData(false);
    }
  }, [dispatch, activeMainTab, activeWardTab, currentFilterState]);

  // Effect: Load inventory when tab or pagination changes
  useEffect(() => {
    const isSame = JSON.stringify(appliedFilterState) === JSON.stringify(currentFilterState);
    if (activeMainTab === InventoryCategory.FACTORY && !isSame) {
      const timer = setTimeout(() => {
        loadInventory();
        setAppliedFilterState(currentFilterState);
      }, 300);
      return () => clearTimeout(timer);
    } else if (activeMainTab !== InventoryCategory.FACTORY) {
      // For aggregation tabs, always fetch all on tab change
      loadInventory();
    }
  }, [activeMainTab, activeWardTab, currentFilterState, appliedFilterState, loadInventory]);

  useEffect(() => {
    dispatch(getAllMaterialsThunk());
    dispatch(getAllVendorsThunk());
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
    if (newValue as InventoryCategory === InventoryCategory.FACTORY) {
      setCurrentFilterState(prev => ({ ...prev, page: 1 })); // Reset page for FACTORY
    }
  };

  const handleWardTabChange = (_: React.SyntheticEvent, newValue: string | number) => {
    setActiveWardTab(newValue as WardTab);
    if (activeMainTab === InventoryCategory.FACTORY) {
      setCurrentFilterState(prev => ({ ...prev, page: 1 })); // Reset page on ward change for FACTORY
    }
  };
  const aggregateInventory = useCallback((): AggregatedInventory[] => {
    const allCategoryItems = getPermissionWiseInventory().filter(item => item.category === activeMainTab);
    const aggregated: Record<string, AggregatedInventory> = {};

    // Process all items for the category to calculate proper totals
    allCategoryItems.forEach(item => {
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

      // Add to purchases array for details
      aggregated[key].purchases.push(item);

      // Calculate totals based on type
      if (item.type === 'inward') {
        aggregated[key].totalQuantity += item.quantity || 0;
        
        // Track the most recent inward purchase
        const itemDate = new Date(item.date);
        if (!aggregated[key].lastPurchaseDate || itemDate > aggregated[key].lastPurchaseDate) {
          aggregated[key].lastPurchaseDate = itemDate;
          aggregated[key].lastPurchase = item.quantity || 0;
        }
      } else if (item.type === 'outward') {
        aggregated[key].usedQty += item.quantity || 0;
      }
    });

    // Calculate balance for each aggregated item
    Object.keys(aggregated).forEach(key => {
      aggregated[key].balance = aggregated[key].totalQuantity - aggregated[key].usedQty;
    });

    return Object.values(aggregated);
  }, [getPermissionWiseInventory, activeMainTab]);

  const aggregatedData = useMemo(() => aggregateInventory(), [aggregateInventory]);

  const handleRowClick = (printerData: AggregatedInventory) => {
    setSelectedPrinter(printerData);
    setShowDetails(true);
  };

  const handleBackClick = () => {
    setShowDetails(false);
    setSelectedPrinter(null);
  };

  const filteredInventory = useMemo(() => getPermissionWiseInventory().filter(item =>
    item.type === activeWardTab &&
    (!selectedMaterial || item.material?._id === selectedMaterial) &&
    (!selectedVendor || item.vendor?._id === selectedVendor) &&
    (!selectedPrinterFilter || item.forCompany?._id === selectedPrinterFilter)
  ), [getPermissionWiseInventory, activeWardTab, selectedMaterial, selectedVendor, selectedPrinterFilter]);

  const materialOptions = useMemo(() => materials.map(material => ({
    value: material._id,
    label: `${material.materialName} (${material.materialGSM} GSM, ${material.materialSize})`
  })), [materials]);

  const vendorOptions = useMemo(() => vendors.map(vendor => ({
    value: vendor._id,
    label: vendor.name
  })), [vendors]);

  const printerOptions = useMemo(() => {
    const uniquePrinterIds = Array.from(new Set(
      getPermissionWiseInventory().filter(item => item.forCompany).map(item => item.forCompany._id)
  ));
  return uniquePrinterIds.map(printerId => {
    const printer = getPermissionWiseInventory().find(item => item.forCompany?._id === printerId)?.forCompany;
    return {
      value: printerId,
      label: printer ? `${printer.firstName} ${printer.lastName}` : 'Unknown'
    };
  });
  }, [getPermissionWiseInventory]);

  // Render row for aggregated data (BasicTable)
  const renderAggregatedRow = useCallback((row: AggregatedInventory, index: number) => (
    <>
      <TableCell>{row.printerName}</TableCell>
      <TableCell>{row.materialName}</TableCell>
      <TableCell>{row.materialGSM}</TableCell>
      <TableCell>{row.materialSize}</TableCell>
      <TableCell>{row.totalQuantity}</TableCell>
      <TableCell>{row.lastPurchase}</TableCell>
      <TableCell>{row.usedQty}</TableCell>
      <TableCell>{row.balance}</TableCell>
      <TableCell>
        <Box display="flex" justifyContent="flex-end" alignItems="center">
          <FaChevronRight
            style={styles.tableActionIcon}
            onClick={() => handleRowClick(row)}
          />
        </Box>
      </TableCell>
    </>
  ), [handleRowClick]);

  // Render row for FACTORY (CustomTable2, raw data)
  const renderFactoryRow = useCallback((row: any, index: number) => (
    <>
      <TableCell>{row.material?.materialName || 'N/A'}</TableCell>
      <TableCell>{row.material?.materialSize || 'N/A'}</TableCell>
      <TableCell>{row.material?.materialGSM || 'N/A'}</TableCell>
      <TableCell>{row.kg || 0}</TableCell>
      <TableCell>{row.quantity || 0}</TableCell>
      <TableCell>{formatDateToDDMMYYYY(row.date)}</TableCell>
      <TableCell>{row.vendor?.name || 'N/A'}</TableCell>
    </>
  ), []);

  // Columns for FACTORY CustomTable2
  const factoryColumns = useMemo(() => [
    { id: 'material', label: 'MATERIAL', value: null },
    { id: 'size', label: 'SIZE', value: null },
    { id: 'gsm', label: 'GSM', value: null },
    { id: 'kg', label: 'KG', value: null },
    { id: 'qty', label: 'QTY', value: null },
    { id: 'date', label: 'DATE', value: null },
    { id: 'vendor', label: 'VENDOR', value: null },
    { id: 'action', label: 'ACTIONS', value: null }, // No actions for now
  ], []);

  // Handle page change for FACTORY
  const handleFactoryPageChange = useCallback((newPage: number) => {
    setCurrentFilterState(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  // Loading for FACTORY
  if (activeMainTab === InventoryCategory.FACTORY && (loading || isLoadingData) && !isInitialLoad) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Main and Ward Tabs in a single row using flex */}
      <Box sx={styles.tabsContainer}>
        <Box sx={{ flex: '0 1 auto', minWidth: 200 }}>
          <ThemeTabs
            value={activeMainTab}
            onChange={handleMainTabChange}
            tabs={mainTabs}
          />
        </Box>
        <Box sx={{ flex: '0 1 auto', minWidth: 150 }}>
          <ThemeTabs
            value={activeWardTab}
            onChange={handleWardTabChange}
            tabs={wardTabs}
          />
        </Box>
      </Box>

      {activeMainTab === InventoryCategory.FACTORY ? (
        // Paginated table for FACTORY using CustomTable2
        <CustomTable2
          tableHeader={factoryColumns}
          rowData={getPermissionWiseInventory()} // Paginated raw data from server
          renderRow={renderFactoryRow}
          title={`Factory Inventory - ${activeWardTab.toUpperCase()}`}
            showDatePicker={false}
            showSearch={false}
            showFillter={false}
            showExcelDownload={false}
            totalRows={inventory.length || 0} // Update with totalCount from API if available
            currentFilterState={currentFilterState}
            setCurrentFilterState={setCurrentFilterState}
            // No filter props needed
          />
      ) : (
        <>
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
                  { id: 'printer', label: 'PRINTER NAME' },
                  { id: 'material', label: 'PAPER' },
                  { id: 'gsm', label: 'GSM' },
                  { id: 'size', label: 'SIZE' },
                  { id: 'quantity', label: 'QUANTITY IN STOCK' },
                  { id: 'lastPurchase', label: 'LAST PURCHASE' },
                  { id: 'usedQty', label: 'USED QUANTITY' },
                  { id: 'balance', label: 'BALANCE' },
                  { id: 'action', label: 'ACTIONS' },
                ]}
                rowData={aggregatedData.filter(item =>
                  (!selectedMaterial || item.materialId === selectedMaterial) &&
                  (!selectedPrinterFilter || item.printerId === selectedPrinterFilter)
                )}
                renderRow={renderAggregatedRow}
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
                    <TableCell>{row.material?.materialName || 'N/A'}</TableCell>
                    <TableCell>{row.material?.materialGSM || 'N/A'}</TableCell>
                    <TableCell>{row.material?.materialSize || 'N/A'}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{formatDateToDDMMYYYY(row.date)}</TableCell>
                    <TableCell>
                      {activeWardTab === WardTab.INWARD ? (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <span>{row.vendor?.name || 'N/A'}</span>
                          <FaChevronRight style={styles.tableActionIcon} />
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <span>{row.orderId?.orderNumber || row.orderId || 'N/A'}</span>
                          <FaChevronRight style={styles.tableActionIcon} />
                        </Box>
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

export default SakshiInventoryPage;