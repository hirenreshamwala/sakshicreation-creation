import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Stack,
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

const columns = [
  { id: 'id', label: 'ID' },
  { id: 'companyName', label: 'Company Name' },
  { id: 'name', label: 'Vendor Name' },
  { id: 'contactNumber', label: 'Contact Number' },
  { id: 'whatsappNumber', label: 'WhatsApp Number' },
  { id: 'gst', label: 'GST' },
  { id: 'address', label: 'Address' },
  { id: 'action', label: 'Actions' },
];

const VendorPage = () => {
  const dispatch = useAppDispatch();
  const { vendors, loading, error } = useAppSelector((state) => state.vendors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorForm>({
    companyName: '',
    name: '',
    contactNumber: '',
    whatsappNumber: '',
    gst: '',
    address: '',
  });
  const [gstError, setGstError] = useState<string | null>(null);

  // Fetch vendors on component mount
  useEffect(() => {
    dispatch(getAllVendorsThunk())
      .unwrap()
      .catch((err) => toast.error(err));
  }, [dispatch]);

  // Open dialog for add or edit
  const handleOpenDialog = (vendor?: any) => {
    if (vendor) {
      setEditId(vendor._id);
      setForm({
        companyName: vendor.companyName?._id || vendor.companyName || '',
        name: vendor.name,
        contactNumber: vendor.contactNumber,
        whatsappNumber: vendor.whatsappNumber,
        gst: vendor.gst || '',
        address: vendor.address,
      });
      setGstError(null); // Reset GST error on open
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
      setGstError(null); // Reset GST error on open
    }
    setDialogOpen(true);
  };

  // GST validation function
  const validateGST = (gst: string): string | null => {
    if (!gst) return null; // GST is optional
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) {
      return 'GST number must be a valid 15-character GSTIN (e.g., 27AAAAA0000A1Z5)';
    }
    return null;
  };

  // Handle GST input change with validation
  const handleGstChange = (value: string) => {
    const upperCaseValue = value.toUpperCase();
    setForm((f) => ({ ...f, gst: upperCaseValue }));
    setGstError(validateGST(upperCaseValue));
  };

  // Save new or edited vendor
  const handleSave = async () => {
    if (
      !form.companyName.trim() ||
      !form.name.trim() ||
      !form.contactNumber.trim() ||
      !form.whatsappNumber.trim() ||
      !form.address.trim()
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    if (
      form.contactNumber.length !== 10 ||
      form.whatsappNumber.length !== 10
    ) {
      toast.error('Contact and WhatsApp numbers must be 10 digits');
      return;
    }

    if (form.gst && validateGST(form.gst)) {
      toast.error(validateGST(form.gst));
      return;
    }

    try {
      if (editId) {
        await dispatch(
          updateVendorThunk({
            id: editId,
            data: {
              companyName: form.companyName,
              name: form.name,
              contactNumber: form.contactNumber,
              whatsappNumber: form.whatsappNumber,
              gst: form.gst,
              address: form.address,
            },
          })
        ).unwrap();
        toast.success('Vendor updated successfully');
      } else {
        await dispatch(
          createVendorThunk({
            companyName: form.companyName,
            name: form.name,
            contactNumber: form.contactNumber,
            whatsappNumber: form.whatsappNumber,
            gst: form.gst,
            address: form.address,
          })
        ).unwrap();
        toast.success('Vendor created successfully');
      }
      setDialogOpen(false);
      setForm({
        companyName: '',
        name: '',
        contactNumber: '',
        whatsappNumber: '',
        gst: '',
        address: '',
      });
      setEditId(null);
      setGstError(null);
    } catch (err: any) {
      toast.error(err || 'Failed to save vendor');
    }
  };

  // Delete vendor with confirmation
  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteVendorThunk(id))
          .unwrap()
          .then(() => {
            toast.success(`${name} has been deleted.`);
          })
          .catch((err) => {
            toast.error(err || 'Failed to delete vendor');
          });
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Vendors
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, mr: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            New Vendor
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setBulkDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 600, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            Bulk Upload
          </Button>
        </Box>
      </Box>
      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={vendors}
        loading={loading}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.companyName?.companyName || 'N/A'}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.contactNumber}</TableCell>
            <TableCell>{row.whatsappNumber}</TableCell>
            <TableCell>{row.gst || 'N/A'}</TableCell>
            <TableCell>{row.address}</TableCell>
            <TableCell>
              <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                <Edit />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => handleDelete(row._id, row.name)}
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
        title={editId ? 'Edit Vendor' : 'New Vendor'}
        maxWidth="md"
        fullWidth
      >
        <Stack direction="row" spacing={2} mb={2}>
          <CompanySelect
            name="companyName"
            value={form.companyName}
            onChange={(event, newValue) => {
              setForm((f) => ({ ...f, companyName: newValue ? newValue.value : '' }));
            }}
            required
            sx={{ flex: 1 }}
          />
          <Input
            labelName="Vendor Name"
            value={form.name}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <Input
            labelName="Contact Number"
            value={form.contactNumber}
            onChange={(e: any) =>
              setForm((f) => ({
                ...f,
                contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
              }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
          <Input
            labelName="WhatsApp Number"
            value={form.whatsappNumber}
            onChange={(e: any) =>
              setForm((f) => ({
                ...f,
                whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
              }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <Input
            labelName="GST Number"
            value={form.gst}
            onChange={(e: any) => handleGstChange(e.target.value)}
            fullWidth
            error={!!gstError}
            helperText={gstError}
            sx={{ flex: 1 }}
          />
          <Input
            labelName="Address"
            value={form.address}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
        </Stack>
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
            sx={{ borderRadius: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
            disabled={loading || !!gstError}
          >
            Save
          </Button>
        </Box>
      </CustomDialog>
      <AddNewVendorBulkDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        refreshData={() => dispatch(getAllVendorsThunk())}
      />
    </Box>
  );
};

export default VendorPage;