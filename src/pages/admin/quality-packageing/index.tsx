import React, { useState } from 'react';
import BasicTable from '@/component/common_component/Table/themetable';
import ThemeChip from '@/component/common_component/themechip';
import ThemeTabs from '@/component/common_component/themetabs';
import { TableCell, IconButton, Box, Stack } from '@mui/material';
import { MdEdit, MdDelete } from 'react-icons/md';
import CustomDialog from '@/component/customdialog';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeSelect from '@/component/common_component/themeselect';
import ThemeButton from '@/component/common_component/themebutton';

const columns = [
  { id: 'party', label: 'Party' },
  { id: 'person', label: 'Person' },
  { id: 'partyTag', label: 'Party Tag' },
  { id: 'mobile', label: 'Mobile No.' },
  { id: 'reason', label: 'Reason to visit' },
  { id: 'market', label: 'Market' },
  { id: 'area', label: 'Area' },
  { id: 'remarks', label: 'Remarks' },
  { id: 'orderNo', label: 'Order No.' },
  { id: 'status', label: 'Status' },
  { id: 'createdBy', label: 'Created By' },
  { id: 'assignedTo', label: 'Assigned to' },
  { id: 'action', label: 'Action' },
];

type OptionType = {
  label: string;
  value: string | number;
};

type RowData = {
  party: string;
  person: string;
  partyTag: string;
  mobile: string;
  reason: string;
  market: string;
  area: string;
  remarks: string;
  orderNo: number;
  status: string;
  createdBy: string;
  assignedTo: string;
};

const rows = [
  {
    party: 'Raj & Sons',
    person: 'Sagar',
    partyTag: 'New',
    mobile: '9879281231',
    reason: 'Get Payment',
    market: 'Shanti Bazar',
    area: 'Vesu',
    remarks: 'Sample remarks',
    orderNo: 1,
    status: 'Done',
    createdBy: 'Sagar',
    assignedTo: 'Dhruv',
  },
  {
    party: 'Patel Traders',
    person: 'Rahul',
    partyTag: 'Customer',
    mobile: '9876543210',
    reason: 'Order Placement',
    market: 'Ghod Dod Road',
    area: 'Surat',
    remarks: 'Urgent delivery',
    orderNo: 2,
    status: 'Cancelled',
    createdBy: 'Admin',
    assignedTo: 'Jay',
  },
];

const getStatusChip = (status: string) => {
  if (status === 'Done') {
    return <ThemeChip label="✔ Done" color="success" sx={{ fontWeight: 500, fontSize: 14, px: 1.5 }} />;
  }
  if (status === 'Cancelled') {
    return <ThemeChip label="✖ Cancelled" color="error" sx={{ fontWeight: 500, fontSize: 14, px: 1.5 }} />;
  }
  if (status === 'Re-Schedule') {
    return <ThemeChip label="↩ Re-Schedule" color="default" sx={{ fontWeight: 500, fontSize: 14, px: 1.5, bgcolor: '#F2F4F7', color: '#667085' }} />;
  }
  return null;
};

const getPartyTagChip = (tag: string) => {
  if (tag === 'New') {
    return <ThemeChip label="New" color="primary" sx={{ fontWeight: 500, fontSize: 13, px: 1.5 }} />;
  }
  if (tag === 'Customer') {
    return <ThemeChip label="Customer" color="default" sx={{ fontWeight: 500, fontSize: 13, px: 1.5, bgcolor: '#F2F4F7', color: '#667085' }} />;
  }
  return null;
};

const companyOptions: OptionType[] = [{ label: 'Sakshi Creation', value: 'sakshi' }];
const partyOptions: OptionType[] = [{ label: 'Party1', value: 'party1' }];
const reasonOptions: OptionType[] = [{ label: 'Get Payment', value: 'get_payment' }];
const staffOptions: OptionType[] = [{ label: 'Staff Name', value: 'staff1' }];

type EditDialogProps = {
  open: boolean;
  onClose: () => void;
  row: RowData | null;
};

const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, row }) => {
  const [owner, setOwner] = useState('Owner Name');
  const [person, setPerson] = useState(row?.person || '');
  const [mobile, setMobile] = useState('98312-13221');
  const [mobileCode, setMobileCode] = useState('91');
  const [whatsapp, setWhatsapp] = useState('98312-13221');
  const [whatsappCode, setWhatsappCode] = useState('91');
  const [date, setDate] = useState('12/02/25');
  const [address1, setAddress1] = useState('34');
  const [address2, setAddress2] = useState('Raj tower');
  const [address3, setAddress3] = useState('Main Road');
  const [address4, setAddress4] = useState('Nr HDFC Bank');
  const [address5, setAddress5] = useState('Navi Mumbai');
  const [address6, setAddress6] = useState('324234');
  const [reason, setReason] = useState<OptionType | null>(null);
  const [assign, setAssign] = useState<OptionType | null>(null);

  return (
    <CustomDialog open={open} onClose={onClose} title="Edit">
      <Box sx={{ p: 2, background: '#fff', borderRadius: 2 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput labelName="Company Name" value={companyOptions[0].label} fullWidth />
          <ThemeInput labelName="Party Name" value={partyOptions[0].label} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput labelName="Owner Name" value={owner} onChange={e => setOwner(e.target.value)} fullWidth />
          <ThemeInput labelName="Person Name" value={person} onChange={e => setPerson(e.target.value)} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Mobile No."
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            mobile
            countryCode={mobileCode}
            onCountryCodeChange={setMobileCode}
            fullWidth
          />
          <ThemeInput
            labelName="WhatsApp No."
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            mobile
            countryCode={whatsappCode}
            onCountryCodeChange={setWhatsappCode}
            fullWidth
          />
        </Stack>
        <ThemeInput
          labelName="Date"
          value={date}
          onChange={e => setDate(e.target.value)}
          type="date"
          fullWidth
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput labelName="Address" value={address1} onChange={e => setAddress1(e.target.value)} fullWidth />
          <ThemeInput value={address2} onChange={e => setAddress2(e.target.value)} fullWidth />
          <ThemeInput value={address3} onChange={e => setAddress3(e.target.value)} fullWidth />
          <ThemeInput value={address4} onChange={e => setAddress4(e.target.value)} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput value={address5} onChange={e => setAddress5(e.target.value)} fullWidth />
          <ThemeInput value={address6} onChange={e => setAddress6(e.target.value)} fullWidth />
        </Stack>
        <ThemeSelect
          label="Reason for visit"
          value={reason}
          options={reasonOptions}
          onChange={(_, v) => setReason(v)}
          sx={{ mb: 2 }}
        />
        <ThemeSelect
          label="Assign to"
          value={assign}
          options={staffOptions}
          onChange={(_, v) => setAssign(v)}
          sx={{ mb: 3 }}
        />
        <Stack direction="row" spacing={2}>
          <ThemeButton
            variant="outlined"
            sx={{
              background: '#667085',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              width: '100%',
              '&:hover': { background: '#475467' }
            }}
            onClick={onClose}
          >
            Discard Changes
          </ThemeButton>
          <ThemeButton
            sx={{
              background: '#12B76A',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              width: '100%',
              '&:hover': { background: '#079455' }
            }}
          >
            Save Changes
          </ThemeButton>
        </Stack>
      </Box>
    </CustomDialog>
  );
};

const orderColumns = [
  { id: 'orderFormNo', label: 'ORDER FORM NO.' },
  { id: 'noOfOrders', label: 'NO. OF ORDERS' },
  { id: 'date', label: 'DATE' },
  { id: 'time', label: 'TIME' },
  { id: 'size', label: 'SIZE' },
  { id: 'rate', label: 'RATE' },
  { id: 'amount', label: 'AMOUNT' },
  { id: 'status', label: 'STATUS' },
  { id: 'startDate', label: 'START DATE' },
  { id: 'endDate', label: 'END DATE' },
];

const orderRows = [
  {
    orderFormNo: 'QP-001',
    noOfOrders: 4,
    date: '02/05/25',
    time: '10:10 AM',
    size: '20×20×23',
    rate: '12',
    amount: '12,000',
    status: 'HOLD',
    startDate: '02/05/25',
    endDate: '02/05/25',
  },
  {
    orderFormNo: 'QP-002',
    noOfOrders: 5,
    date: '01/05/25',
    time: '10:50 AM',
    size: '28×21×31',
    rate: '4.75',
    amount: '28,500',
    status: 'IN-PROGRESS',
    startDate: '02/05/25',
    endDate: '02/05/25',
  },
  {
    orderFormNo: 'QP-003',
    noOfOrders: 10,
    date: '01/05/25',
    time: '12:20 Am',
    size: '34×17×32',
    rate: '86',
    amount: '17200',
    status: 'ORDER',
    startDate: '02/05/25',
    endDate: '02/05/25',
  },
];

const getOrderStatusChip = (status: string) => {
  if (status === 'HOLD') {
    return <ThemeChip label="HOLD" color="error" sx={{ fontWeight: 500, fontSize: 13, px: 2, bgcolor: '#FEE4E2', color: '#D92D20' }} />;
  }
  if (status === 'IN-PROGRESS') {
    return <ThemeChip label="IN-PROGRESS" color="primary" sx={{ fontWeight: 500, fontSize: 13, px: 2, bgcolor: '#F4EBFF', color: '#7F56D9' }} />;
  }
  if (status === 'ORDER') {
    return <ThemeChip label="ORDER" color="success" sx={{ fontWeight: 500, fontSize: 13, px: 2, bgcolor: '#D1FADF', color: '#039855' }} />;
  }
  return null;
};

const QualityPackagingPage = () => {
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<RowData | null>(null);

  const [tab, setTab] = useState(0);

  return (

    <>

      <Box mb={3}>
        <ThemeTabs
          value={tab}
          onChange={(_, v) => setTab(v as number)}
          tabs={[
            { label: 'Account Master', value: 0 },
            { label: 'Order', value: 1 },
          ]}
        />
      </Box>

      {tab === 0 && (
        <BasicTable
          tableHeader={columns}
          rowData={rows}
          renderRow={(row) => (
            <>
              <TableCell>{row.party}</TableCell>
              <TableCell>{row.person}</TableCell>
              <TableCell>{getPartyTagChip(row.partyTag)}</TableCell>
              <TableCell>{row.mobile}</TableCell>
              <TableCell>{row.reason}</TableCell>
              <TableCell>{row.market}</TableCell>
              <TableCell>{row.area}</TableCell>
              <TableCell>{row.remarks}</TableCell>
              <TableCell>{row.orderNo}</TableCell>
              <TableCell>{getStatusChip(row.status)}</TableCell>
              <TableCell>{row.createdBy}</TableCell>
              <TableCell>{row.assignedTo}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex" }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      setEditRow(row);
                      setEditOpen(true);
                    }}
                  >
                    <MdEdit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <MdDelete />
                  </IconButton>
                </Box>
              </TableCell>
            </>
          )}
        />
      )}

      {tab === 1 && (
        <BasicTable
          tableHeader={orderColumns}
          rowData={orderRows}
          renderRow={(row) => (
            <>
              <TableCell>{row.orderFormNo}</TableCell>
              <TableCell>{row.noOfOrders}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell>{row.size}</TableCell>
              <TableCell>{row.rate}</TableCell>
              <TableCell>{row.amount}</TableCell>
              <TableCell>{getOrderStatusChip(row.status)}</TableCell>
              <TableCell>{row.startDate}</TableCell>
              <TableCell>{row.endDate}</TableCell>
            </>
          )}
          showDatePicker={false}
          showSearch={false}
          showFillter={false}
        />
      )}

      <EditDialog open={editOpen} onClose={() => setEditOpen(false)} row={editRow} />
    </>
  );
};

export default QualityPackagingPage;