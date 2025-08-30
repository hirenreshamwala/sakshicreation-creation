import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import AddNewProductBulkDialog from "@/component/AddNewProductBulkDialog";
import {
  createProductItemThunk,
  getAllProductItemsThunk,
  updateProductItemThunk,
  deleteProductItemThunk,
  clearProductItemError,
  clearProductItemSuccessMessage,
} from "@/store/slices/productItemSlice";
import { RootState } from "@/store";
import { toast } from "react-toastify";

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
  const dispatch = useDispatch();
  const { productItems, loading, error, successMessage } = useSelector(
    (state: RootState) => state.productItems
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ itemName: "" });

  // Fetch all products on component mount
  useEffect(() => {
    dispatch(getAllProductItemsThunk());
  }, [dispatch]);

  // Handle success and error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProductItemSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearProductItemError());
    }
  }, [successMessage, error, dispatch]);

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

    const productData = {
      itemName: form.itemName,
    };

    if (editId) {
      dispatch(updateProductItemThunk({ id: editId, data: productData }));
    } else {
      dispatch(createProductItemThunk(productData));
    }

    setDialogOpen(false);
    setForm({ itemName: "" });
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteProductItemThunk(id));
  };

  return (
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={600}>
            Products
          </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 600, mr: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            New Product
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setBulkDialogOpen(true)}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 600, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            Bulk Upload
          </Button>
        </Box>
      </Box>
        <BasicTable
          tableHeader={columns}
          rowData={productItems}
          showDatePicker={false}
          renderRow={(row: ProductItem, idx: number) => (
            <>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{row.itemName}</TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenDialog(row)}
                  disabled={loading}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(row._id)}
                  disabled={loading}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </>
          )}
        />

        {/* Add/Edit Dialog */}
        <CustomDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editId ? "Edit Product" : "New Product"}
          maxWidth="xs"
          fullWidth
        >
          <Input
            label="Product Name"
            name="itemName"
            value={form.itemName}
            onChange={handleFormChange}
            fullWidth
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button
              onClick={() => setDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2, borderColor: '#A409F8', color: '#A409F8', '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' } }}
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              sx={{ borderRadius: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
            >
              Save
            </Button>
          </Box>
        </CustomDialog>
        <AddNewProductBulkDialog
          open={bulkDialogOpen}
          onClose={() => setBulkDialogOpen(false)}
          refreshData={() => dispatch(getAllProductItemsThunk())}
        />
      </Box>
  );
};

export default ProductsPage;