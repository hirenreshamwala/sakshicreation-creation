// In your StaffPage.tsx - Complete multiple filter implementation
"use client"
import { useState, useEffect, useCallback,useRef} from "react"
import { Box, Paper, TableCell, Button, IconButton, Typography, Chip } from "@mui/material"
import { AttachFile, Delete, Edit, Lock } from "@mui/icons-material"
import BasicTable from "@/component/common_component/Table/themetable"
import StaffChart from "@/component/staffchart"
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllStaffThunk, deleteStaffThunk, getStaffFiltersThunk, setFilters } from "@/store/slices/staffSlice"
import Swal from "sweetalert2"
import { toast } from "react-toastify"
import FileViewerModal from "@/component/FileViewerModal"
import AddNewStaffBulkDialog from '@/component/AddNewStaffBulkDialog';
import PasswordUpdateDialog from "@/component/PasswordUpdateDialog"
import { companyOptions } from "@/constants"
import TabComponent from "@/component/Dialog/TabComponent"

const tabLabels = companyOptions
const columns = [
  { id: "name", label: "Staff" },
  { id: "role", label: "Role" },
  { id: "joiningDate", label: "Date of Joining" },
  { id: "aadharFiles", label: "Aadhar Files" },
  { id: "addressFiles", label: "Address Files" },
  { id: "actions", label: "Actions" },
]

const StaffPage = () => {
  const [tab, setTab] = useState(0)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { 
    staffList, 
    loading, 
    error, 
    pagination, 
    filters,
    availableFilters 
  } = useAppSelector((state) => state.staff)
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [currentFileType, setCurrentFileType] = useState<"image" | "pdf" | "other" | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});
  const searchTimeoutRef = useRef<number | null>(null);

  const handleSearchDebounced = useCallback(
    (search: string) => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = window.setTimeout(() => {
        dispatch(setFilters({ search: search.trim(), page: 1 }));
      }, 500);
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
 // In your StaffPage.tsx - Update the fetchStaffData function
// Fetch staff data with current filters
const fetchStaffData = useCallback(() => {
  // Convert active filters to proper API parameters
  const apiFilters: any = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
    company: filters.company,
  };

  // Add array filters properly
  if (activeFilters.Role && activeFilters.Role.length > 0) {
    apiFilters.roles = activeFilters.Role;
  }
  
  if (activeFilters.Staff && activeFilters.Staff.length > 0) {
    apiFilters.staffNames = activeFilters.Staff;
  }
  if (activeFilters["Date of Joining"] && activeFilters["Date of Joining"].length > 0) {
    apiFilters.joiningDates = activeFilters["Date of Joining"]; // send array of "DD/MM/YYYY"
  }

  console.log('Sending filters to API:', apiFilters); // Debug log

  dispatch(getAllStaffThunk(apiFilters))
    .unwrap()
    .catch((err) => {
      toast.error(err.message || "Failed to fetch staff")
    })
}, [dispatch, filters, activeFilters]);

  // Fetch available filters
  const fetchAvailableFilters = useCallback(() => {
    dispatch(getStaffFiltersThunk())
      .unwrap()
      .catch((err) => {
        console.error("Failed to fetch filters:", err)
      })
  }, [dispatch])

  // Initial data fetch
  useEffect(() => {
    fetchStaffData()
    fetchAvailableFilters()
  }, [])

  // Refresh data when filters change
  useEffect(() => {
    fetchStaffData()
  }, [filters, activeFilters, fetchStaffData])

  // Reset page when tab changes
  useEffect(() => {
    dispatch(setFilters({ page: 1 }))
  }, [tab, dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);



  const handleDateChange = useCallback((startDate: string | null, endDate: string | null) => {
    dispatch(setFilters({ 
      startDate: startDate || "", 
      endDate: endDate || "", 
      page: 1 
    }))
  }, [dispatch])

  const handlePageChange = useCallback((page: number) => {
    dispatch(setFilters({ page }))
  }, [dispatch])

  // Handle multiple filter changes
  const handleFilterChange = useCallback((newFilters: { [key: string]: string[] }) => {
    setActiveFilters(newFilters);
    dispatch(setFilters({ page: 1 }));
  }, [dispatch]);

  // Clear specific filter
  const clearFilter = useCallback((filterType: string) => {
    const updatedFilters = { ...activeFilters };
    delete updatedFilters[filterType];
    setActiveFilters(updatedFilters);
    dispatch(setFilters({ page: 1 }));
  }, [activeFilters, dispatch]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    dispatch(setFilters({ 
      search: "",
      role: "",
      page: 1 
    }));
  }, [dispatch]);

  // Handle edit action
  const handleEdit = (id: string) => router.push(`/admin/setup/staff/view?mode=edit&id=${id}`)

  // Handle delete action
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
            fetchStaffData()
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
    const extension = filePath?.split(".").pop()?.toLowerCase()
    const fileName = filePath?.split("/").pop()

    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) {
      toast.error("Backend URL is not configured. Please set NEXT_PUBLIC_API_URL.")
      return
    }

    const fileUrl = `${baseUrl}/api/fileDownload/download?filePath=${encodeURIComponent(filePath)}&view=true`
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
    role: staff.role?.roleName || "N/A",
    joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : "-",
    status: staff.status ? "Active" : "Inactive",
    aadharFiles: staff.aadharFiles || [],
    addressFiles: staff.addressFiles || [],
  }))

  // Count active filters
  const activeFilterCount = Object.values(activeFilters).reduce((count, values) => 
    count + (values ? values.length : 0), 0
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Tabs */}
      <TabComponent activeTab={tab} setActiveTab={setTab} tabList={tabLabels} />
      
      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="textSecondary">
            Active filters:
          </Typography>
          {Object.entries(activeFilters).map(([filterType, values]) => 
            values.map((value, index) => (
              <Chip
                key={`${filterType}-${value}-${index}`}
                // label={`${filterType}: ${value}`}
                label={
        filterType === "Date of Joining" 
          ? `Joined: ${value}` 
          : filterType === "Role" 
            ? `Role: ${value}` 
            : filterType === "Staff" 
              ? `Staff: ${value}` 
              : `${filterType}: ${value}`
      }
                onDelete={() => {
                  const updatedValues = activeFilters[filterType].filter(v => v !== value);
                  if (updatedValues.length === 0) {
                    clearFilter(filterType);
                  } else {
                    setActiveFilters(prev => ({
                      ...prev,
                      [filterType]: updatedValues
                    }));
                  }
                }}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))
          )}
          <Button 
            size="small" 
            onClick={clearAllFilters}
            sx={{ ml: 1 }}
          >
            Clear All
          </Button>
        </Box>
      )}

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
          sx={{ ml: 2, borderRadius: 2, fontWeight: 700 }}
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
          serverSide={true}
          totalCount={pagination.totalItems}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchDebounced}
          onFilterChange={handleFilterChange}
          onDateChange={handleDateChange}
         availableFilters={{
  "Staff": availableFilters.staff || [],
  "Role":       availableFilters.roles || [],
  "Date of Joining":     availableFilters.joiningDates || [],
}}
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
                      const extension = filePath?.split(".").pop()?.toLowerCase()
                      const fileName = filePath?.split("/").pop()

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
                      const extension = filePath?.split(".").pop()?.toLowerCase()
                      const fileName = filePath?.split("/").pop()

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
                  <Lock />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id, row.name)} size="small">
                  <Delete />
                </IconButton>
              </TableCell>
            </>
          )}
        />
      </Paper>

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
        refreshData={fetchStaffData}
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