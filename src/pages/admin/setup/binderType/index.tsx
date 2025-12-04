"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Chip,
  Button,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
// import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import {
  createBinderTypeThunk,
  getAllBinderTypesThunk,
  getBinderTypeFiltersThunk,
  updateBinderTypeThunk,
  deleteBinderTypeThunk,
  clearBinderTypeError,
  clearBinderTypeSuccessMessage,
  setBinderTypeFilters,
} from "@/store/slices/binderTypeSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const columns = [
  { id: "id", label: "ID" },
  { id: "name", label: "Binder Name" },
  { id: "options", label: "Options" },
];

const BinderTypesPage = () => {
  const dispatch = useAppDispatch();
  const {
    binderTypes = [],
    loading = false,
    error,
    successMessage,
    pagination,
    filters,
    availableFilters = { binderNames: [] },
  } = useAppSelector((state: any) => state.binderType || {});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

  const fetchData = useCallback(() => {
    const apiFilters: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      search: filters?.search || "",
    };
    if (activeFilters["Binder Name"]?.length) {
      apiFilters.binderNames = activeFilters["Binder Name"];
    }
    dispatch(getAllBinderTypesThunk(apiFilters));
  }, [dispatch, filters, activeFilters]);

  useEffect(() => {
    dispatch(getBinderTypeFiltersThunk());
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters?.page, filters?.search, activeFilters]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearBinderTypeSuccessMessage());
      fetchData();
    }
    if (error) {
      toast.error(error);
      dispatch(clearBinderTypeError());
    }
  }, [successMessage, error]);

  const handleOpenDialog = (binder?: any) => {
    if (binder) {
      setEditId(binder._id);
      setForm({ name: binder.name });
    } else {
      setEditId(null);
      setForm({ name: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (editId) {
      dispatch(updateBinderTypeThunk({ id: editId, data: { name: form.name } }));
    } else {
      dispatch(createBinderTypeThunk({ name: form.name }));
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: "Delete?", text: "Cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33"
    });
    if (res.isConfirmed) {
      await dispatch(deleteBinderTypeThunk(id)).unwrap();
      toast.success("Deleted");
      fetchData();
    }
  };

  const handleFilterChange = (newFilters: { [key: string]: string[] }) => {
    setActiveFilters(newFilters);
    dispatch(setBinderTypeFilters({ page: 1 }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    dispatch(setBinderTypeFilters({ page: 1, search: "" }));
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Binder Types</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          New Binder
        </Button>
      </Box>

      {activeFilterCount > 0 && (
        <Box mb={2} display="flex" gap={1} flexWrap="wrap">
          <Typography variant="body2" color="textSecondary">Filters:</Typography>
          {Object.entries(activeFilters).map(([k, vals]) =>
            vals.map(v => (
              <Chip
                key={v}
                label={`${k}: ${v}`}
                onDelete={() => setActiveFilters(prev => ({
                  ...prev,
                  [k]: prev[k].filter(x => x !== v)
                }))}
                size="small"
                color="primary"
              />
            ))
          )}
          <Button size="small" onClick={clearAllFilters}>Clear</Button>
        </Box>
      )}

      <BasicTable
        serverSide={true}
        tableHeader={columns}
        rowData={binderTypes}
        loading={loading}
        totalCount={pagination?.totalItems || 0}
        pagination={pagination}
        onPageChange={(page) => dispatch(setBinderTypeFilters({ page }))}
        onSearchChange={(search) => dispatch(setBinderTypeFilters({ search, page: 1 }))}
        onFilterChange={handleFilterChange}
        availableFilters={{
          "Binder Name": availableFilters.binderNames || [],
        }}
        showExcelDownload={true}
        excelHeaders={["Binder Name"]}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{(filters?.page - 1) * (filters?.limit || 10) + idx + 1}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>
              <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                <Edit />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(row._id)}>
                <Delete />
              </IconButton>
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit" : "New Binder"}>
        <Input label="Binder Name" value={form.name} onChange={e => setForm({ name: e.target.value })} />
        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default BinderTypesPage;