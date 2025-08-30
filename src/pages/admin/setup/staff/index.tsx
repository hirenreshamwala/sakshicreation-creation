"use client"
import { useState, useEffect } from "react"
import { Box, Paper, Tabs, Tab, TableCell, Button, IconButton, Typography } from "@mui/material"
import { AttachFile, Delete, Edit, Lock } from "@mui/icons-material" // Renamed Image to ImageIconMui to avoid conflict
import BasicTable from "@/component/common_component/Table/themetable"
import StaffChart from "@/component/staffchart" // Assuming this is a valid import
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllStaffThunk, deleteStaffThunk } from "@/store/slices/staffSlice"
import Swal from "sweetalert2"
import { toast } from "react-toastify"
import FileViewerModal from "@/component/FileViewerModal"
import AddNewStaffBulkDialog from '@/component/AddNewStaffBulkDialog';
import PasswordUpdateDialog from "@/component/PasswordUpdateDialog"
const tabLabels = ["Sakshi Creation", "Quality Packaging"]
const columns = [
  { id: "name", label: "Staff" },
  { id: "role", label: "Role" },
  { id: "joiningDate", label: "Date of Joining" },
  { id: "aadharFiles", label: "Aadhar Files" }, // New column
  { id: "addressFiles", label: "Address Files" }, // New column
  // { id: "status", label: "Status" },
  { id: "actions", label: "Actions" },
]

const StaffPage = () => {
  const [tab, setTab] = useState(0)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { staffList, loading, error } = useAppSelector((state) => state.staff)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null);

  // State for file viewer modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [currentFileType, setCurrentFileType] = useState<"image" | "pdf" | "other" | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  // Fetch all staff on component mount
  useEffect(() => {
    dispatch(getAllStaffThunk())
      .unwrap()
      .catch((err) => {
        toast.error(err.message || "Failed to fetch staff")
      })
  }, [dispatch])

  // Handle edit action
  const handleEdit = (id: string) => {
    router.push(`/admin/setup/staff/view?mode=edit&id=${id}`)
  }

  // Handle delete action with SweetAlert2 confirmation and toast feedback
  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteStaffThunk(id))
          .unwrap()
          .then(() => {
            toast.success(`${name} has been deleted.`)
          })
          .catch((err) => {
            toast.error(err.message || "Failed to delete staff")
          })
      }
    })
  }
 const handlePasswordUpdate = (id: string, name: string) => {
    setSelectedStaff({ id, name });
    setPasswordDialogOpen(true);
  };
  // Function to open the file viewer modal
  const handleFileClick = (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase()
    const fileName = filePath.split("/").pop()

    // Ensure NEXT_PUBLIC_BACKEND_URL is correctly set and is an absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) {
      toast.error("Backend URL is not configured. Please set NEXT_PUBLIC_API_URL.")
      return
    }

    const fileUrl = `${baseUrl}/api/fileDownload/download?filePath=${encodeURIComponent(filePath)}&view=true`
console.log("File URL:", fileUrl)
    let type: "image" | "pdf" | "other"
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension || "")) {
      type = "image"
    } else if (extension === "pdf") {
      type = "pdf"
    } else {
      type = "other"
    }

    setCurrentFileUrl(fileUrl)
    setCurrentFileName(fileName || "File")
    setCurrentFileType(type)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentFileUrl(null)
    setCurrentFileName(null)
    setCurrentFileType(null)
  }

  // Format staffList for table display
  const formattedStaffList = staffList.map((staff) => ({
    id: staff.id,
    name: staff.name || `${staff.firstName} ${staff.lastName}`,
    role: staff.role?.roleName || "N/A", // Use roleName from populated role
    joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : "-",
    status: staff.status ? "Active" : "Inactive",
    aadharFiles: staff.aadharFiles || [], // Include Aadhar files
    addressFiles: staff.addressFiles || [], // Include Address files
  }))

  return (
    <Box sx={{ p: 2 }}>
      {/* Tabs */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Box
          sx={{
            position: "relative",
            display: "inline-flex",
            borderRadius: "12px",
            border: "2px solid #7F56D9",
            backgroundColor: "#fff",
            p: "2px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 2,
              left: tab === 0 ? 2 : "50%",
              width: "50%",
              height: "calc(100% - 4px)",
              backgroundColor: "#7F56D9",
              borderRadius: "10px",
              zIndex: 0,
              transition: "left 0.3s ease",
            }}
          />
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              minHeight: 0,
              zIndex: 1,
              "& .MuiTabs-flexContainer": {
                gap: 0,
              },
              "& .MuiTab-root": {
                textTransform: "none",
                minHeight: 0,
                px: 1.8,
                py: 0.8,
                fontWeight: 700,
                fontSize: 14,
                borderRadius: "10px",
                color: "#7F56D9",
                transition: "color 0.3s ease",
                zIndex: 1,
              },
              "& .MuiTab-root.Mui-selected": {
                color: "#fff",
                backgroundColor: "transparent",
                zIndex: 2,
              },
            }}
          >
            {tabLabels.map((label) => (
              <Tab key={label} label={label} disableRipple />
            ))}
          </Tabs>
        </Box>
      </Box>
      {/* Add Staff Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push("/admin/setup/staff/view?mode=add")}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Add Staff
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setBulkDialogOpen(true)}
          sx={{ ml:2,borderRadius: 2, fontWeight: 700 }}
        >
          Bulk Upload Staff
        </Button>
      </Box>
      {/* Stats & Bar Chart */}
      <StaffChart tab={tab} />
      {/* Staff Table */}
      <Paper sx={{ mt: 4, borderRadius: 2, overflow: "hidden" }}>
        <BasicTable
          tableHeader={columns}
          rowData={formattedStaffList}
          loading={loading}
          renderRow={(row) => (
            <>
              <TableCell sx={{ fontWeight: 500, cursor: "pointer" }} onClick={() => handleEdit(row.id)}>
                {row.name}
              </TableCell>
              <TableCell>{row.role}</TableCell>
              <TableCell>{row.joiningDate}</TableCell>
              {/* Display Aadhar Files */}
              <TableCell>
                {row.aadharFiles.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {row.aadharFiles.map((filePath: string, idx: number) => {
                      const extension = filePath.split(".").pop()?.toLowerCase()
                      const fileName = filePath.split("/").pop()

                      return (
                        <Box
                          key={idx}
                          onClick={() => handleFileClick(filePath)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension || "") ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}/api/fileDownload/download?filePath=${encodeURIComponent(filePath)}&view=true`}
                              alt={fileName || "Image preview"}
                              style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }}
                            />
                          ) : (
                            <AttachFile sx={{ fontSize: 16, mr: 0.5, color: "#7F56D9" }} />
                          )}
                          <Typography variant="body2" sx={{ fontSize: 12, color: "#7F56D9" }}>
                            {fileName}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                ) : (
                  "-"
                )}
              </TableCell>
              {/* Display Address Files */}
              <TableCell>
                {row.addressFiles.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {row.addressFiles.map((filePath: string, idx: number) => {
                      const extension = filePath.split(".").pop()?.toLowerCase()
                      const fileName = filePath.split("/").pop()

                      return (
                        <Box
                          key={idx}
                          onClick={() => handleFileClick(filePath)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension || "") ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}/api/fileDownload/download?filePath=${encodeURIComponent(filePath)}&view=true`}
                              alt={fileName || "Image preview"}
                              style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }}
                            />
                          ) : (
                            <AttachFile sx={{ fontSize: 16, mr: 0.5, color: "#7F56D9" }} />
                          )}
                          <Typography variant="body2" sx={{ fontSize: 12, color: "#7F56D9" }}>
                            {fileName}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                ) : (
                  "-"
                )}
              </TableCell>
              {/* <TableCell>{row.status}</TableCell> */}
              <TableCell>
                <IconButton color="primary" onClick={() => handleEdit(row.id)} size="small">
                  <Edit />
                </IconButton>
                <IconButton 
                  color="primary" 
                  onClick={() => handlePasswordUpdate(row.id, row.name)} 
                  size="small"
                  title="Update Password"
                >
                  <Lock/> {/* You'll need to import Lock icon from @mui/icons-material */}
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id, row.name)} size="small">
                  <Delete />
                </IconButton>
              </TableCell>
            </>
          )}
        />
      </Paper>
      {error && <Box sx={{ color: "error.main", mt: 2, textAlign: "center" }}>{error}</Box>}

      {/* File Viewer Modal */}
      <FileViewerModal
        open={isModalOpen}
        onClose={handleCloseModal}
        fileUrl={currentFileUrl}
        fileName={currentFileName}
        fileType={currentFileType}
      />
      <AddNewStaffBulkDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        refreshData={() => dispatch(getAllStaffThunk())}
/>
      <PasswordUpdateDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        staffId={selectedStaff?.id || ""}
        staffName={selectedStaff?.name || ""}
      />

    </Box>
  )
}

export default StaffPage
