import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { toast } from 'react-toastify';
import CustomDialog from '@/component/customdialog';
import ThemeButton from '@/component/common_component/themebutton';
import CompanySelect from '@/component/reusablecomponents/CompanyWithPartyName';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  bulkCreateVendorsThunk,
  clearError,
  clearSuccessMessage,
} from '@/store/slices/vendorSlice';

interface AddNewVendorBulkDialogProps {
  open: boolean;
  onClose: () => void;
  refreshData?: () => void;
}

const AddNewVendorBulkDialog: React.FC<AddNewVendorBulkDialogProps> = ({
  open,
  onClose,
  refreshData,
}) => {
  const dispatch = useAppDispatch();
  const { loading, error, successMessage } = useAppSelector((state) => state.vendors);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState<string>('');

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!companyName) {
      toast.error('Please select a company');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyName', companyName);

      await dispatch(bulkCreateVendorsThunk(formData)).unwrap();
      toast.success('Bulk vendor upload completed successfully');
      if (refreshData) refreshData();
      setFile(null);
      setCompanyName('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Bulk upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      dispatch(clearSuccessMessage());
      dispatch(clearError());
      setFile(null);
      setCompanyName('');
    }
  }, [open, dispatch]);

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

  const handleDownloadSample = () => {
    const csvContent = `name,contactNumber,whatsappNumber,gst,address\n"Vendor One","9876543210","9876543210","27AAAAA0000A1Z5","123 Street, City"\n"Vendor Two","8765432109","8765432109","","456 Road, Town"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_vendor_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <CustomDialog open={open} maxWidth="sm" onClose={onClose} title="Bulk Upload Vendors">
      <Box sx={{ background: '#fff', borderRadius: 2, p: 3 }}>
        <Box mt={2}>
          <Typography fontWeight={500} fontSize={14} mb={1}>
            Select Company
          </Typography>
          <CompanySelect
            name="companyName"
            value={companyName}
            onChange={(event, newValue) => {
              setCompanyName(newValue ? newValue.value : '');
            }}
            required
            sx={{ mb: 2 }}
          />
        </Box>
        <Box mt={2}>
          <Typography fontWeight={500} fontSize={14} mb={1}>
            Upload CSV File
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
                borderColor: '#A409F8',
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
                if (selectedFile && selectedFile.type === 'text/csv') {
                  setFile(selectedFile);
                } else {
                  toast.error('Please select a valid CSV file');
                }
              }}
              style={{ display: 'none' }}
            />
            {!file ? (
              <>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                  📁 Select CSV File
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click here to upload a CSV file
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Supported format: .csv
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
            sx={{
              borderColor: '#A409F8',
              color: '#A409F8',
              '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' },
            }}
          >
            Cancel
          </ThemeButton>
          <ThemeButton
            disabled={!file || !companyName || isLoading}
            onClick={handleSubmit}
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
            sx={{
              borderColor: '#A409F8',
              color: '#A409F8',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' },
            }}
          >
            Download Sample CSV
          </ThemeButton>
        </Stack>
      </Box>
    </CustomDialog>
  );
};

export default AddNewVendorBulkDialog;