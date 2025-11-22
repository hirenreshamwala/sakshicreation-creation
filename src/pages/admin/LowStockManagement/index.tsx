import React, { useEffect, useState } from 'react';
import {
  Box,
  TableCell,
  IconButton,
  Stack,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import ThemeButton from '@/component/common_component/themebutton';
import BasicTable from '@/component/common_component/Table/themetable';
import ThemeInput from '@/component/common_component/themeinput';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  getAllLowStocksThunk,
  createLowStockThunk,
  updateLowStockThunk,
  deleteLowStockThunk,
  clearError,
  clearSuccessMessage,
} from '@/store/slices/lowStockSlice';
import { getAllPackagingOptionsThunk } from '@/store/slices/packagingOptionSlice';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const columns = [
  { id: 'deckal', label: 'DECKAL' },
  { id: 'gsm', label: 'GSM' },
  { id: 'bf', label: 'BF' },
  { id: 'color', label: 'COLOR' },
  { id: 'minKg', label: 'MIN KG' },
  { id: 'actions', label: 'ACTIONS' },
];

const colorOptions = [
  { value: 'natural', label: 'Natural' },
  { value: 'gold', label: 'Gold' },
  { value: 'white', label: 'White' },
];

const LowStockPage = () => {
  const dispatch = useAppDispatch();
  const { lowStocks, loading, error, successMessage } = useAppSelector(
    (state) => state.lowStock
  );
  const { packagingOptions } = useAppSelector((state) => state.packagingOptions);

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    deckal: '',
    gsm: '',
    bf: '',
    color: '',
    minKg: '',
  });

  const [deckalOptions, setDeckalOptions] = useState<{ value: string; label: string }[]>([]);
  const [gsmOptions, setGsmOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch data on mount
  useEffect(() => {
    dispatch(getAllLowStocksThunk());
    if (!packagingOptions.length) {
      dispatch(getAllPackagingOptionsThunk());
    }
  }, [dispatch]);

  // Setup options from packaging data
  useEffect(() => {
    if (packagingOptions.length) {
      // Unique Deckal options
      const uniqueDeckals = Array.from(
        new Set(packagingOptions.map((opt) => opt.deckal).filter(Boolean))
      ).map((deckal) => ({ value: deckal, label: deckal }));
      setDeckalOptions(uniqueDeckals);

      // Unique GSM options
      const allGsms = packagingOptions.flatMap((opt) => [
        opt.paper1GSM,
        opt.paper2GSM,
        opt.paper3GSM,
      ]);
      const uniqueGsms = Array.from(new Set(allGsms.filter(Boolean))).map((gsm) => ({
        value: gsm,
        label: gsm,
      }));
      setGsmOptions(uniqueGsms);
    }
  }, [packagingOptions]);

  // Handle success/error messages
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [error, successMessage, dispatch]);

  const handleOpenDialog = () => {
    setEditMode(false);
    setCurrentId(null);
    setFormData({ deckal: '', gsm: '', bf: '', color: '', minKg: '' });
    setOpenDialog(true);
  };

  const handleEdit = (lowStock: any) => {
    console.log('Editing low stock:', lowStock); // Debug log
    setEditMode(true);
    setCurrentId(lowStock.id || lowStock._id); // Handle both id and _id
    setFormData({
      deckal: lowStock.deckal,
      gsm: lowStock.gsm,
      bf: lowStock.bf,
      color: lowStock.color,
      minKg: lowStock.minKg.toString(),
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error('Invalid ID');
      return;
    }

    console.log('Deleting low stock with ID:', id); // Debug log

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A409F8',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      await dispatch(deleteLowStockThunk(id));
      dispatch(getAllLowStocksThunk());
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.deckal || !formData.gsm || !formData.bf || !formData.color || !formData.minKg) {
      toast.error('All fields are required');
      return;
    }

    const minKg = Number(formData.minKg);
    if (isNaN(minKg) || minKg < 0) {
      toast.error('Minimum KG must be a valid positive number');
      return;
    }

    const payload = {
      deckal: formData.deckal,
      gsm: formData.gsm,
      bf: formData.bf,
      color: formData.color,
      minKg,
    };

    try {
      if (editMode && currentId) {
        await dispatch(updateLowStockThunk({ id: currentId, data: payload })).unwrap();
      } else {
        await dispatch(createLowStockThunk(payload)).unwrap();
      }
      setOpenDialog(false);
      dispatch(getAllLowStocksThunk());
    } catch (err: any) {
      toast.error(err);
    }
  };

  const rows = lowStocks.map((item) => ({
    id: item.id || item._id, // Handle both id and _id
    _id: item._id,
    deckal: item.deckal,
    gsm: item.gsm,
    bf: item.bf,
    color: item.color,
    minKg: item.minKg,
  }));

  console.log('Low stocks rows:', rows); // Debug log

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Low Stock Management - Paper</h2>
        <ThemeButton onClick={handleOpenDialog} startIcon={<Add />}>
          Add Low Stock Rule
        </ThemeButton>
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={rows}
        renderRow={(row) => (
          <>
            <TableCell>{row.deckal}</TableCell>
            <TableCell>{row.gsm}</TableCell>
            <TableCell>{row.bf}</TableCell>
            <TableCell>{row.color}</TableCell>
            <TableCell>{row.minKg} KG</TableCell>
            <TableCell>
              <IconButton onClick={() => handleEdit(row)} color="primary">
                <Edit />
              </IconButton>
              <IconButton 
                onClick={() => handleDelete(row.id)} 
                color="error"
                disabled={!row.id}
              >
                <Delete />
              </IconButton>
            </TableCell>
          </>
        )}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit' : 'Add'} Low Stock Configuration</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Autocomplete
              options={deckalOptions}
              value={deckalOptions.find((opt) => opt.value === formData.deckal) || null}
              onChange={(e, newValue) =>
                setFormData((prev) => ({ ...prev, deckal: newValue?.value || '' }))
              }
              renderInput={(params) => <TextField {...params} label="DECKAL" required />}
            />

            <Autocomplete
              options={gsmOptions}
              value={gsmOptions.find((opt) => opt.value === formData.gsm) || null}
              onChange={(e, newValue) =>
                setFormData((prev) => ({ ...prev, gsm: newValue?.value || '' }))
              }
              renderInput={(params) => <TextField {...params} label="GSM" required />}
            />

            <ThemeInput
              labelName="BF"
              value={formData.bf}
              onChange={(e) => setFormData((prev) => ({ ...prev, bf: e.target.value }))}
              required
              fullWidth
            />

            <Autocomplete
              freeSolo
              options={colorOptions.map((opt) => opt.label)}
              value={formData.color}
              onChange={(e, newValue) =>
                setFormData((prev) => ({ ...prev, color: newValue || '' }))
              }
              onInputChange={(e, newValue) =>
                setFormData((prev) => ({ ...prev, color: newValue || '' }))
              }
              renderInput={(params) => <TextField {...params} label="COLOR" required />}
            />

            <ThemeInput
              labelName="MINIMUM KG"
              type="number"
              value={formData.minKg}
              onChange={(e) => setFormData((prev) => ({ ...prev, minKg: e.target.value }))}
              required
              fullWidth
              placeholder="e.g., 1000"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LowStockPage;
