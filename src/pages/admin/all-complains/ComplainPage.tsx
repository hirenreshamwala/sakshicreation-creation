"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    Box,
    TableCell,
    IconButton,
    Typography,
    Button,
    CircularProgress,
} from "@mui/material";
import { Delete, Edit, Visibility, AttachFile, Download as DownloadIcon } from '@mui/icons-material';
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
import { reportService } from "@/services/reportService";
import { complainService } from "@/services/complain.service";

import moment from 'moment';

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
    const [exporting, setExporting] = useState(false);

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
        return foundCompany || { _id: "default", companyName };
    }, [company, companies]);

    const defaultFilter = {
        page: 1,
        pageSize: 10,
        search: "",
        filters: {},
        includeCounts: true,
        isPagination: true,
        startDate: null,
        endDate: null,
    }
    const [currentFilterState, setCurrentFilterState] = useState<any>(defaultFilter);

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

    const companyNames = useMemo(() => {
        return [...new Set(companies.map(c => c.companyName))].sort();
    }, [companies]);

    const loadComplains = useCallback(async () => {
        if (isLoadingRef.current) return;
        if (!selectedCompany?._id) return;

        setIsLoadingData(true);
        isLoadingRef.current = true;

        try {
            const params = {
                ...currentFilterState,
                filters: {
                    ...currentFilterState.filters,
                    company: [selectedCompany.companyName],
                },
                isPagination: true,
                includeCounts: true
            };

            if (canViewGlobal) {
                await dispatch(getAllComplainsThunk(params));
            } else if (canViewOwn && user?.id) {
                await dispatch(getComplainsByStaffThunk({ staffId: user.id, filters: params }));
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
                company: [selectedCompany.companyName],
            };

            const response = await complainService.searchFilterOptions(field, "", filterPayload);

            if (response.success && response.data) {
                setFilterOptionsData(prev => ({
                    ...prev,
                    [field]: response.data || []
                }));
            }
        } catch (error: any) {
            toast.error(`Failed to load filter options for ${field}`);
        } finally {
            setLoadingFilterOptions(false);
        }
    };

    const handleFilterFieldSelect = useCallback(async (field: string | null) => {
        setSelectedFilterField(field);
        if (field && !filterOptionsData[field]) {
            await loadFilterOptions(field);
        }
        return Promise.resolve();
    }, [filterOptionsData, loadFilterOptions]);

    const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
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
            loadComplains();
        }
    }, [selectedCompany]); // company change થાય તો reload

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
            text: 'Do you want to delete this complaint?',
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

    const formattedRows = useMemo(() => {
        if (!complains || !Array.isArray(complains)) return [];

        return complains.map((complaint, index) => ({
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
            party: complaint?.party?.partyName || 'N/A',
            srNo: index + 1,
        }));
    }, [complains]);

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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                </Box>
            </TableCell>
        </>
    ), [canEdit, canDelete, handleViewFiles, handleView, handleEdit, handleDelete]);

    // Export to Excel with all current filters
    const handleExportToExcel = async () => {
        setExporting(true);
        try {
            // Prepare payload with ALL current filters
            const payload: any = {
                filters: currentFilterState.filters || {},
                search: currentFilterState.search || "",
                pageSize: -1, // Export all records
            };

            // Add date filters if available
            if (currentFilterState.startDate) payload.startDate = currentFilterState.startDate;
            if (currentFilterState.endDate) payload.endDate = currentFilterState.endDate;

            // Always export current company only
            payload.companyNames = [selectedCompany.companyName];

            // For staff view, add staffId
            if (canViewOwn && !canViewGlobal && user?.id) {
                payload.staffId = user.id;
            }

            console.log('Export payload:', payload); // Debug

            const blob = await reportService.exportComplainToExcel(payload);

            const fileName = `Complains_${selectedCompany.companyName.replace(/ /g, '_')}_${payload.startDate ? moment(payload.startDate).format('DDMMYYYY') + '_to_' + moment(payload.endDate).format('DDMMYYYY') : 'All_Time'}_${moment().format('DDMMYYYY_HHmm')}.xlsx`;

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Excel file downloaded successfully');
        } catch (error: any) {
            console.error('Export error:', error);
            toast.error(error.message || 'Failed to export Excel file');
        } finally {
            setExporting(false);
        }
    };

    if ((loading || isLoadingData) && !isInitialLoad && complains.length === 0) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }

    if (!selectedCompany?._id) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Typography color="error">Company information is not available.</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {canCreate && (
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
                )}

                <IconButton
                    onClick={handleExportToExcel}
                    disabled={loading || exporting}
                // sx={{
                //     border: "1px solid #D0D5DD",
                //     borderRadius: 2,
                //     p: 1.5,
                //     color: "#667085",
                //     bgcolor: exporting ? '#f0f0f0' : 'transparent',
                //     '&:hover': {
                //     bgcolor: '#f5f5f5',
                //     borderColor: '#b0b0b0',
                //     },
                //     '&.Mui-disabled': {
                //     borderColor: '#e0e0e0',
                //     color: '#aaa',
                //     },
                // }}
                >
                    {exporting ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20"
                            width="20"
                            viewBox="0 0 384 512"
                            fill="#667085"
                        >
                            <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c0-13.3 10.7-24 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373s-16.9 32.5-36.6 68.8c-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 33.6 62.3 36.6 68.5 3-6.2 9.7-19.9 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z" />
                        </svg>
                    )}
                </IconButton>
            </Box>

            <CustomTable2
                showDatePicker={true}
                tableHeader={columns}
                showFillter={true}
                showSearch={true}
                title={`Complains - ${selectedCompany.companyName}`}
                showExcelDownload={false}
                rowData={formattedRows}
                setCurrentFilterState={setCurrentFilterState}
                currentFilterState={currentFilterState}
                defaultFilter={defaultFilter}
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