import { useState, useEffect, useCallback, Fragment, memo } from "react";
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
  Checkbox,
  Tooltip,
} from "@mui/material";
import Button from "@/component/common_component/themebutton";
import moment from "moment";

interface Column {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface BasicTableProps<T> {
  tableHeader: Column[];
  rowData: T[];
  renderRow: (row: T, index: number) => React.ReactNode;
  onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectRow?: (id: string) => void;
  selectedRows?: string[];
  count?: any;
  page?: any;
  handlePageChange?: (date: string, page: number) => void;
  date?: any;
  showHeaderCheckbox?: boolean;
  getRowColor?: (row: T) => string;
}

// Function to check if lastStatusChangeDate date is older than 3 days
const isStatusChangeOlderThanThreeDays = (lastStatusChangeDate: string | Date | null): boolean => {
  if (!lastStatusChangeDate) return false;

  const statusChangeDate = moment(lastStatusChangeDate);
  const threeDaysAgo = moment().subtract(3, 'days');

  return statusChangeDate.isBefore(threeDaysAgo);
};

const CustomTable2 = <T extends { id: string; lastStatusChangeDate?: string | Date }>({
  tableHeader,
  rowData,
  renderRow,
  onSelectAll,
  onSelectRow,
  showHeaderCheckbox = true,
  selectedRows = [],
  count,
  page: currentPage,
  handlePageChange,
  date,
  getRowColor,
}: BasicTableProps<T>) => {
  const rowsPerPage = 10;
  const [page, setPage] = useState<any>(currentPage - 1 || 0);
  const [colWidths, setColWidths] = useState<number[]>([]);

  const handleSetPage = (newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
    handlePageChange(date as any, newPage === 0 ? 1 : newPage + 1 as any);
  };

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

  const pageCount = Math.ceil(count / rowsPerPage);

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

  const getPaginationItems = () => {
    const items: React.ReactNode[] = [];

    items.push(
      <Button
        key={0}
        variant="outlined"
        size="small"
        onClick={() => handleSetPage(0)}
        disabled={pageCount === 1}
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

    if (page > 3) {
      items.push(
        <Typography key="ellipsis-start" sx={{ alignSelf: "center", px: 1, color: "#667085" }}>
          ...
        </Typography>
      );
    }

    const start = Math.max(1, page - 1);
    const end = Math.min(pageCount - 2, page + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <Button
          key={i}
          variant="outlined"
          size="small"
          onClick={() => handleSetPage(i)}
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

    if (page < pageCount - 4) {
      items.push(
        <Typography key="ellipsis-end" sx={{ alignSelf: "center", px: 1, color: "#667085" }}>
          ...
        </Typography>
      );
    }

    if (pageCount > 1) {
      items.push(
        <Button
          key={pageCount - 1}
          variant="outlined"
          size="small"
          onClick={() => handleSetPage(pageCount - 1)}
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

  return (
    <Paper elevation={0} sx={{ width: "100%", overflow: "hidden", p: 0, maxWidth: "100%" }}>
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
              </TableRow>
            </TableHead>

            <TableBody>
              {rowData.length > 0 ? (
                rowData?.map((row, index) => (
                  <Fragment key={row?.id}>
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
                      {tableHeader[0]?.id === "checkbox" && onSelectRow && (
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.some((r) => r._id === row._id)}
                            onChange={() => onSelectRow(row)}
                          />
                        </TableCell>
                      )}
                      {renderRow(row, index)}

                    </TableRow>
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableHeader.length}
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
      {count > 0 && (
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
            onClick={() => handleSetPage(Math.max(page - 1, 0))}
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
            onClick={() => handleSetPage(Math.min(page + 1, pageCount - 1))}
          >
            Next →
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default memo(CustomTable2);