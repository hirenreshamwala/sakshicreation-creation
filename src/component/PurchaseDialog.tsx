import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import CustomDialog from '@/component/customdialog';
import ThemeSelect from '@/component/common_component/themeselect';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeButton from '@/component/common_component/themebutton';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createPurchaseThunk,
  updatePurchaseThunk,
  getPurchaseByIdThunk,
  clearSuccessMessage,
  clearError,
  getPurchaseEnumsThunk,
} from '@/store/slices/purchaseSlice';
import Swal from 'sweetalert2';

interface OptionType {
  label: string;
  value: string;
}

interface PurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  purchaseId?: string | null;
  refreshData?: () => void;
}

const validationSchema = Yup.object({
  vendorName: Yup.string().required('Vendor name is required'),
  billNumber: Yup.string().required('Bill number is required'),
  material: Yup.string().required('Material is required'),
  size: Yup.string().required('Size is required'),
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .required('Quantity is required')
    .min(1, 'Quantity must be at least 1'),
  gsm: Yup.number()
    .typeError('GSM must be a number')
    .required('GSM is required')
    .min(0, 'GSM must be a positive number'),
  ratePerSheet: Yup.number()
    .typeError('Rate per sheet must be a number')
    .required('Rate per sheet is required')
    .min(0, 'Rate per sheet must be a positive number'),
  kg: Yup.number()
    .typeError('KG must be a number')
    .required('KG is required')
    .min(0, 'KG must be a positive number'),
  companyName: Yup.string().required('Company name is required'),
  for: Yup.string().required('Purpose is required'),
  forCompany: Yup.string().required('For company is required'),
});

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ open, onClose, purchaseId, refreshData }) => {
  const dispatch = useAppDispatch();
  const { purchaseEnums, singlePurchase, loading, error, successMessage } = useAppSelector(
    (state) => state.purchase
  );
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!purchaseId;

  const companyOptions = [
    { label: 'Sakshi Creation', value: 'Sakshi Creation' },
    { label: 'Quality Packaging', value: 'Quality Packaging' },
  ];

  // Define purpose options based on companyName
  const getPurposeOptions = (companyName: string) => {
    if (companyName === 'Sakshi Creation') {
      return [
        { label: 'PRINTER', value: 'PRINTER' },
        { label: 'BINDER', value: 'BINDER' },
        { label: 'BOOKLET', value: 'BOOKLET' },
      ];
    } else if (companyName === 'Quality Packaging') {
      return [
        { label: 'FACTORY', value: 'FACTORY' },
        { label: 'GODOWN', value: 'GODOWN' },
      ];
    }
    return [];
  };

  const forCompanyOptions = (purpose: string) => {
    if (!purpose || typeof purpose !== 'string') return [];
    return [
      { label: `${purpose.toLowerCase()} company 1`, value: `${purpose.toLowerCase()} company 1` },
      { label: `${purpose.toLowerCase()} company 2`, value: `${purpose.toLowerCase()} company 2` },
      { label: `${purpose.toLowerCase()} company 3`, value: `${purpose.toLowerCase()} company 3` },
    ];
  };

  const formik = useFormik({
    initialValues: {
      vendorName: '',
      billNumber: '',
      material: '',
      size: '',
      quantity: '',
      gsm: '',
      ratePerSheet: '',
      kg: '',
      companyName: '',
      for: '',
      forCompany: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const numericValues = {
          ...values,
          quantity: Number(values.quantity),
          gsm: Number(values.gsm),
          ratePerSheet: Number(values.ratePerSheet),
          kg: Number(values.kg),
        };

        if (isEditMode && purchaseId) {
          await dispatch(updatePurchaseThunk({ id: purchaseId, data: numericValues })).unwrap();
          Swal.fire({
            title: 'Success!',
            text: 'Purchase updated successfully',
            icon: 'success',
            confirmButtonColor: '#7F56D9',
          });
        } else {
          await dispatch(createPurchaseThunk(numericValues)).unwrap();
          Swal.fire({
            title: 'Success!',
            text: 'Purchase created successfully',
            icon: 'success',
            confirmButtonColor: '#7F56D9',
          });
        }
        if (refreshData) refreshData();
        onClose();
      } catch (err: any) {
        Swal.fire({
          title: 'Error!',
          text: err.message || 'Operation failed',
          icon: 'error',
          confirmButtonColor: '#7F56D9',
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
      dispatch(getPurchaseEnumsThunk());

      if (isEditMode && purchaseId) {
        dispatch(getPurchaseByIdThunk(purchaseId));
      } else {
        formik.resetForm();
      }
    }
  }, [open, isEditMode, purchaseId, dispatch]);

  useEffect(() => {
    if (isEditMode && singlePurchase && purchaseId === singlePurchase._id) {
      formik.setValues({
        vendorName: singlePurchase.vendorName || '',
        billNumber: singlePurchase.billNumber || '',
        material: singlePurchase.material || '',
        size: singlePurchase.size || '',
        quantity: singlePurchase.quantity?.toString() || '',
        gsm: singlePurchase.gsm?.toString() || '',
        ratePerSheet: singlePurchase.ratePerSheet?.toString() || '',
        kg: singlePurchase.kg?.toString() || '',
        companyName: singlePurchase.companyName || '',
        for: singlePurchase.for || '',
        forCompany: singlePurchase.forCompany || '',
      });
    }
  }, [singlePurchase, isEditMode, purchaseId]);

  // Reset 'for' and 'forCompany' when companyName changes
  useEffect(() => {
    const currentPurposeOptions = getPurposeOptions(formik.values.companyName);
    const isCurrentForValid = currentPurposeOptions.some(
      (option) => option.value === formik.values.for
    );
    if (!isCurrentForValid && formik.values.companyName) {
      formik.setFieldValue('for', '');
      formik.setFieldValue('forCompany', '');
    }
  }, [formik.values.companyName]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        title: 'Error!',
        text: error,
        icon: 'error',
        confirmButtonColor: '#7F56D9',
      });
      dispatch(clearError());
    }
    if (successMessage) {
      Swal.fire({
        title: 'Success!',
        text: successMessage,
        icon: 'success',
        confirmButtonColor: '#7F56D9',
      });
      dispatch(clearSuccessMessage());
    }
  }, [error, successMessage, dispatch]);

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Purchase' : 'Add New Purchase'}
      maxWidth="md"
      fullWidth
    >
      <Box
        sx={{ p: { xs: 2, sm: 3 }, background: '#fff', borderRadius: 2 }}
        component="form"
        onSubmit={formik.handleSubmit}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Vendor Name"
            value={formik.values.vendorName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="vendorName"
            error={formik.touched.vendorName && Boolean(formik.errors.vendorName)}
            helperText={formik.touched.vendorName && formik.errors.vendorName}
            fullWidth
            required
          />
          <ThemeInput
            labelName="Bill Number"
            value={formik.values.billNumber}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="billNumber"
            error={formik.touched.billNumber && Boolean(formik.errors.billNumber)}
            helperText={formik.touched.billNumber && formik.errors.billNumber}
            fullWidth
            required
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Material"
            value={formik.values.material}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="material"
            error={formik.touched.material && Boolean(formik.errors.material)}
            helperText={formik.touched.material && formik.errors.material}
            fullWidth
            required
          />
          <ThemeInput
            labelName="Size"
            value={formik.values.size}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="size"
            error={formik.touched.size && Boolean(formik.errors.size)}
            helperText={formik.touched.size && formik.errors.size}
            fullWidth
            required
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Quantity"
            type="number"
            value={formik.values.quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="quantity"
            error={formik.touched.quantity && Boolean(formik.errors.quantity)}
            helperText={formik.touched.quantity && formik.errors.quantity}
            fullWidth
            required
          />
          <ThemeInput
            labelName="GSM"
            type="number"
            value={formik.values.gsm}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="gsm"
            error={formik.touched.gsm && Boolean(formik.errors.gsm)}
            helperText={formik.touched.gsm && formik.errors.gsm}
            fullWidth
            required
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Rate per Sheet"
            type="number"
            value={formik.values.ratePerSheet}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="ratePerSheet"
            error={formik.touched.ratePerSheet && Boolean(formik.errors.ratePerSheet)}
            helperText={formik.touched.ratePerSheet && formik.errors.ratePerSheet}
            fullWidth
            required
          />
          <ThemeInput
            labelName="KG"
            type="number"
            value={formik.values.kg}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            name="kg"
            error={formik.touched.kg && Boolean(formik.errors.kg)}
            helperText={formik.touched.kg && formik.errors.kg}
            fullWidth
            required
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <ThemeSelect
            label="Company Name"
            options={companyOptions}
            value={getSelectedOption(formik.values.companyName, companyOptions)}
            onChange={(event, newValue) => {
              formik.setFieldValue('companyName', newValue ? newValue.value : '');
            }}
            name="companyName"
            error={formik.touched.companyName && Boolean(formik.errors.companyName)}
            helperText={formik.touched.companyName && formik.errors.companyName}
            required
            fullWidth
          />
          <ThemeSelect
            label="Purpose"
            options={getPurposeOptions(formik.values.companyName)}
            value={getSelectedOption(formik.values.for, getPurposeOptions(formik.values.companyName))}
            onChange={(event, newValue) => {
              formik.setFieldValue('for', newValue ? newValue.value : '');
              formik.setFieldValue('forCompany', '');
            }}
            name="for"
            error={formik.touched.for && Boolean(formik.errors.for)}
            helperText={formik.touched.for && formik.errors.for}
            required
            fullWidth
            disabled={!formik.values.companyName}
          />
        </Stack>

        <Box mb={3}>
          <ThemeSelect
            label="For Company"
            options={forCompanyOptions(formik.values.for)}
            value={getSelectedOption(formik.values.forCompany, forCompanyOptions(formik.values.for))}
            onChange={(event, newValue) => {
              formik.setFieldValue('forCompany', newValue ? newValue.value : '');
            }}
            name="forCompany"
            error={formik.touched.forCompany && Boolean(formik.errors.forCompany)}
            helperText={formik.touched.forCompany && formik.errors.forCompany}
            required
            fullWidth
            disabled={!formik.values.for}
          />
        </Box>

        <ThemeButton
          type="submit"
          sx={{
            background: '#A409F8',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: '100%',
            mt: 1,
            '&:hover': { background: '#7B06C2' },
          }}
          disabled={isLoading}
        >
          {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Purchase' : 'Create Purchase')}
        </ThemeButton>
      </Box>
    </CustomDialog>
  );
};

export default PurchaseDialog;