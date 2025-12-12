import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Box, TableCell, IconButton, Typography, Button } from "@mui/material";
import { Delete, Edit, Visibility, AttachFile } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import CustomTable2 from "@/component/common_component/Table/CustomTable2";
import ComplainDialogue from './ComplainDialogue';
import ComplainViewDialogue from './ComplainViewDialogue';
import ViewFilesDialog from '@/component/reusablecomponents/ViewFilesDialog';
import { StaticCompanyOptions } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllCompaniesThunk } from '@/store/slices/compnaySlice';
import { deleteComplainThunk, getAllComplainsThunk, getComplainsByStaffThunk } from '@/store/slices/complainSlice';
import { complainService } from "@/services/complain.service";

const columns = [
    { id: 'sr', label: 'Sr no' },
    { id: 'orderno', label: 'OrderNo', value: 'orderNo' },
    { id: 'partyName', label: 'Party', value: 'party' },
    { id: 'subject', label: 'SUBJECT', value: 'subject' },
    { id: 'status', label: 'STATUS', value: 'status' },
    { id: 'createdBy', label: 'CREATED BY', value: 'createdBy' },
    { id: 'files', label: 'FILES' },
    { id: 'actions', label: 'ACTION', value: 'actions' },
];

// Define company interface
interface CompanyType {
    _id: string;
    companyName: string;
}

const ComplainPage = ({ company }: { company?: CompanyType }) => {
    const dispatch = useAppDispatch();
    
    // State variables
    const [open, setOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [filesDialogOpen, setFilesDialogOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectedComplaintSubject, setSelectedComplaintSubject] = useState<string>('');
    const [editData, setEditData] = useState<any>(null);
    const [viewData, setViewData] = useState<any>(null);

    // Redux selectors
    const { companies } = useAppSelector((state) => state.company);
    const { user } = useAppSelector((state) => state.auth);
    const { complains, loading, totalCount } = useAppSelector((state) => state.complains);

    // Get company from props or find from redux store
    const selectedCompany = useMemo(() => {
        if (company && company._id && company.companyName) {
            return company;
        }
        
        const companyName = company?.companyName || StaticCompanyOptions[0];
        const foundCompany = companies.find((item) => item.companyName === companyName);
        
        return foundCompany || { 
            _id: "default-company-id", 
            companyName: companyName 
        };
    }, [company, companies]);

    // Filter states - use selectedCompany
    const [currentFilterState, setCurrentFilterState] = useState<any>({
        page: 1,
        pageSize: 10,
        search: "",
        filters: {},
        includeCounts: true,
        isPagination: true,
        startDate: null,
        endDate: null,
        company: selectedCompany.companyName, // Add company filter at top level
    });

    const [appliedFilterState, setAppliedFilterState] = useState<any>({});
    const [isInitialLoad, setIsInitialLoad] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Filter options states
    const [filterOptionsData, setFilterOptionsData] = useState<{ [key: string]: string[] }>({});
    const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
    const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);

    // Prevent multiple API calls
    const isLoadingRef = useRef(false);

    // Permissions
    const canViewGlobal = user?.role?.permissions?.all_complains?.view_global;
    const canViewOwn = user?.role?.permissions?.all_complains?.view_own;
    const canCreate = user?.role?.permissions?.all_complains?.create;
    const canEdit = user?.role?.permissions?.all_complains?.edit;
    const canDelete = user?.role?.permissions?.all_complains?.delete;

    // Load complains with filters
    const loadComplains = useCallback(async () => {
        if (isLoadingRef.current) {
            console.log("⚠️ Complain API call already in progress, skipping...");
            return;
        }

        if (!selectedCompany?._id) {
            console.error("Cannot load complains: Company ID is undefined");
            return;
        }

        setIsLoadingData(true);
        isLoadingRef.current = true;
        
        try {
            const params = {
                ...currentFilterState,
                filters: {
                    ...currentFilterState.filters,
                    // Add company to filters if not already present
                    ...(currentFilterState.filters.company ? {} : { company: [selectedCompany.companyName] }),
                },
                isPagination: true,
                includeCounts: true
            };

            console.log("📡 Loading complains with params:", params);

            if (canViewGlobal) {
                await dispatch(getAllComplainsThunk(params));
            } else if (canViewOwn && user?.id) {
                await dispatch(getComplainsByStaffThunk({ 
                    staffId: user.id, 
                    filters: params 
                }));
            }

            setIsInitialLoad(true);
        } catch (err: any) {
            console.error("❌ Error loading complains:", err);
            toast.error(err.message || "Failed to load complains");
        } finally {
            setIsLoadingData(false);
            isLoadingRef.current = false;
        }
    }, [dispatch, currentFilterState, user, canViewGlobal, canViewOwn, selectedCompany]);

    // Load filter options
    const loadFilterOptions = async (field: string) => {
        if (!selectedCompany?._id) {
            console.error("Cannot load filter options: Company ID is undefined");
            return;
        }

        setLoadingFilterOptions(true);
        try {
            // Add staffId filter if user can only view own complains
            const extraFilters = canViewOwn && !canViewGlobal ? { staffId: user?.id } : {};

            const filterPayload = {
                ...currentFilterState.filters,
                ...extraFilters,
                startDate: currentFilterState.startDate,
                endDate: currentFilterState.endDate,
                // Always include company filter for filter options
                company: [selectedCompany.companyName],
            };

            console.log(`🔍 Loading complain filter options for ${field}:`, filterPayload);

            const response = await complainService.searchFilterOptions(field, "", filterPayload);

            if (response.success && response.data) {
                setFilterOptionsData(prev => ({
                    ...prev,
                    [field]: response.data || []
                }));
            }
        } catch (error: any) {
            console.error(`Error loading complain filter options for ${field}:`, error);
            toast.error(`Failed to load filter options for ${field}`);
        } finally {
            setLoadingFilterOptions(false);
        }
    };

    // Handle filter field selection
    const handleFilterFieldSelect = useCallback(async (field: string | null) => {
        console.log("Complain handleFilterFieldSelect called with:", field);
        setSelectedFilterField(field);

        if (field && !filterOptionsData[field]) {
            try {
                await loadFilterOptions(field);
            } catch (error) {
                console.error("Error loading complain filter options:", error);
                toast.error(`Failed to load options for ${field}`);
            }
        }

        return Promise.resolve();
    }, [filterOptionsData, currentFilterState, loadFilterOptions]);

    // Handle filter changes
    const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
        console.log("Complain Filters changed to:", newFilters);
        setCurrentFilterState((prev: any) => ({
            ...prev,
            filters: newFilters,
            page: 1,
        }));
    }, []);

    // Effect to load complains when filters change
    useEffect(() => {
        if (!selectedCompany?._id) return;

        const isSame = JSON.stringify(appliedFilterState) === JSON.stringify(currentFilterState);
        if (!isSame) {
            console.log("🔄 Complain Filter state changed, loading complains...");

            const timer = setTimeout(() => {
                loadComplains();
                setAppliedFilterState({ ...currentFilterState }); // Shallow copy to avoid reference issues
            }, 300); // Add small delay for better UX

            return () => clearTimeout(timer);
        }
    }, [currentFilterState, appliedFilterState, loadComplains, selectedCompany]);

    // Effect for initial load
    useEffect(() => {
        if (user && !isInitialLoad && selectedCompany?._id) {
            console.log("🚀 Initial load started for complains");
            loadComplains();
        }
    }, []); // Empty deps: Run only once on mount (user/selectedCompany assumed stable after mount)

    // Handle add new complain
    const handleAddNewOrder = () => {
        setEditData(null);
        setOpen(true);
    };

    // Handle edit
    const handleEdit = (id: string) => {
        const complaint = complains.find((c) => c?._id === id);
        if (complaint) {
            setEditData(complaint);
            setOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this complaint? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteComplainThunk(id)).unwrap();
                toast.success('Complaint deleted successfully');
                loadComplains();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The complaint has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                toast.error(
                    'Error deleting complaint: ' +
                    (error instanceof Error ? error.message : 'Unknown error')
                );
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to delete the complaint.',
                    icon: 'error',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        }
    };

    const handleView = (id: string) => {
        const complaint = complains.find((c) => c?._id === id);
        if (complaint) {
            setViewData(complaint);
            setViewOpen(true);
        }
    };

    // Handle view files
    const handleViewFiles = useCallback((complaintId: string) => {
        const complaint = complains.find((c) => c?._id === complaintId);
        if (complaint) {
            setSelectedFiles(complaint.filePaths || []);
            setSelectedComplaintSubject(complaint.subject);
            setFilesDialogOpen(true);
        }
    }, [complains]);

    // Handle close files dialog
    const handleCloseFilesDialog = () => {
        setFilesDialogOpen(false);
        setSelectedFiles([]);
        setSelectedComplaintSubject('');
    };

    // Format rows for table
    const formattedRows = useMemo(() => {
        if (!complains || !Array.isArray(complains) || !selectedCompany?._id) return [];

        return complains
            .filter(complaint => {
                const companyId = complaint?.company?._id;
                return companyId === selectedCompany._id;
            })
            .map((complaint, index) => ({
                _id: complaint?._id || `temp-${index}`,
                id: complaint?._id || `temp-${index}`,
                orderNo: complaint?.qporder?.orderNo 
                    ? `QP-${complaint.qporder.orderNo}` 
                    : complaint?.scorder?.orderNumber || 'N/A',
                partyName: complaint?.party?.partyName || 'N/A',
                subject: complaint?.subject || 'N/A',
                status: complaint?.status || 'N/A',
                createdBy: `${complaint?.createdBy?.firstName || ''} ${complaint?.createdBy?.lastName || ''}`.trim() || 'N/A',
                filePaths: complaint?.filePaths || [],
                createdAt: complaint?.createdAt || new Date().toISOString(),
                companyName: complaint?.company?.companyName || 'N/A',
                // Add raw values for filtering
                party: complaint?.party?.partyName || 'N/A',
                srNo: index + 1,
            }));
    }, [complains, selectedCompany]);

    // Render row function
                const renderRow = useCallback((row: any, index: number) => (
                    <>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.orderNo}</TableCell>
                        <TableCell>{row.partyName}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>{row.createdBy}</TableCell>
                        <TableCell>
                            {/* Files Button */}
                            {row.filePaths && row.filePaths.length > 0 ? (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AttachFile />}
                                    onClick={() => handleViewFiles(row.id)}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.75rem',
                                        py: 0.5,
                                    }}
                                >
                                    View Files ({row.filePaths.length})
                                </Button>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No Files
                                </Typography>
                            )}
                        </TableCell>
                        <TableCell>
                            <IconButton onClick={() => handleView(row.id)} color="info">
                                <Visibility />
                            </IconButton>
                            {canEdit && (
                                <IconButton onClick={() => handleEdit(row.id)} color="primary">
                                    <Edit />
                                </IconButton>
                            )}
                            {canDelete && (
                                <IconButton onClick={() => handleDelete(row.id)} color="error">
                                    <Delete />
                                </IconButton>
                            )}
                        </TableCell>
                    </>
    ), [canEdit, canDelete, handleViewFiles, handleView, handleEdit, handleDelete]);

    // Excel headers for export
    const excelHeaders = useMemo(() => [
        "Sr No",
        "Order No",
        "Party Name",
        "Subject",
        "Status",
        "Created By",
        "Files Count",
        "Created Date",
    ], []);

    // Excel data for export
    const excelData = useMemo(() => {
        return formattedRows.map((row, index) => ({
            "Sr No": index + 1,
            "Order No": row.orderNo,
            "Party Name": row.partyName,
            "Subject": row.subject,
            "Status": row.status,
            "Created By": row.createdBy,
            "Files Count": row.filePaths?.length || 0,
            "Created Date": row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }) : 'N/A',
        }));
    }, [formattedRows]);

    // Show loading while initial data is being loaded
    if ((loading || isLoadingData) && !isInitialLoad && complains.length === 0) {
        return <div>Loading Complains...</div>;
    }

    // Show error if company is not available
    if (!selectedCompany?._id) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px'
            }}>
                <Typography color="error">
                    Company information is not available. Please try again.
                </Typography>
            </div>
        );
    }

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'right',
                    justifyContent: 'right',
                    gap: 2,
                    mb: 2,
                }}
            >
                {canCreate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button 
                            variant="contained" 
                            onClick={handleAddNewOrder}
                            sx={{
                                backgroundColor: '#7F56D9',
                                '&:hover': {
                                    backgroundColor: '#6941C6',
                                },
                            }}
                        >
                            + Add New Complain
                        </Button>
                    </Box>
                )}
            </Box>

            <CustomTable2
                showDatePicker={true}
                tableHeader={columns}
                showFillter={true}
                showSearch={true}
                title={`Complains - ${selectedCompany.companyName}`}
                showExcelDownload={false}
                excelHeaders={excelHeaders}
                excelData={excelData}
                rowData={formattedRows}
                setCurrentFilterState={setCurrentFilterState}
                currentFilterState={currentFilterState}
                renderRow={renderRow}
                totalRows={totalCount || formattedRows.length}
                onFilterFieldSelect={handleFilterFieldSelect}
                selectedFilterField={selectedFilterField}
                filterOptionsData={filterOptionsData}
                loadingFilterOptions={loadingFilterOptions}
                onFiltersChange={handleFiltersChange}
            />

            {/* Dialogs */}
            {open && selectedCompany && (
                <ComplainDialogue
                    company={selectedCompany}
                    open={open}
                    onClose={() => {
                        setOpen(false);
                        loadComplains();
                    }}
                    refreshData={loadComplains}
                    editData={editData}
                />
            )}
            {viewOpen && (
                <ComplainViewDialogue
                    open={viewOpen}
                    onClose={() => {
                        setViewOpen(false);
                        setViewData(null);
                    }}
                    complaint={viewData}
                />
            )}

            {/* View Files Dialog */}
            <ViewFilesDialog
                open={filesDialogOpen}
                onClose={handleCloseFilesDialog}
                files={selectedFiles}
                title={`Files - ${selectedComplaintSubject}`}
                showDownload={true}
                showView={true}
                downloadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/filedownload/download`}
            />
        </>
    );
};

export default ComplainPage;