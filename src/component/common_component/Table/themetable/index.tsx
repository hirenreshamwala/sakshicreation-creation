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
  MenuItem,
  Select,
  Collapse,
  Tooltip,
} from "@mui/material";
import Button from "@/component/common_component/themebutton";
import { FiSearch, FiDownload, FiX } from "react-icons/fi";
import FilterDropdown from "@/component/fillter";
import DateRangePicker from "@/component/daterangepicker";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import * as XLSX from "xlsx";
import moment from "moment";

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
  excelHeaders?: string[]; // New prop for custom Excel headers
  excelData?: { [key: string]: any }[]; // New prop for custom Excel data
  onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectRow?: (id: string) => void;
  selectedRows?: string[];
  totalCount?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  renderExpandedRow?: (row: T) => React.ReactNode;
  showHeaderCheckbox?: boolean;
  getRowColor?: (row: T) => string;
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

const BasicTable = <T extends { id: string; lastStatusChangeDate?: string | Date }>({
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
  selectedRows = [],
  totalCount = rowData.length,
  pagination = {
    currentPage: 1,
    totalPages: Math.ceil(rowData.length / 10),
    hasNext: rowData.length > 10,
    hasPrev: false,
  },
  renderExpandedRow,
  getRowColor,
}: BasicTableProps<T>) => {
  const [page, setPage] = useState(pagination.currentPage - 1 || 0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms delay
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Check if date range is selected
  const isDateRangeSelected = useMemo(() => {
    return startDate !== null || endDate !== null;
  }, [startDate, endDate]);

  // Clear date range function
  const clearDateRange = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
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

  // Dynamically generate filter options from tableHeader, excluding "action" and "checkbox"
  const filterOptions = useMemo(() => {
    return tableHeader
      .filter((col) => col.id !== "action" && col.id !== "checkbox")
      .map((col) => col.label);
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

  // Compute unique values for the selected filter field
  const uniqueValues = useMemo(() => {
    if (!selectedFilterField) return [];
    const key = filterFieldToKey[selectedFilterField];
    if (!key) return [];

    const values = rowData.map((row) => {
      if (key === "company") {
        return (row[key] as any)?.name || "N/A";
      }
      if (key === "market") {
        return (row[key] as any)?.marketName || "N/A";
      }
      if (key === "area") {
        return (row[key] as any)?.area || "N/A";
      }
      if (key === "driverEmail") {
        // For driver email, show only the part before @ in filter dropdown
        const email = row[key] as string;
        if (!email || email === "Not Started Delivery") return "Not Started Delivery";
        return email?.split("@")[0];
      }
      if (key === "orderid") {
        return String(row[key] || "N/A");
      }
      if (key === "lastStatusChangeDate") {
        const dateValue = row[key];
        if (!dateValue) return "N/A";
        return moment(dateValue).format('DD/MM/YYYY');
      }
      return String(row[key] || "N/A");
    });
    return Array.from(new Set(values)).sort();
  }, [rowData, selectedFilterField, filterFieldToKey]);

  // Filter rows based on search query, date range, and multiple filters
  const filteredRows = useMemo(() => {
    let filtered = rowData;

    // Apply search query filter (using debounced value)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => {
          if (value === null || value === undefined) return false;

          const stringValue =
            typeof value === "object" && value !== null
              ? JSON.stringify(value).toLowerCase()
              : String(value).toLowerCase();

          return stringValue.includes(query);
        })
      );
    }

    // Parse startDate and endDate
    const startMoment = startDate ? moment(startDate).format('DD/MM/YY') : null;
    const endMoment = endDate ? moment(endDate).format('DD/MM/YY') : null;

    // Apply date range filter
    if (startMoment || endMoment) {
      filtered = filtered.filter((row) => {
        const rowDateValue = row.createdDate || row.date || row.createdAt;
        if (!rowDateValue) return true; // Keep row if no date
        const rowMoment = rowDateValue;

        if (startMoment > rowMoment) return false;
        if (endMoment < rowMoment) return false;

        return true;
      });
    }

    // Apply multiple filters
    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter((row) =>
        Object.entries(filters).every(([field, values]) => {
          const key = filterFieldToKey[field];
          if (!key) return true;

          let value;
          if (key === "company") {
            value = (row[key] as any)?.name;
          } else if (key === "market") {
            value = (row[key] as any)?.marketName;
          } else if (key === "area") {
            value = (row[key] as any)?.area;
          } else if (key === "driverEmail") {
            // For driver email filter, compare with the part before @
            const email = row[key] as string;
            if (!email || email === "Not Started Delivery") {
              value = "Not Started Delivery";
            } else {
              value = email?.split("@")[0];
            }
          } else if (key === "orderid") {
            value = String(row[key] || "N/A");
          } else if (key === "lastStatusChangeDate") {
            value = row[key] ? moment(row[key] as string).format('DD/MM/YYYY') : "N/A";
          } else {
            value = row[key];
          }

          return values.includes(String(value ?? "N/A"));
        })
      );
    }

    return filtered;
  }, [rowData, debouncedSearchQuery, startDate, endDate, filters, filterFieldToKey]);

  // Use filteredRows length for pagination when using client-side filtering
  const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, filters, startDate, endDate]);

  // Handle rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newRowsPerPage = parseInt(event.target.value);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };


  const [colWidths, setColWidths] = useState<number[]>([]);

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
      return Math.min(110, Math.max(60, length * 2)); // heuristic 7px per char
    });
    setColWidths(newWidths);
  }, [tableHeader, rowData]);


  // Excel download function
  const handleExcelDownload = useCallback(() => {
    // Use custom excelHeaders and excelData if provided, otherwise fall back to table data
    const headers = excelHeaders
      ? excelHeaders
      : tableHeader
        .filter((col) => col.id !== "checkbox" && col.id !== "action")
        .map((col) => col.label);

    const array = filteredRows.map((row) => id ? row.id : (row as any)._id);
    const data = excelData
      ? excelData?.filter((item) => array.includes(item.id))
      : filteredRows.map((row) => {
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

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TableData");
    XLSX.writeFile(workbook, `${title || "Table"}.xlsx`);
  }, [excelHeaders, excelData, filteredRows, tableHeader, filterFieldToKey, title]);

  const getPaginationItems = () => {
    const maxVisiblePages = 5;
    const items: React.ReactNode[] = [];

    // Always show first page
    items.push(
      <Button
        key={0}
        variant="outlined"
        size="small"
        onClick={() => setPage(0)}
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
          onClick={() => setPage(i)}
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
          onClick={() => setPage(pageCount - 1)}
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
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  sx={{ ml: 1, fontSize: 14 }}
                />
              </Box>
            )}

            {/* Filter */}
            {showFillter && (
              <Box>
                <FilterDropdown
                  filterOptions={filterOptions}
                  uniqueValues={uniqueValues}
                  onFiltersChange={setFilters}
                  filters={filters}
                  selectedField={selectedFilterField}
                  onFieldSelect={setSelectedFilterField}
                />
              </Box>
            )}

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
                // style={{ marginRight: "8px" }}
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
                {/* <Typography fontSize={12}>Download excel</Typography>  */}
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
              {paginatedRows.length > 0 ? (
                paginatedRows?.map((row, index) => (
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
                      {/* Add expand/collapse button in the last column */}
                      {renderExpandedRow && (
                        <TableCell>
                          <IconButton
                            onClick={() => toggleExpandRow(row._id)}
                            size="small"
                            sx={{ padding: 0 }}
                          >
                            {expandedRowId === row._id ? (
                              <FaChevronUp size={14} />
                            ) : (
                              <FaChevronDown size={14} />
                            )}
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>

                    {/* Expanded row content */}
                    {renderExpandedRow && expandedRowId === row._id && (
                      <TableRow>
                        <TableCell
                          colSpan={tableHeader.length + (tableHeader[0].id === "checkbox" ? 1 : 0) + 1}
                          sx={{
                            padding: 0,
                            backgroundColor: "#f9f9f9",
                            borderBottom: "2px solid #F2F4F7",
                          }}
                        >
                          <Collapse in={expandedRowId === (row as any)._id} timeout="auto" unmountOnExit>
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
      {filteredRows.length > 0 && (
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
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
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
            onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
          >
            Next →
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default BasicTable;