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
  { id: 'total', label: 'Total Tasks' },
  { id: 'completed', label: 'Completed Tasks' },
  { id: 'cancelled', label: 'Cancelled Tasks' },
  { id: 'reschduled', label: 'Reschduled Tasks' },
];

const TaskData: React.FC<Props> = ({startDate,endDate, data, loading, companyName }) => {
    const handleClick = (staffId, companyId) => {
    const url = `/admin/assign-task?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;
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
          title='Task Data'
          tableHeader={columns}
          rowData={data}
          renderRow={(row) => (
            <>
              <TableCell>{row.staffName}</TableCell>
              <TableCell onClick={() => handleClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.totalTasks}</TableCell>
              <TableCell onClick={() => handleCompletedClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.completedTasks}</TableCell>
              <TableCell onClick={() => handleCancelledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.cancelledTasks}</TableCell>
              <TableCell onClick={() => handleRescheduledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>{row.rescheduledTasks}</TableCell>
            </>
          )}
        />
      ) : (
        !loading && <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>No data for {companyName}</Box>
      )}
    </Box>
  );
};


export default TaskData;
