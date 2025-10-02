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
  { id: 'total', label: 'Total Party Call' },
  { id: 'completed', label: 'Completed Party Call' },
  { id: 'cancelled', label: 'Cancelled Party Call' },
  { id: 'reschduled', label: 'Reschduled Party Call' },
];

const LeadData: React.FC<Props> = ({ startDate, endDate, data, loading, companyName }) => {
  const handleClick = (staffId, companyId) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;
    window.open(url, '_blank');
  };
  const handleCompletedClick = (staffId, companyId) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=completed`;
    window.open(url, '_blank');
  };
  const handleCancelledClick = (staffId, companyId) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=cancelled  `;
    window.open(url, '_blank');
  };
  const handleRescheduledClick = (staffId, companyId) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=rescheduled`;
    window.open(url, '_blank');
  };
  return (
    <Box sx={{ p: 2 }}>
      {!loading && data.length > 0 ? (
        <BasicTable
          showDatePicker={false}
          showFillter={false}
          showSearch={false}
          title='Party Call Data'
          tableHeader={columns}
          rowData={data}
          renderRow={(row) => (
            <>
              <TableCell>{row.staffName}</TableCell>
              <TableCell onClick={() => handleClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.totalLeads}</TableCell>
              <TableCell onClick={() => handleCompletedClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.completedLeads}</TableCell>
              <TableCell onClick={() => handleCancelledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.cancelledLeads}</TableCell>
              <TableCell onClick={() => handleRescheduledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.rescheduledLeads}</TableCell>
            </>
          )}
        />
      ) : (
        !loading && <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>No data for {companyName}</Box>
      )}
    </Box>
  );
};


export default LeadData;
