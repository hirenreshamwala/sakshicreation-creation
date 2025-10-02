"use client";

import React from 'react';
import { Box, TableCell } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';

interface Props {
  activeTab: number;
  startDate: string;
  endDate: string;
  staffFilter: string[];
  data: any[];
  loading: boolean;
  companyName: string;
}

const columns = [
  { id: 'staffName', label: 'Staff Name' },
  { id: 'new', label: 'Total New Party' },
  { id: 'customer', label: 'New To Customer' },
];

const CustomerData: React.FC<Props> = ({startDate, endDate, data, loading, companyName }) => {
  const handleNewcClick = (staffId, companyId) => {
    const url = `/admin/account-master?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&partyTag=new&c=${companyName}`;
    window.open(url, '_blank');
  };
  const handleCustomerClick = (staffId, companyId) => {
    const url = `/admin/account-master?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&partyTag=customer&c=${companyName}`;
    window.open(url, '_blank');
  };
  return (
    <Box sx={{ p: 2 }}>
      {!loading && data.length > 0 ? (
        <BasicTable
          showDatePicker={false}
          showFillter={false}
          showSearch={false}
          title='Customer Data'
          tableHeader={columns}
          rowData={data}
          renderRow={(row) => (
            <>
              <TableCell>{row.staffName}</TableCell>
              <TableCell onClick={() => handleNewcClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.newparty}</TableCell>
              <TableCell onClick={() => handleCustomerClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.customerparty}</TableCell>
            </>
          )}
        />
      ) : (
        !loading && <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>No data for {companyName}</Box>
      )}
    </Box>
  );
};


export default CustomerData;
