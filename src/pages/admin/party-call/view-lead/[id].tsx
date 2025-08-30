"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/store';
import { getAllLeadsThunk } from '@/store/slices/leadSlice';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeChip from '@/component/common_component/themechip';
import ThemeButton from '@/component/common_component/themebutton';
import { MdTurnLeft } from 'react-icons/md';
import AssignLeadDialog from '@/component/AssignLeadDialog';
import Loader from '@/component/common_component/loader';
import Swal from 'sweetalert2';

interface Lead {
    _id: string;
    companyName: {
        _id: string;
        companyName?: string;
    };
    partyName: {
        _id: string;
        partyName: string;
        companyName?: string;
        ownerMobileNo?: string;
        ownerName?: string;
        ownerEmail?: string;
        personMobileNo?: string;
        contactPerson?: string;
        contactPersonEmail?: string;
        contactMobileNo?: string;
        contactForPayment?: string;
        contactForPaymentEmail?: string;
        address?: {
            unitNo: string;
            marketName: string;
            streetAddress: string;
            area: string;
            pincode: string;
        };
        partyTag?: string;
        createdBy?: {
            _id: string;
            firstName?: string;
            lastName?: string;
        };
    };
    reason: string;
    customReason?: string;
    assignedTo: {
        _id: string;
    firstName?: string;
    lastName?: string;
    };
    dateType: string;
    status: string;
    callFeedback: string;
    date: string;
    time: string;
    createdAt: string;
    updatedAt: string;
    rescheduleDate?: string;
    isRescheduledCall?: boolean;
    originalLeadId?: { _id: string; date: string; createdAt: string };
}

interface PartyDetails {
    address: string;
    ownerMobileNo: string;
    ownerName: string;
    ownerEmail: string;
    contactPersonEmail: string;
    contactForPaymentEmail: string;
    personMobileNo: string;
    contactPerson: string;
    contactMobileNo: string;
    contactForPayment: string;
    marketName: string;
    area: string;
    partyName?: string;
    companyName?: string;
}

interface LeadCardProps {
  lead: Lead;
  onRescheduleClick: (lead: Lead) => void;
}

// Format date and time
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return (
      date.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      }) +
      ' ' +
      date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  } catch {
    return 'Invalid Date';
  }
};

// Format date only for grouping
const formatDateOnly = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};

const LeadCard: React.FC<LeadCardProps> = ({ lead, onRescheduleClick }) => {
  const personName = lead.partyName?.contactPerson || 'Unknown';
  const createdAtToShow = lead.isRescheduledCall && lead.originalLeadId?.createdAt
    ? lead.originalLeadId.createdAt
    : lead.createdAt;

  // Format original lead date for tooltip
  const originalLeadDate = lead.originalLeadId?.date
    ? formatDateOnly(lead.originalLeadId.date)
    : 'N/A';

  return (
    <Box p={2} sx={{ backgroundColor: '#FEF9C3', borderRadius: 2, mt: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography component="div" fontWeight={600} color="warning.main">
            Party Call
          </Typography>
          {lead.isRescheduledCall && (
            <Tooltip title={`Rescheduled from ${originalLeadDate}`}>
              <ThemeChip
                label="Rescheduled"
                color="warning"
                size="small"
                sx={{
                  background: "#FFFAEB",
                  color: "#B54708",
                  fontSize: 11,
                  height: 20,
                }}
              />
            </Tooltip>
          )}
        </Box>
        <ThemeButton
          variant="outlined"
          sx={{ py: 0.6 }}
          startIcon={<MdTurnLeft style={{ fontSize: 18, color: '#98A2B3' }} />}
          onClick={() => onRescheduleClick(lead)}
          disabled={lead.status !== 'pending' && lead.status !== 'rescheduled'}
        >
          Update
        </ThemeButton>
      </Box>

      <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
        <Box>
          <Typography component="div">
            <strong>Called Time:</strong> {formatDate(lead.date)} {lead.time}
          </Typography>
          <Typography component="div">
            <strong>Created Date:</strong> {formatDate(createdAtToShow)}
          </Typography>
        </Box>
        <Box>
          <Typography component="div">
            <strong>Reason:</strong>{' '}
            {lead.reason === 'Other' ? lead.customReason || 'Other' : lead.reason}
          </Typography>
        </Box>
        <Box>
          <Typography component="div">
            <strong>Status:</strong>
          </Typography>
          <ThemeChip
            label={lead.status.charAt(0).toUpperCase() + lead.status.slice(1) || 'N/A'}
            color={
              lead.status === 'pending'
                ? 'primary'
                : lead.status === 'rescheduled'
                ? 'warning'
                : lead.status === 'completed'
                ? 'success'
                : lead.status === 'cancelled'
                ? 'error'
                : 'default'
            }
            variant="filled"
            sx={{
              background:
                lead.status === 'pending'
                  ? '#E0F2FE'
                  : lead.status === 'rescheduled'
                  ? '#FFFAEB'
                  : lead.status === 'completed'
                  ? '#D1FAE5'
                  : lead.status === 'cancelled'
                  ? '#FEE2E2'
                  : '#E0F2FE',
              color:
                lead.status === 'pending'
                  ? '#0369A1'
                  : lead.status === 'rescheduled'
                  ? '#B54708'
                  : lead.status === 'completed'
                  ? '#047857'
                  : lead.status === 'cancelled'
                  ? '#B91C1C'
                  : '#0369A1',
              fontWeight: 600,
              fontSize: 13,
              height: 24,
              px: 1,
              border: 'none',
            }}
          />
        </Box>
        <Box>
          <Typography component="div">
            <strong>Assigned to:</strong>{' '}
            {`${lead.assignedTo?.firstName} ${lead.assignedTo?.lastName}` || 'N/A'}
          </Typography>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography component="div" fontWeight={500} color="text.secondary" mb={0.5}>
          Call Feedback
        </Typography>
        <ThemeInput
          label=""
          value={lead.callFeedback || 'No feedback provided'}
          InputProps={{ readOnly: true }}
          multiline
          sx={{ width: '100%', background: '#fff', borderRadius: 1 }}
        />
      </Box>
    </Box>
  );
};

const ViewLeadPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useAppDispatch();
  const { leads, loading } = useSelector((state: RootState) => state.leads || {});
  const { user } = useSelector((state: RootState) => state.auth || {});
  const canEdit = user?.role?.permissions?.party_call?.edit;
  const [open, setOpen] = useState(false);
  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const pendingPartyCallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(getAllLeadsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (leads.length > 0 && id) {
      const lead = leads.find((lead) => lead._id === id);
      if (lead) {
        setSelectedLead(lead);
        setPartyDetails({
          address: lead.partyName?.address
            ? `${lead.partyName.address.unitNo}, ${lead.partyName.address.marketName}, ${lead.partyName.address.streetAddress}, ${lead.partyName.address.area} - ${lead.partyName.address.pincode}`
            : 'N/A',
          ownerMobileNo: lead.partyName?.ownerMobileNo || 'N/A',
          ownerName: lead.partyName?.ownerName || 'N/A',
          ownerEmail: lead.partyName?.ownerEmail || 'N/A',
          contactPersonEmail: lead.partyName?.contactPersonEmail || 'N/A',
          contactForPaymentEmail: lead.partyName?.contactForPaymentEmail || 'N/A',
          personMobileNo: lead.partyName?.personMobileNo || 'N/A',
          contactPerson: lead.partyName?.contactPerson || 'N/A',
          contactMobileNo: lead.partyName?.contactMobileNo || 'N/A',
          contactForPayment: lead.partyName?.contactForPayment || 'N/A',
          marketName: lead.partyName?.address?.marketName || 'N/A',
          area: lead.partyName?.address?.area || 'N/A',
          partyName: lead.partyName?.partyName || 'N/A',
          companyName: lead.companyName?.companyName || 'N/A',
        });
      }
    }
  }, [leads, id]);

  useEffect(() => {
    if (pendingPartyCallRef.current) {
      pendingPartyCallRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pendingPartyCallRef, leads]);

  const partyLeads = leads.filter((lead) => {
    const mainLead = leads.find((l) => l._id === id);
    return mainLead && lead.partyName?._id === mainLead.partyName?._id;
  });

  // Separate pending and completed leads
  const pendingLeads = partyLeads.filter((lead) =>
    ['pending', 'rescheduled'].includes(lead.status)
  );
  const completedLeads = partyLeads.filter((lead) =>
    ['completed', 'cancelled'].includes(lead.status)
  );

  // Group leads by date for pending and completed leads
  const groupedPendingLeads = useMemo(() => {
    return pendingLeads.reduce((acc, lead) => {
      const leadDate = formatDateOnly(lead.date);
      if (!acc[leadDate]) {
        acc[leadDate] = [];
      }
      acc[leadDate].push(lead);
      return acc;
    }, {} as Record<string, Lead[]>);
  }, [pendingLeads]);

  const groupedCompletedLeads = useMemo(() => {
    return completedLeads.reduce((acc, lead) => {
      const leadDate = formatDateOnly(lead.date);
      if (!acc[leadDate]) {
        acc[leadDate] = [];
      }
      acc[leadDate].push(lead);
      return acc;
    }, {} as Record<string, Lead[]>);
  }, [completedLeads]);

  // Sort dates in descending order
  const sortedPendingDates = useMemo(() => {
    return Object.keys(groupedPendingLeads).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [groupedPendingLeads]);

  const sortedCompletedDates = useMemo(() => {
    return Object.keys(groupedCompletedLeads).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [groupedCompletedLeads]);

  // Check if a date is today
  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const [day, month, year] = dateString.split('/');
    const compareDate = new Date(`${year}-${month}-${day}`);
    return (
      compareDate.getDate() === today.getDate() &&
      compareDate.getMonth() === today.getMonth() &&
      compareDate.getFullYear() === today.getFullYear()
    );
  };

  const handleRescheduleClick = (lead: Lead) => {
    if (!canEdit) {
      Swal.fire({
        title: 'Error!',
        text: 'You do not have permission to reschedule leads.',
        icon: 'error',
        confirmButtonColor: '#7F56D9',
      });
      return;
    }
    setSelectedLead(lead);
    setOpen(true);
  };

  const handleAssignSuccess = () => {
    setOpen(false);
    setSelectedLead(null);
    dispatch(getAllLeadsThunk());
    Swal.fire({
      title: 'Success!',
      text: 'Lead rescheduled successfully!',
      icon: 'success',
      confirmButtonColor: '#7F56D9',
    });
  };

  if (loading) {
    return <Loader />;
  }

  if (!partyDetails) {
    return <Typography>Party not found</Typography>;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          p: 3,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => router.back()} sx={{ p: 0, color: 'primary.main' }}>
          <MdTurnLeft size={24} />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ fontWeight: 400 }}>
          {partyDetails.partyName} | {selectedLead?.companyName?.companyName || 'N/A'} |{' '}
          {selectedLead?.partyName?.createdBy?.firstName}{' '}
          {selectedLead?.partyName?.createdBy?.lastName}
        </Typography>
      </Box>
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" mb={4} gap={2}>
        <Box>
          <Typography component="div" fontWeight={600}>
            Address
          </Typography>
          <Typography component="div">{partyDetails.address}</Typography>
        </Box>
        <Box>
          <Typography component="div" fontWeight={600}>
            Mobile Numbers
          </Typography>
          <Typography component="div">
            <strong>Owner:</strong> {partyDetails.ownerMobileNo}
          </Typography>
          <Typography component="div">
            <strong>Person:</strong> {partyDetails.personMobileNo}
          </Typography>
          <Typography component="div">
            <strong>Payment:</strong> {partyDetails.contactMobileNo}
          </Typography>
        </Box>
        <Box>
          <Typography component="div" fontWeight={600}>
            Contact Names
          </Typography>
          <Typography component="div">
            <strong>Owner:</strong> {partyDetails.ownerName}
          </Typography>
          <Typography component="div">
            <strong>Person:</strong> {partyDetails.contactPerson}
          </Typography>
          <Typography component="div">
            <strong>Payment:</strong> {partyDetails.contactForPayment}
          </Typography>
        </Box>
        <Box>
          <Typography component="div" fontWeight={600}>
            Email Id
          </Typography>
          <Typography component="div">
            <strong>Owner Email:</strong> {partyDetails.ownerEmail}
          </Typography>
          <Typography component="div">
            <strong>Person Email:</strong> {partyDetails.contactPersonEmail}
          </Typography>
          <Typography component="div">
            <strong>Payment Email:</strong> {partyDetails.contactForPaymentEmail}
          </Typography>
        </Box>
        <Box>
          <Typography component="div" fontWeight={600}>
            Market Name
          </Typography>
          <Typography component="div">{partyDetails.marketName}</Typography>
        </Box>
        <Box>
          <Typography component="div" fontWeight={600}>
            Area
          </Typography>
          <Typography component="div">{partyDetails.area}</Typography>
        </Box>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          bgcolor: '#f5f5f5',
        }}
      >
      <Typography component="div" fontWeight={600} color="primary" mb={2}>

        Pending Party Call
      </Typography>
      {sortedPendingDates.length > 0 ? (
        sortedPendingDates.map((date) => (
          <Box
            key={date}
            mb={4}
            sx={{
              backgroundColor: isToday(date) ? '#a0d8b4ff' : 'transparent',
              borderRadius: 2,
              p: isToday(date) ? 2 : 0,
              border: isToday(date) ? '1px solid #D1FADF' : 'none',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Party Call - <span style={{ color: 'red' }}>{date}</span>
              {isToday(date) && (
                <ThemeChip
                  label="Today"
                  color="success"
                  size="small"
                  sx={{ ml: 1, background: '#3a43beff' }}
                />
              )}
            </Typography>
            {groupedPendingLeads[date].map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                onRescheduleClick={handleRescheduleClick}
              />
            ))}
          </Box>
        ))
      ) : (
        <Typography>No pending leads found</Typography>
      )}

      <Typography component="div" fontWeight={600} color="primary" mb={2} mt={4}>
        History
      </Typography>
      {sortedCompletedDates.length > 0 ? (
        sortedCompletedDates.map((date) => (
          <Box
            key={date}
            mb={4}
            sx={{
              backgroundColor: isToday(date) ? '#a0d8b4ff' : 'transparent',
              borderRadius: 2,
              p: isToday(date) ? 2 : 0,
              border: isToday(date) ? '1px solid #D1FADF' : 'none',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Party Call - <span style={{ color: 'red' }}>{date}</span>
              {isToday(date) && (
                <ThemeChip
                  label="Today"
                  color="success"
                  size="small"
                  sx={{ ml: 1, background: '#3a43beff' }}
                />
              )}
            </Typography>
            {groupedCompletedLeads[date].map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                onRescheduleClick={handleRescheduleClick}
              />
            ))}
          </Box>
        ))
      ) : (
        <Typography>No history leads found</Typography>
      )}
      </Box>

      <AssignLeadDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSuccess={handleAssignSuccess}
      />
    </Box>
  );
};

export default ViewLeadPage;