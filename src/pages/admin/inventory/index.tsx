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
  { label: 'Printer', value: InventoryCategory.PRINTER, icon: <MdPeople /> },
  { label: 'Binder', value: InventoryCategory.BINDER, icon: <MdPeople /> },
  { label: 'Booklet', value: InventoryCategory.BOOKLET, icon: <MdPeople /> },
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

const InventoryPage = () => {
  const dispatch = useAppDispatch();
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
  const filtered = inventory.filter(item => item.type === activeWardTab);
  const aggregated: Record<string, AggregatedInventory> = {};

  // First pass: aggregate all inward items
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
        lastPurchaseDate: null, // Track the actual date of last purchase
        usedQty: 0,
        balance: 0,
        purchases: []
      };
    }

    aggregated[key].totalQuantity += item.quantity;
    aggregated[key].purchases.push(item);
    
    // Track the most recent inward purchase
    if (item.type === 'inward') {
      const itemDate = new Date(item.date);
      if (!aggregated[key].lastPurchaseDate || itemDate > aggregated[key].lastPurchaseDate) {
        aggregated[key].lastPurchaseDate = itemDate;
        aggregated[key].lastPurchase = item.quantity;
      }
    }
  });

  // Second pass: calculate used quantity from outward items
  const outwardItems = inventory.filter(item => item.type === 'outward');
  outwardItems.forEach(item => {
    if (!item.forCompany || !item.material) return;
    
    const key = `${item.forCompany._id}-${item.material._id}`;
    if (aggregated[key]) {
      aggregated[key].usedQty += item.quantity;
    }
  });

  // Calculate balance for each item
  Object.keys(aggregated).forEach(key => {
    aggregated[key].balance = aggregated[key].totalQuantity - aggregated[key].usedQty;
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

  const filteredInventory = inventory.filter(item => 
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
    inventory
      .filter(item => item.forCompany)
      .map(item => item.forCompany._id)
  )).map(printerId => {
    const printer = inventory.find(item => item.forCompany?._id === printerId)?.forCompany;
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
              { id: 'material', label: 'MATERIAL' },
              { id: 'size', label: 'SIZE' },
              { id: 'gsm', label: 'GSM' },
              { id: 'kg', label: 'KG' },
              { id: 'qty', label: 'QTY' },
              { id: 'date', label: 'DATE' },
              { id: 'vendor', label: 'VENDOR' },
            ]}
            rowData={filteredInventory}
            renderRow={(row) => (
              <>
                <TableCell>{row.material?.materialName || 'N/A'}</TableCell>
                <TableCell>{row.material?.materialSize || 'N/A'}</TableCell>
                <TableCell>{row.material?.materialGSM || 'N/A'}</TableCell>
                <TableCell>{row.kg}</TableCell>
                <TableCell>{row.quantity}</TableCell>
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
                renderRow={(row) => (
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
                )}
                showDatePicker={false}
                showSearch={false}
                showFillter={false}
              />
            </>
          ) : (
            <>
              <Box sx={styles.filterContainer}>
                {/* <Select
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
                </Select> */}

                {/* <Select
                  size="small"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  sx={{ minWidth: 120 }}
                  displayEmpty
                >
                  <MenuItem value="">All Vendors</MenuItem>
                  {vendorOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select> */}

                <Typography variant="body2" fontWeight={700}>
                  LAST PURCHASE - {selectedPrinter?.lastPurchase || 0}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  USED QUANTITY - {selectedPrinter?.usedQty || 0}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  BALANCE - {selectedPrinter?.balance || 0}
                </Typography>
              </Box>

              {/* <Typography variant="h6" mb={2}>
                Purchase Details for {selectedPrinter?.printerName} - {selectedPrinter?.materialName} ({selectedPrinter?.materialGSM} GSM, {selectedPrinter?.materialSize})
              </Typography> */}

              <BasicTable
                tableHeader={[
                  { id: 'paper', label: 'PAPER' },
                  { id: 'gsm', label: 'GSM' },
                  { id: 'size', label: 'SIZE' },
                  { id: 'qty', label: 'QTY' },
                  { id: 'date', label: 'DATE IN WARD' },
                  { id: 'vendor', label: 'VENDOR' },
                ]}
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
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <span>{row.vendor?.name || 'N/A'}</span>
                        <FaChevronRight style={styles.tableActionIcon} />
                      </Box>
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

export default InventoryPage;