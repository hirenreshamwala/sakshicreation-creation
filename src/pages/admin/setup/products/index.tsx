// pages/ProductsPage.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Chip,
  Button as MuiButton,
} from "@mui/material";
import { Add, Edit, Delete, CloudUpload } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import AddNewProductBulkDialog from "@/component/AddNewProductBulkDialog";
import {
  createProductItemThunk,
  getAllProductItemsThunk,
  getProductItemFiltersThunk,
  updateProductItemThunk,
  deleteProductItemThunk,
  bulkCreateProductItemsThunk,
  clearProductItemError,
  clearProductItemSuccessMessage,
  setProductItemFilters,
} from "@/store/slices/productItemSlice";
import { RootState, useAppDispatch, useAppSelector } from "@/store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

interface ProductItem {
  _id: string;
  itemName: string;
  createdAt?: string;
  updatedAt?: string;
}

const columns = [
  { id: "id", label: "ID" },
  { id: "itemName", label: "Name" },
  { id: "options", label: "Options" },
];

const ProductsPage = () => {
  const dispatch = useAppDispatch();
  const {
    productItems,
    loading,
    error,
    successMessage,
    pagination,
    filters,
    availableFilters = { itemNames: [] },
  } = useAppSelector((state: RootState) => state.productItems);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ itemName: "" });
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

  // Fetch data
  const fetchData = useCallback(() => {
    const apiFilters: any = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || "",
    };
    if (activeFilters["Name"]?.length) apiFilters.itemNames = activeFilters["Name"];
    dispatch(getAllProductItemsThunk(apiFilters));
  }, [dispatch, filters, activeFilters]);

  useEffect(() => {
    dispatch(getProductItemFiltersThunk());
    fetchData();
  }, [dispatch, fetchData]);

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.search, activeFilters]);

  // Handle success and error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProductItemSuccessMessage());
      fetchData(); // Refresh after create/update/delete/bulk
    }
    if (error) {
      toast.error(error);
      dispatch(clearProductItemError());
    }
  }, [successMessage, error, dispatch, fetchData]);

  // Open dialog for add or edit
  const handleOpenDialog = (product?: ProductItem) => {
    if (product) {
      setEditId(product._id);
      setForm({ itemName: product.itemName });
    } else {
      setEditId(null);
      setForm({ itemName: "" });
    }
    setDialogOpen(true);
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ itemName: e.target.value });
  };

  // Save new or edited product
  const handleSave = () => {
    if (!form.itemName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const productData = { itemName: form.itemName };

    if (editId) {
      dispatch(updateProductItemThunk({ id: editId, data: productData }));
    } else {
      dispatch(createProductItemThunk(productData));
    }

    setDialogOpen(false);
    setForm({ itemName: "" });
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteProductItemThunk(id)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: "Product deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete product",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  const handleFilterChange = (newFilters: { [key: string]: string[] }) => {
    setActiveFilters(newFilters);
    dispatch(setProductItemFilters({ page: 1 }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    dispatch(setProductItemFilters({ page: 1, search: "" }));
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Products</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => {/* Download Sample */}}>
            Download Sample CSV
          </Button>
          <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setBulkDialogOpen(true)}>
            Bulk Upload
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            New Product
          </Button>
        </Box>
      </Box>

      {activeFilterCount > 0 && (
        <Box mb={2} display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="body2" color="textSecondary">Filters:</Typography>
          {Object.entries(activeFilters).map(([field, values]) =>
            values.map((val) => (
              <Chip
                key={`${field}-${val}`}
                label={`${field}: ${val}`}
                onDelete={() => {
                  const updated = activeFilters[field].filter((v) => v !== val);
                  setActiveFilters((prev) => ({
                    ...prev,
                    [field]: updated.length ? updated : [],
                  }));
                }}
                size="small"
                color="primary"
              />
            ))
          )}
          <Button size="small" onClick={clearAllFilters}>Clear All</Button>
        </Box>
      )}

      <BasicTable
        serverSide={true}
        tableHeader={columns}
        rowData={productItems}
        loading={loading}
        totalCount={pagination?.totalItems || 0}
        pagination={pagination}
        onPageChange={(page) => dispatch(setProductItemFilters({ page }))}
        onSearchChange={(search) => dispatch(setProductItemFilters({ search, page: 1 }))}
        onFilterChange={handleFilterChange}
        availableFilters={{
          "Name": availableFilters.itemNames,
        }}
        showExcelDownload={true}
        excelHeaders={["Name"]}
        renderRow={(row: ProductItem, idx: number) => (
          <>
            <TableCell>{(filters.page - 1) * filters.limit + idx + 1}</TableCell>
            <TableCell>{row.itemName}</TableCell>
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

      {/* Add/Edit Dialog */}
      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Product" : "New Product"}>
        <form>
          <Box display="grid" gap={2}>
            <Input label="Product Name" name="itemName" value={form.itemName} onChange={handleFormChange} />
          </Box>
          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="button" variant="contained" onClick={handleSave}>
              Save
            </Button>
          </Box>
        </form>
      </CustomDialog>

      {/* Bulk Dialog */}
      <AddNewProductBulkDialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} refreshData={fetchData} />
    </Box>
  );
};

export default ProductsPage;