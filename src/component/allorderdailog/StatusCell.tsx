import { MenuItem, TextField, Typography, Box, Chip, Tooltip, Button } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import { ORDER_STATUSES } from "@/constants"
import ThemeButton from "@/component/common_component/themebutton"
import { useEffect, useState } from "react"

const statusOptions = ORDER_STATUSES

const processSteps = [
  { key: "paper_cutting", label: "Paper Cutting", color: "#EF4444" },
  { key: "corrugation", label: "Corrugation", color: "#F59E0B" },
  { key: "pasting", label: "Pasting", color: "#10B981" },
  { key: "rotary", label: "Rotary", color: "#3B82F6" },
  { key: "slotting", label: "Slotting", color: "#8B5CF6" },
  { key: "printing", label: "Printing", color: "#EC4899" },
  { key: "manual_pasting", label: "Manual Pasting", color: "#06B6D4" },
  { key: "pinning", label: "Pinning", color: "#84CC16" },
  { key: "punching", label: "Punching", color: "#F97316" },
];

export const StatusCell = ({ row }: { row: any }) => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const cutting = user?.role?.roleName?.toLowerCase()?.includes("cutting") || false
  const corrugation = user?.role?.roleName?.toLowerCase()?.includes("corrugation") || false
  const operator = user?.role?.roleName?.toLowerCase()?.includes("operator") || false
  const admin = user?.role?.roleName?.toLowerCase()?.includes("admin") || false

  const canStatus = user?.role?.permissions?.all_orders?.status
  const isStatusFinal = row.status === "Completed" || row.status === "Canceled" || row.status === "On Hold"

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (row.kantanStart && !row.kantanEnd) {
      const start = new Date(row.kantanStart).getTime();
      interval = setInterval(() => {
        setElapsed(Date.now() - start);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [row.kantanStart, row.kantanEnd]);

  // Get user's allowed actions based on role
  const getUserAllowedActions = () => {
    if (cutting) {
      return {
        canDoPaperCutting: true,
        canDoCorrugation: false,
        canDoOtherProcesses: false,
        viewType: "cutting"
      };
    } else if (corrugation) {
      return {
        canDoPaperCutting: false,
        canDoCorrugation: true,
        canDoOtherProcesses: false,
        viewType: "corrugation"
      };
    } else if (operator) {
      return {
        canDoPaperCutting: false,
        canDoCorrugation: true,
        canDoOtherProcesses: true,
        viewType: "operator"
      };
    } else if (admin || canStatus) {
      return {
        canDoPaperCutting: true,
        canDoCorrugation: true,
        canDoOtherProcesses: true,
        viewType: "admin"
      };
    }

    return {
      canDoPaperCutting: false,
      canDoCorrugation: false,
      canDoOtherProcesses: false,
      viewType: "viewer"
    };
  };

  const userActions = getUserAllowedActions();

  // Check if process can be marked as done
  const canMarkProcessDone = (processKey: string) => {
    // Check user permissions
    if (processKey === "paper_cutting" && !userActions.canDoPaperCutting) return false;
    if (processKey === "corrugation" && !userActions.canDoCorrugation) return false;
    if (processKey !== "paper_cutting" && processKey !== "corrugation" && !userActions.canDoOtherProcesses) return false;

    // Check process dependencies
    if (processKey === "paper_cutting" || processKey === "corrugation") {
      return true; // Can be done anytime in parallel
    }

    if (processKey === "pasting") {
      return row.paperCuttingDone && row.corrugationDone; // Requires both cutting and corrugation
    }

    // For other processes, check all previous processes are done
    const processIndex = processSteps.findIndex(step => step.key === processKey);
    const previousProcesses = processSteps.slice(0, processIndex);

    return previousProcesses.every(step => {
      switch (step.key) {
        case "paper_cutting": return row.paperCuttingDone;
        case "corrugation": return row.corrugationDone;
        case "pasting": return row.pastingDone;
        case "rotary": return row.rotaryDone;
        case "slotting": return row.slottingDone;
        case "printing": return row.printingDone;
        case "manual_pasting": return row.manualPastingDone;
        case "pinning": return row.pinningDone;
        case "punching": return row.punchingDone;
        default: return true;
      }
    });
  };

  const handleMarkProcessDone = async (processKey: string) => {
    if (!canMarkProcessDone(processKey)) {
      const processLabel = processSteps.find(step => step.key === processKey)?.label;

      if ((processKey === "paper_cutting" && !userActions.canDoPaperCutting) ||
        (processKey === "corrugation" && !userActions.canDoCorrugation) ||
        (processKey !== "paper_cutting" && processKey !== "corrugation" && !userActions.canDoOtherProcesses)) {
        toast.error(`You don't have permission to mark ${processLabel} as done`);
      } else {
        toast.error(`Cannot mark ${processLabel} as done - prerequisite processes not completed`);
      }
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to mark ${processSteps.find(step => step.key === processKey)?.label} as done?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, mark as done!",
    });

    if (result.isConfirmed) {
      try {
        const updateData: any = {};

        // Mark the specific process as done
        switch (processKey) {
          case "paper_cutting":
            updateData.paperCuttingDone = true;
            break;
          case "corrugation":
            updateData.corrugationDone = true;
            break;
          case "pasting":
            updateData.pastingDone = true;
            break;
          case "rotary":
            updateData.rotaryDone = true;
            break;
          case "slotting":
            updateData.slottingDone = true;
            break;
          case "printing":
            updateData.printingDone = true;
            break;
          case "manual_pasting":
            updateData.manualPastingDone = true;
            break;
          case "pinning":
            updateData.pinningDone = true;
            break;
          case "punching":
            updateData.punchingDone = true;
            break;
        }

        // Special logic for paper cutting and corrugation
        if (processKey === "paper_cutting" || processKey === "corrugation") {
          const cuttingDone = processKey === "paper_cutting" ? true : row.paperCuttingDone;
          const corrugationDone = processKey === "corrugation" ? true : row.corrugationDone;

          // If both cutting and corrugation are done, move to pasting
          if (cuttingDone && corrugationDone) {
            updateData.status = "pasting";
          } else {
            // Stay in "paper cutting & corrugation" status but mark the process as done
            updateData.status = "paper cutting & corrugation";
          }
        } else {
          // For other processes, move to next status
          const currentProcessIndex = processSteps.findIndex(step => step.key === processKey);
          if (currentProcessIndex < processSteps.length - 1) {
            updateData.status = processSteps[currentProcessIndex + 1].key;
          } else {
            updateData.status = "Kanthan";
          }
        }

        await dispatch(updateQPOrderThunk({
          id: row._id,
          data: updateData
        })).unwrap();

        toast.success(`${processSteps.find(step => step.key === processKey)?.label} marked as done`);
      } catch (error: any) {
        toast.error(error?.message || "Failed to update process");
      }
    }
  };

  const isProcessDone = (processKey: string): boolean => {
    switch (processKey) {
      case "paper_cutting": return !!row.paperCuttingDone;
      case "corrugation": return !!row.corrugationDone;
      case "pasting": return !!row.pastingDone;
      case "rotary": return !!row.rotaryDone;
      case "slotting": return !!row.slottingDone;
      case "printing": return !!row.printingDone;
      case "manual_pasting": return !!row.manualPastingDone;
      case "pinning": return !!row.pinningDone;
      case "punching": return !!row.punchingDone;
      default: return false;
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 3600);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to start Kanthan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, start it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(updateQPOrderThunk({ id: row._id, data: { kantanStart: new Date() } })).unwrap();
        toast.success("Kanthan started successfully");
      } catch (err: any) {
        toast.error(err?.message || "Failed to start Kanthan");
      }
    }
  };

  const handleFinish = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to finish Kanthan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, finish it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(updateQPOrderThunk({ id: row._id, data: { kantanEnd: new Date() } })).unwrap();
        toast.success("Kanthan finished successfully");
      } catch (err: any) {
        toast.error(err?.message || "Failed to finish Kanthan");
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to change status to "${newStatus}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    })

    if (result.isConfirmed) {
      try {
        await dispatch(updateQPOrderThunk({ id: row._id, data: { status: newStatus } })).unwrap()
        toast.success("Status updated successfully")
      } catch (err: any) {
        toast.error(err?.message || "Failed to update status")
      }
    }
  }

  // Render status dropdown for users with canStatus permission
  const renderStatusDropdown = () => {
    if (!canStatus && !admin) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          value={row.status || "Pending"}
          onChange={(e) => handleStatusChange(e.target.value)}
          sx={{ width: '100%' }}
          disabled={isStatusFinal}
        >
          {statusOptions.map((status) => (
            <MenuItem
              key={status}
              value={status}
              disabled={status === "Completed" || status === "Canceled" || status === "On Hold" || status === "In Progress" || status === "Pending" || status === "Printer" || status === "Lamination"}
            >
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    );
  };

  // Render Kanthan timer
  const renderKanthanTimer = () => {
    if (row.status !== "Kanthan") return null;

    return (
      <Box sx={{ mt: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', mb: 0.5 }}>
          Kanthan Timer
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!row.kantanStart ? (
            <ThemeButton size="small" onClick={handleStart}>
              Start
            </ThemeButton>
          ) : !row.kantanEnd ? (
            <>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatTime(elapsed)}</Typography>
              <ThemeButton size="small" onClick={handleFinish}>
                Finish
              </ThemeButton>
            </>
          ) : (
            <Typography sx={{ color: '#10B981', fontSize: '0.8rem' }}>Completed</Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Render next processes (pasting, rotary, etc.) when both paper cutting and corrugation are done
  const renderNextProcesses = () => {
    if (!row.paperCuttingDone || !row.corrugationDone) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Next Processes
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5, mb: 2 }}>
          {processSteps.filter(step => step.key !== "paper_cutting" && step.key !== "corrugation").map(process => {
            const isDone = isProcessDone(process.key);
            const canDo = canMarkProcessDone(process.key) && !isDone;

            return (
              <Tooltip
                key={process.key}
                title={isDone ? "Completed" : !canDo ? "Prerequisites not met" : `Mark ${process.label} as done`}
                arrow
              >
                <Box>
                  <Chip
                    label={process.label}
                    size="small"
                    onClick={canDo ? () => handleMarkProcessDone(process.key) : undefined}
                    sx={{
                      fontSize: '0.6rem',
                      height: 24,
                      backgroundColor: isDone ? '#10B981' : (canDo ? process.color : '#D1D5DB'),
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: canDo ? 'pointer' : 'default',
                      width: '100%',
                      '&:hover': canDo ? { backgroundColor: process.color, opacity: 0.9 } : {}
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Render different views based on user role
  const renderCuttingView = () => (
    <Box sx={{ minWidth: 200 }}>
      {/* Current Status Display */}
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>

      {/* Status Dropdown */}
      {/* {renderStatusDropdown()} */}

      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#3B82F6' }}>
        Paper Cutting
      </Typography>

      {!row.paperCuttingDone ? (
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => handleMarkProcessDone("paper_cutting")}
          sx={{ mb: 1 }}
        >
          Mark Paper Cutting Done
        </Button>
      ) : (
        <Chip
          label="Paper Cutting Completed"
          color="success"
          size="small"
          sx={{ width: '100%', mb: 1 }}
        />
      )}

      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        <div>Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.paperCuttingDone && row.corrugationDone && (
          <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Pasting</div>
        )}
      </Box>

      {/* Show next processes when both are done */}
      {renderNextProcesses()}

      {/* Kanthan Timer */}
      {renderKanthanTimer()}
    </Box>
  );

  const renderCorrugationView = () => (
    <Box sx={{ minWidth: 200 }}>
      {/* Current Status Display */}
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>

      {/* Status Dropdown */}
      {renderStatusDropdown()}

      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#F59E0B' }}>
        Corrugation
      </Typography>

      {!row.corrugationDone ? (
        <Button
          fullWidth
          variant="contained"
          color="warning"
          onClick={() => handleMarkProcessDone("corrugation")}
          sx={{ mb: 1 }}
        >
          Mark Corrugation Done
        </Button>
      ) : (
        <Chip
          label="Corrugation Completed"
          color="success"
          size="small"
          sx={{ width: '100%', mb: 1 }}
        />
      )}

      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        <div>Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.paperCuttingDone && row.corrugationDone && (
          <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Pasting</div>
        )}
      </Box>

      {/* Show next processes when both are done */}
      {renderNextProcesses()}

      {/* Kanthan Timer */}
      {renderKanthanTimer()}
    </Box>
  );

  const renderOperatorView = () => (
    <Box sx={{ minWidth: 200 }}>
      {/* Current Status Display */}
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>

      {/* Status Dropdown */}
      {/* {renderStatusDropdown()} */}

      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#F59E0B' }}>
        Corrugation
      </Typography>

      {!row.corrugationDone ? (
        <Button
          fullWidth
          variant="contained"
          color="warning"
          onClick={() => handleMarkProcessDone("corrugation")}
          sx={{ mb: 1 }}
        >
          Mark Corrugation Done
        </Button>
      ) : (
        <Chip
          label="Corrugation Completed"
          color="success"
          size="small"
          sx={{ width: '100%', mb: 1 }}
        />
      )}

      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        <div>Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.paperCuttingDone && row.corrugationDone && (
          <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Pasting</div>
        )}
      </Box>

      {/* Show next processes when both are done */}
      {renderNextProcesses()}

      {/* Kanthan Timer */}
      {renderKanthanTimer()}
    </Box>
  );

  const renderAdminView = () => (
    <Box sx={{ minWidth: 220 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Admin Control
      </Typography>

      {/* Current Status Display */}
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>

      {/* Status Dropdown */}
      {renderStatusDropdown()}

      {/* Paper Cutting and Corrugation Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3B82F6' }}>
          Paper Cutting
        </Typography>
        {!row.paperCuttingDone ? (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => handleMarkProcessDone("paper_cutting")}
            sx={{ mb: 1 }}
          >
            Mark Paper Cutting Done
          </Button>
        ) : (
          <Chip
            label="Paper Cutting Completed"
            color="success"
            size="small"
            sx={{ width: '100%', mb: 1 }}
          />
        )}

        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#F59E0B' }}>
          Corrugation
        </Typography>
        {!row.corrugationDone ? (
          <Button
            fullWidth
            variant="contained"
            color="warning"
            onClick={() => handleMarkProcessDone("corrugation")}
            sx={{ mb: 1 }}
          >
            Mark Corrugation Done
          </Button>
        ) : (
          <Chip
            label="Corrugation Completed"
            color="success"
            size="small"
            sx={{ width: '100%', mb: 1 }}
          />
        )}
      </Box>

      {/* Show next processes when both are done */}
      {renderNextProcesses()}

      {/* Kanthan Timer */}
      {renderKanthanTimer()}
    </Box>
  );

  // Main render based on user role
  if (userActions.viewType === "cutting") {
    return renderCuttingView();
  } else if (userActions.viewType === "corrugation") {
    return renderCorrugationView();
  } else if (userActions.viewType === "operator") {
    return renderOperatorView();
  } else if (userActions.viewType === "admin") {
    return renderAdminView();
  }

  // Default view for users with no specific permissions
  return (
    <Box sx={{ minWidth: 150 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3B82F6' }}>
        {row.status || "Pending"}
      </Typography>
      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        <div>Cutting: {row.paperCuttingDone ? '✅ Done' : '❌ Pending'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '❌ Pending'}</div>
      </Box>
    </Box>
  );
}