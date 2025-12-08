import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Stack,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import BasicTable from '@/component/common_component/Table/themetable';
import Input from '@/component/common_component/themeinput';
import Button from '@/component/common_component/themebutton';
import CustomDialog from '@/component/customdialog';
import CompanySelect from '@/component/reusablecomponents/CompanyWithPartyName';
import AddNewVendorBulkDialog from '@/component/AddNewVendorBulkDialog';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  getAllVendorsThunk,
  createVendorThunk,
  updateVendorThunk,
  deleteVendorThunk,
  clearError,
} from '@/store/slices/vendorSlice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface VendorForm {
  companyName: string;
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  gst: string;
  address: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

const columns = [
  { id: 'id', label: 'ID' },
  { id: 'companyName', label: 'Company Name' },
  { id: 'name', label: 'Vendor Name' },
  { id: 'contactNumber', label: 'Contact' },
  { id: 'whatsappNumber', label: 'WhatsApp' },
  { id: 'gst', label: 'GST' },
  { id: 'address', label: 'Address' },
  { id: 'action', label: 'Actions' },
];

const VendorPage = () => {
  const dispatch = useAppDispatch();
  const { vendors, loading } = useAppSelector((state) => state.vendors);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [form, setForm] = useState<VendorForm>({
    companyName: '',
    name: '',
    contactNumber: '',
    whatsappNumber: '',
    gst: '',
    address: '',
  });
  const [gstError, setGstError] = useState<string | null>(null);

  // Fetch vendors with pagination
  const fetchVendors = () => {
    dispatch(getAllVendorsThunk({ page, limit }))
      .unwrap()
      .then((res: any) => {
        // Assuming your backend returns: { data: [...], pagination: { totalItems, currentPage, totalPages, limit } }
        if (res.pagination) {
          setTotalItems(res.pagination.totalItems || 0);
        }
      })
      .catch((err) => toast.error(err));
  };

  useEffect(() => {
    fetchVendors();
  }, [page, limit]);

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: any) => {
    setLimit(event.target.value);
    setPage(1); // Reset to first page
  };

  // Open dialog (add/edit)
  const handleOpenDialog = (vendor?: any) => {
    if (vendor) {
      setEditId(vendor._id);
      setForm({
        companyName: vendor.companyName?._id || vendor.companyName || '',
        name: vendor.name || '',
        contactNumber: vendor.contactNumber || '',
        whatsappNumber: vendor.whatsappNumber || '',
        gst: vendor.gst || '',
        address: vendor.address || '',
      });
    } else {
      setEditId(null);
      setForm({
        companyName: '',
        name: '',
        contactNumber: '',
        whatsappNumber: '',
        gst: '',
        address: '',
      });
    }
    setGstError(null);
    setDialogOpen(true);
  };

  const validateGST = (gst: string): string | null => {
    if (!gst) return null;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst) ? null : 'Invalid GSTIN format';
  };

  const handleGstChange = (value: string) => {
    const upper = value.toUpperCase();
    setForm((f) => ({ ...f, gst: upper }));
    setGstError(validateGST(upper));
  };

  const handleSave = async () => {
    if (!form.companyName || !form.name || !form.contactNumber || !form.whatsappNumber || !form.address) {
      toast.error('All fields except GST are required');
      return;
    }
    if (form.contactNumber.length !== 10 || form.whatsappNumber.length !== 10) {
      toast.error('Contact & WhatsApp must be 10 digits');
      return;
    }
    if (form.gst && validateGST(form.gst)) {
      toast.error('Please enter a valid GST number');
      return;
    }

    try {
      if (editId) {
        await dispatch(updateVendorThunk({ id: editId, data: form })).unwrap();
        toast.success('Vendor updated');
      } else {
        await dispatch(createVendorThunk(form)).unwrap();
        toast.success('Vendor created');
      }
      setDialogOpen(false);
      fetchVendors(); // Refresh current page
    } catch (err: any) {
      toast.error(err || 'Operation failed');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: 'Delete Vendor?',
      text: `${name} will be deleted permanently`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteVendorThunk(id))
          .unwrap()
          .then(() => {
            toast.success('Vendor deleted');
            fetchVendors();
          })
          .catch(() => toast.error('Delete failed'));
      }
    });
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Vendors ({totalItems})
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setBulkDialogOpen(true)}
            sx={{ bgcolor: '#7B06C2', '&:hover': { bgcolor: '#6b05a8' } }}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#A409F8', '&:hover': { bgcolor: '#7B06C2' } }}
          >
            New Vendor
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <BasicTable
        tableHeader={columns}
       rowData={vendors?.data || vendors || []}
        loading={loading}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
            <TableCell>{row.companyName?.companyName || 'N/A'}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.contactNumber}</TableCell>
            <TableCell>{row.whatsappNumber}</TableCell>
            <TableCell>{row.gst || '—'}</TableCell>
            <TableCell>{row.address}</TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpenDialog(row)}>
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(row._id, row.name)}>
                <Delete fontSize="small" />
              </IconButton>
            </TableCell>
          </>
        )}
      />

      {/* Pagination Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
        <FormControl size="small">
          <InputLabel>Rows per page</InputLabel>
          <Select value={limit} label="Rows per page" onChange={handleLimitChange}>
            {[10, 25, 50].map((val) => (
              <MenuItem key={val} value={val}>
                {val}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack spacing={2}>
          <Pagination
          count={Math.ceil(totalItems / limit)}
          page={page}
          onChange={handlePageChange}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          siblingCount={1}
          boundaryCount={1}
        />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} vendors
        </Typography>
      </Box>

      {/* Add/Edit Dialog */}
      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? 'Edit Vendor' : 'New Vendor'} maxWidth="md" fullWidth>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2}>
            <CompanySelect
              value={form.companyName}
              onChange={(_, newValue) => setForm(f => ({ ...f, companyName: newValue?.value || '' }))}
              required
              sx={{ flex: 1 }}
            />
            <Input
              labelName="Vendor Name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Input
              labelName="Contact Number *"
              value={form.contactNumber}
              onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value.replace(/\D/g, '').slice(0,10) }))}
              fullWidth
            />
            <Input
              labelName="WhatsApp Number *"
              value={form.whatsappNumber}
              onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0,10) }))}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Input
              labelName="GST Number"
              value={form.gst}
              onChange={e => handleGstChange(e.target.value)}
              error={!!gstError}
              helperText={gstError}
              fullWidth
            />
            <Input
              labelName="Address *"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || !!gstError}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {editId ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Stack>
      </CustomDialog>

      <AddNewVendorBulkDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        refreshData={() => {
          setPage(1);
          fetchVendors();
        }}
      />
    </Box>
  );
};

export default VendorPage;