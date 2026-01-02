import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TableCell, Alert } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService } from '@/services/reportService';

interface ProductItem {
  productName: string;
  orderCount: number;
}

interface StaffProductData {
  staffName: string;
  products: ProductItem[];
}

// Flat row type for table
interface FlatRow {
  staffName: string;
  productName: string;
  orderCount: number;
}

interface ProductItemsApiResponse {
  success: boolean;
  message: string;
  data?: StaffProductData[];
}

const ProductsItemsReportPage = () => {
  const defaultStartDate = moment().subtract(30, 'days').toDate();
  const defaultEndDate = moment().toDate();

  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);

  const [dateRange, setDateRange] = useState({
    startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
    endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
  });

  const [flatData, setFlatData] = useState<FlatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const columns = [
    { id: 'staffName', label: 'Staff Name' },
    { id: 'productName', label: 'Product Name' },
    { id: 'orderCount', label: 'Order Count' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiMessage(null);
      setHasData(false);
      try {
        const response: ProductItemsApiResponse = await reportService.getProductItemsReport(dateRange);
        if (response.success && response.data && response.data.length > 0) {
          const flattened: FlatRow[] = [];
          response.data.forEach(staff => {
            staff.products.forEach(product => {
              flattened.push({
                staffName: staff.staffName,
                productName: product.productName,
                orderCount: product.orderCount,
              });
            });
          });

          // Optional: Sort by staff name then product name
          flattened.sort((a, b) => {
            if (a.staffName !== b.staffName) return a.staffName.localeCompare(b.staffName);
            return a.productName.localeCompare(b.productName);
          });

          setFlatData(flattened);
          setHasData(true);
        } else {
          setFlatData([]);
          setHasData(false);
          setApiMessage(response.message || 'No product items data found for the selected date range.');
        }
      } catch (err: any) {
        console.error('Error fetching product items report:', err);
        setFlatData([]);
        setHasData(false);
        setApiMessage(err.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

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
  };

  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  const isDateRangeChanged = !(
    moment(startDate).isSame(defaultStartDate, 'day') &&
    moment(endDate).isSame(defaultEndDate, 'day')
  );

  if (loading) {
    return <Typography>Loading product items report...</Typography>;
  }

  return (
    <div>
      {/* Date Range Picker */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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

      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
      </Typography>

      {apiMessage && !hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {apiMessage}
        </Alert>
      )}

      {hasData && flatData.length > 0 && (
      <BasicTable
        tableHeader={columns}
        rowData={flatData}
        showDatePicker={false}
        showSearch={false}
        renderRow={(row: FlatRow) => (
          <>
            <TableCell sx={{ fontWeight: 'medium' }}>{row.staffName}</TableCell>
            <TableCell>{row.productName}</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {row.orderCount}
            </TableCell>
          </>
        )}
      />
      )}
    </div>
  );
};

export default ProductsItemsReportPage;