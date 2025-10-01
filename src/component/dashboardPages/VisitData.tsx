"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Box, TableCell, Button, TextField, Popover, List, ListItem, ListItemText } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import { useAppSelector } from '@/store';
import { companyOptions } from '@/constants';
import Request from '@/services/axios';
import Loader from '@/component/common_component/loader';
import { getCompanyWisePermission } from '@/utills/utills';

interface Props {
  activeTab: number;
  startDate: string;
  endDate: string;
  staffFilter: string[];
}

const columns = [
  { id: 'staffName', label: 'Staff Name' },
  { id: 'visit', label: 'Party Visit Tasks' },
  { id: 'new', label: 'New Party Visit' },
  { id: 'customer', label: 'Customer Party Visit' },
];

const VisitData: React.FC<Props> = ({ activeTab, startDate, endDate, staffFilter }) => {
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const hasBothPermissions = getCompanyWisePermission(0);
  const hasSakshiOnly = getCompanyWisePermission(3);
  const hasQpOnly = getCompanyWisePermission(4);

  const getCompanyConfig = () => {
    if (hasBothPermissions) {
      return {
        companyName: companyOptions[activeTab],
        apiEndpoint: activeTab === 0 ? '/api/report/getsc' : '/api/report/getqp'
      };
    } else if (hasSakshiOnly) {
      return { companyName: companyOptions[0], apiEndpoint: '/api/report/getsc' };
    } else if (hasQpOnly) {
      return { companyName: companyOptions[1], apiEndpoint: '/api/report/getqp' };
    }
    return { companyName: '', apiEndpoint: '' };
  };

  const { companyName, apiEndpoint } = getCompanyConfig();

  // Fetch report
  const fetchReport = async () => {
    if (!startDate || !endDate || !apiEndpoint) return;
    setLoading(true);
    try {
      const BaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8383';
      const res = await Request.post(`${BaseURL}${apiEndpoint}`, { startDate, endDate });
      if (res.data.success) setReportData(res.data.data);
      else setReportData([]);
    } catch (err) {
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReport();
  }, [activeTab, startDate, endDate, apiEndpoint]);

  // Filter data dynamically
  const filteredData = React.useMemo(() => {
    // Check if staffFilter is an array
    const filterArray = Array.isArray(staffFilter)
      ? staffFilter
      : staffFilter && Array.isArray(staffFilter["Staff Name"])
        ? staffFilter["Staff Name"]
        : [];

    if (!filterArray || filterArray.length === 0) return reportData;
    return reportData.filter((row) =>
      filterArray.some((f: string) => f.toLowerCase() === row.staffName.toLowerCase())
    );
  }, [reportData, staffFilter]);

  return (
    <Box sx={{ p: 2 }}>
      {loading && <Loader />}
      {!loading && filteredData.length > 0 ? (
        <BasicTable
          showDatePicker={false}
          showFillter={false}
          showSearch={false}
          title='Visit Data'
          tableHeader={columns}
          rowData={filteredData}
          renderRow={(row) => ( 
            <>
              <TableCell>{row.staffName}</TableCell>
              <TableCell>{row.getVisitCount}</TableCell>
              <TableCell>{row.newPartyCount}</TableCell>
              <TableCell>{row.customerPartyCount}</TableCell>
            </>
          )}
        />
      ) : (
        !loading && <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>No data for {companyName}</Box>
      )}
    </Box>
  );
};


export default VisitData;
