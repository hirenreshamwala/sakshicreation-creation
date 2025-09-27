import { MenuItem, TextField, Typography, Box } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import { ORDER_STATUSES } from "@/constants"
import ThemeButton from "@/component/common_component/themebutton"
import { useEffect, useState } from "react"

const statusOptions = ORDER_STATUSES

export const StatusCell = ({ row }: { row: any }) => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const canStatus = user?.role?.permissions?.all_orders?.status
  const isStatusFinal = row.status === "Completed" || row.status === "Canceled" || row.status === "On Hold" || row.status === "In Progress"

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

  const formatTime = (ms) => {
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

  if (!canStatus) {
    return (
      <Typography variant="body2" sx={{ minWidth: 140 }}>
        {row.status || "Pending"}
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        select
        size="small"
        value={row.status || "Pending"}
        onChange={(e) => handleStatusChange(e.target.value)}
        sx={{ minWidth: 140 }}
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
      {row.status === "Kanthan" && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!row.kantanStart ? (
            <ThemeButton size="small" onClick={handleStart}>
              Start
            </ThemeButton>
          ) : !row.kantanEnd ? (
            <>
              <Typography>{formatTime(elapsed)}</Typography>
              <ThemeButton size="small" onClick={handleFinish}>
                Finish
              </ThemeButton>
            </>
          ) : null}
        </Box>
      )}
    </Box>
  )
}