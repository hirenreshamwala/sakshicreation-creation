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
  const kantanEnd = updatedData.kantanEnd ?? row.kantanEnd;

  const hasDesigner = !!row.designer;
  const hasPrinter = !!row.printer;
  const hasBinder = !!row.binder;
  const isPunchingRequired = row.isPunching;
  const isKantanRequired = row.isKantan;
  const isScreenPrinting = row.printType === "screen_printing" || row.printType === "sterio";

  // ✅ PEHLE CHECK: Agar Kanthan complete ho gaya hai to hamesha "Completed"
  if (isKantanRequired && kantanEnd) {
    return "Completed";
  }

  // Sequential flow based on isPunching and printType
  if (!isPunchingRequired) {
    // FLOW 1: isPunching = false

    if (hasDesigner && !designDone) {
      return "Designer";
    }
    if (!paperCuttingDone) {
      return "Paper cutting";
    }

    // ✅ SCREEN PRINTING FLOW: corrugation → pasting → printer → lamination
    if (isScreenPrinting) {
      if (!corrugationDone) {
        return "Corrugation";
      }
      if (!pastingDone) {
        return "Pasting";
      }
      if (hasPrinter && !printerDone) {
        return "Printer";
      }
      if (hasBinder && !laminationDone) {
        return "Lamination";
      }
    }
    // ✅ OFFSET FLOW: printer → lamination → corrugation → pasting
    else {
      if (hasPrinter && !printerDone) {
        return "Printer";
      }
      if (hasBinder && !laminationDone) {
        return "Lamination";
      }
      if (!corrugationDone) {
        return "Corrugation";
      }
      if (!pastingDone) {
        return "Pasting";
      }
    }

    if (!rotaryDone) {
      return "Rotery";
    }
    if (!slottingDone) {
      return "Sloting/rs4";
    }
    if (!pinningDone) {
      return "Pinning";
    }

    // ✅ Final step based on isKantan
    if (isKantanRequired) {
      return "Kanthan";
    } else {
      return "Completed";
    }
  } else {
    // FLOW 2: isPunching = true

    if (hasDesigner && !designDone) {
      return "Designer";
    }
    if (!paperCuttingDone) {
      return "Paper cutting";
    }

    // ✅ SCREEN PRINTING FLOW: corrugation → pasting → printer → lamination
    if (isScreenPrinting) {
      if (!corrugationDone) {
        return "Corrugation";
      }
      if (!pastingDone) {
        return "Pasting";
      }
      if (hasPrinter && !printerDone) {
        return "Printer";
      }
      if (hasBinder && !laminationDone) {
        return "Lamination";
      }
    }
    // ✅ OFFSET FLOW: printer → lamination → corrugation → pasting
    else {
      if (hasPrinter && !printerDone) {
        return "Printer";
      }
      if (hasBinder && !laminationDone) {
        return "Lamination";
      }
      if (!corrugationDone) {
        return "Corrugation";
      }
      if (!pastingDone) {
        return "Pasting";
      }
    }

    if (!punchingDone) {
      return "Puching";
    }

    // ✅ Manual Pasting & Pinning (conditional) - ONLY in Flow 2
    const isPastingRequired = row.isPasting;
    const isPinningRequired = row.isPinning;

    if (isPastingRequired && !manualPastingDone) {
      return "Manual pasting";
    }
    if (isPinningRequired && !pinningDone) {
      return "Pinning";
    }

    // ✅ Final step based on isKantan
    if (isKantanRequired) {
      const allPreKanthanDone =
        (!isPastingRequired || manualPastingDone) &&
        (!isPinningRequired || pinningDone);

      if (allPreKanthanDone) {
        return "Kanthan";
      }
    } else {
      const allProcessesDone =
        (!isPastingRequired || manualPastingDone) &&
        (!isPinningRequired || pinningDone);

      if (allProcessesDone) {
        return "Completed";
      }
    }
  }

  return "In Progress";
};

// ✅ Current process determine karne ka function
const getCurrentProcess = (row) => {
  // ✅ PEHLE CHECK: Agar order ready nahi hai processing ke liye
  if (row.status === "Pending" || row.status === "In Progress") {
    return "in_progress";
  }
  if (row.isKantan && row.kantanEnd) {
    return null; // All processes done including Kanthan
  }

  const hasDesigner = !!row.designer;
  const hasPrinter = !!row.printer;
  const hasBinder = !!row.binder;
  const isPunchingRequired = row.isPunching;
  const isKantanRequired = row.isKantan;
  const isScreenPrinting = row.printType === "screen_printing" || row.printType === "sterio";

  console.log("DEBUG getCurrentProcess:", {
    isPunchingRequired,
    isKantanRequired,
    isScreenPrinting,
    hasDesigner, designDone: row.designDone,
    paperCuttingDone: row.paperCuttingDone,
    hasPrinter, printerDone: row.printerDone,
    hasBinder, laminationDone: row.laminationDone,
    corrugationDone: row.corrugationDone,
    pastingDone: row.pastingDone,
    rotaryDone: row.rotaryDone,
    slottingDone: row.slottingDone,
    manualPastingDone: row.manualPastingDone,
    pinningDone: row.pinningDone,
    punchingDone: row.punchingDone
  });

  // ✅ FLOW 1: isPunching = false
  if (!isPunchingRequired) {
    if (hasDesigner && !row.designDone) return "design";
    if (!row.paperCuttingDone) return "paper_cutting";

    // ✅ SCREEN PRINTING FLOW
    if (isScreenPrinting) {
      if (!row.corrugationDone) return "corrugation";
      if (!row.pastingDone) return "pasting";
      if (hasPrinter && !row.printerDone) return "printer";
      if (hasBinder && !row.laminationDone) return "lamination";
    }
    // ✅ OFFSET FLOW
    else {
      if (hasPrinter && !row.printerDone) return "printer";
      if (hasBinder && !row.laminationDone) return "lamination";
      if (!row.corrugationDone) return "corrugation";
      if (!row.pastingDone) return "pasting";
    }

    if (!row.rotaryDone) return "rotary";
    if (!row.slottingDone) return "slotting";
    if (!row.pinningDone) return "pinning";

    // ✅ Final step based on isKantan
    if (isKantanRequired) {
      return "kanthan";
    }

    return null; // All processes done
  }
  // ✅ FLOW 2: isPunching = true
  else {
    if (hasDesigner && !row.designDone) return "design";
    if (!row.paperCuttingDone) return "paper_cutting";

    // ✅ SCREEN PRINTING FLOW
    if (isScreenPrinting) {
      if (!row.corrugationDone) return "corrugation";
      if (!row.pastingDone) return "pasting";
      if (hasPrinter && !row.printerDone) return "printer";
      if (hasBinder && !row.laminationDone) return "lamination";
    }
    // ✅ OFFSET FLOW
    else {
      if (hasPrinter && !row.printerDone) return "printer";
      if (hasBinder && !row.laminationDone) return "lamination";
      if (!row.corrugationDone) return "corrugation";
      if (!row.pastingDone) return "pasting";
    }

    if (!row.punchingDone) return "punching";

    // ✅ Manual Pasting & Pinning (conditional) - ONLY in Flow 2
    const isPastingRequired = row.isPasting;
    const isPinningRequired = row.isPinning;

    if (isPastingRequired && !row.manualPastingDone) return "manual_pasting";
    if (isPinningRequired && !row.pinningDone) return "pinning";

    // ✅ Final step based on isKantan
    if (isKantanRequired) {
      const allPreKanthanDone =
        (!isPastingRequired || row.manualPastingDone) &&
        (!isPinningRequired || row.pinningDone);

      if (allPreKanthanDone) {
        return "kanthan";
      }
    }

    return null; // All processes done
  }
};

// ✅ Process labels (same as before)
const processLabels = {
  design: { label: "Design", color: "#8B5CF6" },
  paper_cutting: { label: "Paper Cutting", color: "#3B82F6" },
  printer: { label: "Printer", color: "#8B008B" },
  lamination: { label: "Lamination", color: "#FF69B4" },
  corrugation: { label: "Corrugation", color: "#F59E0B" },
  pasting: { label: "Pasting", color: "#10B981" },
  rotary: { label: "Rotary", color: "#3B82F6" },
  slotting: { label: "Slotting/RS4", color: "#8B5CF6" },
  manual_pasting: { label: "Manual Pasting", color: "#06B6D4" },
  pinning: { label: "Pinning", color: "#84CC16" },
  punching: { label: "Punching", color: "#F97316" },
  kanthan: { label: "Kanthan", color: "#EF4444" },
  in_progress: { label: "In Progress", color: "#6B7280" }
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
  const isScreenPrinting = row.printType === "screen_printing" || row.printType === "sterio";

  const isOrderReadyForProcessing = () => {
    return !["Pending", "In Progress", "Completed", "Canceled", "On Hold"].includes(row.status);
  };

  const canMarkCurrentProcessDone = () => {
    const currentProcess = getCurrentProcess(row);
    const isPunchingRequired = row.isPunching;
    const isKantanRequired = row.isKantan;
    const isScreenPrinting = row.printType === "screen_printing" || row.printType === "sterio";

    // ✅ Agar order ready nahi hai processing ke liye
    if (currentProcess === "in_progress") {
      return false;
    }

    if (!isOrderReadyForProcessing()) {
      return false;
    }

    // ✅ Agar current process null hai (sab processes complete), to kuch mark nahi kar sakte
    if (currentProcess === null) {
      return false;
    }

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

    // Sequential dependency check
    const hasDesigner = !!row.designer;

    if (!isPunchingRequired) {
      // FLOW 1: isPunching = false
      switch (currentProcess) {
        case "design":
          return true;

        case "paper_cutting":
          return hasDesigner ? row.designDone : true;

        // ✅ OFFSET FLOW dependencies (since printType is "offset")
        case "printer":
          return row.paperCuttingDone;

        case "lamination":
          return row.printerDone;

        case "corrugation":
          return row.paperCuttingDone;

        case "pasting":
          return row.corrugationDone;

        case "rotary":
          return row.pastingDone;

        case "slotting":
          return row.rotaryDone;

        case "pinning":
          return row.slottingDone;

        default:
          return false;
      }
    } else {
      // FLOW 2: isPunching = true
      switch (currentProcess) {
        case "design":
          return true;

        case "paper_cutting":
          return hasDesigner ? row.designDone : true;

        // ✅ OFFSET FLOW dependencies
        case "printer":
          return row.paperCuttingDone;

        case "lamination":
          return row.printerDone;

        case "corrugation":
          return row.paperCuttingDone;

        case "pasting":
          return row.corrugationDone;

        case "punching":
          return row.pastingDone;

        case "manual_pasting":
          return row.punchingDone;

        case "pinning":
          return row.isPasting ? row.manualPastingDone : true;

        default:
          return false;
      }
    }
  };

  // ... (rest of the functions remain the same - handleMarkCurrentProcessDone, formatTime, handleStart, handleFinish, handleStatusChange, handleBoxFounded)

  const handleMarkCurrentProcessDone = async () => {
    const currentProcess = getCurrentProcess(row);
    const isPunchingRequired = row.isPunching;
    const isKantanRequired = row.isKantan;

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
        }

        // ✅ Check if this is the LAST process (without Kanthan)
        const nextProcess = getCurrentProcess({ ...row, ...updateData });

        // Agar next process null hai (matlab sab processes complete) aur Kanthan required nahi hai
        if (nextProcess === null && !isKantanRequired) {
          updateData.status = "Completed";
        } else {
          const newStatus = calculateDynamicStatus(row, updateData);
          updateData.status = newStatus;
        }

        console.log("DEBUG: Updating with data:", {
          currentProcess,
          updateData,
          isKantanRequired,
          nextProcess
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
        // ✅ Kanthan finish hone pe hamesha "Completed" status set karo
        const updateData = {
          kantanEnd: new Date(),
          status: "Completed" // ✅ Always set to Completed when Kanthan finishes
        };

        await dispatch(updateQPOrderThunk({
          id: row._id,
          data: updateData
        })).unwrap();

        toast.success("Kanthan finished successfully. Order marked as Completed.");
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
    console.log("DEBUG : renderProcessView : processInfo:", processInfo);

    const canDo = canMarkCurrentProcessDone();

    // ✅ Agar order ready nahi hai processing ke liye
    if (currentProcess === "in_progress") {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: processInfo.color }}>
            {processInfo.label}
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: processInfo?.color || '#6B7280' }}>
          {processInfo?.label || "Completed"}
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
                ) : (<></>
                  // ✅ Kanthan finish hone ke baad koi button nahi
                )}
              </>
            )}
          </Box>
        ) : (
          // ✅ Other processes ke liye normal button
          canDo ? (
            <Button
              variant="contained"
              style={{ backgroundColor: processInfo?.color }}
              onClick={handleMarkCurrentProcessDone}
              sx={{ mb: 1, p: 0 }}
            >
              Done
            </Button>
          ) : (<></>)
        )}
      </Box>
    );
  };

  const renderAdminView = () => (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Admin Control
      </Typography>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#6B7280' }}>
          Flow: {row.isPunching ? "With Punching" : "Without Punching"} |
          Print: {isScreenPrinting ? "Screen/Sterio" : "Offset"} |
          Kantan: {row.isKantan ? "Yes" : "No"}
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