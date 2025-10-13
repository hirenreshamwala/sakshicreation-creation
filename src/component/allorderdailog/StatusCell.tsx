import { MenuItem, TextField, Typography, Box, Chip, Tooltip, Button } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import { ORDER_STATUSES, processSteps } from "@/constants"
import ThemeButton from "@/component/common_component/themebutton"
import { useEffect, useState } from "react"

const statusOptions = ORDER_STATUSES


// ✅ NAYA: Dynamic status calculate karne ka function
const calculateDynamicStatus = (row: any, updatedData: any = {}) => {
  const paperCuttingDone = updatedData.paperCuttingDone !== undefined ? updatedData.paperCuttingDone : row.paperCuttingDone;
  const corrugationDone = updatedData.corrugationDone !== undefined ? updatedData.corrugationDone : row.corrugationDone;
  const printerDone = updatedData.printerDone !== undefined ? updatedData.printerDone : row.printerDone;
  const laminationDone = updatedData.laminationDone !== undefined ? updatedData.laminationDone : row.laminationDone;
  const pastingDone = updatedData.pastingDone !== undefined ? updatedData.pastingDone : row.pastingDone;
  const rotaryDone = updatedData.rotaryDone !== undefined ? updatedData.rotaryDone : row.rotaryDone;
  const slottingDone = updatedData.slottingDone !== undefined ? updatedData.slottingDone : row.slottingDone;
  const printingDone = updatedData.printingDone !== undefined ? updatedData.printingDone : row.printingDone;
  const manualPastingDone = updatedData.manualPastingDone !== undefined ? updatedData.manualPastingDone : row.manualPastingDone;
  const pinningDone = updatedData.pinningDone !== undefined ? updatedData.pinningDone : row.pinningDone;
  const punchingDone = updatedData.punchingDone !== undefined ? updatedData.punchingDone : row.punchingDone;

  const hasPrinter = !!row.printer;
  const hasBinder = !!row.binder;

  if (row.designer && !row.designDone) return "Paper cutting & Corrugation";
  if (!paperCuttingDone && !corrugationDone) return "Paper cutting & Corrugation";
  if (paperCuttingDone && hasPrinter && !printerDone) return "Printer & Corrugation";
  if (paperCuttingDone && printerDone && hasBinder && !laminationDone) return "Lamination & Corrugation";
  if (paperCuttingDone && !hasPrinter && !hasBinder) return "Paper cutting & Corrugation";
  if (paperCuttingDone && corrugationDone && (!hasPrinter || printerDone) && (!hasBinder || laminationDone) && !pastingDone) return "Pasting";
  if (pastingDone && !rotaryDone) return "Rotary";
  if (rotaryDone && !slottingDone) return "Slotting";
  if (slottingDone && !printingDone) return "Printing";
  if (printingDone && !manualPastingDone) return "Manual Pasting";
  if (manualPastingDone && !pinningDone) return "Pinning";
  if (pinningDone && !punchingDone) return "Punching";
  if (punchingDone) return "Kanthan";
  return "Paper cutting & Corrugation";
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

  const canMarkProcessDone = (processKey: string) => {
    if (processKey === "design" && !userActions.canDoDesign) return false;
    if (processKey === "paper_cutting" && !userActions.canDoPaperCutting) return false;
    if (processKey === "corrugation" && !userActions.canDoCorrugation) return false;
    if (processKey === "printer" && !userActions.canDoPrinter) return false;
    if (processKey === "lamination" && !userActions.canDoLamination) return false;
    if (processKey !== "design" && processKey !== "paper_cutting" && processKey !== "corrugation" && processKey !== "printer" && processKey !== "lamination" && !userActions.canDoOtherProcesses) return false;
    if (processKey === "design") return true;
    if (processKey === "paper_cutting" || processKey === "corrugation") return true;
    if (processKey === "printer") {
      const result = row.paperCuttingDone;
      return result;
    }
    if (processKey === "lamination") {
      const result = row.printerDone;
      return result;
    }
    if (processKey === "pasting") {
      const designComplete = row.designer ? row.designDone : true;
      const cuttingDone = row.paperCuttingDone;
      const corrugationDone = row.corrugationDone;
      if (row.printer && row.binder) {
        const result = designComplete && cuttingDone && corrugationDone && row.printerDone && row.laminationDone;
        return result;
      } else if (row.printer && !row.binder) {
        const result = designComplete && cuttingDone && corrugationDone && row.printerDone;
        return result;
      } else {
        const result = designComplete && cuttingDone && corrugationDone;
        return result;
      }
    }
    const processIndex = processSteps.findIndex(step => step.key === processKey);
    const previousProcesses = processSteps.slice(0, processIndex);

    const allPreviousDone = previousProcesses.every(step => {
      const stepDone = (() => {
        switch (step.key) {
          case "design": return row.designer ? row.designDone : true;
          case "paper_cutting": return row.paperCuttingDone;
          case "corrugation": return row.corrugationDone;
          case "printer": return row.printer ? row.printerDone : true;
          case "lamination": return row.binder ? row.laminationDone : true;
          case "pasting": return row.pastingDone;
          case "rotary": return row.rotaryDone;
          case "slotting": return row.slottingDone;
          case "printing": return row.printingDone;
          case "manual_pasting": return row.manualPastingDone;
          case "pinning": return row.pinningDone;
          case "punching": return row.punchingDone;
          default: return true;
        }
      })();
      return stepDone;
    });
    return allPreviousDone;
  };

  const handleMarkProcessDone = async (processKey: string) => {
    if (!canMarkProcessDone(processKey)) {
      const processLabel = processSteps.find(step => step.key === processKey)?.label;
      if ((processKey === "design" && !userActions.canDoDesign) ||
        (processKey === "paper_cutting" && !userActions.canDoPaperCutting) ||
        (processKey === "corrugation" && !userActions.canDoCorrugation) ||
        (processKey === "printer" && !userActions.canDoPrinter) ||
        (processKey === "lamination" && !userActions.canDoLamination) ||
        (processKey !== "design" && processKey !== "paper_cutting" && processKey !== "corrugation" && processKey !== "printer" && processKey !== "lamination" && !userActions.canDoOtherProcesses)) {
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
          case "design":
            updateData.designDone = true;
            updateData.status = "Paper cutting & Corrugation";
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

        const newStatus = calculateDynamicStatus(row, updateData);
        updateData.status = newStatus;

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
      case "design": return !!row.designDone;
      case "paper_cutting": return !!row.paperCuttingDone;
      case "corrugation": return !!row.corrugationDone;
      case "printer": return !!row.printerDone;
      case "lamination": return !!row.laminationDone;
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

  const renderNextProcesses = () => {
    const isDesignComplete = row.designer ? row.designDone : true;
    if (!isDesignComplete || !row.paperCuttingDone || !row.corrugationDone) return null;
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Next Processes
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5, mb: 2 }}>
          {processSteps
            .filter(step =>
              step.key !== "paper_cutting" &&
              step.key !== "corrugation" &&
              (!row.designer || step.key !== "design") // Don't show design if no designer assigned
            )
            .map(process => {
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

  const renderDesignerView = () => (
    <Box sx={{ minWidth: 200 }}>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#8B5CF6' }}>
        Design
      </Typography>
      {!row.designDone ? (
        <Button
          fullWidth
          variant="contained"
          style={{ backgroundColor: '#8B5CF6' }}
          onClick={() => handleMarkProcessDone("design")}
          sx={{ mb: 1 }}
        >
          Mark Design Done
        </Button>
      ) : (
        <Chip
          label="Design Completed"
          color="success"
          size="small"
          sx={{ width: '100%', mb: 1 }}
        />
      )}
      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        <div>Design: {row.designDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Paper Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'} {!row.designDone && '(Waiting for Design)'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'} {!row.designDone && '(Waiting for Design)'}</div>
        {row.designDone && ( <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Paper Cutting & Corrugation</div> )}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Next Processes {!row.designDone && '(Waiting for Design)'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5, mb: 2 }}>
          {processSteps
            .filter(step => step.key !== "design")
            .map(process => {
              const isDone = isProcessDone(process.key);
              const canDo = row.designDone && canMarkProcessDone(process.key) && !isDone; 
              return (
                <Tooltip
                  key={process.key}
                  title={isDone ? "Completed" : !row.designDone ? "Waiting for Design" : !canDo ? "Prerequisites not met" : `Mark ${process.label} as done`}
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
      {renderKanthanTimer()}
    </Box>
  );
  const renderCuttingView = () => (
    <Box sx={{ minWidth: 200 }}>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>
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
          disabled={row.designer && !row.designDone}
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
        {row.designer && ( <div>Design: {row.designDone ? '✅ Done' : '⏳ Pending'}</div> )}
        <div>Paper Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.printer && ( <div>Printer: {row.printerDone ? '✅ Done' : '⏳ Pending'}</div> )}
        {row.binder && ( <div>Lamination: {row.laminationDone ? '✅ Done' : '⏳ Pending'}</div> )}
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.paperCuttingDone && row.corrugationDone && (!row.printer || row.printerDone) && (!row.binder || row.laminationDone) && (<div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Pasting</div> )}
      </Box>

      {(!row.designer || row.designDone) && renderNextProcesses()}

      {renderKanthanTimer()}
    </Box>
  );
  const renderCorrugationView = () => (
    <Box sx={{ minWidth: 200 }}>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>
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
          disabled={row.designer && !row.designDone}
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
        {row.designer && ( <div>Design: {row.designDone ? '✅ Done' : '⏳ Pending'}</div> )}
        <div>Paper Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.printer && ( <div>Printer: {row.printerDone ? '✅ Done' : '⏳ Pending'}</div> )}
        {row.binder && ( <div>Lamination: {row.laminationDone ? '✅ Done' : '⏳ Pending'}</div> )}
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.paperCuttingDone && row.corrugationDone && (!row.printer || row.printerDone) && (!row.binder || row.laminationDone) && ( <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Pasting</div> )}
      </Box>

      {(!row.designer || row.designDone) && renderNextProcesses()}
      {renderKanthanTimer()}
    </Box>
  );
  const renderPrinterView = () => (
    <Box sx={{ minWidth: 200 }}>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#8B008B' }}>
        Printer
      </Typography>
      {!row.printerDone ? (
        <Button
          fullWidth
          variant="contained"
          style={{ backgroundColor: '#8B008B' }}
          onClick={() => handleMarkProcessDone("printer")}
          sx={{ mb: 1 }}
          disabled={!row.paperCuttingDone}
        >
          Mark Printer Done
        </Button>
      ) : (
        <Chip
          label="Printer Completed"
          color="success"
          size="small"
          sx={{ width: '100%', mb: 1 }}
        />
      )}
      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        <div>Paper Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Printer: {row.printerDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.printerDone && row.binder && ( <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Lamination</div> )}
      </Box>
      {renderKanthanTimer()}
    </Box>
  );
  const renderBinderView = () => (
    <Box sx={{ minWidth: 200 }}>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#FF69B4' }}>
        Lamination
      </Typography>
      {!row.laminationDone ? (
        <Button
          fullWidth
          variant="contained"
          style={{ backgroundColor: '#FF69B4' }}
          onClick={() => handleMarkProcessDone("lamination")}
          sx={{ mb: 1 }}
          disabled={!row.printerDone}
        >
          Mark Lamination Done
        </Button>
      ) : (
        <Chip
          label="Lamination Completed"
          color="success"
          size="small"
          sx={{ width: '100%', mb: 1 }}
        />
      )}
      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        <div>Printer: {row.printerDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Lamination: {row.laminationDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.laminationDone && row.corrugationDone && ( <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Pasting</div> )}
      </Box>
      {renderKanthanTimer()}
    </Box>
  );
  const renderOperatorView = () => (
    <Box sx={{ minWidth: 200 }}>
      <Box sx={{ mb: 1, p: 1, backgroundColor: '#F3F4F6', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          Current: {row.status || "Pending"}
        </Typography>
      </Box>
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
          disabled={row.designer && !row.designDone}
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
        {row.designer && ( <div>Design: {row.designDone ? '✅ Done' : '⏳ Pending'}</div> )}
        <div>Paper Cutting: {row.paperCuttingDone ? '✅ Done' : '⏳ Pending'}</div>
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '⏳ Pending'}</div>
        {row.printer && ( <div>Printer: {row.printerDone ? '✅ Done' : '⏳ Pending'}</div> )}
        {row.binder && ( <div>Lamination: {row.laminationDone ? '✅ Done' : '⏳ Pending'}</div> )}
        {row.paperCuttingDone && row.corrugationDone && (!row.printer || row.printerDone) && (!row.binder || row.laminationDone) && ( <div style={{ color: '#10B981', fontWeight: 'bold' }}>Ready for Pasting</div> )}
      </Box>

      {(!row.designer || row.designDone) && renderNextProcesses()}
      {renderKanthanTimer()}
    </Box>
  );
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
        {row.printer && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#8B008B' }}>
              Printer
            </Typography>
            {!row.printerDone ? (
              <Button
                fullWidth
                variant="contained"
                style={{ backgroundColor: '#8B008B' }}
                onClick={() => handleMarkProcessDone("printer")}
                sx={{ mb: 1 }}
              >
                Mark Printer Done
              </Button>
            ) : (
              <Chip
                label="Printer Completed"
                color="success"
                size="small"
                sx={{ width: '100%', mb: 1 }}
              />
            )}
          </>
        )}
        {row.binder && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#FF69B4' }}>
              Lamination
            </Typography>
            {!row.laminationDone ? (
              <Button
                fullWidth
                variant="contained"
                style={{ backgroundColor: '#FF69B4' }}
                onClick={() => handleMarkProcessDone("lamination")}
                sx={{ mb: 1 }}
              >
                Mark Lamination Done
              </Button>
            ) : (
              <Chip
                label="Lamination Completed"
                color="success"
                size="small"
                sx={{ width: '100%', mb: 1 }}
              />
            )}
          </>
        )}
      </Box>
      {(!row.designer || row.designDone) && renderNextProcesses()}
      {renderKanthanTimer()}
    </Box>
  );
  if (userActions.viewType === "designer") { return renderDesignerView(); } 
  else if (userActions.viewType === "cutting") { return renderCuttingView(); }
  else if (userActions.viewType === "corrugation") { return renderCorrugationView(); } 
  else if (userActions.viewType === "printer") { return renderPrinterView(); } 
  else if (userActions.viewType === "binder") { return renderBinderView(); } 
  else if (userActions.viewType === "operator") { return renderOperatorView(); } 
  else if (userActions.viewType === "admin") { return renderAdminView(); }

  return (
    <Box sx={{ minWidth: 150 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#3B82F6' }}>
        {row.status || "Pending"}
      </Typography>
      <Box sx={{ mt: 1, fontSize: '0.7rem', color: '#6B7280' }}>
        {row.designer && ( <div>Design: {row.designDone ? '✅ Done' : '⏳ Pending'}</div> )}
        <div>Paper Cutting: {row.paperCuttingDone ? '✅ Done' : '❌ Pending'}</div>
        {row.printer && ( <div>Printer: {row.printerDone ? '✅ Done' : '❌ Pending'}</div> )}
        {row.binder && ( <div>Lamination: {row.laminationDone ? '✅ Done' : '❌ Pending'}</div> )}
        <div>Corrugation: {row.corrugationDone ? '✅ Done' : '❌ Pending'}</div>
      </Box>
    </Box>
  );
}