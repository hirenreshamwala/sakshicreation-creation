import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TableCell } from '@mui/material';
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

const ProductsItemsReportPage = () => {
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());

  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  const [reportData, setReportData] = useState<StaffProductData[]>([]);
  const [flatData, setFlatData] = useState<FlatRow[]>([]); // Flat list for table
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fixed columns - simple 3 columns
  const columns = [
    { id: 'staffName', label: 'Staff Name' },
    { id: 'productName', label: 'Product Name' },
    { id: 'orderCount', label: 'Order Count' },
  ];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportService.getProductItemsReport(dateRange);
        if (response.success && response.data) {
          setReportData(response.data);

          // Convert to flat rows (ek staff na multiple products -> multiple rows)
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
            if (a.staffName !== b.staffName) {
              return a.staffName.localeCompare(b.staffName);
            }
            return a.productName.localeCompare(b.productName);
          });

          setFlatData(flattened);
        } else {
          setReportData([]);
          setFlatData([]);
        }
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Failed to fetch data');
        setFlatData([]);
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

  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  // Loading / Error / Empty
  if (loading) {
    return <Typography>Loading product items report...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  if (flatData.length === 0) {
    return (
      <div>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
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
        </Box>
        <Typography>No data available for selected date range.</Typography>
      </div>
    );
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
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
      </Typography>

      {/* Simple Table with Flat Data */}
      <BasicTable
        tableHeader={columns}
        rowData={flatData}
        showDatePicker={false}
        renderRow={(row: FlatRow) => (
          <>
            <TableCell sx={{ fontWeight: 'medium' }}>{row.staffName}</TableCell>
            <TableCell>{row.productName}</TableCell>
            <TableCell  sx={{ fontWeight: 'bold' }}>
              {row.orderCount}
            </TableCell>
          </>
        )}
      />
    </div>
  );
};

export default ProductsItemsReportPage;