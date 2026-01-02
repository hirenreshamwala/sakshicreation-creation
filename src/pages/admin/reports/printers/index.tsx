import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TableCell,
  IconButton,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BasicTable from '@/component/common_component/Table/themetable';
import DateRangePicker from '@/component/daterangepicker';
import FilterDropdown from '@/component/fillter'; // જો તમારી પાસે આ કમ્પોનેન્ટ છે
import moment from 'moment';
import { reportService, PrinterPerformance } from '@/services/reportService';
import Loader from '@/component/common_component/loader';

const columns = [
  { id: 'name', label: 'Printer Name' },
  { id: 'totalAssignedOrders', label: 'Total Assigned' },
  { id: 'printingCompletedCount', label: 'Completed' },
  { id: 'pendingOrdersCount', label: 'Pending' },
  { id: 'inProgressOrdersCount', label: 'In Progress' },
];

const PrintersPage = () => {
  const defaultStartDate = moment().subtract(30, 'days').toDate();
  const defaultEndDate = moment().toDate();

  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);

  const [dateRange, setDateRange] = useState({
    startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
    endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
  });

  const [printers, setPrinters] = useState<PrinterPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Printer Name Filter State
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);

  // Fetch data on dateRange change
  useEffect(() => {
    fetchPrinterData();
  }, [dateRange]);

  const fetchPrinterData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getPrinterPerformance(dateRange);
      if (response.success && response.data) {
        setPrinters(response.data);
      } else {
        setPrinters([]);
      }
    } catch (error) {
      console.error('Error fetching printer data:', error);
      setPrinters([]);
    } finally {
      setLoading(false);
    }
  };

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
    setSelectedPrinters([]); // Clear filter
  };

  // Client-side filtering for table
  const filteredPrinters = useMemo(() => {
    if (selectedPrinters.length === 0) return printers;
    return printers.filter(p => selectedPrinters.includes(p.name.trim()));
  }, [printers, selectedPrinters]);

  // Unique printer names for dropdown filter
  const printerNames = useMemo(() => {
    return [...new Set(printers.map(p => p.name.trim()))].sort();
  }, [printers]);

  // Export to Excel
  const handleExportToExcel = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select a date range first');
      return;
    }

    setExporting(true);
    try {
      const payload: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      if (selectedPrinters.length > 0) {
        payload.printerNames = selectedPrinters;
      }

      const blob = await reportService.exportPrinterToExcel(payload);

      const startFmt = moment(dateRange.startDate).format('DDMMYYYY');
      const endFmt = moment(dateRange.endDate).format('DDMMYYYY');
      const filterSuffix = selectedPrinters.length > 0 ? '_Filtered' : '';

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Printer_Performance_${startFmt}_to_${endFmt}${filterSuffix}.xlsx`;
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

  const displayedDateRange = `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`;

  const isDateRangeChanged = !(
    moment(startDate).isSame(defaultStartDate, 'day') &&
    moment(endDate).isSame(defaultEndDate, 'day')
  );

  if (loading && printers.length === 0) {
    return <Typography>Loading printer data...</Typography>;
  }

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center',justifyContent: "space-between", gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <Button variant="contained" color="primary" onClick={handleApplyDateRange}>
          Apply
        </Button>
        {isDateRangeChanged && (
          <Button variant="outlined" color="error" onClick={handleClearDateRange}>
            Clear
          </Button>
        )}
        </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Printer Name Filter */}
        {printers.length > 0 && (
          <FilterDropdown
            filterOptions={['Printer Name']}
            uniqueValues={printerNames}
            selectedField="Printer Name"
            onFieldSelect={() => {}}
            filters={{ 'Printer Name': selectedPrinters }}
            onFiltersChange={(newFilters) => {
              setSelectedPrinters(newFilters['Printer Name'] || []);
            }}
          />
        )}

        {/* Export Button */}
        <IconButton
          onClick={handleExportToExcel}
          disabled={loading || exporting}
          // sx={{
          //   border: "1px solid #D0D5DD",
          //   borderRadius: 2,
          //   p: 1.5,
          //   color: "#667085",
          //   bgcolor: exporting ? '#f0f0f0' : 'transparent',
          //   '&:hover': {
          //     bgcolor: '#f5f5f5',
          //     borderColor: '#b0b0b0',
          //   },
          //   '&.Mui-disabled': {
          //     borderColor: '#e0e0e0',
          //     color: '#aaa',
          //   },
          // }}
        >
          {exporting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20"
              width="20"
              viewBox="0 0 384 512"
              fill="#667085"
            >
              <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c0-13.3 10.7-24 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373s-16.9 32.5-36.6 68.8c-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 33.6 62.3 36.6 68.5 3-6.2 9.7-19.9 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"/>
            </svg>
          )}
        </IconButton>
        </Box>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
        {selectedPrinters.length > 0 && (
          <span> | Filtered Printers: {selectedPrinters.join(', ')}</span>
        )}
      </Typography>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Data */}
      {!loading && filteredPrinters.length === 0 && (
        <Typography textAlign="center" mt={4} color="text.secondary">
          No data found for selected filters.
        </Typography>
      )}

      {/* Table */}
      {!loading && filteredPrinters.length > 0 && (
        <BasicTable
          tableHeader={columns}
          rowData={filteredPrinters}
          showDatePicker={false}
          showSearch={false}
          showFillter={false}
          renderRow={(row: PrinterPerformance) => (
            <>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.totalAssignedOrders}</TableCell>
              <TableCell>{row.printingCompletedCount}</TableCell>
              <TableCell>{row.pendingOrdersCount}</TableCell>
              <TableCell>{row.inProgressOrdersCount}</TableCell>
            </>
          )}
        />
      )}
    </>
  );
};

export default PrintersPage;