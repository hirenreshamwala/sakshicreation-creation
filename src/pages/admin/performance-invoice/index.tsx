"use client";

import React, { useState, useEffect } from "react";
import { Box, TableCell, Typography, IconButton } from "@mui/material";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllPerformanceInvoicesThunk,
  deletePerformanceInvoiceThunk,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/performanceInvoiceSlice";
import Dashboard from "@/component/Dashboard";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import AddNewPerformanceInvoiceDialog from "@/component/PerformanceInvoice/AddNewPerformanceInvoiceDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { authService } from "@/services/auth.service";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";

interface Company {
  name: string;
  avatar?: string;
  _id?: string; // Added to handle potential ID if available
}

interface RowData {
  id: string;
  company: Company;
  createdDate: string;
  party: string;
  orderNumber: string;
  quantity: number;
  unitPrice: number;
  total: number;
  applyGST: boolean;
  finalAmount: number;
  servicePerformance: string;
}

const columns = [
  { id: "company", label: "Company" },
  { id: "createdDate", label: "Created Date" },
  { id: "party", label: "Party" },
  { id: "orderNumber", label: "Order Number" },
  { id: "quantity", label: "Quantity" },
  { id: "unitPrice", label: "Unit Price" },
  { id: "total", label: "Total" },
  { id: "applyGST", label: "GST Applied" },
  { id: "finalAmount", label: "Final Amount" },
  { id: "servicePerformance", label: "Service/Performance" },
  { id: "action", label: "Action" },
];

const PerformanceInvoicePage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { performanceInvoices, loading, error, successMessage } = useAppSelector(
    (state) => state.performanceInvoices
  );
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const handleAddNew = () => {
    setEditId(null);
    setOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the performance invoice!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deletePerformanceInvoiceThunk(id)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: "Performance invoice deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
        dispatch(getAllPerformanceInvoicesThunk());
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete performance invoice",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditId(null);
  };

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    dispatch(getAllPerformanceInvoicesThunk());

    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch, router]);

  const formattedRows: RowData[] = performanceInvoices.map((invoice: any) => {
    console.log("Invoice Data:", invoice); // Debug log to check companyName
    return {
      id: invoice._id,
      company: {
        name: invoice.companyName?.companyName || "N/A", // Updated to use companyName.companyName
        _id: invoice.companyName?._id || "", // Use _id from companyName
      },
      createdDate: new Date(invoice.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }),
      party: invoice.party?.partyName || "N/A",
      orderNumber: invoice.orderNumber || "N/A",
      quantity: invoice.quantity || 0,
      unitPrice: invoice.unitPrice || 0,
      total: invoice.total || 0,
      applyGST: invoice.applyGST || false,
      finalAmount: invoice.finalAmount || 0,
      servicePerformance: invoice.servicePerformance || "N/A",
    };
  });

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "end", alignItems: "center", mb: 2 }}>
        <ThemeButton onClick={handleAddNew}>+ Add New Performance Invoice</ThemeButton>
      </Box>
      {loading ? (
        <Loader />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : formattedRows.length === 0 ? (
        <Typography>No performance invoices found.</Typography>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={formattedRows}
          renderRow={(row: RowData) => (
            <>
              <TableCell
                sx={{ cursor: "pointer", fontWeight: 500 }}
                onClick={() => router.push(`/admin/performance-invoice/view/${row.id}`)}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontWeight={500}>{row.company.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>{row.createdDate}</TableCell>
              <TableCell>{row.party}</TableCell>
              <TableCell>{row.orderNumber}</TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>{row.unitPrice}</TableCell>
              <TableCell>{row.total}</TableCell>
              <TableCell>{row.applyGST ? "Yes" : "No"}</TableCell>
              <TableCell>{row.finalAmount}</TableCell>
              <TableCell>{row.servicePerformance}</TableCell>
              <TableCell>
                <IconButton onClick={() => handleDelete(row.id)}>
                  <DeleteIcon />
                </IconButton>
                <IconButton onClick={() => handleEdit(row.id)}>
                  <EditIcon />
                </IconButton>
              </TableCell>
            </>
          )}
        />
      )}
      <AddNewPerformanceInvoiceDialog
        open={open}
        onClose={handleDialogClose}
        invoiceId={editId ?? undefined}
        refreshData={() => dispatch(getAllPerformanceInvoicesThunk())}
      />
    </>
  );
};

export default PerformanceInvoicePage;