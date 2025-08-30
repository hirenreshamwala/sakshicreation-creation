import React from 'react';
import BasicTable from '@/component/common_component/Table/themetable';
import { Box, TableCell } from '@mui/material';
import { FaChevronRight } from 'react-icons/fa6';
import { useRouter } from 'next/router';

const columns = [
  { id: 'received', label: 'Received' },
  { id: 'party', label: 'Party Name' },
  { id: 'printer', label: 'Printer' },
  { id: 'orderNo', label: 'Order No' },
  { id: 'item', label: 'Item Name' },
  { id: 'balance', label: 'Balance' },
  { id: 'sentForApproval', label: 'Sent for approval' },
  { id: 'approvalReceived', label: 'Approval Received' },
  { id: 'finalPrintFile', label: 'Final Print file' },
];

const rows = [
  {
    received: '01/04/25 , 10:10',
    party: 'Mr . Shah',
    printer: 'Raj',
    orderNo: '123',
    item: 'Item 1',
    balance: '200',
    sentForApproval: '01/04/25 , 10:10',
    approvalReceived: '01/04/25 , 10:10',
    finalPrintFile: '01/04/25 , 10:10',
  },
  {
    received: '01/04/25 , 10:10',
    party: 'Mr. Roy',
    printer: 'Dhruv',
    orderNo: '432',
    item: 'Item 2',
    balance: '180',
    sentForApproval: '01/04/25 , 10:10',
    approvalReceived: '01/04/25 , 10:10',
    finalPrintFile: '01/04/25 , 10:10',
  },
  {
    received: '01/04/25 , 10:10',
    party: 'Mr. Akash',
    printer: 'Sagar',
    orderNo: '324',
    item: 'Item 3',
    balance: '190',
    sentForApproval: '01/04/25 , 10:10',
    approvalReceived: '01/04/25 , 10:10',
    finalPrintFile: '01/04/25 , 10:10',
  },
];

const PrintersPage = () => {
  const router = useRouter();

  type OrderRow = {
    orderNo: string;
    party: string;
  };
  
  const handleRowClick = (row: OrderRow) => {
    if (!row?.orderNo || !row?.party) {
      console.warn("Missing order number or party in row:", row);
      return;
    }
  
    router.push({
      pathname: '/admin/all-orders/view/printers',
      query: {
        orderNo: row.orderNo,
        party: row.party,
      },
    });
  };
  

  return (
    <>
      <BasicTable
        tableHeader={columns}
        rowData={rows}
        renderRow={(row) => (
          <>
          <TableCell>{row.received}</TableCell>
            <TableCell>
              <Box
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                {row.party}
              </Box>
            </TableCell>
            <TableCell>
              <Box
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                {row.printer}
              </Box>
            </TableCell>
            <TableCell>{row.orderNo}</TableCell>
            <TableCell>{row.item}</TableCell>
            <TableCell>{row.balance}</TableCell>
            
            <TableCell>{row.sentForApproval}</TableCell>
            <TableCell>{row.approvalReceived}</TableCell>
            <TableCell>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                <Box>{row.finalPrintFile}</Box>
                <FaChevronRight style={{ fontSize: 16, color: '#98A2B3', marginLeft: 8 }} />
              </Box>
            </TableCell>
          </>
        )}
      />
    </>
  );
};

export default PrintersPage;
