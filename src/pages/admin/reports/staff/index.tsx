import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, TableCell, Button } from '@mui/material';
import Dashboard from '@/component/Dashboard';
import BasicTable from '@/component/common_component/Table/themetable';
import StaffChart from '@/component/staffchart';
import { useRouter } from 'next/router';

const staffList1 = [
  { name: 'Staff 1', department: 'Department1', joining: '01/04/25', left: '-' },
  { name: 'Staff 2', department: 'Department2', joining: '01/04/25', left: '-' },
  { name: 'Staff 3', department: 'Department3', joining: '01/04/25', left: '-' },
];

const staffList2 = [
  { name: 'Staff A', department: 'DepartmentA', joining: '02/04/25', left: '-' },
  { name: 'Staff B', department: 'DepartmentB', joining: '02/04/25', left: '-' },
  { name: 'Staff C', department: 'DepartmentC', joining: '02/04/25', left: '-' },
];

const tabLabels = ['Sakshi Creation', 'Quality Packaging'];

const columns = [
  { id: 'name', label: 'Staff' },
  { id: 'department', label: 'Department' },
  { id: 'joining', label: 'Date of Joining' },
  { id: 'left', label: 'Date of left' },
];

const StaffPage = () => {
  const [tab, setTab] = useState(0);
  const router = useRouter();

  // Change table data based on tab
  const staffList = tab === 0 ? staffList1 : staffList2;

  return (
      <Box sx={{ p: 2 }}>
        {/* Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '12px',
              border: '2px solid #7F56D9',
              backgroundColor: '#fff',
              p: '2px',
              overflow: 'hidden',
            }}
          >
            {/* Sliding background for selected tab */}
            <Box
              sx={{
                position: 'absolute',
                top: 2,
                left: tab === 0 ? 2 : '50%',
                width: '50%',
                height: 'calc(100% - 4px)',
                backgroundColor: '#7F56D9',
                borderRadius: '10px',
                zIndex: 0,
                transition: 'left 0.3s ease',
              }}
            />
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              TabIndicatorProps={{ style: { display: 'none' } }}
              sx={{
                minHeight: 0,
                zIndex: 1,
                '& .MuiTabs-flexContainer': {
                  gap: 0,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minHeight: 0,
                  px: 1.8,
                  py: 0.8,
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: '10px',
                  color: '#7F56D9',
                  transition: 'color 0.3s ease',
                  zIndex: 1,
                },
                '& .MuiTab-root.Mui-selected': {
                  color: '#fff',
                  backgroundColor: 'transparent',
                  zIndex: 2,
                },
              }}
            >
              {tabLabels.map((label) => (
                <Tab key={label} label={label} disableRipple />
              ))}
            </Tabs>
          </Box>
        </Box>
        {/* Add Staff Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/admin/reports/staff/view?mode=add')}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Add Staff
          </Button>
        </Box>
        {/* Stats & Bar Chart */}
        <StaffChart tab={tab} />
        {/* Staff Table */}
        <Paper sx={{ mt: 4, borderRadius: 2, overflow: 'hidden' }}>
          <BasicTable
            tableHeader={columns}
            rowData={staffList}
            renderRow={(row, idx) => (
              <>
                <TableCell
                  sx={{ fontWeight: 500, cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/reports/staff/view?mode=edit&id=${idx}`)}
                >
                  {row.name}
                </TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.joining}</TableCell>
                <TableCell>{row.left}</TableCell>
              </>
            )}
          />
        </Paper>
      </Box>
  );
};

export default StaffPage;