// "use client";

// import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
// import {
//   Box,
//   Typography,
//   TableCell,
//   IconButton,
//   InputBase,
//   Tooltip,
//   Avatar,
// } from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete";
// import { FiSearch } from "react-icons/fi";
// import { useRouter } from "next/router";
// import { useAppDispatch, useAppSelector } from "@/store";
// import ThemeButton from "@/component/common_component/themebutton";
// import ThemeChip from "@/component/common_component/themechip";
// import FilterDropdown from "@/component/fillter";
// import DateRangePicker from "@/component/daterangepicker";
// import AssignLeadDialog from "@/component/AssignLeadDialog";
// import Swal from "sweetalert2";
// import Loader from "@/component/common_component/loader";
// import { authService } from "@/services/auth.service";
// import { toast } from "react-toastify";
// import TabComponent from "@/component/Dialog/TabComponent";
// import { getCompanyWisePermission } from "@/utills/utills";
// import { StaticCompanyOptions } from "@/constants";
// import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
// import { leadService } from "@/services/lead.service";
// import CustomTable2 from "@/component/common_component/Table/CustomTable/CustomTable2";

// interface Lead {
//   _id: string;
//   companyName: {
//     _id: string;
//     companyName?: string;
//     avatar?: string;
//   };
//   partyName: {
//     _id: string;
//     partyName: string;
//     ownerName?: string;
//     ownerMobileNo?: string;
//     ownerWhatsAppNo?: string;
//     contactPerson?: string;
//     personMobileNo?: string;
//     personWhatsAppNo?: string;
//     contactForPayment?: string;
//     contactMobileNo?: string;
//     contactWhatsAppNo?: string;
//     GSTNo?: string;
//     partyTag?: string;
//     address?: {
//       unitNo: string;
//       marketName: string;
//       landMark: string;
//       area: string;
//       pincode: string;
//     };
//     createdAt?: string;
//     updatedAt?: string;
//     createdBy?: {
//       _id: string;
//       firstName?: string;
//       lastName?: string;
//     };
//   };
//   reason: string;
//   customReason?: string;
//   assignedTo: {
//     _id: string;
//     firstName?: string;
//     lastName?: string;
//     email?: string;
//   };
//   status: string;
//   rescheduleDate?: string;
//   isRescheduledCall?: boolean;
//   originalLeadId?: {
//     _id: string;
//     date: string;
//     createdAt: string;
//   };
//   callFeedback: string;
//   date: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface DatePaginationState {
//   [date: string]: {
//     currentPage: number;
//     itemsPerPage: number;
//     totalItems: number;
//     loading: boolean;
//     data: Lead[];
//   };
// }

// const columns = [
//   { id: "company", label: "Company" },
//   { id: "createdAt", label: "Created Date" },
//   { id: "party", label: "Party" },
//   { id: "reason", label: "Reason to Call" },
//   { id: "mobile", label: "Mobile No." },
//   { id: "address", label: "Unit No" },
//   { id: "market", label: "Market Name" },
//   { id: "area", label: "Area" },
//   { id: "statusofparty", label: "Status of Party" },
//   { id: "status", label: "Status" },
//   { id: "createdBy", label: "Created By" },
//   { id: "assignedTo", label: "Assigned To" },
//   { id: "actions", label: "Actions" },
// ];

// const tabLabels = ["Pending", "History"];

// const LeadManagementPage: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const {
//     leads = [],
//     loading = false,
//     error = null,
//     successMessage = null,
//   } = useAppSelector((state) => state.leads || {});
//   const { user } = useAppSelector((state) => state.auth || {});
//   const { companies } = useAppSelector((state) => state.company);

//   const [tab, setTab] = useState(0);
//   const [comapanyTab, setCompanyTab] = useState(0);
//   const [openAssignDialog, setOpenAssignDialog] = useState(false);
//   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
//   const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
//   const router = useRouter();
//   const todayRef = useRef<HTMLDivElement>(null);
//   const [filterOptions, setFilterOptions] = useState<string[]>([]);
//   const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
//   // Pagination state
//   const [availableDates, setAvailableDates] = useState<{ date: string, count: number }[]>([]);
//   const [datePagination, setDatePagination] = useState<DatePaginationState>({});
//   const [loadingDates, setLoadingDates] = useState(true);

//   const ITEMS_PER_PAGE = 10;

//   const canViewGlobal = user?.role?.permissions?.party_call?.view_global;
//   const canViewOwn = user?.role?.permissions?.party_call?.view_own;
//   const canDelete = user?.role?.permissions?.party_call?.delete;
//   const cancreate = user?.role?.permissions?.party_call?.create;
//   const canEdit = user?.role?.permissions?.party_call?.edit;

//   // Company permissions
//   const hasSakshi = !!getCompanyWisePermission(5);
//   const hasQP = !!getCompanyWisePermission(6);
//   const hasBothCompanies = getCompanyWisePermission(0);
//   const { staffId: si, startDate: st, endDate: e, status: s, reason: r, c, companyName } = router.query;


//   const isToday = (dateString: string): boolean => {
//     const today = new Date();
//     const [day, month, year] = dateString?.split("/");
//     const compareDate = new Date(`${year}-${month}-${day}`);
//     return (
//       compareDate.getDate() === today.getDate() &&
//       compareDate.getMonth() === today.getMonth() &&
//       compareDate.getFullYear() === today.getFullYear()
//     );
//   };

//   useEffect(() => {
//     if (error) toast.error(error);
//   }, [error, dispatch]);

//   useEffect(() => {
//     if (!companies.length) dispatch(getAllCompaniesThunk(true));
//   }, []);

//   useEffect(() => {
//     if (c) setCompanyTab(c === "Quality Packaging" || c === "QP" ? 1 : 0);
//     if (st) setStartDate(new Date(st as string));
//     if (e) setEndDate(new Date(e as string));
//     if (s) {
//       const statuses = (s as string)?.split(",");
//       setTab(
//         statuses.some((status) => ["completed", "cancelled"].includes(status))
//           ? 1
//           : 0
//       );
//     }
//   }, [st, e, s, c]);

//   const fetchLeadsForDate = useCallback(async (date: string, page: number, itemsPerPage: number) => {
//     setDatePagination(prev => ({
//       ...prev,
//       [date]: {
//         ...prev[date],
//         loading: true,
//       }
//     }));

//     try {
//       const response = await leadService.getAllLeads({
//         companyName,
//         staffId: si,
//         startDate: st,
//         endDate: e,
//         status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
//         reason: r,
//         date,
//         page: page,
//         limit: 10,
//       });

//       if (response.success) {
//         setDatePagination(prev => ({
//           ...prev,
//           [date]: {
//             ...prev[date],
//             data: response.data || [],
//             // totalItems: response.pagination?.total || 0,
//             loading: false,
//           }
//         }));
//       }
//     } catch (error) {
//       console.error(`Error fetching leads for date ${date}:`, error);
//       toast.error(`Failed to fetch leads for ${date}`);
//       setDatePagination(prev => ({
//         ...prev,
//         [date]: {
//           ...prev[date],
//           loading: false,
//         }
//       }));
//     }
//   }, []);

//   const fetchDates = useCallback(async () => {
//     setLoadingDates(true);
//     try {
//       // Fixed: Directly use the response from leadService
//       const res = await leadService.getAllLeads({
//         companyName,
//         staffId: si,
//         startDate: st,
//         endDate: e,
//         status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
//         reason: r,
//         getDatesOnly: true,
//       });

//       const response = res.res.data
//       if (response.success) {
//         setAvailableDates(response.dates || []);

//         // Initialize pagination state for each date
//         const newPagination: DatePaginationState = {};
//         response.dates.forEach((dateInfo: { date: string, count: number }) => {
//           newPagination[dateInfo.date] = {
//             currentPage: 1,
//             itemsPerPage: ITEMS_PER_PAGE,
//             totalItems: dateInfo.count,
//             loading: false,
//             data: [],
//           };
//         });
//         setDatePagination(newPagination);

//         // Fetch first page of data for each date
//         response.dates.forEach((dateInfo: { date: string }) => {
//           fetchLeadsForDate(dateInfo.date, 1, ITEMS_PER_PAGE);
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching dates:', error);
//       toast.error('Failed to fetch lead dates');
//     } finally {
//       setLoadingDates(false);
//     }
//   }, []);

//   // Update useEffect to use the memoized fetchDates
//   useEffect(() => {
//     if (canViewGlobal && router.isReady) fetchDates();
//   }, [fetchDates, canViewGlobal, router.isReady]);

//   // Handle page change for a specific date
//   const handlePageChange = (date: any, page: any) => {
//     const pagination = datePagination[date];
//     if (pagination) {
//       fetchLeadsForDate(date, page, pagination.itemsPerPage);
//       setDatePagination(prev => ({
//         ...prev,
//         [date]: {
//           ...prev[date],
//           currentPage: page,
//         }
//       }));
//     }
//   };

//   // Auto-scroll to today's section
//   useEffect(() => {
//     if (todayRef.current) todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
//   }, [availableDates]);

//   useEffect(() => {
//     const token = authService.getToken();
//     if (!token) {
//       router.push("/login");
//       return;
//     }

//     if (canViewOwn && user?.id) leadService.getLeadsByStaffId(user?.id);

//   }, [dispatch, router, canViewOwn, user?.id]);

//   useEffect(() => {
//     if (error) {
//       Swal.fire({
//         title: "Error!",
//         text: error,
//         icon: "error",
//         confirmButtonText: "OK",
//         confirmButtonColor: "#7F56D9",
//       });

//     }
//     if (successMessage) {
//       Swal.fire({
//         title: "Success!",
//         text: successMessage,
//         icon: "success",
//         confirmButtonText: "OK",
//         confirmButtonColor: "#7F56D9",
//       });

//     }
//   }, [error, successMessage, dispatch]);

//   // Map filter labels to rowData keys
//   const filterFieldToKey: { [key: string]: string } = {
//     Company: "companyName.companyName",
//     "Created Date": "createdAt",
//     Party: "partyName.partyName",
//     "Reason to Call": "reason",
//     "Mobile No.": "partyName.ownerWhatsAppNo",
//     "Unit No": "partyName.address.unitNo",
//     "Market Name": "partyName.address.marketName.marketName",
//     Area: "partyName.address.area.area",
//     "Status of Party": "partyName.partyTag",
//     Status: "status",
//     "Created By": "partyName.createdBy",
//     "Assigned To": "assignedTo",
//   };

//   // Compute unique values for the selected filter field
//   const uniqueValues = useMemo(() => {
//     if (!selectedFilterField) return [];
//     const key = filterFieldToKey[selectedFilterField];
//     if (!key) return [];

//     return [];
//   }, [selectedFilterField]);

//   const handleClick = (id: string) => router.push(`/admin/party-call/view-lead/${id}`);

//   const handleUpdateClick = (lead: Lead) => {
//     setSelectedLead(lead);
//     setOpenAssignDialog(true);
//   };

//   const handleDeleteClick = async (id: string) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "You won't be to revert this!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#7F56D9",
//       cancelButtonColor: "#d33",
//       confirmButtonText: "Yes, delete it!",
//     });

//     if (result.isConfirmed) {
//       try {
//         await leadService.deleteLead(id);
//         Swal.fire({
//           title: "Deleted!",
//           text: "The lead has been deleted.",
//           icon: "success",
//           confirmButtonColor: "#7F56D9",
//         });

//         // Refresh the dates and pagination
//         const datesResponse = await leadService.getAllLeads({
//           companyName,
//           staffId: si,
//           startDate: st,
//           endDate: e,
//           status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
//           reason: r,
//           getDatesOnly: true,
//         });

//         if (datesResponse.success) {
//           setAvailableDates(datesResponse.dates || []);

//           // Update pagination state for each date
//           const newPagination: DatePaginationState = {};
//           datesResponse.dates.forEach((dateInfo: { date: string; count: number }) => {
//             const existing = datePagination[dateInfo.date];
//             newPagination[dateInfo.date] = {
//               currentPage: existing ? existing.currentPage : 1,
//               itemsPerPage: existing ? existing.itemsPerPage : ITEMS_PER_PAGE,
//               totalItems: dateInfo.count,
//               data: [],
//               loading: false,
//             };
//           });
//           setDatePagination(newPagination);

//           // Fetch first page of data for each date
//           datesResponse.dates.forEach((dateInfo: { date: string }) => {
//             fetchLeadsForDate(dateInfo.date, 1, newPagination[dateInfo.date].itemsPerPage);
//           });
//         }
//       } catch (err: any) {
//         Swal.fire({
//           title: "Error!",
//           text: err.message || "Failed to delete lead",
//           icon: "error",
//           confirmButtonColor: "#7F56D9",
//         });
//       }
//     }
//   };

//   useEffect(() => {
//     const fetchFilterOptions = async () => {
//       if (!selectedFilterField) {
//         setFilterOptions([]);
//         return;
//       }

//       setLoadingFilterOptions(true);
//       try {
//         // Map the field name to the API parameter
//         const fieldMap: Record<string, string> = {
//           'created date': 'createdAt',
//           'party': 'partyName',
//           'Mobile No': 'mobile',
//           'Reason to Call': 'reason',
//           'Unit No': 'unitNo',
//           'market': 'marketName',
//           'area': 'area',
//           'party status': 'partyTag',
//           'assign to': 'assignedTo',
//           'Created By': 'createdBy'
//         };

//         const apiField = fieldMap[selectedFilterField] || selectedFilterField;

//         // Call the API to get filter options
//         const response = await leadService.searchFilterOptions(apiField, "", filters);

//         if (response.success) {
//           setFilterOptions(response.data || []);
//         } else {
//           toast.error(response.message || "Failed to load filter options");
//           setFilterOptions([]);
//         }
//       } catch (error: any) {
//         console.error("Error fetching filter options:", error);
//         toast.error(error.message || "Failed to load filter options");
//         setFilterOptions([]);
//       } finally {
//         setLoadingFilterOptions(false);
//       }
//     };

//     fetchFilterOptions();
//   }, [selectedFilterField, filters]);

//   const handleAssignSuccess = () => {
//     setOpenAssignDialog(false);
//     Swal.fire({
//       title: "Success!",
//       text: selectedLead?._id
//         ? "Lead updated successfully!"
//         : "Lead assigned successfully!",
//       icon: "success",
//       confirmButtonColor: "#7F56D9",
//     }).then(() => {
//       // Refresh the dates and pagination
//       const refreshData = async () => {
//         const datesResponse = await leadService.getAllLeads({
//           companyName,
//           staffId: si,
//           startDate: st,
//           endDate: e,
//           status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
//           reason: r,
//           getDatesOnly: true,
//         });

//         if (datesResponse.success) {
//           setAvailableDates(datesResponse.dates || []);

//           // Update pagination state for each date
//           const newPagination: DatePaginationState = {};
//           datesResponse.dates.forEach((dateInfo: { date: string; count: number }) => {
//             const existing = datePagination[dateInfo.date];
//             newPagination[dateInfo.date] = {
//               currentPage: existing ? existing.currentPage : 1,
//               itemsPerPage: existing ? existing.itemsPerPage : ITEMS_PER_PAGE,
//               totalItems: dateInfo.count,
//               data: [],
//               loading: false,
//             };
//           });
//           setDatePagination(newPagination);

//           // Fetch first page of data for each date
//           datesResponse.dates.forEach((dateInfo: { date: string }) => {
//             fetchLeadsForDate(dateInfo.date, 1, newPagination[dateInfo.date].itemsPerPage);
//           });
//         }
//       };

//       refreshData();
//     });
//   };

//   const truncateText = (text: string, maxLength: number) => {
//     if (!text) return "N/A";
//     if (text.length <= maxLength) return text;
//     return `${text.substring(0, maxLength)}...`;
//   };

//   const renderRow = (row: Lead) => (
//     <>
//       <TableCell>
//         <Box display="flex" alignItems="center" gap={1}>
//           <Avatar
//             sx={{ width: 32, height: 32 }}
//             src={row.companyName?.avatar}
//             alt={row.companyName?.companyName || "Company"}
//           />
//           <Typography fontWeight={500} sx={{ fontSize: 14 }}>
//             {row.companyName?.companyName || "N/A"}
//             {row.isRescheduledCall && (
//               <Tooltip title={`Rescheduled from ${new Date(row.originalLeadId?.date).toLocaleDateString('en-GB')}`}>
//                 <ThemeChip label="Rescheduled" color="warning" size="small" sx={{ ml: 1, background: "#FFFAEB", color: "#B54708" }} />
//               </Tooltip>
//             )}
//           </Typography>
//         </Box>
//       </TableCell>
//       <TableCell sx={{ fontSize: 14 }}>
//         {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "N/A"}
//       </TableCell>
//       <TableCell
//         sx={{ cursor: "pointer", fontSize: 14 }}
//         onClick={() => handleClick(row._id || "")}
//       >
//         {row.partyName?.partyName || "N/A"}
//       </TableCell>
//       <TableCell sx={{ fontSize: 14 }}>
//         {row.reason === "Other" ? row.customReason || "Other" : row.reason}
//       </TableCell>
//       <TableCell sx={{ fontSize: 14 }}>{row.partyName?.ownerWhatsAppNo || "N/A"}</TableCell>
//       <TableCell sx={{ fontSize: 14 }}>
//         {row.partyName?.address
//           ? truncateText(
//             `${row.partyName.address.unitNo}`,
//             30
//           )
//           : "N/A"}
//       </TableCell>
//       <TableCell sx={{ fontSize: 14 }}>{row.partyName?.address?.marketName?.marketName || "N/A"}</TableCell>
//       <TableCell sx={{ fontSize: 14 }}>{row.partyName?.address?.area?.area || "N/A"}</TableCell>
//       <TableCell sx={{ fontSize: 14 }}>
//         <ThemeChip
//           label={row.partyName?.partyTag || "N/A"}
//           color={row.partyName?.partyTag === "New" ? "primary" : "default"}
//           variant={row.partyName?.partyTag === "New" ? "filled" : "outlined"}
//           sx={{
//             background:
//               row.partyName?.partyTag === "New" ? "#F4EBFF" : "#F4F3FF",
//             color: "#7F56D9",
//             fontWeight: 600,
//             fontSize: 13,
//             px: 1.5,
//             height: 28,
//           }}
//         />
//       </TableCell>
//       <TableCell sx={{ fontSize: 14 }}>
//         <ThemeChip
//           label={row.status.charAt(0).toUpperCase() + row.status.slice(1) || "N/A"}
//           color={
//             row.status === "pending" ? "primary" :
//               row.status === "rescheduled" ? "warning" :
//                 row.status === "completed" ? "success" :
//                   row.status === "cancelled" ? "error" : "default"
//           }
//           variant="filled"
//           sx={{
//             fontWeight: 600,
//             fontSize: 13,
//             px: 1.5,
//             height: 28,
//           }}
//         />
//       </TableCell>

//       <TableCell sx={{ fontSize: 14 }}>
//         {row.partyName?.createdBy
//           ? `${row.partyName.createdBy.firstName} ${row.partyName.createdBy.lastName}`.trim()
//           : "N/A"}
//       </TableCell>
//       <TableCell>
//         {row.assignedTo
//           ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}`.trim()
//           : "N/A"}
//       </TableCell>
//       <TableCell sx={{ display: "flex", fontSize: 14 }}>
//         {canEdit && (
//           <IconButton onClick={() => handleUpdateClick(row)} color="primary">
//             <EditIcon />
//           </IconButton>
//         )}
//         {canDelete && (
//           <IconButton
//             onClick={() => handleDeleteClick(row._id || "")}
//             color="error"
//           >
//             <DeleteIcon />
//           </IconButton>
//         )}
//       </TableCell>
//     </>
//   );

//   return (
//     <>
//       {/* Only show company tabs if user has access to both companies */}
//       {hasBothCompanies && (
//         <TabComponent activeTab={comapanyTab} setActiveTab={setCompanyTab} />
//       )}

//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           mb: 2,
//           gap: 2,
//         }}
//       >
//         <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//           <DateRangePicker
//             startDate={startDate}
//             endDate={endDate}
//             onStartDateChange={(date) => setStartDate(date)}
//             onEndDateChange={(date) => setEndDate(date)}
//           />
//           <ThemeButton
//             onClick={() => {
//               setStartDate(null);
//               setEndDate(null);
//             }}
//           >
//             Clear Date Range
//           </ThemeButton>
//         </Box>

//         <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//           <Box
//             sx={{
//               display: "flex",
//               alignItems: "center",
//               border: "1px solid #D0D5DD",
//               borderRadius: 2,
//               px: 1.5,
//               width: 200,
//               height: 35,
//             }}
//           >
//             <IconButton size="small" sx={{ color: "#98A2B3" }}>
//               <FiSearch size={18} />
//             </IconButton>
//             <InputBase
//               placeholder="Search..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               sx={{ ml: 1, fontSize: 14 }}
//             />
//           </Box>
//           <FilterDropdown
//             filterOptions={['created date', 'party', 'Mobile No', 'Reason to Call', 'Unit No', 'market', 'area', 'party status', 'assign to', 'Created By']}
//             uniqueValues={filterOptions} // Now using the fetched options
//             loading={loadingFilterOptions} // Pass loading state
//             onFiltersChange={setFilters}
//             filters={filters}
//             selectedField={selectedFilterField}
//             onFieldSelect={setSelectedFilterField}
//           />
//           {cancreate && (
//             <ThemeButton
//               onClick={() => {
//                 setSelectedLead(null);
//                 setOpenAssignDialog(true);
//               }}
//             >
//               + Assign New Party Call
//             </ThemeButton>
//           )}
//         </Box>
//       </Box>

//       <TabComponent activeTab={tab} setActiveTab={setTab} tabList={tabLabels} align="left" />
//       <Box
//         sx={{
//           maxHeight: "110vh",
//           overflowY: "auto",
//           px: 2,
//           py: 2,
//           "&::-webkit-scrollbar": {
//             width: "8px",
//           },
//           "&::-webkit-scrollbar-track": {
//             background: "#f1f1f1",
//           },
//           "&::-webkit-scrollbar-thumb": {
//             background: "#888",
//             borderRadius: "4px",
//           },
//           "&::-webkit-scrollbar-thumb:hover": {
//             background: "#555",
//           },
//         }}
//       >
//         {loadingDates ? (
//           <Loader />
//         ) : (
//           availableDates.map((dateInfo) => {
//             const { date, count } = dateInfo;
//             const pagination = datePagination[date] || {
//               currentPage: 1,
//               itemsPerPage: ITEMS_PER_PAGE,
//               totalItems: count,
//               loading: true,
//               data: [],
//             };

//             const { currentPage, itemsPerPage, loading, data } = pagination;

//             return (
//               <Box
//                 key={date}
//                 ref={isToday(date) ? todayRef : null}
//                 mb={4}
//                 sx={{
//                   backgroundColor: isToday(date) ? "#a0d8b4ff" : "transparent",
//                   borderRadius: 2,
//                   p: 2,
//                   border: isToday(date) ? "1px solid #D1FADF" : "none",
//                 }}
//               >
//                 <Typography variant="subtitle1" fontWeight={600}>
//                   {date}
//                   {isToday(date) && (
//                     <ThemeChip
//                       label="Today"
//                       color="success"
//                       size="small"
//                       sx={{ ml: 1, background: "#3a43beff" }}
//                     />
//                   )}
//                 </Typography>

//                 {loading ? (
//                   <Loader />
//                 ) : (
//                   <>
//                     <CustomTable2
//                       tableHeader={columns}
//                       rowData={data}
//                       showDatePicker={false}
//                       showSearch={false}
//                       showFillter={false}
//                       renderRow={renderRow}
//                       count={count}
//                       page={currentPage}
//                       handlePageChange={handlePageChange}
//                       date={date}
//                     />
//                   </>
//                 )}
//               </Box>
//             );
//           })
//         )}
//       </Box>

//       {openAssignDialog ? (
//         <AssignLeadDialog
//           open={openAssignDialog}
//           onClose={() => {
//             setOpenAssignDialog(false);
//             setSelectedLead(null);
//           }}
//           lead={selectedLead}
//           onSuccess={handleAssignSuccess}
//           company={companies.find((item) => item.companyName === StaticCompanyOptions[comapanyTab])}
//         />
//       ) : null}
//     </>
//   );
// };

// export default LeadManagementPage;
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TableCell,
  IconButton,
  InputBase,
  Tooltip,
  Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FiSearch } from "react-icons/fi";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import FilterDropdown from "@/component/fillter";
import DateRangePicker from "@/component/daterangepicker";
import AssignLeadDialog from "@/component/AssignLeadDialog";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import { authService } from "@/services/auth.service";
import { toast } from "react-toastify";
import TabComponent from "@/component/Dialog/TabComponent";
import { getCompanyWisePermission } from "@/utills/utills";
import { StaticCompanyOptions } from "@/constants";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { leadService } from "@/services/lead.service";
import CustomTable2 from "@/component/common_component/Table/CustomTable/CustomTable2";

interface Lead {
  _id: string;
  companyName: {
    _id: string;
    companyName?: string;
    avatar?: string;
  };
  partyName: {
    _id: string;
    partyName: string;
    ownerName?: string;
    ownerMobileNo?: string;
    ownerWhatsAppNo?: string;
    contactPerson?: string;
    personMobileNo?: string;
    personWhatsAppNo?: string;
    contactForPayment?: string;
    contactMobileNo?: string;
    contactWhatsAppNo?: string;
    GSTNo?: string;
    partyTag?: string;
    address?: {
      unitNo: string;
      marketName: string;
      landMark: string;
      area: string;
      pincode: string;
    };
    createdAt?: string;
    updatedAt?: string;
    createdBy?: {
      _id: string;
      firstName?: string;
      lastName?: string;
    };
  };
  reason: string;
  customReason?: string;
  assignedTo: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  status: string;
  rescheduleDate?: string;
  isRescheduledCall?: boolean;
  originalLeadId?: {
    _id: string;
    date: string;
    createdAt: string;
  };
  callFeedback: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface DatePaginationState {
  [date: string]: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    loading: boolean;
    data: Lead[];
  };
}

const columns = [
  { id: "company", label: "Company" },
  { id: "createdAt", label: "Created Date" },
  { id: "party", label: "Party" },
  { id: "reason", label: "Reason to Call" },
  { id: "mobile", label: "Mobile No." },
  { id: "address", label: "Unit No" },
  { id: "market", label: "Market Name" },
  { id: "area", label: "Area" },
  { id: "statusofparty", label: "Status of Party" },
  { id: "status", label: "Status" },
  { id: "createdBy", label: "Created By" },
  { id: "assignedTo", label: "Assigned To" },
  { id: "actions", label: "Actions" },
];

const tabLabels = ["Pending", "History"];

const LeadManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    leads = [],
    loading = false,
    error = null,
    successMessage = null,
  } = useAppSelector((state) => state.leads || {});
  const { user } = useAppSelector((state) => state.auth || {});
  const { companies } = useAppSelector((state) => state.company);

  const [tab, setTab] = useState(0);
  const [comapanyTab, setCompanyTab] = useState(0);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const router = useRouter();
  const todayRef = useRef<HTMLDivElement>(null);
  const [filterOptions, setFilterOptions] = useState<string[]>([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  // Pagination state
  const [availableDates, setAvailableDates] = useState<{ date: string, count: number }[]>([]);
  const [datePagination, setDatePagination] = useState<DatePaginationState>({});
  const [loadingDates, setLoadingDates] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const canViewGlobal = user?.role?.permissions?.party_call?.view_global;
  const canViewOwn = user?.role?.permissions?.party_call?.view_own;
  const canDelete = user?.role?.permissions?.party_call?.delete;
  const cancreate = user?.role?.permissions?.party_call?.create;
  const canEdit = user?.role?.permissions?.party_call?.edit;

  // Company permissions
  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = getCompanyWisePermission(0);
  const { staffId: si, startDate: st, endDate: e, status: s, reason: r, c, companyName } = router.query;


  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const [day, month, year] = dateString?.split("/");
    const compareDate = new Date(`${year}-${month}-${day}`);
    return (
      compareDate.getDate() === today.getDate() &&
      compareDate.getMonth() === today.getMonth() &&
      compareDate.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, dispatch]);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true));
  }, []);

  useEffect(() => {
    if (c) setCompanyTab(c === "Quality Packaging" || c === "QP" ? 1 : 0);
    if (st) setStartDate(new Date(st as string));
    if (e) setEndDate(new Date(e as string));
    if (s) {
      const statuses = (s as string)?.split(",");
      setTab(
        statuses.some((status) => ["completed", "cancelled"].includes(status))
          ? 1
          : 0
      );
    }
  }, [st, e, s, c]);

  const fetchLeadsForDate = useCallback(async (date: string, page: number, itemsPerPage: number) => {
    setDatePagination(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        loading: true,
      }
    }));

    try {
      const response = await leadService.getAllLeads({
        companyName,
        staffId: si,
        startDate: st,
        endDate: e,
        status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
        reason: r,
        date,
        page: page,
        limit: 10,
        filters,
      });

      if (response.success) {
        setDatePagination(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            data: response.data || [],
            // totalItems: response.pagination?.total || 0,
            loading: false,
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching leads for date ${date}:`, error);
      toast.error(`Failed to fetch leads for ${date}`);
      setDatePagination(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          loading: false,
        }
      }));
    }
  }, []);

  const fetchDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      // Apply all current filters to the dates fetch
      const queryParams: any = {
        companyName,
        staffId: si,
        startDate: st,
        endDate: e,
        status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
        reason: r,
        getDatesOnly: true,
      };

      // Add search query if available
      if (searchQuery) {
        queryParams.search = searchQuery;
      }

      // Add other filters if available
      if (Object.keys(filters).length > 0) {
        // Convert filters to the format expected by backend
        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
            // Map frontend filter keys to backend field names
            const fieldMap: Record<string, string> = {
              'created date': 'createdAt',
              'party': 'partyName',
              'Mobile No': 'mobile',
              'Reason to Call': 'reason',
              'Unit No': 'unitNo',
              'market': 'marketName',
              'area': 'area',
              'party status': 'partyTag',
              'assign to': 'assignedTo',
              'Created By': 'createdBy'
            };

            const backendField = fieldMap[key] || key;
            queryParams[backendField] = filters[key].join(',');
          }
        });
      }

      // Fixed: Directly use the response from leadService
      const res = await leadService.getAllLeads(queryParams);
      const response = res.res.data;

      if (response.success) {
        setAvailableDates(response.dates || []);

        // Initialize pagination state for each date
        const newPagination: DatePaginationState = {};
        response.dates.forEach((dateInfo: { date: string, count: number }) => {
          newPagination[dateInfo.date] = {
            currentPage: 1,
            itemsPerPage: ITEMS_PER_PAGE,
            totalItems: dateInfo.count,
            loading: false,
            data: [],
          };
        });
        setDatePagination(newPagination);

        // Fetch first page of data for each date
        response.dates.forEach((dateInfo: { date: string }) => {
          fetchLeadsForDate(dateInfo.date, 1, ITEMS_PER_PAGE);
        });
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
      toast.error('Failed to fetch lead dates');
    } finally {
      setLoadingDates(false);
    }
  }, [searchQuery, filters, si, st, e, s, r, companyName]);

  // Update useEffect to use the memoized fetchDates
  useEffect(() => {
    if (canViewGlobal && router.isReady) fetchDates();
  }, [fetchDates, canViewGlobal, router.isReady]);

  // Handle page change for a specific date
  const handlePageChange = (date: any, page: any) => {
    const pagination = datePagination[date];
    if (pagination) {
      fetchLeadsForDate(date, page, pagination.itemsPerPage);
      setDatePagination(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          currentPage: page,
        }
      }));
    }
  };

  // Auto-scroll to today's section
  useEffect(() => {
    if (todayRef.current) todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [availableDates]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (canViewOwn && user?.id) leadService.getLeadsByStaffId(user?.id);

  }, [dispatch, router, canViewOwn, user?.id]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        title: "Error!",
        text: error,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#7F56D9",
      });

    }
    if (successMessage) {
      Swal.fire({
        title: "Success!",
        text: successMessage,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#7F56D9",
      });

    }
  }, [error, successMessage, dispatch]);

  // Map filter labels to rowData keys
  const filterFieldToKey: { [key: string]: string } = {
    Company: "companyName.companyName",
    "Created Date": "createdAt",
    Party: "partyName.partyName",
    "Reason to Call": "reason",
    "Mobile No.": "partyName.ownerWhatsAppNo",
    "Unit No": "partyName.address.unitNo",
    "Market Name": "partyName.address.marketName.marketName",
    Area: "partyName.address.area.area",
    "Status of Party": "partyName.partyTag",
    Status: "status",
    "Created By": "partyName.createdBy",
    "Assigned To": "assignedTo",
  };

  // Compute unique values for the selected filter field
  const uniqueValues = useMemo(() => {
    if (!selectedFilterField) return [];
    const key = filterFieldToKey[selectedFilterField];
    if (!key) return [];

    return [];
  }, [selectedFilterField]);

  const handleClick = (id: string) => router.push(`/admin/party-call/view-lead/${id}`);

  const handleUpdateClick = (lead: Lead) => {
    setSelectedLead(lead);
    setOpenAssignDialog(true);
  };

  const handleDeleteClick = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await leadService.deleteLead(id);
        Swal.fire({
          title: "Deleted!",
          text: "The lead has been deleted.",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });

        // Refresh the dates and pagination
        const datesResponse = await leadService.getAllLeads({
          companyName,
          staffId: si,
          startDate: st,
          endDate: e,
          status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
          reason: r,
          getDatesOnly: true,
        });

        if (datesResponse.success) {
          setAvailableDates(datesResponse.dates || []);

          // Update pagination state for each date
          const newPagination: DatePaginationState = {};
          datesResponse.dates.forEach((dateInfo: { date: string; count: number }) => {
            const existing = datePagination[dateInfo.date];
            newPagination[dateInfo.date] = {
              currentPage: existing ? existing.currentPage : 1,
              itemsPerPage: existing ? existing.itemsPerPage : ITEMS_PER_PAGE,
              totalItems: dateInfo.count,
              data: [],
              loading: false,
            };
          });
          setDatePagination(newPagination);

          // Fetch first page of data for each date
          datesResponse.dates.forEach((dateInfo: { date: string }) => {
            fetchLeadsForDate(dateInfo.date, 1, newPagination[dateInfo.date].itemsPerPage);
          });
        }
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete lead",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!selectedFilterField) {
        setFilterOptions([]);
        return;
      }

      setLoadingFilterOptions(true);
      try {
        // Map the field name to the API parameter
        const fieldMap: Record<string, string> = {
          'created date': 'createdAt',
          'party': 'partyName',
          'Mobile No': 'mobile',
          'Reason to Call': 'reason',
          'Unit No': 'unitNo',
          'market': 'marketName',
          'area': 'area',
          'party status': 'partyTag',
          'assign to': 'assignedTo',
          'Created By': 'createdBy'
        };

        const apiField = fieldMap[selectedFilterField] || selectedFilterField;

        // Call the API to get filter options
        const response = await leadService.searchFilterOptions(apiField, "", filters);

        if (response.success) {
          setFilterOptions(response.data || []);
        } else {
          toast.error(response.message || "Failed to load filter options");
          setFilterOptions([]);
        }
      } catch (error: any) {
        console.error("Error fetching filter options:", error);
        toast.error(error.message || "Failed to load filter options");
        setFilterOptions([]);
      } finally {
        setLoadingFilterOptions(false);
      }
    };

    fetchFilterOptions();
  }, [selectedFilterField, filters]);

  const handleAssignSuccess = () => {
    setOpenAssignDialog(false);
    Swal.fire({
      title: "Success!",
      text: selectedLead?._id
        ? "Lead updated successfully!"
        : "Lead assigned successfully!",
      icon: "success",
      confirmButtonColor: "#7F56D9",
    }).then(() => {
      // Refresh the dates and pagination
      const refreshData = async () => {
        const datesResponse = await leadService.getAllLeads({
          companyName,
          staffId: si,
          startDate: st,
          endDate: e,
          status: s?.toString()?.split(",").map((x) => x.toLowerCase()),
          reason: r,
          getDatesOnly: true,
        });

        if (datesResponse.success) {
          setAvailableDates(datesResponse.dates || []);

          // Update pagination state for each date
          const newPagination: DatePaginationState = {};
          datesResponse.dates.forEach((dateInfo: { date: string; count: number }) => {
            const existing = datePagination[dateInfo.date];
            newPagination[dateInfo.date] = {
              currentPage: existing ? existing.currentPage : 1,
              itemsPerPage: existing ? existing.itemsPerPage : ITEMS_PER_PAGE,
              totalItems: dateInfo.count,
              data: [],
              loading: false,
            };
          });
          setDatePagination(newPagination);

          // Fetch first page of data for each date
          datesResponse.dates.forEach((dateInfo: { date: string }) => {
            fetchLeadsForDate(dateInfo.date, 1, newPagination[dateInfo.date].itemsPerPage);
          });
        }
      };

      refreshData();
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderRow = (row: Lead) => (
    <>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={row.companyName?.avatar}
            alt={row.companyName?.companyName || "Company"}
          />
          <Typography fontWeight={500} sx={{ fontSize: 14 }}>
            {row.companyName?.companyName || "N/A"}
            {row.isRescheduledCall && (
              <Tooltip title={`Rescheduled from ${new Date(row.originalLeadId?.date).toLocaleDateString('en-GB')}`}>
                <ThemeChip label="Rescheduled" color="warning" size="small" sx={{ ml: 1, background: "#FFFAEB", color: "#B54708" }} />
              </Tooltip>
            )}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "N/A"}
      </TableCell>
      <TableCell
        sx={{ cursor: "pointer", fontSize: 14 }}
        onClick={() => handleClick(row._id || "")}
      >
        {row.partyName?.partyName || "N/A"}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {row.reason === "Other" ? row.customReason || "Other" : row.reason}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.ownerWhatsAppNo || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {row.partyName?.address
          ? truncateText(
            `${row.partyName.address.unitNo}`,
            30
          )
          : "N/A"}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.address?.marketName?.marketName || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.address?.area?.area || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <ThemeChip
          label={row.partyName?.partyTag || "N/A"}
          color={row.partyName?.partyTag === "New" ? "primary" : "default"}
          variant={row.partyName?.partyTag === "New" ? "filled" : "outlined"}
          sx={{
            background:
              row.partyName?.partyTag === "New" ? "#F4EBFF" : "#F4F3FF",
            color: "#7F56D9",
            fontWeight: 600,
            fontSize: 13,
            px: 1.5,
            height: 28,
          }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <ThemeChip
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1) || "N/A"}
          color={
            row.status === "pending" ? "primary" :
              row.status === "rescheduled" ? "warning" :
                row.status === "completed" ? "success" :
                  row.status === "cancelled" ? "error" : "default"
          }
          variant="filled"
          sx={{
            fontWeight: 600,
            fontSize: 13,
            px: 1.5,
            height: 28,
          }}
        />
      </TableCell>

      <TableCell sx={{ fontSize: 14 }}>
        {row.partyName?.createdBy
          ? `${row.partyName.createdBy.firstName} ${row.partyName.createdBy.lastName}`.trim()
          : "N/A"}
      </TableCell>
      <TableCell>
        {row.assignedTo
          ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}`.trim()
          : "N/A"}
      </TableCell>
      <TableCell sx={{ display: "flex", fontSize: 14 }}>
        {canEdit && (
          <IconButton onClick={() => handleUpdateClick(row)} color="primary">
            <EditIcon />
          </IconButton>
        )}
        {canDelete && (
          <IconButton
            onClick={() => handleDeleteClick(row._id || "")}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </TableCell>
    </>
  );

  return (
    <>
      {/* Only show company tabs if user has access to both companies */}
      {hasBothCompanies && (
        <TabComponent activeTab={comapanyTab} setActiveTab={setCompanyTab} />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => setStartDate(date)}
            onEndDateChange={(date) => setEndDate(date)}
          />
          <ThemeButton
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            Clear Date Range
          </ThemeButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              px: 1.5,
              width: 200,
              height: 35,
            }}
          >
            <IconButton size="small" sx={{ color: "#98A2B3" }}>
              <FiSearch size={18} />
            </IconButton>
            <InputBase
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ ml: 1, fontSize: 14 }}
            />
          </Box>
          <FilterDropdown
            filterOptions={['created date', 'party', 'Mobile No', 'Reason to Call', 'Unit No', 'market', 'area', 'party status', 'assign to', 'Created By']}
            uniqueValues={filterOptions} // Now using the fetched options
            loading={loadingFilterOptions} // Pass loading state
            onFiltersChange={setFilters}
            filters={filters}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          {cancreate && (
            <ThemeButton
              onClick={() => {
                setSelectedLead(null);
                setOpenAssignDialog(true);
              }}
            >
              + Assign New Party Call
            </ThemeButton>
          )}
        </Box>
      </Box>

      <TabComponent activeTab={tab} setActiveTab={setTab} tabList={tabLabels} align="left" />
      <Box
        sx={{
          maxHeight: "110vh",
          overflowY: "auto",
          px: 2,
          py: 2,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#555",
          },
        }}
      >
        {loadingDates ? (
          <Loader />
        ) : (
          availableDates.map((dateInfo) => {
            const { date, count } = dateInfo;
            const pagination = datePagination[date] || {
              currentPage: 1,
              itemsPerPage: ITEMS_PER_PAGE,
              totalItems: count,
              loading: true,
              data: [],
            };

            const { currentPage, itemsPerPage, loading, data } = pagination;

            return (
              <Box
                key={date}
                ref={isToday(date) ? todayRef : null}
                mb={4}
                sx={{
                  backgroundColor: isToday(date) ? "#a0d8b4ff" : "transparent",
                  borderRadius: 2,
                  p: 2,
                  border: isToday(date) ? "1px solid #D1FADF" : "none",
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {date}
                  {isToday(date) && (
                    <ThemeChip
                      label="Today"
                      color="success"
                      size="small"
                      sx={{ ml: 1, background: "#3a43beff" }}
                    />
                  )}
                </Typography>

                {loading ? (
                  <Loader />
                ) : (
                  <>
                    <CustomTable2
                      tableHeader={columns}
                      rowData={data}
                      showDatePicker={false}
                      showSearch={false}
                      showFillter={false}
                      renderRow={renderRow}
                      count={count}
                      page={currentPage}
                      handlePageChange={handlePageChange}
                      date={date}
                    />
                  </>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {openAssignDialog ? (
        <AssignLeadDialog
          open={openAssignDialog}
          onClose={() => {
            setOpenAssignDialog(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSuccess={handleAssignSuccess}
          company={companies.find((item) => item.companyName === StaticCompanyOptions[comapanyTab])}
        />
      ) : null}
    </>
  );
};

export default LeadManagementPage;