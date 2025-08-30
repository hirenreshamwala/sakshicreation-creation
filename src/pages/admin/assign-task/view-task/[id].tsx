"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { getAllAssignTasksThunk, getAssignTaskByIdThunk } from '@/store/slices/assignTaskSlice';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeChip from '@/component/common_component/themechip';
import ThemeButton from '@/component/common_component/themebutton';
import { MdTurnLeft } from 'react-icons/md';
import Loader from '@/component/common_component/loader';
import AssignTaskDialog from '@/component/assigntaskdailog';

// Interface for Address
interface Address {
  unitNo: string;
  marketName: string;
  streetAddress: string;
  landMark?: string;
  area: string;
  pincode: string;
}

// Interface for Party
interface Party {
  _id: string;
  partyName: string;
  ownerName: string;
  contactPerson: string;
  personMobileNo: string;
  address: Address;
  ownerMobileNo?: string;
  ownerEmail?: string;
  contactPersonEmail?: string;
  contactForPaymentEmail?: string;
  contactMobileNo?: string;
  contactForPayment?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Task {
  _id: string;
  companyName: { _id: string; companyName: string } | string;
  partyName: Party | string;
  date: string;
  time: string;
  reasonForVisit: string;
  remarks?: string;
  status: string;
  feedback: string;
  assignTo: User;
  accountMaster?: {
    party: Party;
  };
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  isRescheduledTask?: boolean;
  originalTaskId?: {
    _id: string;
    date: string;
    status: string;
    createdAt: string;
  };
}

interface PartyDetails {
  partyName: string;
  companyName?: string;
  companyNameObj?: { companyName: string };
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
  createdByObj?: {
    firstName: string;
    lastName: string;
  };

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

// TaskCard Component
interface TaskCardProps {
  title: string;
  task: Task;
  showStatusChip?: boolean;
  onReschedule: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, task, showStatusChip = true, onReschedule }) => {
  const party = typeof task.partyName === 'object' ? task.partyName : task.accountMaster?.party;
  const personName = party?.contactPerson || party?.ownerName || 'Unknown';
  const address = party?.address
    ? `${party.address.unitNo}, ${party.address.marketName}, ${party.address.streetAddress}, ${party.address.area}`
    : 'Address not available';
  // Determine which createdAt to display
  const createdAtToShow = task.isRescheduledTask && task.originalTaskId?.createdAt
    ? task.originalTaskId.createdAt
    : task.createdAt;

  // Format original task date for tooltip
  const originalTaskDate = task.originalTaskId?.date
    ? formatDateOnly(task.originalTaskId.date)
    : 'N/A';

  return (
    <Box mb={4} p={2} sx={{ backgroundColor: '#EDE9FE', borderRadius: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography component="div" fontWeight={600} color="primary">
            {title}
          </Typography>
          {task.isRescheduledTask && (
            <Tooltip title={`Rescheduled from ${originalTaskDate}`}>
              <ThemeChip
                label="Rescheduled"
                color="warning"
                size="small"
                sx={{
                  mt: 0.5,
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
          onClick={() => onReschedule(task._id)}
          sx={{ py: 0.6 }}
          startIcon={<MdTurnLeft style={{ fontSize: 18, color: '#98A2B3' }} />}
        >
          Update
        </ThemeButton>
      </Box>
      <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
        <Box>
          <Typography component="div">Created Time</Typography>
          <Typography component="div">
            <strong>{formatDate(createdAtToShow)}</strong>
          </Typography>
        </Box>
        <Box>
          <Typography component="div">Task Date</Typography>
          <Typography component="div">
            <strong>{formatDate(task.date)}</strong>
          </Typography>
        </Box>
        <Box>
          <Typography component="div">Visit Time</Typography>
          <Typography component="div">
            <strong>{task.time || 'Not specified'}</strong>
          </Typography>
        </Box>
        <Box>
          <Typography component="div">Reason for Visit</Typography>
          <Typography component="div">
            <strong>{task.reasonForVisit}</strong>
          </Typography>
        </Box>
        <Box>
          <Typography component="div">Status</Typography>
          {task.status && showStatusChip ? (
            <ThemeChip
              label={task.status}
              color={task.status === 'Completed' ? 'success' : task.status === 'Pending' ? 'warning' : 'error'}
              variant="outlined"
              sx={{
                background:
                  task.status === 'Completed'
                    ? '#D1FAE5'
                    : task.status === 'Pending'
                    ? '#FEF3C7'
                    : '#FEE2E2',
                color:
                  task.status === 'Completed'
                    ? '#065F46'
                    : task.status === 'Pending'
                    ? '#92400E'
                    : '#B91C1C',
                fontWeight: 600,
                fontSize: 13,
                height: 24,
                px: 1,
                border: 'none',
              }}
            />
          ) : (
            showStatusChip && (
              <ThemeChip
                label="-"
                color="default"
                variant="outlined"
                sx={{
                  background: '#f3f4f6',
                  fontWeight: 600,
                  fontSize: 13,
                  height: 24,
                  px: 1,
                  border: 'none',
                }}
              />
            )
          )}
        </Box>
        <Box>
          <Typography component="div">Assign to</Typography>
          <Typography component="div">
            <strong>
              {task.assignTo?.firstName} {task.assignTo?.lastName}
            </strong>
          </Typography>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography component="div" fontWeight={500} color="text.secondary" mb={0.5}>
          Task Feedback
        </Typography>
        <ThemeInput
          label=""
          value={task.feedback || 'No Feedback provided'}
          InputProps={{ readOnly: true }}
          multiline
          sx={{ width: '100%', background: '#fff', borderRadius: 1 }}
        />
      </Box>
    </Box>
  );
};

// ViewTaskPage Component
const ViewTaskPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch: AppDispatch = useDispatch();
  const { assignTasks, singleAssignTask, loading } = useSelector((state: RootState) => state.assignTasks);
  const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(getAllAssignTasksThunk());
    if (id) {
      dispatch(getAssignTaskByIdThunk(id as string));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (singleAssignTask && assignTasks.length > 0) {
      const fullTask = assignTasks.find((task) => task._id === singleAssignTask._id);
      console.log("🚀 ~ ViewTaskPage ~ fullTask:", fullTask);
      const party = typeof fullTask?.partyName === 'object' ? fullTask.partyName : fullTask?.accountMaster?.party;
      console.log("🚀 ~ ViewTaskPage ~ party:", party);
      const company = typeof fullTask?.companyName === 'object' ? fullTask.companyName : null;

      if (party) {
      setPartyDetails({
        partyName: party?.partyName || 'Unknown',
        companyName: typeof fullTask?.companyName === 'string' ? fullTask.companyName : undefined,
        companyNameObj: company ? { companyName: company.companyName } : undefined,
        address: party.address
          ? `${party.address.unitNo}, ${party.address.marketName}, ${party.address.streetAddress}, ${party.address.landMark || ''}, ${party.address.area} - ${party.address.pincode}`
          : 'Address not available',
        createdByObj: fullTask?.createdBy || singleAssignTask?.createdBy,
        ownerMobileNo: party.ownerMobileNo || 'Not available',
        ownerName: party.ownerName || 'Unknown',
        ownerEmail :party.ownerEmail || 'Unknown',
        contactPersonEmail  :party.contactPersonEmail  || 'Unknown',
        contactForPaymentEmail  :party.contactForPaymentEmail  || 'Unknown',
        personMobileNo: party.personMobileNo || 'Not available',
        contactPerson: party.contactPerson || 'Not available',
        contactMobileNo: party.contactMobileNo || 'Not available',
        contactForPayment: party.contactForPayment || 'Not available',
        marketName: party.address?.marketName || 'Not available',
        area: party.address?.area || 'Not available',
      });
    } else {
      setPartyDetails(null);
    }
    }
  }, [singleAssignTask, assignTasks]);

  // Filter tasks to only show those for this party
const partyTasks = assignTasks.filter((task) => {
  if (!singleAssignTask) return false;

  const taskPartyId =
    typeof task.partyName === 'object'
      ? task.partyName?._id || null
      : task.partyName || null;

  const singlePartyId =
    typeof singleAssignTask.partyName === 'string'
      ? singleAssignTask.partyName || null
      : singleAssignTask.partyName?._id || null;

  return taskPartyId && singlePartyId && taskPartyId === singlePartyId;
});

  // Separate pending and completed tasks
  const pendingTasks = partyTasks.filter((task) => ["Pending", "Rescheduled"].includes(task.status));
  const completedTasks = partyTasks.filter((task) => ["Completed", "Cancelled"].includes(task.status));

  // Group tasks by date for pending and completed tasks
  const groupedPendingTasks = useMemo(() => {
    return pendingTasks.reduce((acc, task) => {
      const taskDate = formatDateOnly(task.date);
      if (!acc[taskDate]) {
        acc[taskDate] = [];
      }
      acc[taskDate].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [pendingTasks]);

  const groupedCompletedTasks = useMemo(() => {
    return completedTasks.reduce((acc, task) => {
      const taskDate = formatDateOnly(task.date);
      if (!acc[taskDate]) {
        acc[taskDate] = [];
      }
      acc[taskDate].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [completedTasks]);

  // Sort dates in descending order
  const sortedPendingDates = useMemo(() => {
    return Object.keys(groupedPendingTasks).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [groupedPendingTasks]);

  const sortedCompletedDates = useMemo(() => {
    return Object.keys(groupedCompletedTasks).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [groupedCompletedTasks]);

  // Handle reschedule button click
  const handleReschedule = (taskId: string) => {
    setEditTaskId(taskId);
    setOpenRescheduleDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenRescheduleDialog(false);
    setEditTaskId(null);
  };

  if (loading) {
    return <Loader />;
  }

  if (!partyDetails || !singleAssignTask) {
    return <Typography>Party or task not found</Typography>;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
          <IconButton
            onClick={() => router.back()}
            sx={{ p: 0, color: 'primary.main' }}
          >
            <MdTurnLeft size={24} />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ fontWeight: 400 }}>
            {partyDetails.partyName} |
            {partyDetails.companyNameObj?.companyName || partyDetails.companyName} |
            {partyDetails.createdByObj?.firstName} {partyDetails.createdByObj?.lastName}
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
              Mobile No.
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
              Contact Name
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
              Contact Email
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

      {/* Scrollable Content Container */}
    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#f5f5f5' }}>
      {/* Pending Tasks */}
      <Typography component="div" fontWeight={600} color="primary" mb={2}>
        Pending Tasks
      </Typography>
      {sortedPendingDates.length > 0 ? (
        sortedPendingDates.map((date) => (
          <Box
            key={date}
            ref={isToday(date) ? todayRef : null}
            mb={4}
            sx={{
              backgroundColor: isToday(date) ? '#a0d8b4ff' : 'transparent',
              borderRadius: 2,
              p: 2,
              border: isToday(date) ? '1px solid #D1FADF' : 'none',
            }}
          >
            {/* <Typography variant="subtitle1" fontWeight={600}>
              Task - <span style={{ color: 'red' }}>{date}</span>
              {isToday(date) && (
                <ThemeChip
                  label="Today"
                  color="success"
                  size="small"
                  sx={{ ml: 1, background: '#3a43beff' }}
                />
              )}
            </Typography> */}
            {groupedPendingTasks[date].map((task) => (
              <TaskCard
                key={task._id}
                title="Task"
                task={task}
                showStatusChip
                onReschedule={handleReschedule}
              />
            ))}
          </Box>
        ))
      ) : (
        <Typography>No pending tasks found</Typography>
      )}

      {/* Completed Tasks */}
      <Typography component="div" fontWeight={600} color="primary" mb={2} mt={4}>
        History Tasks
      </Typography>
      {sortedCompletedDates.length > 0 ? (
        sortedCompletedDates.map((date) => (
          <Box
            key={date}
            mb={4}
            sx={{
              backgroundColor: isToday(date) ? '#a0d8b4ff' : 'transparent',
              borderRadius: 2,
              p: 2,
              border: isToday(date) ? '1px solid #D1FADF' : 'none',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Task - <span style={{ color: 'red' }}>{date}</span>
              {isToday(date) && (
                <ThemeChip
                  label="Today"
                  color="success"
                  size="small"
                  sx={{ ml: 1, background: '#3a43beff' }}
                />
              )}
            </Typography>
            {groupedCompletedTasks[date].map((task) => (
              <TaskCard
                key={task._id}
                title="Task"
                task={task}
                onReschedule={handleReschedule}
              />
            ))}
          </Box>
        ))
      ) : (
        <Typography>No history tasks found</Typography>
      )}
      </Box>

      {/* AssignTaskDialog for Rescheduling */}
      <AssignTaskDialog
        open={openRescheduleDialog}
        onClose={handleDialogClose}
        taskId={editTaskId}
        refreshData={() => dispatch(getAllAssignTasksThunk())}
      />
    </Box>
  );
};

export default ViewTaskPage;