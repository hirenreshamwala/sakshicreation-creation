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

interface NewPurchaseProps {
  isEditMode?: boolean;
  purchaseId?: string;
}

interface Option {
  value: string;
  label: string;
}

const NewPurchase: React.FC<NewPurchaseProps> = ({ isEditMode = false, purchaseId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { materials } = useAppSelector(state => state.materials);
  const { companies, roles, staff, singlePurchase, loading, error } = useAppSelector(state => state.purchase);
  const { vendors } = useAppSelector(state => state.vendors);

  const [formData, setFormData] = useState({
    vendorName: '',
    billNumber: '',
    material: '', // This will store the material _id
    materialName: '',
    materialGSM: '',
    materialSize: '',
    quantity: '',
    ratePerSheet: '',
    kg: '',
    companyName: '',
    for: '',
    forCompany: ''
  });
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

  // Options for material fields
  const materialNameOptions = Array.from(new Set(materials.map(material => material.materialName))).map(name => ({
    value: name,
    label: name
  }));

  const getMaterialGSMOptions = () => {
    const filteredMaterials = materials.filter(material => !formData.materialName || material.materialName === formData.materialName);
    return Array.from(new Set(filteredMaterials.map(material => material.materialGSM.toString()))).map(gsm => ({
      value: gsm,
      label: `${gsm} GSM`
    }));
  };

  const getMaterialSizeOptions = () => {
    const filteredMaterials = materials.filter(
      material =>
        (!formData.materialName || material.materialName === formData.materialName) &&
        (!formData.materialGSM || material.materialGSM.toString() === formData.materialGSM)
    );
    return Array.from(new Set(filteredMaterials.map(material => material.materialSize))).map(size => ({
      value: size,
      label: size
    }));
  };

  const companyOptions = companies.map(company => ({
    value: company._id,
    label: company.companyName
  }));

  const allowedRoleNames = ['Booklet & Folder Binder', 'Printer', 'Binder'];
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

  useEffect(() => {
    dispatch(getAllMaterialsThunk());
    dispatch(getCompaniesThunk());
    dispatch(getRolesThunk());
    dispatch(getAllVendorsThunk());
    if (isEditMode && purchaseId) {
      dispatch(getPurchaseByIdThunk(purchaseId));
    }
  }, [dispatch, isEditMode, purchaseId]);

  useEffect(() => {
    if (vendors.length > 0) {
      const options = vendors.map(vendor => ({
        value: vendor._id,
        label: vendor.name
      }));
      setVendorOptions(options);
    }
  }, [vendors]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch({ type: 'purchases/clearError' });
    }
  }, [error, dispatch]);

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
        forCompany: singlePurchase.forCompany?._id || ''
      });

      if (singlePurchase.for?._id) {
        dispatch(getStaffByRoleThunk(singlePurchase.for._id));
      }
    }
  }, [isEditMode, singlePurchase, materials, dispatch]);

  useEffect(() => {
    if (formData.for) {
      dispatch(getStaffByRoleThunk(formData.for));
    } else {
      dispatch({ type: 'purchases/clearStaff' });
    }
  }, [formData.for, dispatch]);

  // Update material _id when materialName, materialGSM, and materialSize are selected
  useEffect(() => {
    if (formData.materialName && formData.materialGSM && formData.materialSize) {
      const selectedMaterial = materials.find(
        material =>
          material.materialName === formData.materialName &&
          material.materialGSM.toString() === formData.materialGSM &&
          material.materialSize === formData.materialSize
      );
      setFormData(prev => ({ ...prev, material: selectedMaterial?._id || '' }));
    } else {
      setFormData(prev => ({ ...prev, material: '' }));
    }
  }, [formData.materialName, formData.materialGSM, formData.materialSize, materials]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value || '',
      ...(name === 'materialName' ? { materialGSM: '', materialSize: '', material: '' } : {}),
      ...(name === 'materialGSM' ? { materialSize: '', material: '' } : {}),
      ...(name === 'companyName' && !isEditMode ? { for: '', forCompany: '' } : {})
    }));
    if (name === 'companyName' && !isEditMode) {
      dispatch({ type: 'purchases/clearStaff' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (
        !formData.vendorName ||
        !formData.billNumber ||
        !formData.material ||
        !formData.materialName ||
        !formData.materialGSM ||
        !formData.materialSize ||
        !formData.quantity ||
        !formData.ratePerSheet ||
        !formData.kg ||
        !formData.companyName ||
        !formData.for ||
        !formData.forCompany
      ) {
        toast.error('Please fill all required fields');
        return;
      }

      const purchaseData = {
        ...formData,
        quantity: Number(formData.quantity),
        ratePerSheet: Number(formData.ratePerSheet),
        kg: Number(formData.kg)
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
          await dispatch(createPurchaseThunk(purchaseData)).unwrap();
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
        </Stack>
        
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="MATERIAL NAME"
            options={materialNameOptions}
            value={materialNameOptions.find(opt => opt.value === formData.materialName) || null}
            onChange={(e, newValue) => handleSelectChange('materialName', newValue?.value)}
            required
            fullWidth
          />
          <ThemeSelect
            label="MATERIAL GSM"
            options={getMaterialGSMOptions()}
            value={getMaterialGSMOptions().find(opt => opt.value === formData.materialGSM) || null}
            onChange={(e, newValue) => handleSelectChange('materialGSM', newValue?.value)}
            required
            fullWidth
            disabled={!formData.materialName}
          />
          <ThemeSelect
            label="MATERIAL SIZE"
            options={getMaterialSizeOptions()}
            value={getMaterialSizeOptions().find(opt => opt.value === formData.materialSize) || null}
            onChange={(e, newValue) => handleSelectChange('materialSize', newValue?.value)}
            required
            fullWidth
            disabled={!formData.materialGSM}
          />
        </Stack>
        
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="QUANTITY"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            fullWidth
            required
          />
          <ThemeInput
            labelName="RATE PER SHEET/UNIT"
            name="ratePerSheet"
            type="number"
            value={formData.ratePerSheet}
            onChange={handleChange}
            fullWidth
            required
          />
          <ThemeInput
            labelName="KG"
            name="kg"
            type="number"
            value={formData.kg}
            onChange={handleChange}
            fullWidth
            required
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          
        <ThemeSelect
          label="COMPANY NAME"
          options={companyOptions}
          value={companyOptions.find(opt => opt.value === formData.companyName) || null}
          onChange={(e, newValue) => handleSelectChange('companyName', newValue?.value)}
          required
          fullWidth
          sx={{ mb: 3 }}
        />
        
        <ThemeSelect
          label="DELIVER TO"
          options={roleOptions}
          value={roleOptions.find(opt => opt.value === formData.for) || null}
          onChange={(e, newValue) => handleSelectChange('for', newValue?.value)}
          required
          fullWidth
          sx={{ mb: 3 }}
          disabled={!formData.companyName}
        />
        
        <ThemeSelect
          label="PRINTER NAME"
          options={staffOptions}
          value={staffOptions.find(opt => opt.value === formData.forCompany) || null}
          onChange={(e, newValue) => handleSelectChange('forCompany', newValue?.value)}
          required
          fullWidth
          sx={{ mb: 3 }}
          disabled={!formData.for}
        />
        </Stack>
        <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleCancel}
          >
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

export default NewPurchase;