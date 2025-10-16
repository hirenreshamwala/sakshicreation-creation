import { MenuItem, TextField, Typography, Box, Button } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import { ORDER_STATUSES } from "@/constants"
import ThemeButton from "@/component/common_component/themebutton"
import { useEffect, useState } from "react"

const statusOptions = ORDER_STATUSES

// ✅ Sequential status calculate karne ka function
// ✅ Sequential status calculate karne ka function - FIXED
const calculateDynamicStatus = (row, updatedData = {}) => {
  // Current values with updates
  const designDone = updatedData.designDone ?? row.designDone;
  const paperCuttingDone = updatedData.paperCuttingDone ?? row.paperCuttingDone;
  const corrugationDone = updatedData.corrugationDone ?? row.corrugationDone;
  const printerDone = updatedData.printerDone ?? row.printerDone;
  const laminationDone = updatedData.laminationDone ?? row.laminationDone;
  const pastingDone = updatedData.pastingDone ?? row.pastingDone;
  const rotaryDone = updatedData.rotaryDone ?? row.rotaryDone;
  const slottingDone = updatedData.slottingDone ?? row.slottingDone;
  const manualPastingDone = updatedData.manualPastingDone ?? row.manualPastingDone;
  const pinningDone = updatedData.pinningDone ?? row.pinningDone;
  const punchingDone = updatedData.punchingDone ?? row.punchingDone;

  const hasDesigner = !!row.designer;
  const hasPrinter = !!row.printer;
  const hasBinder = !!row.binder;
  const isPastingRequired = row.isPasting;
  const isPinningRequired = row.isPinning;

  // Sequential flow - yeh order important hai
  if (hasDesigner && !designDone) {
    return "Designer";
  }

  if (!paperCuttingDone) {
    return "Paper cutting";
  }

  if (hasPrinter && !printerDone) {
    return "Printer";
  }

  if (hasBinder && !laminationDone) {
    return "Lamination";
  }

  if (!corrugationDone) {
    return "Corrugation";
  }

  if (isPastingRequired && !pastingDone) {
    return "Pasting";
  }

  if (!rotaryDone) {
    return "Rotery";
  }

  if (!slottingDone) {
    return "Sloting/rs4";
  }

  if (!manualPastingDone) {
    return "Manual pasting";
  }

  if (isPinningRequired && !pinningDone) {
    return "Pinning";
  }

  if (!punchingDone) {
    return "Puching";
  }

  if (punchingDone) {
    return "Kanthan";
  }

  return "In Progress";
};

// ✅ Current process determine karne ka function
// ✅ Current process determine karne ka function - FIXED
// ✅ Current process determine karne ka function - FIXED
const getCurrentProcess = (row) => {
  const hasDesigner = !!row.designer;
  const hasPrinter = !!row.printer;
  const hasBinder = !!row.binder;
  const isPastingRequired = row.isPasting;
  const isPinningRequired = row.isPinning;

  console.log("DEBUG getCurrentProcess:", {
    hasDesigner, designDone: row.designDone,
    paperCuttingDone: row.paperCuttingDone,
    hasPrinter, printerDone: row.printerDone,
    hasBinder, laminationDone: row.laminationDone,
    corrugationDone: row.corrugationDone,
    isPastingRequired, pastingDone: row.pastingDone,
    rotaryDone: row.rotaryDone,
    slottingDone: row.slottingDone,
    manualPastingDone: row.manualPastingDone,
    isPinningRequired, pinningDone: row.pinningDone,
    punchingDone: row.punchingDone
  });

  if (hasDesigner && !row.designDone) return "design";
  if (!row.paperCuttingDone) return "paper_cutting";
  if (hasPrinter && !row.printerDone) return "printer";
  if (hasBinder && !row.laminationDone) return "lamination";
  if (!row.corrugationDone) return "corrugation";
  if (isPastingRequired && !row.pastingDone) return "pasting";
  if (!row.rotaryDone) return "rotary";
  if (!row.slottingDone) return "slotting";
  if (!row.manualPastingDone) return "manual_pasting";
  if (isPinningRequired && !row.pinningDone) return "pinning";
  if (!row.punchingDone) return "punching";

  // ✅ Kanthan process - yeh last process hai
  return "kanthan";
};

// ✅ Process labels
const processLabels = {
  design: { label: "Design", color: "#8B5CF6" },
  paper_cutting: { label: "Paper Cutting", color: "#3B82F6" },
  printer: { label: "Printer", color: "#8B008B" },
  lamination: { label: "Lamination", color: "#FF69B4" },
  corrugation: { label: "Corrugation", color: "#F59E0B" },
  pasting: { label: "Pasting", color: "#10B981" },
  rotary: { label: "Rotary", color: "#3B82F6" },
  slotting: { label: "Slotting", color: "#8B5CF6" },
  manual_pasting: { label: "Manual Pasting", color: "#06B6D4" },
  pinning: { label: "Pinning", color: "#84CC16" },
  punching: { label: "Punching", color: "#F97316" },
  kanthan: { label: "Kanthan", color: "#EF4444" }
};

export const StatusCell = ({ row }: { row: any }) => {

  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const isAssignedDesigner = row.designer?._id === user?.id;
  const designer = user?.role?.roleName?.toLowerCase()?.includes("designer") || false
  const cutting = user?.role?.roleName?.toLowerCase()?.includes("cutting") || false
  const corrugation = user?.role?.roleName?.toLowerCase()?.includes("corrugation") || false
  const printer = user?.role?.roleName?.toLowerCase()?.includes("printer") || false
  const binder = user?.role?.roleName?.toLowerCase()?.includes("binder") || false
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

  const getUserAllowedActions = () => {
    if (designer && isAssignedDesigner) {
      return { canDoDesign: true, canDoPaperCutting: false, canDoCorrugation: false, canDoPrinter: false, canDoLamination: false, canDoOtherProcesses: false, viewType: "designer" };
    } else if (cutting) {
      return { canDoDesign: false, canDoPaperCutting: true, canDoCorrugation: false, canDoPrinter: false, canDoLamination: false, canDoOtherProcesses: false, viewType: "cutting" };
    } else if (corrugation) {
      return { canDoDesign: false, canDoPaperCutting: false, canDoCorrugation: true, canDoPrinter: false, canDoLamination: false, canDoOtherProcesses: false, viewType: "corrugation" };
    } else if (printer) {
      return { canDoDesign: false, canDoPaperCutting: false, canDoCorrugation: false, canDoPrinter: true, canDoLamination: false, canDoOtherProcesses: false, viewType: "printer" };
    } else if (binder) {
      return { canDoDesign: false, canDoPaperCutting: false, canDoCorrugation: false, canDoPrinter: false, canDoLamination: true, canDoOtherProcesses: false, viewType: "binder" };
    } else if (operator) {
      return { canDoDesign: false, canDoPaperCutting: false, canDoCorrugation: true, canDoPrinter: false, canDoLamination: false, canDoOtherProcesses: true, viewType: "operator" };
    } else if (admin) {
      return { canDoDesign: true, canDoPaperCutting: true, canDoCorrugation: true, canDoPrinter: true, canDoLamination: true, canDoOtherProcesses: true, viewType: "admin" };
    } return { canDoDesign: false, canDoPaperCutting: false, canDoCorrugation: false, canDoPrinter: false, canDoLamination: false, canDoOtherProcesses: false, viewType: "viewer" };
  };

  const userActions = getUserAllowedActions();

  const canMarkCurrentProcessDone = () => {
    const currentProcess = getCurrentProcess(row);

    // ✅ Kanthan process ke liye yeh function false return karega
    if (currentProcess === "kanthan") {
      return false;
    }

    // Role-based permission check
    if (currentProcess === "design" && !userActions.canDoDesign) return false;
    if (currentProcess === "paper_cutting" && !userActions.canDoPaperCutting) return false;
    if (currentProcess === "corrugation" && !userActions.canDoCorrugation) return false;
    if (currentProcess === "printer" && !userActions.canDoPrinter) return false;
    if (currentProcess === "lamination" && !userActions.canDoLamination) return false;
    if (currentProcess !== "design" && currentProcess !== "paper_cutting" && currentProcess !== "corrugation" && currentProcess !== "printer" && currentProcess !== "lamination" && !userActions.canDoOtherProcesses) return false;

    // Sequential dependency check for other processes
    const hasDesigner = !!row.designer;

    switch (currentProcess) {
      case "design": return true;
      case "paper_cutting": return hasDesigner ? row.designDone : true;
      case "printer": return row.paperCuttingDone;
      case "lamination": return row.printerDone;
      case "corrugation": return row.paperCuttingDone;
      case "pasting":
        const designComplete = hasDesigner ? row.designDone : true;
        return designComplete && row.paperCuttingDone && row.corrugationDone;
      case "rotary":
        const pastingComplete = row.isPasting ? row.pastingDone : true;
        return row.paperCuttingDone && row.corrugationDone && pastingComplete;
      case "slotting": return row.rotaryDone;
      case "manual_pasting": return row.slottingDone;
      case "pinning":
        if (!row.isPinning) return false;
        return row.manualPastingDone;
      case "punching":
        const pinningComplete = row.isPinning ? row.pinningDone : true;
        return row.manualPastingDone && pinningComplete;
      default: return false;
    }
  };

  const handleMarkCurrentProcessDone = async () => {
    const currentProcess = getCurrentProcess(row);

    // ✅ Kanthan process ke liye yeh function call hi nahi hoga
    if (currentProcess === "kanthan") {
      return;
    }

    if (!canMarkCurrentProcessDone()) {
      const processLabel = processLabels[currentProcess]?.label;

      if ((currentProcess === "design" && !userActions.canDoDesign) ||
        (currentProcess === "paper_cutting" && !userActions.canDoPaperCutting) ||
        (currentProcess === "corrugation" && !userActions.canDoCorrugation) ||
        (currentProcess === "printer" && !userActions.canDoPrinter) ||
        (currentProcess === "lamination" && !userActions.canDoLamination) ||
        (currentProcess !== "design" && currentProcess !== "paper_cutting" && currentProcess !== "corrugation" && currentProcess !== "printer" && currentProcess !== "lamination" && !userActions.canDoOtherProcesses)) {
        toast.error(`You don't have permission to mark ${processLabel} as done`);
      } else {
        toast.error(`Cannot mark ${processLabel} as done - prerequisite processes not completed`);
      }
      return;
    }

    const processLabel = processLabels[currentProcess]?.label;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to mark ${processLabel} as done?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, mark as done!",
    });

    if (result.isConfirmed) {
      try {
        const updateData: any = {};

        // Mark the current process as done
        switch (currentProcess) {
          case "design":
            updateData.designDone = true;
            break;
          case "paper_cutting":
            updateData.paperCuttingDone = true;
            break;
          case "corrugation":
            updateData.corrugationDone = true;
            break;
          case "printer":
            updateData.printerDone = true;
            break;
          case "lamination":
            updateData.laminationDone = true;
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
          case "manual_pasting":
            updateData.manualPastingDone = true;
            break;
          case "pinning":
            updateData.pinningDone = true;
            break;
          case "punching":
            updateData.punchingDone = true;
            break;
          // ✅ Kanthan case completely removed
        }

        const newStatus = calculateDynamicStatus(row, updateData);
        updateData.status = newStatus;

        console.log("DEBUG: Updating with data:", {
          currentProcess,
          updateData
        });

        await dispatch(updateQPOrderThunk({
          id: row._id,
          data: updateData
        })).unwrap();

        toast.success(`${processLabel} marked as done. Status updated to: ${updateData.status}`);
      } catch (error: any) {
        console.error("DEBUG: Update failed:", error);
        toast.error(error?.message || "Failed to update process");
      }
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

  const handleBoxFounded = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to mark Box as Founded?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, mark as founded!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(updateQPOrderThunk({
          id: row._id,
          data: { isBoxFound: true }
        })).unwrap();
        toast.success("Box marked as founded successfully");
      } catch (err: any) {
        toast.error(err?.message || "Failed to mark box as founded");
      }
    }
  };

  const renderKanthanTimer = () => {
    if (row.status !== "Kanthan") return null;

    return (
      <Box sx={{ mt: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 'bold', mb: 0.5 }}>
          Kanthan Timer
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!row.isBoxFound ? (
            <ThemeButton size="small" onClick={handleBoxFounded}>
              Box Founded
            </ThemeButton>
          ) : (
            <>
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
            </>
          )}
        </Box>

        {row.isBoxFound && (
          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#10B981', mt: 1 }}>
            ✅ Box Founded
          </Typography>
        )}
      </Box>
    );
  };

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
              disabled={status === "Completed" || status === "Canceled" || status === "On Hold"}
            >
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    );
  };

  const renderProcessView = () => {
    const currentProcess = getCurrentProcess(row);
    const processInfo = processLabels[currentProcess];
    const canDo = canMarkCurrentProcessDone();

    // ✅ Next process calculate karo for display
    const nextStatus = calculateDynamicStatus(row);

    return (
      <Box sx={{ minWidth: 200 }}>
        <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Current Status: {row.status || "Pending"}
          </Typography>
          {/* {currentProcess !== "kanthan" && (
            <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#6B7280' }}>
              Next: {nextStatus}
            </Typography>
          )} */}
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: processInfo.color }}>
          {processInfo.label}
        </Typography>

        {currentProcess === "kanthan" ? (
          // ✅ Kanthan ke liye sirf timer controls
          <Box>
            {!row.isBoxFound ? (
              <Button
                fullWidth
                variant="contained"
                style={{ backgroundColor: processInfo.color }}
                onClick={handleBoxFounded}
                sx={{ mb: 1 }}
              >
                Box Founded
              </Button>
            ) : (
              <>
                {!row.kantanStart ? (
                  <Button
                    fullWidth
                    variant="contained"
                    style={{ backgroundColor: processInfo.color }}
                    onClick={handleStart}
                    sx={{ mb: 1 }}
                  >
                    Start Kanthan
                  </Button>
                ) : !row.kantanEnd ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', flex: 1 }}>
                      {formatTime(elapsed)}
                    </Typography>
                    <Button
                      variant="contained"
                      style={{ backgroundColor: processInfo.color }}
                      onClick={handleFinish}
                    >
                      Finish Kanthan
                    </Button>
                  </Box>
                ) : (
                  // ✅ Kanthan finish hone ke baad koi button nahi
                  <Typography variant="body2" sx={{ color: '#10B981', fontSize: '0.8rem', mb: 1 }}>
                    Kanthan Completed - Order Ready
                  </Typography>
                )}
              </>
            )}
          </Box>
        ) : (
          // ✅ Other processes ke liye normal button
          canDo ? (
            <Button
              fullWidth
              variant="contained"
              style={{ backgroundColor: processInfo.color }}
              onClick={handleMarkCurrentProcessDone}
              sx={{ mb: 1 }}
            >
              Mark {processInfo.label} Done
            </Button>
          ) : (
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem', mb: 1 }}>
              {processInfo.label} cannot be marked as done yet
            </Typography>
          )
        )}

        {/* <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
          {row.designer && <div>Design: {row.designDone ? '✅ Done' : '⏳ Pending'}</div>}
          <div>Paper Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
          {row.printer && <div>Printer: {row.printerDone ? '✅ Done' : '⏳ Pending'}</div>}
          {row.binder && <div>Lamination: {row.laminationDone ? '✅ Done' : '⏳ Pending'}</div>}
          <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
          {row.isPasting && <div>Pasting: {row.pastingDone ? '✅ Done' : '⏳ Pending'}</div>}
          <div>Rotary: {row.rotaryDone ? '✅ Done' : '⏳ Pending'}</div>
          <div>Slotting: {row.slottingDone ? '✅ Done' : '⏳ Pending'}</div>
          <div>Manual Pasting: {row.manualPastingDone ? '✅ Done' : '⏳ Pending'}</div>
          {row.isPinning && <div>Pinning: {row.pinningDone ? '✅ Done' : '⏳ Pending'}</div>}
          <div>Punching: {row.punchingDone ? '✅ Done' : '⏳ Pending'}</div>
          {currentProcess === "kanthan" && <div>Kanthan: {row.kantanEnd ? '✅ Done' : '⏳ In Progress'}</div>}
        </Box> */}

        {/* {renderKanthanTimer()} */}
      </Box>
    );
  };

  const renderAdminView = () => (
    <Box sx={{ minWidth: 220 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Admin Control
      </Typography>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>
      {renderStatusDropdown()}
      {renderProcessView()}
    </Box>
  );

  if (userActions.viewType === "admin") {
    return renderAdminView();
  }

  return renderProcessView();
};