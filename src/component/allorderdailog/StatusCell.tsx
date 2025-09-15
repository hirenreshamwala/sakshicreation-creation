import { MenuItem, TextField, Typography } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import Swal from "sweetalert2"

const statusOptions = [
  "Paper cutting",
  "Corogation",
  "Pasting",
  "Rotery",
  "Sloting/rs4",
  "Printing",
  "Pinning",
  "Kanthan",
  "Puching",
  "Manual pasting",
  "Pending",
  "Order",
  "In Progress",
  "Canceled",
  "Completed",
]

export const StatusCell = ({ row }: { row: any }) => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const canStatus = user?.role?.permissions?.all_orders?.status

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
    <TextField
      select
      size="small"
      value={row.status || "Pending"}
      onChange={(e) => handleStatusChange(e.target.value)}
      sx={{ minWidth: 140 }}
    >
      {statusOptions.map((status) => (
        <MenuItem key={status} value={status}>
          {status}
        </MenuItem>
      ))}
    </TextField>
  )
}