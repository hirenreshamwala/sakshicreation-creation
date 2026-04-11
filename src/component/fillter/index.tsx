// // import React, { useState, useEffect, useRef, useCallback } from "react";
// // import {
// //   Button,
// //   Menu,
// //   MenuItem,
// //   ListItemText,
// //   InputBase,
// //   Box,
// //   IconButton,
// //   Checkbox,
// //   Divider,
// //   Stack,
// //   CircularProgress,
// //   Typography,
// // } from "@mui/material";
// // import { FiFilter, FiSearch, FiX } from "react-icons/fi";
// // import { MdArrowBack } from "react-icons/md";

// // interface FilterDropdownProps {
// //   filterOptions: string[];
// //   uniqueValues: string[];
// //   loading?: boolean;
// //   onFiltersChange: (filters: { [key: string]: string[] }) => void;
// //   filters: { [key: string]: string[] };
// //   selectedField: string | null;
// //   onFieldSelect: (field: string | null) => void;
// //   onFieldOpen?: (field: string) => Promise<void>;
// //   defaultFilter?: any;
// // }

// // const labelMap: Record<string, string> = {
// //   contactPerson: "Contact Person",
// //   contactNumber: "Contact Number",
// //   paymentTerms:"Payment Terms",
// //   createdAt: "Created At",
// //   partyTag: "Party Tag",
// //   partyType: "Party Type",
// //   createdBy: "Created By",
// //   assignTo: "Assign To",
// //   assignedTo: "Assigned To",
// //   orderNumber: "Order Number",
// //   orderedBy: "Ordered By",
// //   orderStatus: "Order Status",
// //   assignedDate: "assigned date"
// // };

// // const FilterDropdown: React.FC<FilterDropdownProps> = ({
// //   filterOptions = [],
// //   uniqueValues = [],
// //   loading = false,
// //   onFiltersChange,
// //   filters,
// //   selectedField,
// //   defaultFilter,
// //   onFieldSelect,
// //   onFieldOpen,
// // }) => {
// //   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
// //   const [fieldLoading, setFieldLoading] = useState<string | null>(null);
// //   const [cachedValues, setCachedValues] = useState<Record<string, string[]>>({});
// //   const searchInputRef = useRef<HTMLInputElement>(null);
// //   const open = Boolean(anchorEl);

// //   // Debounce search query (150ms delay - reduced from 300ms)
// //   const debouncedSearchQuery = searchQuery;

// //   // Reset search when opening/closing
// //   useEffect(() => {
// //     if (open) {
// //       setSearchQuery("");
// //       if (selectedField && searchInputRef.current) searchInputRef.current?.focus();
// //     } else setFieldLoading(null);

// //   }, [open, selectedField]);

// //   // Load selected values when field changes
// //   useEffect(() => {
// //     if (selectedField && filters[selectedField]) setTempSelectedValues(filters[selectedField]);
// //     else setTempSelectedValues([]);
// //   }, [selectedField, filters]);

// //   // Check if we have cached values for the selected field
// //   useEffect(() => {
// //     if (selectedField && cachedValues[selectedField] && cachedValues[selectedField].length > 0) return;
// //   }, [selectedField, cachedValues]);

// //   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);

// //   const handleClose = () => {
// //     setAnchorEl(null);
// //     setSearchQuery("");
// //     onFieldSelect(null);
// //     setTempSelectedValues([]);
// //     setFieldLoading(null);
// //   };

// //   const handleFieldSelect = useCallback(async (field: string) => {
// //     setSearchQuery(""); // Clear search when selecting new field
// //     onFieldSelect(field);

// //     if (cachedValues[field] && cachedValues[field].length > 0) return;

// //     if (onFieldOpen) {
// //       setFieldLoading(field);

// //       try {
// //         await onFieldOpen(field);
// //         if (uniqueValues.length > 0)
// //           setCachedValues(prev => ({
// //             ...prev,
// //             [field]: [...uniqueValues]
// //           }));
// //       } finally {
// //         setFieldLoading(null);
// //       }
// //     }
// //   }, [onFieldSelect, onFieldOpen, cachedValues, uniqueValues]);

// //   const handleValueToggle = useCallback((value: string) => {
// //     setTempSelectedValues((prev) =>
// //       prev.includes(value)
// //         ? prev.filter((v) => v !== value)
// //         : [...prev, value]
// //     );
// //   }, []);

// //   const handleApplyFilter = useCallback(() => {
// //     if (selectedField) {
// //       const newFilters = { ...filters };

// //       if (tempSelectedValues.length > 0) newFilters[selectedField] = tempSelectedValues;
// //       else delete newFilters[selectedField];

// //       onFiltersChange(newFilters);
// //     }
// //     handleClose();
// //   }, [selectedField, filters, tempSelectedValues, onFiltersChange]);

// //   const handleClearFilter = useCallback(() => {
// //     onFiltersChange(defaultFilter?.filters || {});
// //     onFieldSelect(null);
// //     setTempSelectedValues([]);
// //     handleClose();
// //   }, [defaultFilter, onFiltersChange, onFieldSelect]);

// //   const handleBack = useCallback(() => {
// //     onFieldSelect(null);
// //     setSearchQuery("");
// //     setTempSelectedValues([]);
// //     setFieldLoading(null);
// //   }, [onFieldSelect]);

// //   // Optimized filter function using useMemo with debounced query
// //   const filteredUniqueValues = React.useMemo(() => {
// //     if (!Array.isArray(uniqueValues)) return [];

// //     const query = debouncedSearchQuery.trim().toLowerCase();

// //     if (!query) return uniqueValues;

// //     // For better performance with large arrays
// //     const result: string[] = [];
// //     const length = Math.min(uniqueValues.length, 2000); // Limit for very large datasets

// //     for (let i = 0; i < length; i++) {
// //       const value = uniqueValues[i];
// //       if (value !== null && value !== undefined &&
// //         value.toString().toLowerCase().includes(query)) {
// //         result.push(value);
// //         // Limit search results for better performance
// //         if (result.length >= 500) break;
// //       }
// //     }

// //     return result;
// //   }, [uniqueValues, debouncedSearchQuery]);

// //   // Check if there are any active filters
// //   const hasActiveFilters = Object.keys(filters).length > 0 &&
// //     Object.values(filters).some(arr => arr && arr.length > 0);

// //   // Check if currently loading this specific field
// //   const isFieldCurrentlyLoading = fieldLoading === selectedField;

// //   // Memoize field options to prevent unnecessary re-renders
// //   const filteredFieldOptions = React.useMemo(() => {
// //     return filterOptions
// //       ?.filter((item) => item?.trim() !== "")
// //       ?.filter(item => !['actions', 'options', 'action', 'option', 'aadhar files', 'address files']
// //         ?.includes(item?.toLowerCase()?.trim()));
// //   }, [filterOptions]);

// //   // Function to get field label with loading indicator
// //   const getFieldLabel = useCallback((field: string) => {
// //     const baseLabel = labelMap[field] || field;

// //     if (fieldLoading === field) {
// //       return (
// //         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //           <CircularProgress size={12} />
// //           <span>{baseLabel}</span>
// //         </Box>
// //       );
// //     }

// //     return baseLabel;
// //   }, [fieldLoading]);

// //   return (
// //     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
// //       {/* Filter chips and Clear All button */}
// //       {hasActiveFilters && (
// //         <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
// //           <Button
// //             variant="text"
// //             onClick={handleClearFilter}
// //             sx={{
// //               color: "#D32F2F",
// //               fontWeight: 600,
// //               fontSize: 14,
// //               textTransform: "none",
// //               minWidth: 'auto',
// //               px: 1,
// //               py: 0.5,
// //               '&:hover': {
// //                 backgroundColor: 'transparent',
// //                 textDecoration: 'underline'
// //               }
// //             }}
// //           >
// //             Clear All
// //           </Button>
// //         </Stack>
// //       )}

// //       {/* Filter button */}
// //       <Button
// //         variant="outlined"
// //         onClick={handleClick}
// //         startIcon={<FiFilter />}
// //         sx={{
// //           textTransform: "none",
// //           borderRadius: 2,
// //           color: "#344054",
// //           px: 2,
// //           borderColor: "#D0D5DD",
// //           fontWeight: 700,
// //           minWidth: 110,
// //           ml: hasActiveFilters ? 1 : 0,
// //         }}
// //       >
// //         Filters
// //       </Button>

// //       {/* Filter dropdown menu */}
// //       <Menu
// //         anchorEl={anchorEl}
// //         open={open}
// //         onClose={handleClose}
// //         PaperProps={{
// //           sx: {
// //             mt: 1,
// //             borderRadius: 2,
// //             px: 1,
// //             py: 0.5,
// //             minWidth: 250,
// //             maxHeight: 500,
// //             overflowY: "auto",
// //             display: "flex",
// //             flexDirection: "column",
// //             transition: 'all 0.2s ease',
// //           },
// //         }}
// //       >
// //         {!selectedField ? (
// //           <>
// //             {filteredFieldOptions?.length > 0 ? (
// //               filteredFieldOptions.map((field) => (
// //                 <MenuItem
// //                   key={field}
// //                   sx={{
// //                     px: 2,
// //                     opacity: fieldLoading === field ? 0.7 : 1
// //                   }}
// //                   onClick={() => !fieldLoading && handleFieldSelect(field)}
// //                   disabled={fieldLoading === field}
// //                 >
// //                   <ListItemText
// //                     primary={getFieldLabel(field)}
// //                     primaryTypographyProps={{
// //                       fontSize: 14,
// //                       fontWeight: 500,
// //                       color: fieldLoading === field ? "#98A2B3" : "#344054",
// //                     }}
// //                   />
// //                   {fieldLoading === field && (
// //                     <CircularProgress size={16} sx={{ ml: 1 }} />
// //                   )}
// //                 </MenuItem>
// //               ))
// //             ) : (
// //               <MenuItem sx={{ px: 2 }} disabled>
// //                 <ListItemText
// //                   primary="No filters available"
// //                   primaryTypographyProps={{
// //                     fontSize: 14,
// //                     fontWeight: 500,
// //                     color: "#98A2B3",
// //                   }}
// //                 />
// //               </MenuItem>
// //             )}
// //           </>
// //         ) : (
// //           <>
// //             {/* Header with Back button and Search */}
// //             <Box sx={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
// //               {/* Back button */}
// //               <MenuItem sx={{ px: 2, py: 1 }} onClick={handleBack}>
// //                 <IconButton size="small" sx={{ mr: 1 }}>
// //                   <MdArrowBack size={18} />
// //                 </IconButton>
// //                 <ListItemText
// //                   primary="Back"
// //                   primaryTypographyProps={{
// //                     fontSize: 14,
// //                     fontWeight: 500,
// //                     color: "#344054",
// //                   }}
// //                 />
// //               </MenuItem>

// //               {/* Search Input */}
// //               <Box
// //                 sx={{
// //                   display: "flex",
// //                   alignItems: "center",
// //                   borderBottom: "1px solid #D0D5DD",
// //                   px: 2,
// //                   py: 1,
// //                 }}
// //               >
// //                 <IconButton size="small" sx={{ color: "#98A2B3" }}>
// //                   <FiSearch size={18} />
// //                 </IconButton>
// //                 <InputBase
// //                   placeholder="Search values..."
// //                   value={searchQuery}
// //                   inputRef={searchInputRef}
// //                   onChange={(e) => setSearchQuery(e.target.value)}
// //                   sx={{ ml: 1, fontSize: 14, flex: 1 }}
// //                   inputProps={{
// //                     'aria-label': 'search filter values',
// //                   }}
// //                   autoFocus
// //                 />
// //                 {searchQuery && (
// //                   <IconButton
// //                     size="small"
// //                     onClick={() => setSearchQuery("")}
// //                     sx={{ color: "#98A2B3" }}
// //                   >
// //                     <FiX size={16} />
// //                   </IconButton>
// //                 )}
// //               </Box>
// //             </Box>

// //             <Divider />

// //             {/* Scrollable values list */}
// //             <Box sx={{ overflowY: "auto", flex: 1, maxHeight: 300 }}>
// //               {isFieldCurrentlyLoading ? (
// //                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
// //                   <CircularProgress size={20} />
// //                   <Typography variant="body2" sx={{ ml: 1, color: '#667085' }}>
// //                     Loading values...
// //                   </Typography>
// //                 </Box>
// //               ) : filteredUniqueValues.length > 0 ? (
// //                 <>
// //                   <Typography
// //                     variant="caption"
// //                     sx={{
// //                       display: 'block',
// //                       px: 2,
// //                       py: 1,
// //                       color: '#667085',
// //                       fontSize: 12
// //                     }}
// //                   >
// //                     {filteredUniqueValues.length} value{filteredUniqueValues.length !== 1 ? 's' : ''} found
// //                     {debouncedSearchQuery !== searchQuery && ' (searching...)'}
// //                   </Typography>
// //                   {filteredUniqueValues.map((value) => ( // Limit to 500 for performance
// //                     <MenuItem
// //                       key={value}
// //                       sx={{ px: 2 }}
// //                       onClick={() => handleValueToggle(value)}
// //                     >
// //                       <Checkbox
// //                         checked={tempSelectedValues.includes(value)}
// //                         size="small"
// //                         sx={{ p: 0, mr: 1 }}
// //                       />
// //                       <ListItemText
// //                         primary={value || "(Empty)"}
// //                         primaryTypographyProps={{
// //                           fontSize: 14,
// //                           fontWeight: 500,
// //                           color: value ? "#344054" : "#98A2B3",
// //                         }}
// //                       />
// //                     </MenuItem>
// //                   ))}
// //                 </>
// //               ) : (
// //                 <Box sx={{ textAlign: 'center', py: 3 }}>
// //                   <Typography
// //                     variant="body2"
// //                     sx={{ color: '#667085', mb: 0.5 }}
// //                   >
// //                     {searchQuery ? "No matching values found" : "No values available"}
// //                   </Typography>
// //                   {searchQuery && (
// //                     <Typography
// //                       variant="caption"
// //                       sx={{ color: '#98A2B3', fontSize: 12 }}
// //                     >
// //                       Try a different search term
// //                     </Typography>
// //                   )}
// //                 </Box>
// //               )}
// //             </Box>

// //             {/* Fixed buttons at bottom */}
// //             <Box
// //               sx={{
// //                 display: "flex",
// //                 justifyContent: "space-between",
// //                 px: 2,
// //                 py: 1.5,
// //                 position: "sticky",
// //                 bottom: 0,
// //                 background: "#fff",
// //                 zIndex: 1,
// //                 borderTop: "1px solid #f0f0f0",
// //               }}
// //             >
// //               <Button
// //                 variant="text"
// //                 onClick={handleClearFilter}
// //                 sx={{
// //                   color: "#D32F2F",
// //                   fontWeight: 600,
// //                   fontSize: 14,
// //                   textTransform: "none",
// //                 }}
// //               >
// //                 Clear All
// //               </Button>
// //               <Button
// //                 variant="contained"
// //                 onClick={handleApplyFilter}
// //                 disabled={isFieldCurrentlyLoading}
// //                 sx={{
// //                   backgroundColor: "#7F56D9",
// //                   fontWeight: 600,
// //                   fontSize: 14,
// //                   textTransform: "none",
// //                   "&:hover": {
// //                     backgroundColor: "#6941C6",
// //                   },
// //                   "&:disabled": {
// //                     backgroundColor: "#E9D7FE",
// //                     color: "#fff"
// //                   }
// //                 }}
// //               >
// //                 {isFieldCurrentlyLoading ? "Loading..." : "Apply"}
// //               </Button>
// //             </Box>
// //           </>
// //         )}
// //       </Menu>
// //     </Box>
// //   );
// // };

// // export default React.memo(FilterDropdown);

// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import {
//   Button,
//   Menu,
//   MenuItem,
//   ListItemText,
//   InputBase,
//   Box,
//   IconButton,
//   Checkbox,
//   Divider,
//   Stack,
//   CircularProgress,
//   Typography,
// } from "@mui/material";
// import { FiFilter, FiSearch, FiX } from "react-icons/fi";
// import { MdArrowBack } from "react-icons/md";
// import { Virtuoso } from "react-virtuoso";
// import { useSelector } from "react-redux";

// interface FilterDropdownProps {
//   filterOptions: string[];
//   uniqueValues: string[];
//   loading?: boolean;
//   onFiltersChange: (filters: { [key: string]: string[] }) => void;
//   filters: { [key: string]: string[] };
//   selectedField: string | null;
//   onFieldSelect: (field: string | null) => void;
//   onFieldOpen?: (field: string) => Promise<void>;
//   defaultFilter?: any;
//   companyTab?: number;
// }

// const labelMap: Record<string, string> = {
//   contactPerson: "Contact Person",
//   contactNumber: "Contact Number",
//   paymentTerms: "Payment Terms",
//   createdAt: "Created At",
//   partyTag: "Party Tag",
//   partyType: "Party Type",
//   createdBy: "Created By",
//   assignTo: "Assign To",
//   assignedTo: "Assigned To",
//   orderNumber: "Order Number",
//   orderedBy: "Ordered By",
//   orderStatus: "Order Status",
//   assignedDate: "assigned date"
// };

// const FilterDropdown: React.FC<FilterDropdownProps> = React.memo(({
//   filterOptions = [],
//   uniqueValues = [],
//   loading = false,
//   onFiltersChange,
//   filters,
//   selectedField,
//   defaultFilter,
//   onFieldSelect,
//   onFieldOpen,
//   companyTab
// }) => {
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
//   const [fieldLoading, setFieldLoading] = useState<string | null>(null);
//   const [cachedValues, setCachedValues] = useState<Record<string, string[]>>({});
//   const searchInputRef = useRef<HTMLInputElement>(null);
//   const open = Boolean(anchorEl);
//   const {companies} = useSelector((state:any)=>state.company)

//   // Memoize debounced search query to prevent unnecessary re-renders
//   const debouncedSearchQuery = useMemo(() => searchQuery, [searchQuery]);

//   // Reset search when opening/closing - optimized with useCallback
//   useEffect(() => {
//     if (open) {
//       setSearchQuery("");
//       if (selectedField && searchInputRef.current) searchInputRef.current?.focus();
//     } else setFieldLoading(null);

//   }, [open, selectedField]);

//   // Load selected values when field changes - optimized with useCallback
//   useEffect(() => {
//     if (selectedField && filters[selectedField]) setTempSelectedValues(filters[selectedField]);
//     else setTempSelectedValues([]);
//   }, [selectedField, filters]);

//   // Clear cached filter values when companyTab changes so stale data is removed
//   useEffect(() => {
//     setCachedValues({});
//   }, [companyTab]);

//   // Memoize hasActiveFilters calculation
//   const hasActiveFilters = useMemo(() => {
//     return Object.keys(filters).length > 0 &&
//       Object.values(filters).some(arr => arr && arr.length > 0);
//   }, [filters]);

//   // Memoize filtered field options with performance optimization
//   const filteredFieldOptions = useMemo(() => {
//     const excludedFields = new Set(['actions', 'options', 'action', 'option', 'aadhar files', 'address files']);
//     return filterOptions
//       ?.filter((item) => item?.trim() !== "")
//       ?.filter(item => !excludedFields.has(item?.toLowerCase()?.trim()));
//   }, [filterOptions]);

//   // Optimized handleClick with useCallback
//   const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
//     setAnchorEl(event.currentTarget);
//   }, []);

//   // Optimized handleClose with useCallback
//   const handleClose = useCallback(() => {
//     setAnchorEl(null);
//     setSearchQuery("");
//     onFieldSelect(null);
//     setTempSelectedValues([]);
//     setFieldLoading(null);
//   }, [onFieldSelect]);

//   // Optimized handleFieldSelect with useCallback
//   const handleFieldSelect = useCallback(async (field: string) => {
//     setSearchQuery("");
//     onFieldSelect(field);

//     if (cachedValues[field] && cachedValues[field].length > 0) return;

//     if (onFieldOpen) {
//       setFieldLoading(field);

//       try {
//         await onFieldOpen(field);
//         if (uniqueValues.length > 0) {
//           setCachedValues(prev => ({
//             ...prev,
//             [field]: [...uniqueValues]
//           }));
//         }
//       } finally {
//         setFieldLoading(null);
//       }
//     }
//   }, [onFieldSelect, onFieldOpen, cachedValues, uniqueValues]);

//   // Optimized handleValueToggle with useCallback
//   const handleValueToggle = useCallback((value: string) => {
//     setTempSelectedValues((prev) =>
//       prev.includes(value)
//         ? prev.filter((v) => v !== value)
//         : [...prev, value]
//     );
//   }, []);

//   // Optimized handleApplyFilter with useCallback
//   const handleApplyFilter = useCallback(() => {
//     if (selectedField) {
//       const newFilters = { ...filters };

//       if (tempSelectedValues.length > 0) newFilters[selectedField] = tempSelectedValues;
//       else delete newFilters[selectedField];

//       onFiltersChange(newFilters);
//     }
//     handleClose();
//   }, [selectedField, filters, tempSelectedValues, onFiltersChange, handleClose]);

//   // Optimized handleClearFilter with useCallback
//   const handleClearFilter = useCallback(() => {
//     onFiltersChange(defaultFilter?.filters || {});
//     onFieldSelect(null);
//     setTempSelectedValues([]);
//     handleClose();
//   }, [defaultFilter, onFiltersChange, onFieldSelect, handleClose]);

//   // Optimized handleBack with useCallback
//   const handleBack = useCallback(() => {
//     onFieldSelect(null);
//     setSearchQuery("");
//     setTempSelectedValues([]);
//     setFieldLoading(null);
//   }, [onFieldSelect]);

//   // Optimized filter function with useMemo - REMOVED LIMITS
//   const filteredUniqueValues = useMemo(() => {
//     if (!Array.isArray(uniqueValues)) return [];

//     const query = debouncedSearchQuery.trim().toLowerCase();

//     if (!query) return uniqueValues;

//     // Using filter for better readability and no limits
//     return uniqueValues.filter(value => {
//       if (value === null || value === undefined) return false;
//       return value.toString().toLowerCase().includes(query);
//     });
//   }, [uniqueValues, debouncedSearchQuery]);

//   // Memoize field loading state
//   const isFieldCurrentlyLoading = useMemo(() => fieldLoading === selectedField, [fieldLoading, selectedField]);

//   // Memoize field label rendering
//   const getFieldLabel = useCallback((field: string) => {
//     const baseLabel = labelMap[field] || field;

//     if (fieldLoading === field) {
//       return (
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <CircularProgress size={12} />
//           <span>{baseLabel}</span>
//         </Box>
//       );
//     }

//     return baseLabel;
//   }, [fieldLoading]);

//   // Memoize menu items for fields
//   const menuItems = useMemo(() => {
//     if (!selectedField) {
//       if (filteredFieldOptions?.length > 0) {
//         return filteredFieldOptions.map((field) => (
//           <MenuItem
//             key={field}
//             sx={{
//               px: 2,
//               opacity: fieldLoading === field ? 0.7 : 1
//             }}
//             onClick={() => !fieldLoading && handleFieldSelect(field)}
//             disabled={fieldLoading === field}
//           >
//             <ListItemText
//               primary={getFieldLabel(field)}
//               primaryTypographyProps={{
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: fieldLoading === field ? "#98A2B3" : "#344054",
//               }}
//             />
//             {fieldLoading === field && (
//               <CircularProgress size={16} sx={{ ml: 1 }} />
//             )}
//           </MenuItem>
//         ));
//       }
//       return (
//         <MenuItem sx={{ px: 2 }} disabled>
//           <ListItemText
//             primary="No filters available"
//             primaryTypographyProps={{
//               fontSize: 14,
//               fontWeight: 500,
//               color: "#98A2B3",
//             }}
//           />
//         </MenuItem>
//       );
//     }
//     return null;
//   }, [selectedField, filteredFieldOptions, fieldLoading, handleFieldSelect, getFieldLabel]);

//   // Memoize value items for selected field - REMOVED LIMITS
 

// // valueItems useMemo ko replace karo is se:
// const valueItems = useMemo(() => {
//   if (!selectedField) return null;

//   return (
//     <>
//       <Typography
//         variant="caption"
//         sx={{ display: "block", px: 2, py: 1, color: "#667085", fontSize: 12 }}
//       >
//         {filteredUniqueValues.length} value{filteredUniqueValues.length !== 1 ? "s" : ""} found
//       </Typography>
//       <Virtuoso
//         style={{ height: Math.min(filteredUniqueValues.length * 46, 260) }}
//         totalCount={filteredUniqueValues.length}
//         itemContent={(index) => {
//           const value = filteredUniqueValues[index];
//           return (
//             <MenuItem
//               key={value}
//               sx={{ px: 2 }}
//               onClick={() => handleValueToggle(value)}
//             >
//               <Checkbox
//                 checked={tempSelectedValues.includes(value)}
//                 size="small"
//                 sx={{ p: 0, mr: 1 }}
//               />
//               <ListItemText
//                 primary={value || "(Empty)"}
//                 primaryTypographyProps={{
//                   fontSize: 14,
//                   fontWeight: 500,
//                   color: value ? "#344054" : "#98A2B3",
//                 }}
//               />
//             </MenuItem>
//           );
//         }}
//       />
//     </>
//   );
// }, [selectedField, filteredUniqueValues, tempSelectedValues, handleValueToggle]);
//   // Memoize empty state
//   const emptyState = useMemo(() => {
//     if (!selectedField) return null;

//     return (
//       <Box sx={{ textAlign: 'center', py: 3 }}>
//         <Typography
//           variant="body2"
//           sx={{ color: '#667085', mb: 0.5 }}
//         >
//           {searchQuery ? "No matching values found" : "No values available"}
//         </Typography>
//         {searchQuery && (
//           <Typography
//             variant="caption"
//             sx={{ color: '#98A2B3', fontSize: 12 }}
//           >
//             Try a different search term
//           </Typography>
//         )}
//       </Box>
//     );
//   }, [selectedField, searchQuery]);

//   // Memoize loading state
//   const loadingState = useMemo(() => {
//     if (!selectedField) return null;

//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
//         <CircularProgress size={20} />
//         <Typography variant="body2" sx={{ ml: 1, color: '#667085' }}>
//           Loading values...
//         </Typography>
//       </Box>
//     );
//   }, [selectedField]);

//   return (
//     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//       {/* Filter chips and Clear All button */}
//       {hasActiveFilters && (
//         <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
//           <Button
//             variant="text"
//             onClick={handleClearFilter}
//             sx={{
//               color: "#D32F2F",
//               fontWeight: 600,
//               fontSize: 14,
//               textTransform: "none",
//               minWidth: 'auto',
//               px: 1,
//               py: 0.5,
//               '&:hover': {
//                 backgroundColor: 'transparent',
//                 textDecoration: 'underline'
//               }
//             }}
//           >
//             Clear All
//           </Button>
//         </Stack>
//       )}

//       {/* Filter button */}
//       <Button
//         variant="outlined"
//         onClick={handleClick}
//         startIcon={<FiFilter />}
//         sx={{
//           textTransform: "none",
//           borderRadius: 2,
//           color: "#344054",
//           px: 2,
//           borderColor: "#D0D5DD",
//           fontWeight: 700,
//           minWidth: 110,
//           ml: hasActiveFilters ? 1 : 0,
//         }}
//       >
//         Filters
//       </Button>

//       {/* Filter dropdown menu */}
//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleClose}
//         PaperProps={{
//           sx: {
//             mt: 1,
//             borderRadius: 2,
//             px: 1,
//             py: 0.5,
//             minWidth: 250,
//             maxHeight: 500,
//             overflowY: "auto",
//             display: "flex",
//             flexDirection: "column",
//             transition: 'all 0.2s ease',
//           },
//         }}
//       >
//         {!selectedField ? (
//           menuItems
//         ) : (
//           <>
//             {/* Header with Back button and Search */}
//             <Box sx={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
//               {/* Back button */}
//               <MenuItem sx={{ px: 2, py: 1 }} onClick={handleBack}>
//                 <IconButton size="small" sx={{ mr: 1 }}>
//                   <MdArrowBack size={18} />
//                 </IconButton>
//                 <ListItemText
//                   primary="Back"
//                   primaryTypographyProps={{
//                     fontSize: 14,
//                     fontWeight: 500,
//                     color: "#344054",
//                   }}
//                 />
//               </MenuItem>

//               {/* Search Input */}
//               <Box
//                 sx={{
//                   display: "flex",
//                   alignItems: "center",
//                   borderBottom: "1px solid #D0D5DD",
//                   px: 2,
//                   py: 1,
//                 }}
//               >
//                 <IconButton size="small" sx={{ color: "#98A2B3" }}>
//                   <FiSearch size={18} />
//                 </IconButton>
//                 <InputBase
//                   placeholder="Search values..."
//                   value={searchQuery}
//                   inputRef={searchInputRef}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   sx={{ ml: 1, fontSize: 14, flex: 1 }}
//                   inputProps={{
//                     'aria-label': 'search filter values',
//                   }}
//                   autoFocus
//                 />
//                 {searchQuery && (
//                   <IconButton
//                     size="small"
//                     onClick={() => setSearchQuery("")}
//                     sx={{ color: "#98A2B3" }}
//                   >
//                     <FiX size={16} />
//                   </IconButton>
//                 )}
//               </Box>
//             </Box>

//             <Divider />

//             {/* Scrollable values list */}
//             {/* <Box sx={{ overflowY: "auto", flex: 1, maxHeight: 300 }}> */}
//               {isFieldCurrentlyLoading ? loadingState : (
//                 filteredUniqueValues.length > 0 ? valueItems : emptyState
//               )}
//             {/* </Box> */}

//             {/* Fixed buttons at bottom */}
//             <Box
//               sx={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 px: 2,
//                 py: 1.5,
//                 position: "sticky",
//                 bottom: 0,
//                 background: "#fff",
//                 zIndex: 1,
//                 borderTop: "1px solid #f0f0f0",
//               }}
//             >
//               <Button
//                 variant="text"
//                 onClick={handleClearFilter}
//                 sx={{
//                   color: "#D32F2F",
//                   fontWeight: 600,
//                   fontSize: 14,
//                   textTransform: "none",
//                 }}
//               >
//                 Clear All
//               </Button>
//               <Button
//                 variant="contained"
//                 onClick={handleApplyFilter}
//                 disabled={isFieldCurrentlyLoading}
//                 sx={{
//                   backgroundColor: "#7F56D9",
//                   fontWeight: 600,
//                   fontSize: 14,
//                   textTransform: "none",
//                   "&:hover": {
//                     backgroundColor: "#6941C6",
//                   },
//                   "&:disabled": {
//                     backgroundColor: "#E9D7FE",
//                     color: "#fff"
//                   }
//                 }}
//               >
//                 {isFieldCurrentlyLoading ? "Loading..." : "Apply"}
//               </Button>
//             </Box>
//           </>
//         )}
//       </Menu>
//     </Box>
//   );
// });

// export default FilterDropdown;

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemText,
  InputBase,
  Box,
  IconButton,
  Checkbox,
  Divider,
  Stack,
  CircularProgress,
  Typography,
} from "@mui/material";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import { MdArrowBack } from "react-icons/md";
import { Virtuoso } from "react-virtuoso";
import { useSelector } from "react-redux";
import moment from "moment";

interface FilterDropdownProps {
  filterOptions: string[];
  uniqueValues: string[];
  loading?: boolean;
  onFiltersChange: (filters: { [key: string]: string[] }) => void;
  filters: { [key: string]: string[] };
  selectedField: string | null;
  onFieldSelect: (field: string | null) => void;
  onFieldOpen?: (field: string) => Promise<void>;
  defaultFilter?: any;
  companyTab?: number;
}

const labelMap: Record<string, string> = {
  contactPerson: "Contact Person",
  contactNumber: "Contact Number",
  paymentTerms: "Payment Terms",
  createdAt: "Created At",
  partyTag: "Party Tag",
  partyType: "Party Type",
  createdBy: "Created By",
  assignTo: "Assign To",
  assignedTo: "Assigned To",
  orderNumber: "Order Number",
  orderedBy: "Ordered By",
  orderStatus: "Order Status",
  assignedDate: "assigned date",
  paymentAmount: "Payment Amount",
  receivedAmount:"Received Amount",
  differenceAmount:"Difference Amount",
  pendingAmount: "Pending Amount",
  taskStatus: "Task Status"
};

// Helper function to format date values
const formatDateValue = (value: string): string => {
  if (!value) return value;
  
  // Check if the value is a valid date
  const date = moment(value);
  if (date.isValid()) {
    return date.format("DD-MM-YYYY");
  }
  
  return value;
};

// Helper function to check if field is date-related
const isDateField = (fieldName: string): boolean => {
  if (!fieldName) return false;
  return fieldName.toLowerCase().includes('date');
};

const FilterDropdown: React.FC<FilterDropdownProps> = React.memo(({
  filterOptions = [],
  uniqueValues = [],
  loading = false,
  onFiltersChange,
  filters,
  selectedField,
  defaultFilter,
  onFieldSelect,
  onFieldOpen,
  companyTab
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const [fieldLoading, setFieldLoading] = useState<string | null>(null);
  const [cachedValues, setCachedValues] = useState<Record<string, string[]>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const open = Boolean(anchorEl);
  const {companies} = useSelector((state:any)=>state.company)

  // Memoize debounced search query to prevent unnecessary re-renders
  const debouncedSearchQuery = useMemo(() => searchQuery, [searchQuery]);

  // Reset search when opening/closing - optimized with useCallback
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      if (selectedField && searchInputRef.current) searchInputRef.current?.focus();
    } else setFieldLoading(null);

  }, [open, selectedField]);

  // Load selected values when field changes - optimized with useCallback
  useEffect(() => {
    if (selectedField && filters[selectedField]) setTempSelectedValues(filters[selectedField]);
    else setTempSelectedValues([]);
  }, [selectedField, filters]);

  // Clear cached filter values when companyTab changes so stale data is removed
  useEffect(() => {
    setCachedValues({});
  }, [companyTab]);

  // Memoize hasActiveFilters calculation
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0 &&
      Object.values(filters).some(arr => arr && arr.length > 0);
  }, [filters]);

  // Memoize filtered field options with performance optimization
  const filteredFieldOptions = useMemo(() => {
    const excludedFields = new Set(['actions', 'options', 'action', 'option', 'aadhar files', 'address files']);
    return filterOptions
      ?.filter((item) => item?.trim() !== "")
      ?.filter(item => !excludedFields.has(item?.toLowerCase()?.trim()));
  }, [filterOptions]);

  // Optimized handleClick with useCallback
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  // Optimized handleClose with useCallback
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setSearchQuery("");
    onFieldSelect(null);
    setTempSelectedValues([]);
    setFieldLoading(null);
  }, [onFieldSelect]);

  // Optimized handleFieldSelect with useCallback
  const handleFieldSelect = useCallback(async (field: string) => {
    setSearchQuery("");
    onFieldSelect(field);

    if (cachedValues[field] && cachedValues[field].length > 0) return;

    if (onFieldOpen) {
      setFieldLoading(field);

      try {
        await onFieldOpen(field);
        if (uniqueValues.length > 0) {
          setCachedValues(prev => ({
            ...prev,
            [field]: [...uniqueValues]
          }));
        }
      } finally {
        setFieldLoading(null);
      }
    }
  }, [onFieldSelect, onFieldOpen, cachedValues, uniqueValues]);

  // Optimized handleValueToggle with useCallback
  const handleValueToggle = useCallback((value: string) => {
    setTempSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }, []);

  // Optimized handleApplyFilter with useCallback
  const handleApplyFilter = useCallback(() => {
    if (selectedField) {
      const newFilters = { ...filters };

      if (tempSelectedValues.length > 0) newFilters[selectedField] = tempSelectedValues;
      else delete newFilters[selectedField];

      onFiltersChange(newFilters);
    }
    handleClose();
  }, [selectedField, filters, tempSelectedValues, onFiltersChange, handleClose]);

  // Optimized handleClearFilter with useCallback
  const handleClearFilter = useCallback(() => {
    onFiltersChange(defaultFilter?.filters || {});
    onFieldSelect(null);
    setTempSelectedValues([]);
    handleClose();
  }, [defaultFilter, onFiltersChange, onFieldSelect, handleClose]);

  // Optimized handleBack with useCallback
  const handleBack = useCallback(() => {
    onFieldSelect(null);
    setSearchQuery("");
    setTempSelectedValues([]);
    setFieldLoading(null);
  }, [onFieldSelect]);

  // Optimized filter function with useMemo - REMOVED LIMITS
  const filteredUniqueValues = useMemo(() => {
    if (!Array.isArray(uniqueValues)) return [];

    const query = debouncedSearchQuery.trim().toLowerCase();

    if (!query) return uniqueValues;

    // Using filter for better readability and no limits
    return uniqueValues.filter(value => {
      if (value === null || value === undefined) return false;
      
      const stringValue = value.toString();
      const lowerValue = stringValue.toLowerCase();
      
      // For date fields, also check the formatted version
      if (selectedField && isDateField(selectedField)) {
        const formattedValue = formatDateValue(stringValue);
        return lowerValue.includes(query) || formattedValue.toLowerCase().includes(query);
      }
      
      return lowerValue.includes(query);
    });
  }, [uniqueValues, debouncedSearchQuery, selectedField]);

  // Memoize field loading state
  const isFieldCurrentlyLoading = useMemo(() => fieldLoading === selectedField, [fieldLoading, selectedField]);

  // Memoize field label rendering
  const getFieldLabel = useCallback((field: string) => {
    const baseLabel = labelMap[field] || field;

    if (fieldLoading === field) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={12} />
          <span>{baseLabel}</span>
        </Box>
      );
    }

    return baseLabel;
  }, [fieldLoading]);

  // Memoize menu items for fields
  const menuItems = useMemo(() => {
    if (!selectedField) {
      if (filteredFieldOptions?.length > 0) {
        return filteredFieldOptions.map((field) => (
          <MenuItem
            key={field}
            sx={{
              px: 2,
              opacity: fieldLoading === field ? 0.7 : 1
            }}
            onClick={() => !fieldLoading && handleFieldSelect(field)}
            disabled={fieldLoading === field}
          >
            <ListItemText
              primary={getFieldLabel(field)}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 500,
                color: fieldLoading === field ? "#98A2B3" : "#344054",
              }}
            />
            {fieldLoading === field && (
              <CircularProgress size={16} sx={{ ml: 1 }} />
            )}
          </MenuItem>
        ));
      }
      return (
        <MenuItem sx={{ px: 2 }} disabled>
          <ListItemText
            primary="No filters available"
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 500,
              color: "#98A2B3",
            }}
          />
        </MenuItem>
      );
    }
    return null;
  }, [selectedField, filteredFieldOptions, fieldLoading, handleFieldSelect, getFieldLabel]);

  // Memoize value items for selected field - REMOVED LIMITS
  const valueItems = useMemo(() => {
    if (!selectedField) return null;

    return (
      <>
        <Typography
          variant="caption"
          sx={{ display: "block", px: 2, py: 1, color: "#667085", fontSize: 12 }}
        >
          {filteredUniqueValues.length} value{filteredUniqueValues.length !== 1 ? "s" : ""} found
        </Typography>
        <Virtuoso
          style={{ height: Math.min(filteredUniqueValues.length * 46, 260) }}
          totalCount={filteredUniqueValues.length}
          itemContent={(index) => {
            const value = filteredUniqueValues[index];
            const displayValue = isDateField(selectedField) ? formatDateValue(value) : value;
            
            return (
              <MenuItem
                key={value}
                sx={{ px: 2 }}
                onClick={() => handleValueToggle(value)}
              >
                <Checkbox
                  checked={tempSelectedValues.includes(value)}
                  size="small"
                  sx={{ p: 0, mr: 1 }}
                />
                <ListItemText
                  primary={displayValue || "(Empty)"}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: value ? "#344054" : "#98A2B3",
                  }}
                />
              </MenuItem>
            );
          }}
        />
      </>
    );
  }, [selectedField, filteredUniqueValues, tempSelectedValues, handleValueToggle]);

  // Memoize empty state
  const emptyState = useMemo(() => {
    if (!selectedField) return null;

    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography
          variant="body2"
          sx={{ color: '#667085', mb: 0.5 }}
        >
          {searchQuery ? "No matching values found" : "No values available"}
        </Typography>
        {searchQuery && (
          <Typography
            variant="caption"
            sx={{ color: '#98A2B3', fontSize: 12 }}
          >
            Try a different search term
          </Typography>
        )}
      </Box>
    );
  }, [selectedField, searchQuery]);

  // Memoize loading state
  const loadingState = useMemo(() => {
    if (!selectedField) return null;

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 1, color: '#667085' }}>
          Loading values...
        </Typography>
      </Box>
    );
  }, [selectedField]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* Filter chips and Clear All button */}
      {hasActiveFilters && (
        <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            variant="text"
            onClick={handleClearFilter}
            sx={{
              color: "#D32F2F",
              fontWeight: 600,
              fontSize: 14,
              textTransform: "none",
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            Clear All
          </Button>
        </Stack>
      )}

      {/* Filter button */}
      <Button
        variant="outlined"
        onClick={handleClick}
        startIcon={<FiFilter />}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          color: "#344054",
          px: 2,
          borderColor: "#D0D5DD",
          fontWeight: 700,
          minWidth: 110,
          ml: hasActiveFilters ? 1 : 0,
        }}
      >
        Filters
      </Button>

      {/* Filter dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            px: 1,
            py: 0.5,
            minWidth: 250,
            maxHeight: 500,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            transition: 'all 0.2s ease',
          },
        }}
      >
        {!selectedField ? (
          menuItems
        ) : (
          <>
            {/* Header with Back button and Search */}
            <Box sx={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              {/* Back button */}
              <MenuItem sx={{ px: 2, py: 1 }} onClick={handleBack}>
                <IconButton size="small" sx={{ mr: 1 }}>
                  <MdArrowBack size={18} />
                </IconButton>
                <ListItemText
                  primary="Back"
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#344054",
                  }}
                />
              </MenuItem>

              {/* Search Input */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #D0D5DD",
                  px: 2,
                  py: 1,
                }}
              >
                <IconButton size="small" sx={{ color: "#98A2B3" }}>
                  <FiSearch size={18} />
                </IconButton>
                <InputBase
                  placeholder={selectedField && isDateField(selectedField) ? "Search dates (DD-MM-YYYY)..." : "Search values..."}
                  value={searchQuery}
                  inputRef={searchInputRef}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ ml: 1, fontSize: 14, flex: 1 }}
                  inputProps={{
                    'aria-label': 'search filter values',
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery("")}
                    sx={{ color: "#98A2B3" }}
                  >
                    <FiX size={16} />
                  </IconButton>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Scrollable values list */}
            {isFieldCurrentlyLoading ? loadingState : (
              filteredUniqueValues.length > 0 ? valueItems : emptyState
            )}

            {/* Fixed buttons at bottom */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                position: "sticky",
                bottom: 0,
                background: "#fff",
                zIndex: 1,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Button
                variant="text"
                onClick={handleClearFilter}
                sx={{
                  color: "#D32F2F",
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: "none",
                }}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilter}
                disabled={isFieldCurrentlyLoading}
                sx={{
                  backgroundColor: "#7F56D9",
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#6941C6",
                  },
                  "&:disabled": {
                    backgroundColor: "#E9D7FE",
                    color: "#fff"
                  }
                }}
              >
                {isFieldCurrentlyLoading ? "Loading..." : "Apply"}
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </Box>
  );
});

export default FilterDropdown;