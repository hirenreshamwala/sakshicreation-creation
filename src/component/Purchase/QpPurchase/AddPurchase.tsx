import React, { useEffect, useState } from 'react';
import { Box, Stack, Button } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeSelect from '@/component/common_component/themeselect';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllMaterialsThunk } from '@/store/slices/materialSlice';
import { getCompaniesThunk, getRolesThunk, getStaffByRoleThunk, createPurchaseThunk, getPurchaseByIdThunk, updatePurchaseThunk } from '@/store/slices/purchaseSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import { getAllKantansThunk } from '@/store/slices/kantanSlice';
import { StaticCompanyOptions } from '@/constants';
import { createQpPurchaseThunk } from '@/store/slices/qpPurchaseSlice';

interface NewPurchaseProps {
  isEditMode?: boolean;
  purchaseId?: string;
}

interface Option {
  value: string;
  label: string;
}

const QpNewPurchase: React.FC<NewPurchaseProps> = ({ isEditMode = false, purchaseId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { materials } = useAppSelector(state => state.materials);
  const { companies, roles, staff, singlePurchase, loading, error } = useAppSelector(state => state.purchase);
  const { vendors } = useAppSelector(state => state.vendors);
  const { kantans } = useAppSelector(state => state.kantans);

  const [formData, setFormData] = useState({
    vendorName: '',
    billNumber: '',
    material: '',
    materialName: '',
    materialGSM: '',
    materialSize: '',
    quantity: '',
    ratePerSheet: '',
    kg: '',
    companyName: '',
    for: '',
    forCompany: '',
    type: '', // New field for type selection
    kantan: '' // New field for kantan selection
  });

  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(getAllMaterialsThunk());
    dispatch(getCompaniesThunk());
    dispatch(getRolesThunk());
    dispatch(getAllVendorsThunk());
    dispatch(getAllKantansThunk()); // Fetch kantans

    if (isEditMode && purchaseId) {
      dispatch(getPurchaseByIdThunk(purchaseId));
    }
  }, [dispatch, isEditMode, purchaseId]);

  // Type options
  const typeOptions = [
    { value: 'kantan', label: 'Kantan' },
    { value: 'paper', label: 'Paper' },
    { value: 'glue', label: 'Glue' },
    { value: 'wire', label: 'Wire' }
  ];

  // Get Quality Packaging company
  const qualityPackagingCompany = companies.find(company =>
    company.companyName?.toLowerCase().includes('quality packaging')
  );

  // Company options - only show Quality Packaging
  const companyOptions = qualityPackagingCompany ? [
    {
      value: qualityPackagingCompany._id,
      label: qualityPackagingCompany.companyName
    }
  ] : [];

  // Kantan options
  const kantanOptions = kantans.map(kantan => ({
    value: kantan._id,
    label: kantan.kantanName
  }));

  // Role and staff options
  const allowedRoleNames = ['Factory Manager', 'Godown Manager'];
  const roleOptions = roles
    .filter(role => allowedRoleNames.includes(role.roleName))
    .map(role => ({
      value: role._id,
      label: role.roleName
    }));

  const staffOptions = staff.map(staffMember => ({
    value: staffMember._id,
    label: `${staffMember.firstName} ${staffMember.lastName}`
  }));

  console.log(vendors, 'vendors')
  // Vendor options
  useEffect(() => {
    if (vendors.length > 0) {
      const options = vendors.filter((item) => item.companyName.companyName === StaticCompanyOptions[1]).map(vendor => ({
        value: vendor._id,
        label: vendor.name
      }));
      setVendorOptions(options);
    }
  }, [vendors]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch({ type: 'purchases/clearError' });
    }
  }, [error, dispatch]);

  // Set form data for edit mode
  useEffect(() => {
    if (isEditMode && singlePurchase) {
      const material = materials.find(m => m._id === singlePurchase.material?._id);
      setFormData({
        vendorName: (typeof singlePurchase.vendorName === 'object' ? singlePurchase.vendorName?._id : singlePurchase.vendorName) || '',
        billNumber: singlePurchase.billNumber || '',
        material: singlePurchase.material?._id || '',
        materialName: material?.materialName || '',
        materialGSM: material?.materialGSM.toString() || '',
        materialSize: material?.materialSize || '',
        quantity: singlePurchase.quantity.toString() || '',
        ratePerSheet: singlePurchase.ratePerSheet.toString() || '',
        kg: singlePurchase.kg.toString() || '',
        companyName: singlePurchase.companyName?._id || '',
        for: singlePurchase.for?._id || '',
        forCompany: singlePurchase.forCompany?._id || '',
        type: singlePurchase.type || '',
        kantan: singlePurchase.kantan || ''
      });

      if (singlePurchase.for?._id) {
        dispatch(getStaffByRoleThunk(singlePurchase.for._id));
      }
    }
  }, [isEditMode, singlePurchase, materials, dispatch]);

  // Fetch staff when role is selected
  useEffect(() => {
    if (formData.for) {
      dispatch(getStaffByRoleThunk(formData.for));
    } else {
      dispatch({ type: 'purchases/clearStaff' });
    }
  }, [formData.for, dispatch]);

  // Auto-select Quality Packaging company
  useEffect(() => {
    if (qualityPackagingCompany && !formData.companyName) {
      setFormData(prev => ({
        ...prev,
        companyName: qualityPackagingCompany._id
      }));
    }
  }, [qualityPackagingCompany, formData.companyName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value || '',
      ...(name === 'type' ? { kantan: '', kg: '' } : {}) // Clear kantan and kg when type changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validation
      const requiredFields = [
        'vendorName',
        'billNumber',
        'companyName',
        'for',
        'forCompany',
        'type'
      ];

      // Additional validation based on type
      if (formData.type === 'kantan') {
        requiredFields.push('kantan');
      } else if (formData.type === 'glue' || formData.type === 'wire') {
        requiredFields.push('kg');
      }

      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const purchaseData = {
        ...formData,
        quantity: formData.type === 'kantan' ? 0 : Number(formData.quantity) || 0,
        ratePerSheet: formData.type === 'kantan' ? 0 : Number(formData.ratePerSheet) || 0,
        kg: formData.type === 'glue' || formData.type === 'wire' ? Number(formData.kg) : 0
      };

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: isEditMode ? 'You are about to update this purchase record.' : 'You are about to create a new purchase record.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#A409F8',
        cancelButtonColor: '#d33',
        confirmButtonText: isEditMode ? 'Yes, update it!' : 'Yes, create it!'
      });

      if (result.isConfirmed) {
        if (isEditMode && purchaseId) {
          await dispatch(updatePurchaseThunk({ id: purchaseId, data: purchaseData })).unwrap();
          toast.success('Purchase updated successfully!');
          router.push('/admin/purchase');
        } else {
          await dispatch(createQpPurchaseThunk(purchaseData)).unwrap();
          toast.success('Purchase created successfully!');
          router.push('/admin/purchase');
        }
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase`);
    }
  };

  const handleCancel = () => {
    router.push('/admin/purchase');
  };

  return (
    <Box>
      <ToastContainer position="top-right" autoClose={3000} />

      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="VENDOR NAME"
            options={vendorOptions}
            value={vendorOptions.find(opt => opt.value === formData.vendorName) || null}
            onChange={(e, newValue) => handleSelectChange('vendorName', newValue?.value)}
            required
            fullWidth
          />

          <ThemeInput
            labelName="BILL NUMBER"
            name="billNumber"
            value={formData.billNumber}
            onChange={handleChange}
            fullWidth
            required
          />

          <ThemeSelect
            label="COMPANY NAME"
            options={companyOptions}
            value={companyOptions.find(opt => opt.value === formData.companyName) || null}
            onChange={(e, newValue) => handleSelectChange('companyName', newValue?.value)}
            required
            fullWidth
            disabled={!!qualityPackagingCompany} // Disable if Quality Packaging is auto-selected
          />
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="TYPE"
            options={typeOptions}
            value={typeOptions.find(opt => opt.value === formData.type) || null}
            onChange={(e, newValue) => handleSelectChange('type', newValue?.value)}
            required
            fullWidth
          />

          {/* Show kantan selection when type is kantan */}
          {formData.type === 'kantan' && (
            <ThemeSelect
              label="KANTAN"
              options={kantanOptions}
              value={kantanOptions.find(opt => opt.value === formData.kantan) || null}
              onChange={(e, newValue) => handleSelectChange('kantan', newValue?.value)}
              required
              fullWidth
            />
          )}

          {/* Show kg field when type is glue or wire */}
          {(formData.type === 'glue' || formData.type === 'wire') && (
            <ThemeInput
              labelName="KG"
              name="kg"
              type="number"
              value={formData.kg}
              onChange={handleChange}
              fullWidth
              required
            />
          )}
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="DELIVER TO"
            options={roleOptions}
            value={roleOptions.find(opt => opt.value === formData.for) || null}
            onChange={(e, newValue) => handleSelectChange('for', newValue?.value)}
            required
            fullWidth
            disabled={!formData.companyName}
          />

          <ThemeSelect
            label="STAFF NAME"
            options={staffOptions}
            value={staffOptions.find(opt => opt.value === formData.forCompany) || null}
            onChange={(e, newValue) => handleSelectChange('forCompany', newValue?.value)}
            required
            fullWidth
            disabled={!formData.for}
          />
        </Stack>

        <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
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
            {isEditMode ? 'Update Purchase' : 'Save Purchase'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default QpNewPurchase;