import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CustomDialog from '@/component/customdialog';
import ThemeButton from '@/component/common_component/themebutton';
import ThemeSelect from '@/component/common_component/themeselect';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  bulkCreatePurchasesThunk,
  clearError,
  clearSuccessMessage,
  getCompaniesThunk,
  getRolesThunk,
  getStaffByRoleThunk,
} from '@/store/slices/purchaseSlice';
import { getAllMaterialsThunk } from '@/store/slices/materialSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';

interface FormData {
  vendorName: string;
  companyName: string;
  for: string;
  forCompany: string;
}

interface AddNewPurchaseBulkDialogProps {
  open: boolean;
  onClose: () => void;
  refreshData?: () => void;
}

interface Option {
  value: string;
  label: string;
}

const validationSchema = Yup.object({
  vendorName: Yup.string().required('Vendor Name is required'),
  companyName: Yup.string().required('Company Name is required'),
  for: Yup.string().required('Deliver To is required'),
  forCompany: Yup.string().required('Printer Name is required'),
});

const AddNewPurchaseBulkDialog: React.FC<AddNewPurchaseBulkDialogProps> = ({
  open,
  onClose,
  refreshData,
}) => {
  const dispatch = useAppDispatch();
  const { materials } = useAppSelector((state) => state.materials);
  const { companies, roles, staff, loading: purchaseLoading, error: purchaseError, successMessage } = useAppSelector(
    (state) => state.purchase
  );
  const { vendors } = useAppSelector((state) => state.vendors);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [materialName, setMaterialName] = useState<string>('');
  const [materialGSM, setMaterialGSM] = useState<string>('');
  const [materialSize, setMaterialSize] = useState<string>('');

  const formik = useFormik<FormData>({
    initialValues: {
      vendorName: '',
      companyName: '',
      for: '',
      forCompany: '',
    },
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      if (!file) {
        toast.error('Please select a file to upload');
        return;
      }

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('vendorName', values.vendorName);
        formData.append('companyName', values.companyName);
        formData.append('for', values.for);
        formData.append('forCompany', values.forCompany);
        if (materialName) formData.append('materialName', materialName);
        if (materialGSM) formData.append('materialGSM', materialGSM);
        if (materialSize) formData.append('materialSize', materialSize);

        await dispatch(bulkCreatePurchasesThunk(formData)).unwrap();
        toast.success('Bulk upload completed successfully');
        if (refreshData) refreshData();
        setFile(null);
        setMaterialName('');
        setMaterialGSM('');
        setMaterialSize('');
        formik.resetForm();
        onClose();
      } catch (err: any) {
        toast.error(err.message || 'Bulk upload failed');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const vendorOptions: Option[] = vendors.map((vendor) => ({
    value: vendor._id,
    label: vendor.name,
  }));

  const companyOptions: Option[] = companies.map((company) => ({
    value: company._id,
    label: company.companyName,
  }));

  const allowedRoleNames = ['Booklet & Folder Binder', 'Printer', 'Binder'];
  const roleOptions: Option[] = roles
    .filter((role) => allowedRoleNames.includes(role.roleName))
    .map((role) => ({
      value: role._id,
      label: role.roleName,
    }));

  const staffOptions: Option[] = staff.map((staffMember) => ({
    value: staffMember._id,
    label: `${staffMember.firstName} ${staffMember.lastName}`,
  }));

  const materialNameOptions: Option[] = Array.from(new Set(materials.map((material) => material.materialName))).map(
    (name) => ({
      value: name,
      label: name,
    })
  );

  const getMaterialGSMOptions = () => {
    const filteredMaterials = materials.filter(
      (material) => !materialName || material.materialName === materialName
    );
    return Array.from(new Set(filteredMaterials.map((material) => material.materialGSM.toString()))).map((gsm) => ({
      value: gsm,
      label: `${gsm} GSM`,
    }));
  };

  const getMaterialSizeOptions = () => {
    const filteredMaterials = materials.filter(
      (material) =>
        (!materialName || material.materialName === materialName) &&
        (!materialGSM || material.materialGSM.toString() === materialGSM)
    );
    return Array.from(new Set(filteredMaterials.map((material) => material.materialSize))).map((size) => ({
      value: size,
      label: size,
    }));
  };

  useEffect(() => {
    if (open) {
      dispatch(clearSuccessMessage());
      dispatch(clearError());
      dispatch(getAllMaterialsThunk());
      dispatch(getCompaniesThunk());
      dispatch(getRolesThunk());
      dispatch(getAllVendorsThunk());
      formik.resetForm();
      setFile(null);
      setMaterialName('');
      setMaterialGSM('');
      setMaterialSize('');
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (purchaseError) {
      toast.error(purchaseError);
      dispatch(clearError());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [purchaseError, successMessage, dispatch]);

  useEffect(() => {
    if (formik.values.for) {
      dispatch(getStaffByRoleThunk(formik.values.for));
    } else {
      dispatch({ type: 'purchases/clearStaff' });
    }
  }, [formik.values.for, dispatch]);

  const handleDownloadSample = () => {
    const csvContent = `billNumber,quantity,ratePerSheet,kg\nBILL123,100,10,50\nBILL124,200,15,75`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_purchase_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <CustomDialog open={open} maxWidth="md" onClose={onClose} title="Bulk Upload Purchases">
      <Box sx={{ background: '#fff', borderRadius: 2, p: 3 }} component="form" onSubmit={formik.handleSubmit}>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="VENDOR NAME"
            options={vendorOptions}
            value={vendorOptions.find((opt) => opt.value === formik.values.vendorName) || null}
            onChange={(e, newValue) => formik.setFieldValue('vendorName', newValue?.value || '')}
            required
            fullWidth
            error={formik.touched.vendorName && Boolean(formik.errors.vendorName)}
            helperText={formik.touched.vendorName && formik.errors.vendorName}
          />
          <ThemeSelect
            label="COMPANY NAME"
            options={companyOptions}
            value={companyOptions.find((opt) => opt.value === formik.values.companyName) || null}
            onChange={(e, newValue) => {
              formik.setFieldValue('companyName', newValue?.value || '');
              formik.setFieldValue('for', '');
              formik.setFieldValue('forCompany', '');
              dispatch({ type: 'purchases/clearStaff' });
            }}
            required
            fullWidth
            error={formik.touched.companyName && Boolean(formik.errors.companyName)}
            helperText={formik.touched.companyName && formik.errors.companyName}
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="DELIVER TO"
            options={roleOptions}
            value={roleOptions.find((opt) => opt.value === formik.values.for) || null}
            onChange={(e, newValue) => {
              formik.setFieldValue('for', newValue?.value || '');
              formik.setFieldValue('forCompany', '');
              dispatch({ type: 'purchases/clearStaff' });
            }}
            required
            fullWidth
            disabled={!formik.values.companyName}
            error={formik.touched.for && Boolean(formik.errors.for)}
            helperText={formik.touched.for && formik.errors.for}
          />
          <ThemeSelect
            label="PRINTER NAME"
            options={staffOptions}
            value={staffOptions.find((opt) => opt.value === formik.values.forCompany) || null}
            onChange={(e, newValue) => formik.setFieldValue('forCompany', newValue?.value || '')}
            required
            fullWidth
            disabled={!formik.values.for}
            error={formik.touched.forCompany && Boolean(formik.errors.forCompany)}
            helperText={formik.touched.forCompany && formik.errors.forCompany}
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="MATERIAL NAME"
            options={materialNameOptions}
            value={materialNameOptions.find((opt) => opt.value === materialName) || null}
            onChange={(e, newValue) => {
              setMaterialName(newValue?.value || '');
              setMaterialGSM('');
              setMaterialSize('');
            }}
            required
            fullWidth
          />
          <ThemeSelect
            label="MATERIAL GSM"
            options={getMaterialGSMOptions()}
            value={getMaterialGSMOptions().find((opt) => opt.value === materialGSM) || null}
            onChange={(e, newValue) => {
              setMaterialGSM(newValue?.value || '');
              setMaterialSize('');
            }}
            required
            fullWidth
            disabled={!materialName}
          />
          <ThemeSelect
            label="MATERIAL SIZE"
            options={getMaterialSizeOptions()}
            value={getMaterialSizeOptions().find((opt) => opt.value === materialSize) || null}
            onChange={(e, newValue) => setMaterialSize(newValue?.value || '')}
            required
            fullWidth
            disabled={!materialGSM}
          />
        </Stack>
        <Box mt={2}>
          <Typography fontWeight={500} fontSize={14} mb={1}>
            Bulk Upload
          </Typography>
          <Box
            sx={{
              border: '2px dashed #e0e0e0',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              backgroundColor: '#fafafa',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: '#f5f5f5',
              },
              ...(file && {
                borderColor: '#4caf50',
                backgroundColor: '#f1f8e9',
              }),
            }}
            onClick={() => document.getElementById('bulk-file-input')?.click()}
          >
            <input
              id="bulk-file-input"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) setFile(selectedFile);
              }}
              style={{ display: 'none' }}
            />
            {!file ? (
              <>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                  📁 Choose File to Upload
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click here to select CSV file
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Supported formats: .csv
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                  ✅ File Selected
                </Typography>
                <Typography variant="body2" color="textPrimary" fontWeight={500}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Size: {(file.size / 1024).toFixed(2)} KB
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
          <ThemeButton
            variant="outlined"
            onClick={onClose}
          >
            Cancel
          </ThemeButton>
          <ThemeButton
            disabled={
              !formik.values.vendorName ||
              !formik.values.companyName ||
              !formik.values.for ||
              !formik.values.forCompany ||
              !materialName ||
              !materialGSM ||
              !materialSize ||
              !file ||
              isLoading
            }
            type="submit"
            sx={{
              background: '#A409F8',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              '&:hover': { background: '#7B06C2' },
            }}
          >
            {isLoading ? 'Uploading...' : 'Upload Bulk File'}
          </ThemeButton>
          <ThemeButton
            variant="outlined"
            onClick={handleDownloadSample}
            sx={{ minWidth: 180 }}
          >
            Download Sample CSV
          </ThemeButton>
        </Stack>
      </Box>
    </CustomDialog>
  );
};

export default AddNewPurchaseBulkDialog;