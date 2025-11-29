// import React, { useState, useMemo, useEffect, useCallback } from "react";
// import {
//   Box,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   InputBase,
//   IconButton,
//   Checkbox,
//   Collapse,
//   Tooltip,
//   CircularProgress,
// } from "@mui/material";
// import Button from "@/component/common_component/themebutton";
// import { FiSearch, FiDownload, FiX } from "react-icons/fi";
// import FilterDropdown from "@/component/fillter";
// import DateRangePicker from "@/component/daterangepicker";
// import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
// import * as XLSX from "xlsx";
// import moment from "moment";
// import { useDispatch, useSelector } from "react-redux";
// import { complainService } from "@/services/complain.service";
// import { addToState } from "@/store/slices/accountMasterFilterSlice";

// interface Column {
//   id: string;
//   label: string;
//   align?: "left" | "center" | "right";
// }

// interface BasicTableProps<T> {
//   id?: boolean | string;
//   tableHeader: Column[];
//   rowData: T[];
//   renderRow: (row: T, index: number) => React.ReactNode;
//   title?: string;
//   showDatePicker?: boolean;
//   showSearch?: boolean;
//   showFillter?: boolean;
//   showExcelDownload?: boolean;
//   excelHeaders?: string[];
//   excelData?: { [key: string]: any }[];
//   onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
//   onSelectRow?: (id: string) => void;
//   selectedRows?: string[];
//   totalRows?: number;
//   renderExpandedRow?: (row: T) => React.ReactNode;
//   showHeaderCheckbox?: boolean;
//   getRowColor?: (row: T) => string;
//   setCurrentFilterState?: (state: any) => void;
//   currentFilterState?: any;
//   pageName?: string;
//   getFilterOptions?: (field: string, filters?: any) => Promise<{ success: boolean; data: string[] }>;
// }

// // Debounce hook
// const useDebounce = (value: string, delay: number) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

// // Function to check if lastStatusChangeDate date is older than 3 days
// const isStatusChangeOlderThanThreeDays = (lastStatusChangeDate: string | Date | null): boolean => {
//   if (!lastStatusChangeDate) return false;

//   const statusChangeDate = moment(lastStatusChangeDate);
//   const threeDaysAgo = moment().subtract(3, 'days');

//   return statusChangeDate.isBefore(threeDaysAgo);
// };

// const CustomTable = <T extends { id: string; lastStatusChangeDate?: string | Date }>({
//   id,
//   tableHeader,
//   rowData,
//   renderRow,
//   title,
//   showDatePicker = true,
//   showSearch = true,
//   showFillter = true,
//   showExcelDownload = false,
//   excelHeaders,
//   excelData,
//   onSelectAll,
//   onSelectRow,
//   showHeaderCheckbox = true,
//   totalRows = 0,
//   selectedRows = [],
//   renderExpandedRow,
//   getRowColor,
//   setCurrentFilterState,
//   pageName,
//   getFilterOptions,
//   currentFilterState = {
//     page: 1,
//     pageSize: 10,
//     searchQuery: "",
//     filters: {},
//     includeCounts: true,
//     isPagination: true,
//     dateRange: { start: null, end: null },
//     statusTab: 0,
//     companyTab: 0,
//     startDate: null,
//     endDate: null,
//     search: ""
//   }
// }: BasicTableProps<T>) => {
//   const dispatch = useDispatch();

//   console.log(rowData, 'currentFilterState------------------')

//   // Get filter options from Redux store
//   const filterOptionsFromRedux = useSelector((state: any) => state.dynamic || {});

//   // Use currentFilterState.page as the source of truth for current page (convert to 0-based)
//   const page = (currentFilterState?.page || 1) - 1;
//   const rowsPerPage = currentFilterState?.pageSize || 10;

//   const [startDate, setStartDate] = useState<string | null>(
//     currentFilterState?.startDate || currentFilterState?.dateRange?.start || null
//   );
//   const [endDate, setEndDate] = useState<string | null>(
//     currentFilterState?.endDate || currentFilterState?.dateRange?.end || null
//   );

//   const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
//   const [filters, setFilters] = useState<{ [key: string]: string[] }>(currentFilterState?.filters || {});
//   const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
//   const [colWidths, setColWidths] = useState<number[]>([]);
//   const [loadingOptions, setLoadingOptions] = useState<{ [key: string]: boolean }>({});

//   // Use totalRows from server for pagination calculation
//   const pageCount = Math.ceil(totalRows / rowsPerPage);

//   // Get search query from currentFilterState
//   const searchQuery = currentFilterState?.search || currentFilterState?.searchQuery || "";

//   // Debounced search for immediate UI feedback
//   const debouncedSearchQuery = useDebounce(searchQuery, 300);

//   // Check if date range is selected
//   const isDateRangeSelected = useMemo(() => {
//     return startDate !== null || endDate !== null;
//   }, [startDate, endDate]);

//   // Clear date range function
//   const clearDateRange = useCallback(() => {
//     setStartDate(null);
//     setEndDate(null);
//     if (setCurrentFilterState) {
//       setCurrentFilterState((prev: any) => ({
//         ...prev,
//         startDate: null,
//         endDate: null,
//         dateRange: { start: null, end: null },
//         page: 1,
//       }));
//     }
//   }, [setCurrentFilterState]);

//   const getRowBackgroundColor = useCallback((row: T): string => {
//     if (getRowColor) {
//       const color = getRowColor(row);
//       if (color) return color;
//     }

//     if (row.lastStatusChangeDate && isStatusChangeOlderThanThreeDays(row.lastStatusChangeDate))
//       return "#fdbbbbff";

//     return "transparent";
//   }, [getRowColor]);

//   const getRowHoverBackgroundColor = useCallback((row: T): string => {
//     if (row.lastStatusChangeDate && isStatusChangeOlderThanThreeDays(row.lastStatusChangeDate))
//       return "#fdbbbbff";

//     return "#F9FAFB";
//   }, []);

//   // Handle search change - update currentFilterState directly
//   const handleSearchChange = useCallback((value: string) => {
//     if (setCurrentFilterState) {
//       setCurrentFilterState((prev: any) => ({
//         ...prev,
//         search: value,
//         searchQuery: value,
//         page: 1,
//       }));
//     }
//   }, [setCurrentFilterState]);

//   // Handle filter changes - update currentFilterState directly
//   const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
//     setFilters(newFilters);
//     if (setCurrentFilterState) {
//       setCurrentFilterState((prev: any) => ({
//         ...prev,
//         filters: newFilters,
//         page: 1,
//       }));
//     }
//   }, [setCurrentFilterState]);

//   // Handle date changes - update currentFilterState directly
//   const handleDateChange = useCallback((newStartDate: string | null, newEndDate: string | null) => {
//     setStartDate(newStartDate);
//     setEndDate(newEndDate);
//     if (setCurrentFilterState) {
//       setCurrentFilterState((prev: any) => ({
//         ...prev,
//         startDate: newStartDate,
//         endDate: newEndDate,
//         dateRange: { start: newStartDate, end: newEndDate },
//         page: 1,
//       }));
//     }
//   }, [setCurrentFilterState]);

//   // Sync local state with currentFilterState
//   useEffect(() => {
//     if (currentFilterState?.filters) {
//       setFilters(currentFilterState.filters);
//     }
//   }, [currentFilterState?.filters]);

//   // Sync dates with currentFilterState
//   useEffect(() => {
//     if (currentFilterState?.startDate || currentFilterState?.dateRange?.start) {
//       setStartDate(currentFilterState.startDate || currentFilterState.dateRange.start);
//     }
//     if (currentFilterState?.endDate || currentFilterState?.dateRange?.end) {
//       setEndDate(currentFilterState.endDate || currentFilterState.dateRange.end);
//     }
//   }, [currentFilterState?.startDate, currentFilterState?.endDate, currentFilterState?.dateRange]);

//   // Get unique values for filter dropdown - with lazy loading
//   const getUniqueValues = useCallback(async (field: string) => {
//     console.log('getUniqueValues -------------------------------')
//     // Check if data already exists in Redux
//     const existingData = filterOptionsFromRedux[field];
//     if (existingData && existingData.length > 0) {
//       console.log('returns -------------------------------')
//       return existingData;
//     }

//     // If getFilterOptions function is provided, use it

//     console.log('getFilterOptions -------------------------------')
//     setLoadingOptions(prev => ({ ...prev, [field]: true }));

//     try {
//       // Prepare filters for API call
//       const apiFilters = {
//         startDate: currentFilterState?.startDate,
//         endDate: currentFilterState?.endDate,
//         companyName: currentFilterState?.companyName,
//         // Add other relevant filters
//       };

//       // Fetch data from API
//       const response = await complainService.searchFilterOptions(field, "", apiFilters);
//       console.log(response,response.data,'responseeeeee')

//       if (response.success && response.data) {
//         // Store in Redux for future use
//         dispatch(addToState({ key: field, data: response.data }));
//         return response.data;
//       }
//       return [];
//     } catch (error) {
//       console.error(`Error fetching ${field} options:`, error);
//       return [];
//     } finally {
//       setLoadingOptions(prev => ({ ...prev, [field]: false }));
//     }


//     return [];
//   }, [filterOptionsFromRedux, currentFilterState]);

//   // Handle filter field selection - this will trigger API call
//   const handleFilterFieldSelect = useCallback((field: string | null) => {
//     setSelectedFilterField(field);
//   }, []);

//   // Handle field open - this will trigger API call when field is selected
//   const handleFieldOpen = useCallback(async (field: string) => {
//     console.log("API call triggered for field:", field);
//     await getUniqueValues(field);
//   }, [getUniqueValues]);

//   // Get current unique values for selected field
//   const uniqueValues = useMemo(() => {
//     if (!selectedFilterField) return { values: [], isLoading: false };

//     const data = filterOptionsFromRedux[selectedFilterField] || [];
//     const isLoading = loadingOptions[selectedFilterField];

//     // Ensure we always return an array of strings
//     let values: string[] = [];

//     if (Array.isArray(data)) {
//       if (data.length > 0 && typeof data[0] === 'object' && data[0].name) {
//         // If data is array of objects with name property
//         values = [...new Set(data.map(item => item.name))];
//       } else {
//         // If data is array of strings
//         values = [...new Set(data)];
//       }
//     }

//     return {
//       values,
//       isLoading,
//     };
//   }, [selectedFilterField, filterOptionsFromRedux, loadingOptions]);

//   // Dynamically generate filter options from tableHeader, excluding "action" and "checkbox"
//   const filterOptions = useMemo(() => {
//     return tableHeader
//       ?.filter((col) => col.id !== "action" && col.id !== "checkbox")
//       .map((col) => col.value);
//   }, [tableHeader]);

//   // Map filter labels to rowData keys dynamically
//   const filterFieldToKey = useMemo(() => {
//     const mapping: { [key: string]: keyof T } = {};
//     tableHeader.forEach((col) => {
//       let key: keyof T;
//       switch (col.label) {
//         case "Company":
//           key = "company" as keyof T;
//           break;
//         case "Created Date":
//         case "Date":
//           key = "createdDate" as keyof T;
//           break;
//         case "Party":
//           key = "party" as keyof T;
//           break;
//         case "Contact Person":
//           key = "contactPerson" as keyof T;
//           break;
//         case "Party Tag":
//           key = "partyTag" as keyof T;
//           break;
//         case "Mobile No.":
//           key = "mobile" as keyof T;
//           break;
//         case "Reason to Visit":
//           key = "reason" as keyof T;
//           break;
//         case "Market":
//         case "Market Name":
//           key = "market" as keyof T;
//           break;
//         case "Area":
//           key = "area" as keyof T;
//           break;
//         case "Remarks":
//           key = "remarks" as keyof T;
//           break;
//         case "Status":
//           key = "status" as keyof T;
//           break;
//         case "Created By":
//         case "Assign By":
//           key = "createdBy" as keyof T;
//           break;
//         case "Assigned to":
//         case "Assign To":
//           key = "assignedTo" as keyof T;
//           break;
//         case "Address":
//           key = "address" as keyof T;
//           break;
//         case "OrderNo":
//           key = "orderid" as keyof T;
//           break;
//         case "Driver":
//           key = "driverEmail" as keyof T;
//           break;
//         case "Last Status Change":
//           key = "lastStatusChangeDate" as keyof T;
//           break;
//         default:
//           key = col.id as keyof T;
//       }
//       mapping[col.label] = key;
//     });
//     return mapping;
//   }, [tableHeader]);

//   // Filter rows based on search query, date range, and multiple filters (client-side for display only)
//   const filteredRows = useMemo(() => {
//     let filtered = rowData;

//     // Apply search query filter (using debounced value)
//     if (debouncedSearchQuery.trim()) {
//       const query = debouncedSearchQuery.toLowerCase();
//       filtered = filtered.filter((row) =>
//         Object.values(row).some((value) => {
//           if (value === null || value === undefined) return false;

//           const stringValue =
//             typeof value === "object" && value !== null
//               ? JSON.stringify(value).toLowerCase()
//               : String(value).toLowerCase();

//           return stringValue.includes(query);
//         })
//       );
//     }

//     // Apply date range filter
//     if (startDate || endDate) {
//       filtered = filtered.filter((row) => {
//         const rowDateValue = (row as any).createdDate || (row as any).date || (row as any).createdAt;
//         if (!rowDateValue) return true;

//         const rowDate = moment(rowDateValue);
//         const start = startDate ? moment(startDate) : null;
//         const end = endDate ? moment(endDate) : null;

//         if (start && rowDate.isBefore(start)) return false;
//         if (end && rowDate.isAfter(end)) return false;

//         return true;
//       });
//     }

//     // Apply multiple filters
//     if (Object.keys(filters).length > 0) {
//       filtered = filtered?.filter((row) =>
//         Object.entries(filters).every(([field, values]) => {
//           const key = filterFieldToKey[field];
//           if (!key) return true;

//           let value;
//           if (key === "company") {
//             value = (row[key] as any)?.name;
//           } else if (key === "market") {
//             value = (row[key] as any)?.marketName;
//           } else if (key === "area") {
//             value = (row[key] as any)?.area;
//           } else if (key === "driverEmail") {
//             const email = row[key] as string;
//             if (!email || email === "Not Started Delivery") {
//               value = "Not Started Delivery";
//             } else {
//               value = email?.split("@")[0];
//             }
//           } else if (key === "orderid") {
//             value = String(row[key] || "N/A");
//           } else if (key === "lastStatusChangeDate") {
//             value = row[key] ? moment(row[key] as string).format('DD/MM/YYYY') : "N/A";
//           } else {
//             value = row[key];
//           }

//           return values.includes(String(value ?? "N/A"));
//         })
//       );
//     }

//     return filtered;
//   }, [rowData, debouncedSearchQuery, startDate, endDate, filters, filterFieldToKey]);

//   // For display, use client-side filtered data
//   const displayRows = filteredRows;

//   // Handle page changes
//   const handlePageChange = useCallback((newPage: number) => {
//     if (setCurrentFilterState) {
//       setCurrentFilterState((prev: any) => ({
//         ...prev,
//         page: newPage + 1, // Convert back to 1-based index for server
//       }));
//     }
//   }, [setCurrentFilterState]);

//   useEffect(() => {
//     const newWidths = tableHeader.map((col) => {
//       const headerLen = col.label.length;
//       const maxRowLen = Math.max(
//         ...rowData.map((r) => {
//           const val = (r as any)[col.id];
//           if (val === null || val === undefined) return 0;
//           return String(val).length;
//         }),
//         0
//       );
//       const length = Math.max(headerLen, maxRowLen);
//       return Math.min(110, Math.max(60, length * 2));
//     });
//     setColWidths(newWidths);
//   }, [tableHeader, rowData]);

//   const handleExcelDownload = useCallback(() => {
//     const headers = excelHeaders
//       ? excelHeaders
//       : tableHeader
//         .filter((col) => col.id !== "checkbox" && col.id !== "action")
//         .map((col) => col.label);

//     const array = filteredRows.map((row) => id ? row.id : (row as any)._id);
//     const data = excelData
//       ? excelData?.filter((item) => array.includes(item.id))
//       : filteredRows.map((row) => {
//         const rowData: { [key: string]: any } = {};
//         tableHeader
//           .filter((col) => col.id !== "checkbox" && col.id !== "action")
//           .forEach((col) => {
//             const key = filterFieldToKey[col.label];
//             let value = row[key];
//             if (key === "company") {
//               value = (row[key] as any)?.name || "N/A";
//             } else if (key === "lastStatusChangeDate") {
//               value = row[key] ? moment(row[key] as string).format('DD/MM/YYYY HH:mm') : "N/A";
//             } else {
//               value = value ?? "N/A";
//             }
//             rowData[col.label] = value;
//           });
//         return rowData;
//       });

//     const worksheet = XLSX.utils.json_to_sheet(data);
//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "TableData");
//     XLSX.writeFile(workbook, `${title || "Table"}.xlsx`);
//   }, [excelHeaders, excelData, filteredRows, tableHeader, filterFieldToKey, title, id]);

//   const getPaginationItems = () => {
//     const maxVisiblePages = 5;
//     const items: React.ReactNode[] = [];

//     // Always show first page
//     items.push(
//       <Button
//         key={0}
//         variant="outlined"
//         size="small"
//         onClick={() => handlePageChange(0)}
//         sx={{
//           background: page === 0 ? "#F9F5FF" : "transparent",
//           color: page === 0 ? "#7F56D9" : "#667085",
//           fontWeight: page === 0 ? 600 : 500,
//           borderRadius: "6px",
//           textTransform: "none",
//         }}
//       >
//         1
//       </Button>
//     );

//     // Add ellipsis if needed after first page
//     if (page > 3) {
//       items.push(
//         <Typography key="ellipsis-start" sx={{ alignSelf: "center", px: 1, color: "#667085" }}>
//           ...
//         </Typography>
//       );
//     }

//     // Calculate the range of pages to show around the current page
//     const start = Math.max(1, page - 1);
//     const end = Math.min(pageCount - 2, page + 1);

//     for (let i = start; i <= end; i++) {
//       items.push(
//         <Button
//           key={i}
//           variant="outlined"
//           size="small"
//           onClick={() => handlePageChange(i)}
//           sx={{
//             background: page === i ? "#F9F5FF" : "transparent",
//             color: page === i ? "#7F56D9" : "#667085",
//             fontWeight: page === i ? 600 : 500,
//             borderRadius: "6px",
//             textTransform: "none",
//           }}
//         >
//           {i + 1}
//         </Button>
//       );
//     }

//     // Add ellipsis if needed before last page
//     if (page < pageCount - 4) {
//       items.push(
//         <Typography key="ellipsis-end" sx={{ alignSelf: "center", px: 1, color: "#667085" }}>
//           ...
//         </Typography>
//       );
//     }

//     // Always show last page if more than 1 page
//     if (pageCount > 1) {
//       items.push(
//         <Button
//           key={pageCount - 1}
//           variant="outlined"
//           size="small"
//           onClick={() => handlePageChange(pageCount - 1)}
//           sx={{
//             background: page === pageCount - 1 ? "#F9F5FF" : "transparent",
//             color: page === pageCount - 1 ? "#7F56D9" : "#667085",
//             fontWeight: page === pageCount - 1 ? 600 : 500,
//             borderRadius: "6px",
//             textTransform: "none",
//           }}
//         >
//           {pageCount}
//         </Button>
//       );
//     }

//     return items;
//   };

//   const toggleExpandRow = (rowId: string) => {
//     setExpandedRowId(expandedRowId === rowId ? null : rowId);
//   };

//   return (
//     <Paper elevation={0} sx={{ width: "100%", overflow: "hidden", p: 0, maxWidth: "100%" }}>
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           p: 2,
//           flexWrap: "wrap",
//           rowGap: 2,
//         }}
//       >
//         {title && (
//           <Typography variant="h1" sx={{ fontWeight: 600 }}>
//             {title}
//           </Typography>
//         )}

//         {/* Search + Date + Filter */}
//         <Box
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: showDatePicker ? "space-between" : "flex-end",
//             width: "100%",
//             gap: 2,
//           }}
//         >
//           {/* Date Range Picker */}
//           {showDatePicker && (
//             <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//               <DateRangePicker
//                 startDate={startDate}
//                 endDate={endDate}
//                 onStartDateChange={(date) => handleDateChange(date, endDate)}
//                 onEndDateChange={(date) => handleDateChange(startDate, date)}
//               />

//               {/* Clear Date Range Button */}
//               {isDateRangeSelected && (
//                 <Tooltip title="Clear date range">
//                   <IconButton
//                     color="error"
//                     onClick={clearDateRange}
//                   >
//                     <FiX size={16} />
//                   </IconButton>
//                 </Tooltip>
//               )}
//             </Box>
//           )}

//           {/* Search and Filter */}
//           <Box
//             sx={{
//               display: "flex",
//               gap: 2,
//               marginLeft: showDatePicker ? 0 : "auto",
//             }}
//           >
//             {/* Search */}
//             {showSearch && (
//               <Box
//                 sx={{
//                   display: "flex",
//                   alignItems: "center",
//                   border: "1px solid #D0D5DD",
//                   borderRadius: 2,
//                   px: 1.5,
//                   width: 200,
//                   height: 35,
//                 }}
//               >
//                 <IconButton size="small" sx={{ color: "#98A2B3" }}>
//                   <FiSearch size={18} />
//                 </IconButton>
//                 <InputBase
//                   placeholder="Search..."
//                   fullWidth
//                   value={searchQuery}
//                   onChange={(e) => handleSearchChange(e.target.value)}
//                   sx={{ ml: 1, fontSize: 14 }}
//                 />
//               </Box>
//             )}

//             {/* Filter */}
//             {showFillter && (
//               <Box>
//                 <FilterDropdown
//                   filterOptions={filterOptions}
//                   uniqueValues={uniqueValues.values || []}
//                   loading={uniqueValues.isLoading}
//                   onFiltersChange={handleFiltersChange}
//                   filters={filters}
//                   selectedField={selectedFilterField}
//                   onFieldSelect={handleFilterFieldSelect}
//                   onFieldOpen={handleFieldOpen} // Make sure this is passed
//                 />
//               </Box>
//             )}

//             {showExcelDownload && (
//               <IconButton
//                 onClick={handleExcelDownload}
//                 sx={{
//                   border: "1px solid #D0D5DD",
//                   borderRadius: 2,
//                   p: 1,
//                   color: "#667085",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//                 title="Download as Excel"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   height="16"
//                   width="16"
//                   viewBox="0 0 384 512"
//                 >
//                   <path
//                     fill="#667085"
//                     d="M224 136V0H24C10.7 0 0 10.7 0 24v464c13.3 0 24
//                        10.7 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 
//                        0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 
//                        8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 
//                        405.5 192 373 192 373c-6.4 14.8-10 20-36.6 
//                        68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 
//                        0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 
//                        .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 
//                        6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 
//                        6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 
//                        10.6-6.3H274c9.5-.1 15.2 10.4 10.1 
//                        18.4zM384 121.9v6.1H256V0h6.1c6.4 0 
//                        12.5 2.5 17 7l97.9 98c4.5 4.5 7 
//                        10.6 7 16.9z"
//                   />
//                 </svg>
//               </IconButton>
//             )}
//           </Box>
//         </Box>
//       </Box>

//       <TableContainer sx={{ width: "100%", overflowX: "auto", maxWidth: "100vw" }}>
//         <Box sx={{ minWidth: 0, width: "100%" }}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 {tableHeader.map((col, i) => (
//                   <TableCell
//                     key={col.id}
//                     align={col.align || "left"}
//                     sx={{
//                       background: "#EAECF0",
//                       fontSize: "14px",
//                       fontWeight: 500,
//                       color: "#667085",
//                       borderBottom: "none",
//                       whiteSpace: "nowrap",
//                       overflow: "hidden",
//                       textOverflow: "ellipsis",
//                       width: colWidths[i],
//                       maxWidth: colWidths[i],
//                     }}
//                   >
//                     <Tooltip title={col.label} arrow>
//                       <Box
//                         sx={{
//                           overflow: "hidden",
//                           textOverflow: "ellipsis",
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         {col.id === "checkbox" ? (
//                           showHeaderCheckbox ? (
//                             <Checkbox
//                               checked={selectedRows.length === rowData.length && rowData.length > 0}
//                               onChange={onSelectAll}
//                               disabled={!onSelectAll}
//                             />
//                           ) : (
//                             <></>
//                           )
//                         ) : (
//                           col.label
//                         )}
//                       </Box>
//                     </Tooltip>
//                   </TableCell>
//                 ))}

//                 {renderExpandedRow && (
//                   <TableCell
//                     sx={{
//                       background: "#EAECF0",
//                       borderBottom: "none",
//                       width: 50,
//                     }}
//                   />
//                 )}
//               </TableRow>
//             </TableHead>

//             <TableBody>
//               {displayRows.length > 0 ? (
//                 displayRows.map((row, index) => (
//                   <React.Fragment key={row?.id}>
//                     <TableRow
//                       hover
//                       sx={{
//                         borderBottom: "2px solid #F2F4F7",
//                         "& .MuiTableCell-root": {
//                           padding: "6px 10px",
//                           fontSize: "14px",
//                           lineHeight: "1.2",
//                         },
//                         backgroundColor: getRowBackgroundColor(row),
//                         "&:hover .MuiTableCell-root": {
//                           backgroundColor: getRowHoverBackgroundColor(row),
//                         },
//                       }}
//                     >
//                       {tableHeader[0]?.id === "checkbox" && (
//                         <TableCell>
//                           <Checkbox
//                             checked={selectedRows.includes(row.id)}
//                             onChange={() => onSelectRow && onSelectRow(row.id)}
//                           />
//                         </TableCell>
//                       )}
//                       {renderRow(row, index)}
//                       {renderExpandedRow && (
//                         <TableCell>
//                           <IconButton
//                             onClick={() => toggleExpandRow((row as any)._id || row.id)}
//                             size="small"
//                             sx={{ padding: 0 }}
//                           >
//                             {expandedRowId === ((row as any)._id || row.id) ? (
//                               <FaChevronUp size={14} />
//                             ) : (
//                               <FaChevronDown size={14} />
//                             )}
//                           </IconButton>
//                         </TableCell>
//                       )}
//                     </TableRow>

//                     {renderExpandedRow && expandedRowId === ((row as any)._id || row.id) && (
//                       <TableRow>
//                         <TableCell
//                           colSpan={tableHeader.length + (tableHeader[0].id === "checkbox" ? 1 : 0) + 1}
//                           sx={{
//                             padding: 0,
//                             backgroundColor: "#f9f9f9",
//                             borderBottom: "2px solid #F2F4F7",
//                           }}
//                         >
//                           <Collapse in={expandedRowId === ((row as any)._id || row.id)} timeout="auto" unmountOnExit>
//                             <Box sx={{ p: 2 }}>
//                               {renderExpandedRow(row)}
//                             </Box>
//                           </Collapse>
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </React.Fragment>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell
//                     colSpan={tableHeader.length + (renderExpandedRow ? 1 : 0)}
//                     align="center"
//                     sx={{ py: 3 }}
//                   >
//                     <Typography variant="body2" color="textSecondary">
//                       No matching records found
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </Box>
//       </TableContainer>

//       {/* Pagination */}
//       {totalRows > 0 && (
//         <Box
//           sx={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             py: 2,
//             px: 2,
//             flexWrap: "wrap",
//             gap: 2,
//           }}
//         >
//           <Button
//             variant="outlined"
//             size="small"
//             disabled={page === 0}
//             onClick={() => handlePageChange(page - 1)}
//           >
//             ← Previous
//           </Button>

//           <Box sx={{ display: "flex", gap: 1 }}>
//             {getPaginationItems()}
//           </Box>

//           <Button
//             variant="outlined"
//             size="small"
//             disabled={page >= pageCount - 1}
//             onClick={() => handlePageChange(page + 1)}
//           >
//             Next →
//           </Button>
//         </Box>
//       )}
//     </Paper>
//   );
// };

// export default CustomTable;

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  InputBase,
  IconButton,
  Checkbox,
  Collapse,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Button from "@/component/common_component/themebutton";
import { FiSearch, FiDownload, FiX } from "react-icons/fi";
import FilterDropdown from "@/component/fillter";
import DateRangePicker from "@/component/daterangepicker";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import * as XLSX from "xlsx";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { complainService } from "@/services/complain.service";
import { addToState } from "@/store/slices/accountMasterFilterSlice";

interface Column {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface BasicTableProps<T> {
  id?: boolean | string;
  tableHeader: Column[];
  rowData: T[];
  renderRow: (row: T, index: number) => React.ReactNode;
  title?: string;
  showDatePicker?: boolean;
  showSearch?: boolean;
  showFillter?: boolean;
  showExcelDownload?: boolean;
  excelHeaders?: string[];
  excelData?: { [key: string]: any }[];
  onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectRow?: (id: string) => void;
  selectedRows?: string[];
  totalRows?: number;
  renderExpandedRow?: (row: T) => React.ReactNode;
  showHeaderCheckbox?: boolean;
  getRowColor?: (row: T) => string;
  setCurrentFilterState?: (state: any) => void;
  currentFilterState?: any;
  pageName?: string;
  getFilterOptions?: (field: string, filters?: any) => Promise<{ success: boolean; data: string[] }>;
}

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Function to check if lastStatusChangeDate date is older than 3 days
const isStatusChangeOlderThanThreeDays = (lastStatusChangeDate: string | Date | null): boolean => {
  if (!lastStatusChangeDate) return false;

  const statusChangeDate = moment(lastStatusChangeDate);
  const threeDaysAgo = moment().subtract(3, 'days');

  return statusChangeDate.isBefore(threeDaysAgo);
};

const CustomTable = <T extends { id: string; lastStatusChangeDate?: string | Date }>({
  id,
  tableHeader,
  rowData,
  renderRow,
  title,
  showDatePicker = true,
  showSearch = true,
  showFillter = true,
  showExcelDownload = false,
  excelHeaders,
  excelData,
  onSelectAll,
  onSelectRow,
  showHeaderCheckbox = true,
  totalRows = 0,
  selectedRows = [],
  renderExpandedRow,
  getRowColor,
  setCurrentFilterState,
  pageName,
  getFilterOptions,
  defaultAccountMasterFilter,
  currentFilterState = {
    page: 1,
    pageSize: 10,
    searchQuery: "",
    filters: {},
    includeCounts: true,
    isPagination: true,
    dateRange: { start: null, end: null },
    statusTab: 0,
    companyTab: 0,
    startDate: null,
    endDate: null,
    search: ""
  }
}: BasicTableProps<T>) => {
  const dispatch = useDispatch();

  // Get filter options from Redux store
  const filterOptionsFromRedux = useSelector((state: any) => state.dynamic || {});

  // Use currentFilterState.page as the source of truth for current page (convert to 0-based)
  const page = (currentFilterState?.page || 1) - 1;
  const rowsPerPage = currentFilterState?.pageSize || 10;

  // Temporary states for search and date filters
  const [tempSearch, setTempSearch] = useState(currentFilterState?.search || "");
  const [tempStartDate, setTempStartDate] = useState<string | null>(
    currentFilterState?.startDate || currentFilterState?.dateRange?.start || null
  );
  const [tempEndDate, setTempEndDate] = useState<string | null>(
    currentFilterState?.endDate || currentFilterState?.dateRange?.end || null
  );

  const [startDate, setStartDate] = useState<string | null>(
    currentFilterState?.startDate || currentFilterState?.dateRange?.start || null
  );
  const [endDate, setEndDate] = useState<string | null>(
    currentFilterState?.endDate || currentFilterState?.dateRange?.end || null
  );

  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>(currentFilterState?.filters || {});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<number[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<{ [key: string]: boolean }>({});

  // Use totalRows from server for pagination calculation
  const pageCount = Math.ceil(totalRows / rowsPerPage);

  // Get search query from currentFilterState
  const searchQuery = currentFilterState?.search || currentFilterState?.searchQuery || "";

  // Debounced search for immediate UI feedback
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Check if date range is selected
  const isDateRangeSelected = useMemo(() => {
    return tempStartDate !== null || tempEndDate !== null;
  }, [tempStartDate, tempEndDate]);

  // Check if search or date filters have been changed
  const hasSearchOrDateChanges = useMemo(() => {
    return (
      tempSearch !== currentFilterState?.search ||
      tempStartDate !== currentFilterState?.startDate ||
      tempEndDate !== currentFilterState?.endDate
    );
  }, [tempSearch, tempStartDate, tempEndDate, currentFilterState]);

  // Clear date range function
  const clearDateRange = useCallback(() => {
    setTempStartDate(null);
    setTempEndDate(null);
  }, []);

  const getRowBackgroundColor = useCallback((row: T): string => {
    if (getRowColor) {
      const color = getRowColor(row);
      if (color) return color;
    }

    if (row.lastStatusChangeDate && isStatusChangeOlderThanThreeDays(row.lastStatusChangeDate))
      return "#fdbbbbff";

    return "transparent";
  }, [getRowColor]);

  const getRowHoverBackgroundColor = useCallback((row: T): string => {
    if (row.lastStatusChangeDate && isStatusChangeOlderThanThreeDays(row.lastStatusChangeDate))
      return "#fdbbbbff";

    return "#F9FAFB";
  }, []);

  // Handle search change - update temporary state
  const handleSearchChange = useCallback((value: string) => {
    setTempSearch(value);
  }, []);

  // Handle filter changes - update currentFilterState directly
  const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
    setFilters(newFilters);
    if (setCurrentFilterState) {
      setCurrentFilterState((prev: any) => ({
        ...prev,
        filters: newFilters,
        page: 1,
      }));
    }
  }, [setCurrentFilterState]);

  // Handle date changes - update temporary state
  const handleDateChange = useCallback((newStartDate: string | null, newEndDate: string | null) => {
    setTempStartDate(newStartDate);
    setTempEndDate(newEndDate);
  }, []);

  // Apply search and date filters
  const handleApplySearchAndDate = useCallback(() => {
    if (setCurrentFilterState) {
      setCurrentFilterState((prev: any) => ({
        ...prev,
        search: tempSearch,
        searchQuery: tempSearch,
        startDate: tempStartDate,
        endDate: tempEndDate,
        dateRange: { start: tempStartDate, end: tempEndDate },
        page: 1,
      }));
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
    }
  }, [setCurrentFilterState, tempSearch, tempStartDate, tempEndDate]);

  // Clear search and date filters
  const handleClearSearchAndDate = useCallback(() => {
    setTempSearch("");
    setTempStartDate(null);
    setTempEndDate(null);
    
    if (setCurrentFilterState) {
      setCurrentFilterState((prev: any) => ({
        ...prev,
        search: "",
        searchQuery: "",
        startDate: null,
        endDate: null,
        dateRange: { start: null, end: null },
        page: 1,
      }));
      setStartDate(null);
      setEndDate(null);
    }
  }, [setCurrentFilterState]);

  // Sync local state with currentFilterState
  useEffect(() => {
    if (currentFilterState?.filters) {
      setFilters(currentFilterState.filters);
    }
  }, [currentFilterState?.filters]);

  // Sync dates with currentFilterState
  useEffect(() => {
    if (currentFilterState?.startDate || currentFilterState?.dateRange?.start) {
      setStartDate(currentFilterState.startDate || currentFilterState.dateRange.start);
      setTempStartDate(currentFilterState.startDate || currentFilterState.dateRange.start);
    }
    if (currentFilterState?.endDate || currentFilterState?.dateRange?.end) {
      setEndDate(currentFilterState.endDate || currentFilterState.dateRange.end);
      setTempEndDate(currentFilterState.endDate || currentFilterState.dateRange.end);
    }
  }, [currentFilterState?.startDate, currentFilterState?.endDate, currentFilterState?.dateRange]);

  // Sync search with currentFilterState
  useEffect(() => {
    if (currentFilterState?.search !== undefined) {
      setTempSearch(currentFilterState.search);
    }
  }, [currentFilterState?.search]);

  // Get unique values for filter dropdown - with lazy loading
  const getUniqueValues = useCallback(async (field: string) => {
    console.log('getUniqueValues -------------------------------')
    // Check if data already exists in Redux
    const existingData = filterOptionsFromRedux[field];
    if (existingData && existingData.length > 0) {
      console.log('returns -------------------------------')
      return existingData;
    }

    // If getFilterOptions function is provided, use it

    console.log('getFilterOptions -------------------------------')
    setLoadingOptions(prev => ({ ...prev, [field]: true }));

    try {
      // Prepare filters for API call
      const apiFilters = {
        startDate: currentFilterState?.startDate,
        endDate: currentFilterState?.endDate,
        companyName: currentFilterState?.companyName,
        // Add other relevant filters
      };

      // Fetch data from API
      const response = await complainService.searchFilterOptions(field, "", apiFilters);

      if (response.success && response.data) {
        // Store in Redux for future use
        dispatch(addToState({ key: field, data: response.data }));
        return response.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching ${field} options:`, error);
      return [];
    } finally {
      setLoadingOptions(prev => ({ ...prev, [field]: false }));
    }


    return [];
  }, [filterOptionsFromRedux, currentFilterState]);

  // Handle filter field selection - this will trigger API call
  const handleFilterFieldSelect = useCallback((field: string | null) => {
    setSelectedFilterField(field);
  }, []);

  // Handle field open - this will trigger API call when field is selected
  const handleFieldOpen = useCallback(async (field: string) => {
    console.log("API call triggered for field:", field);
    await getUniqueValues(field);
  }, [getUniqueValues]);

  // Get current unique values for selected field
  const uniqueValues = useMemo(() => {
    if (!selectedFilterField) return { values: [], isLoading: false };

    const data = filterOptionsFromRedux[selectedFilterField] || [];
    const isLoading = loadingOptions[selectedFilterField];

    // Ensure we always return an array of strings
    let values: string[] = [];

    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'object' && data[0].name) {
        // If data is array of objects with name property
        values = [...new Set(data.map(item => item.name))];
      } else {
        // If data is array of strings
        values = [...new Set(data)];
      }
    }

    return {
      values,
      isLoading,
    };
  }, [selectedFilterField, filterOptionsFromRedux, loadingOptions]);

  const filterOptions = useMemo(() => {
    return tableHeader
      ?.filter(col => col.id !== "action" && col.id !== "checkbox")
      .map(col => col.value).filter(v => v !== undefined);
  }, [tableHeader]);

  // Map filter labels to rowData keys dynamically
  const filterFieldToKey = useMemo(() => {
    const mapping: { [key: string]: keyof T } = {};
    tableHeader.forEach((col) => {
      let key: keyof T;
      switch (col.label) {
        case "Company":
          key = "company" as keyof T;
          break;
        case "Created Date":
        case "Date":
          key = "createdDate" as keyof T;
          break;
        case "Party":
          key = "party" as keyof T;
          break;
        case "Contact Person":
          key = "contactPerson" as keyof T;
          break;
        case "Party Tag":
          key = "partyTag" as keyof T;
          break;
        case "Mobile No.":
          key = "mobile" as keyof T;
          break;
        case "Reason to Visit":
          key = "reason" as keyof T;
          break;
        case "Market":
        case "Market Name":
          key = "market" as keyof T;
          break;
        case "Area":
          key = "area" as keyof T;
          break;
        case "Remarks":
          key = "remarks" as keyof T;
          break;
        case "Status":
          key = "status" as keyof T;
          break;
        case "Created By":
        case "Assign By":
          key = "createdBy" as keyof T;
          break;
        case "Assigned to":
        case "Assign To":
          key = "assignedTo" as keyof T;
          break;
        case "Address":
          key = "address" as keyof T;
          break;
        case "OrderNo":
          key = "orderid" as keyof T;
          break;
        case "Driver":
          key = "driverEmail" as keyof T;
          break;
        case "Last Status Change":
          key = "lastStatusChangeDate" as keyof T;
          break;
        default:
          key = col.id as keyof T;
      }
      mapping[col.label] = key;
    });
    return mapping;
  }, [tableHeader]);

  // For display, use the server-filtered data
  const displayRows = rowData;

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    if (setCurrentFilterState) {
      setCurrentFilterState((prev: any) => ({
        ...prev,
        page: newPage + 1, // Convert back to 1-based index for server
      }));
    }
  }, [setCurrentFilterState]);

  useEffect(() => {
    const newWidths = tableHeader.map((col) => {
      const headerLen = col.label.length;
      const maxRowLen = Math.max(
        ...rowData.map((r) => {
          const val = (r as any)[col.id];
          if (val === null || val === undefined) return 0;
          return String(val).length;
        }),
        0
      );
      const length = Math.max(headerLen, maxRowLen);
      return Math.min(110, Math.max(60, length * 2));
    });
    setColWidths(newWidths);
  }, [tableHeader, rowData]);

  const handleExcelDownload = useCallback(() => {
    const headers = excelHeaders
      ? excelHeaders
      : tableHeader
        .filter((col) => col.id !== "checkbox" && col.id !== "action")
        .map((col) => col.label);

    const array = displayRows.map((row) => id ? row.id : (row as any)._id);
    const data = excelData
      ? excelData?.filter((item) => array.includes(item.id))
      : displayRows.map((row) => {
        const rowData: { [key: string]: any } = {};
        tableHeader
          .filter((col) => col.id !== "checkbox" && col.id !== "action")
          .forEach((col) => {
            const key = filterFieldToKey[col.label];
            let value = row[key];
            if (key === "company") {
              value = (row[key] as any)?.name || "N/A";
            } else if (key === "lastStatusChangeDate") {
              value = row[key] ? moment(row[key] as string).format('DD/MM/YYYY HH:mm') : "N/A";
            } else {
              value = value ?? "N/A";
            }
            rowData[col.label] = value;
          });
        return rowData;
      });

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TableData");
    XLSX.writeFile(workbook, `${title || "Table"}.xlsx`);
  }, [excelHeaders, excelData, displayRows, tableHeader, filterFieldToKey, title, id]);

  const getPaginationItems = () => {
    const maxVisiblePages = 5;
    const items: React.ReactNode[] = [];

    // Always show first page
    items.push(
      <Button
        key={0}
        variant="outlined"
        size="small"
        onClick={() => handlePageChange(0)}
        sx={{
          background: page === 0 ? "#F9F5FF" : "transparent",
          color: page === 0 ? "#7F56D9" : "#667085",
          fontWeight: page === 0 ? 600 : 500,
          borderRadius: "6px",
          textTransform: "none",
        }}
      >
        1
      </Button>
    );

    // Add ellipsis if needed after first page
    if (page > 3) {
      items.push(
        <Typography key="ellipsis-start" sx={{ alignSelf: "center", px: 1, color: "#667085" }}>
          ...
        </Typography>
      );
    }

    // Calculate the range of pages to show around the current page
    const start = Math.max(1, page - 1);
    const end = Math.min(pageCount - 2, page + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <Button
          key={i}
          variant="outlined"
          size="small"
          onClick={() => handlePageChange(i)}
          sx={{
            background: page === i ? "#F9F5FF" : "transparent",
            color: page === i ? "#7F56D9" : "#667085",
            fontWeight: page === i ? 600 : 500,
            borderRadius: "6px",
            textTransform: "none",
          }}
        >
          {i + 1}
        </Button>
      );
    }

    // Add ellipsis if needed before last page
    if (page < pageCount - 4) {
      items.push(
        <Typography key="ellipsis-end" sx={{ alignSelf: "center", px: 1, color: "#667085" }}>
          ...
        </Typography>
      );
    }

    // Always show last page if more than 1 page
    if (pageCount > 1) {
      items.push(
        <Button
          key={pageCount - 1}
          variant="outlined"
          size="small"
          onClick={() => handlePageChange(pageCount - 1)}
          sx={{
            background: page === pageCount - 1 ? "#F9F5FF" : "transparent",
            color: page === pageCount - 1 ? "#7F56D9" : "#667085",
            fontWeight: page === pageCount - 1 ? 600 : 500,
            borderRadius: "6px",
            textTransform: "none",
          }}
        >
          {pageCount}
        </Button>
      );
    }

    return items;
  };

  const toggleExpandRow = (rowId: string) => {
    setExpandedRowId(expandedRowId === rowId ? null : rowId);
  };

  return (
    <Paper elevation={0} sx={{ width: "100%", overflow: "hidden", p: 0, maxWidth: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          flexWrap: "wrap",
          rowGap: 2,
        }}
      >
        {title && (
          <Typography variant="h1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        )}

        {/* Search + Date + Filter */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: showDatePicker ? "space-between" : "flex-end",
            width: "100%",
            gap: 2,
          }}
        >
          {/* Date Range Picker */}
          {showDatePicker && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DateRangePicker
                startDate={tempStartDate}
                endDate={tempEndDate}
                onStartDateChange={(date) => handleDateChange(date, tempEndDate)}
                onEndDateChange={(date) => handleDateChange(tempStartDate, date)}
              />

              {/* Clear Date Range Button */}
              {isDateRangeSelected && (
                <Tooltip title="Clear date range">
                  <IconButton
                    color="error"
                    onClick={clearDateRange}
                  >
                    <FiX size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}

          {/* Search and Filter */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              marginLeft: showDatePicker ? 0 : "auto",
            }}
          >
            {/* Search */}
            {showSearch && (
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
                  fullWidth
                  value={tempSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  sx={{ ml: 1, fontSize: 14 }}
                />
              </Box>
            )}

            {/* Filter */}
            {showFillter && (
              <Box>
                <FilterDropdown
                  filterOptions={filterOptions}
                  uniqueValues={uniqueValues.values || []}
                  loading={uniqueValues.isLoading}
                  onFiltersChange={handleFiltersChange}
                  filters={filters}
                  selectedField={selectedFilterField}
                  onFieldSelect={handleFilterFieldSelect}
                  defaultAccountMasterFilter={defaultAccountMasterFilter}
                  onFieldOpen={handleFieldOpen} // Make sure this is passed
                />
              </Box>
            )}

            {/* Search and Clear Buttons */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleApplySearchAndDate}
                disabled={!hasSearchOrDateChanges}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearSearchAndDate}
              >
                Clear
              </Button>
            </Box>

            {showExcelDownload && (
              <IconButton
                onClick={handleExcelDownload}
                sx={{
                  border: "1px solid #D0D5DD",
                  borderRadius: 2,
                  p: 1,
                  color: "#667085",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Download as Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="16"
                  width="16"
                  viewBox="0 0 384 512"
                >
                  <path
                    fill="#667085"
                    d="M224 136V0H24C10.7 0 0 10.7 0 24v464c13.3 0 24
                       10.7 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 
                       0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 
                       8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 
                       405.5 192 373 192 373c-6.4 14.8-10 20-36.6 
                       68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 
                       0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 
                       .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 
                       6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 
                       6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 
                       10.6-6.3H274c9.5-.1 15.2 10.4 10.1 
                       18.4zM384 121.9v6.1H256V0h6.1c6.4 0 
                       12.5 2.5 17 7l97.9 98c4.5 4.5 7 
                       10.6 7 16.9z"
                  />
                </svg>
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      <TableContainer sx={{ width: "100%", overflowX: "auto", maxWidth: "100vw" }}>
        <Box sx={{ minWidth: 0, width: "100%" }}>
          <Table>
            <TableHead>
              <TableRow>
                {tableHeader.map((col, i) => (
                  <TableCell
                    key={col.id}
                    align={col.align || "left"}
                    sx={{
                      background: "#EAECF0",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#667085",
                      borderBottom: "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: colWidths[i],
                      maxWidth: colWidths[i],
                    }}
                  >
                    <Tooltip title={col.label} arrow>
                      <Box
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.id === "checkbox" ? (
                          showHeaderCheckbox ? (
                            <Checkbox
                              checked={selectedRows.length === rowData.length && rowData.length > 0}
                              onChange={onSelectAll}
                              disabled={!onSelectAll}
                            />
                          ) : (
                            <></>
                          )
                        ) : (
                          col.label
                        )}
                      </Box>
                    </Tooltip>
                  </TableCell>
                ))}

                {renderExpandedRow && (
                  <TableCell
                    sx={{
                      background: "#EAECF0",
                      borderBottom: "none",
                      width: 50,
                    }}
                  />
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {displayRows.length > 0 ? (
                displayRows.map((row, index) => (
                  <React.Fragment key={row?.id}>
                    <TableRow
                      hover
                      sx={{
                        borderBottom: "2px solid #F2F4F7",
                        "& .MuiTableCell-root": {
                          padding: "6px 10px",
                          fontSize: "14px",
                          lineHeight: "1.2",
                        },
                        backgroundColor: getRowBackgroundColor(row),
                        "&:hover .MuiTableCell-root": {
                          backgroundColor: getRowHoverBackgroundColor(row),
                        },
                      }}
                    >
                      {tableHeader[0]?.id === "checkbox" && (
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.includes(row.id)}
                            onChange={() => onSelectRow && onSelectRow(row.id)}
                          />
                        </TableCell>
                      )}
                      {renderRow(row, index)}
                      {renderExpandedRow && (
                        <TableCell>
                          <IconButton
                            onClick={() => toggleExpandRow((row as any)._id || row.id)}
                            size="small"
                            sx={{ padding: 0 }}
                          >
                            {expandedRowId === ((row as any)._id || row.id) ? (
                              <FaChevronUp size={14} />
                            ) : (
                              <FaChevronDown size={14} />
                            )}
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>

                    {renderExpandedRow && expandedRowId === ((row as any)._id || row.id) && (
                      <TableRow>
                        <TableCell
                          colSpan={tableHeader.length + (tableHeader[0].id === "checkbox" ? 1 : 0) + 1}
                          sx={{
                            padding: 0,
                            backgroundColor: "#f9f9f9",
                            borderBottom: "2px solid #F2F4F7",
                          }}
                        >
                          <Collapse in={expandedRowId === ((row as any)._id || row.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2 }}>
                              {renderExpandedRow(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableHeader.length + (renderExpandedRow ? 1 : 0)}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      No matching records found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </TableContainer>

      {/* Pagination */}
      {totalRows > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
            px: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
          >
            ← Previous
          </Button>

          <Box sx={{ display: "flex", gap: 1 }}>
            {getPaginationItems()}
          </Box>

          <Button
            variant="outlined"
            size="small"
            disabled={page >= pageCount - 1}
            onClick={() => handlePageChange(page + 1)}
          >
            Next →
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default CustomTable;