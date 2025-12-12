import React, { useEffect, useState } from 'react';
import { Box, Stack, Button, Autocomplete, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeSelect from '@/component/common_component/themeselect';
import { useAppDispatch, useAppSelector } from '@/store';
import { getCompaniesThunk, getRolesThunk, getStaffByRoleThunk } from '@/store/slices/purchaseSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import { getAllKantansThunk } from '@/store/slices/kantanSlice';
import { StaticCompanyOptions } from '@/constants';
import { createQpPurchaseThunk, getQpPurchaseByIdThunk, updateQpPurchaseThunk } from '@/store/slices/qpPurchaseSlice';
import { getAllPaperGSMThunk } from '@/store/slices/paperGSMSlice';
import { getAllPackagingOptionsThunk } from '@/store/slices/packagingOptionSlice';

interface NewPurchaseProps {
  isEditMode?: boolean;
  purchaseId?: string;
}

interface Option {
  value: string;
  label: string;
}

const QpNewPurchase: React.FC<NewPurchaseProps> = ({ isEditMode = false, purchaseId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { vendors } = useAppSelector(state => state.vendors);
  const { kantans } = useAppSelector(state => state.kantans);
  const { paperGSM } = useAppSelector(state => state.paperGSMs);
  const { companies, roles, staff, singlePurchase, error } = useAppSelector(state => state.purchase);
  const { packagingOptions } = useAppSelector((state) => state.packagingOptions);

  // State for individual options
  const [paperOptions, setPaperOptions] = useState<Option[]>([]);
  const [deckalOptions, setDeckalOptions] = useState<Option[]>([]);
  const [gsmOptions, setGsmOptions] = useState<Option[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

  const [formData, setFormData] = useState({
    vendorName: '',
    billNumber: '',
    companyName: '',
    for: '',
    forCompany: '',
    type: '',
    kantan: '',
    deckal: '',
    gsm: '',
    category: "",
    kg: '',
    reel: '',
    reelBatchNo: '', // Added REEL/BATCH NO field
    paperMil: '',
    bf: '',
    color: '',
  });

  const colorOptions = [
    { value: 'natural', label: 'Natural' },
    { value: 'gold', label: 'Gold' },
  ];

  useEffect(() => {
    if (!paperGSM.length) dispatch(getAllPaperGSMThunk());
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
    if (!kantans.length) dispatch(getAllKantansThunk());
  }, []);


  useEffect(() => {
    if (packagingOptions.length) {
      // Unique Deckal options for paper
      const uniqueDeckals = Array.from(
        new Set(packagingOptions.map(opt => opt.deckal).filter(Boolean))
      ).map(deckal => ({
        value: deckal,
        label: deckal,
      }));
      setDeckalOptions(uniqueDeckals);

      // Collect all GSMs (paper1GSM, paper2GSM, paper3GSM)
      const allGsms = packagingOptions.flatMap(opt => [
        opt.paper1GSM,
        opt.paper2GSM,
        opt.paper3GSM,
      ]);

      // Unique GSM options
      const uniqueGsms = Array.from(new Set(allGsms.filter(Boolean))).map(gsm => ({
        value: gsm,
        label: gsm,
      }));
      setGsmOptions(uniqueGsms);
    }
  }, [packagingOptions]);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(getCompaniesThunk());
    dispatch(getRolesThunk());
    dispatch(getAllVendorsThunk());

    if (isEditMode && purchaseId) dispatch(getQpPurchaseByIdThunk(purchaseId));
  }, [dispatch, isEditMode, purchaseId]);

  const typeOptions = [
    { value: 'kantan', label: 'Kantan' },
    { value: 'paper', label: 'Paper' },
    { value: 'glue', label: 'Glue' },
    { value: 'wire', label: 'Wire' },
  ];

  const qualityPackagingCompany = companies.find(company =>
    company.companyName?.toLowerCase().includes('quality packaging')
  );

  const companyOptions = qualityPackagingCompany
    ? [{ value: qualityPackagingCompany._id, label: qualityPackagingCompany.companyName }]
    : [];

  const kantanOptions = kantans.map(kantan => ({
    value: kantan._id,
    label: kantan.kantanName,
  }));

  const allowedRoleNames = ['Factory Manager', 'Godown Manager'];
  const roleOptions = roles
    .filter(role => allowedRoleNames.includes(role.roleName))
    .map(role => ({
      value: role._id,
      label: role.roleName,
    }));

  const staffOptions = staff.map(staffMember => ({
    value: staffMember._id,
    label: `${staffMember.firstName} ${staffMember.lastName}`,
  }));

  useEffect(() => {
    if (vendors.length > 0) {
      const options = vendors
        .filter(item => item.companyName.companyName === StaticCompanyOptions[1])
        .map(vendor => ({
          value: vendor._id,
          label: vendor.name,
        }));
      setVendorOptions(options);
    }
  }, [vendors]);

  // Create paper options without blank values
  useEffect(() => {
    if (paperGSM.length > 0) {
      const options = paperGSM
        .filter(paper => paper.name && paper.name.trim() !== '')
        .map(paper => ({
          value: paper._id,
          label: paper.name,
        }));
      setPaperOptions(options);
    }
  }, [paperGSM]);

  // Deckal options for paper
  useEffect(() => {
    if (paperGSM.length > 0) {
      const uniqueDeckals = Array.from(
        new Map(
          paperGSM
            .filter(paper => paper.deckal && paper.deckal.trim() !== '')
            .map(paper => [paper.deckal, paper])
        ).values()
      );

      const options = uniqueDeckals.map(paper => ({
        value: paper._id,
        label: paper.deckal,
      }));

      setDeckalOptions(options);
    }
  }, [paperGSM]);

  // GSM options
  useEffect(() => {
    if (paperGSM.length > 0) {
      const uniqueGsms = Array.from(
        new Map(
          paperGSM
            .filter(paper => paper.gsm && paper.gsm.trim() !== '')
            .map(paper => [paper.gsm, paper])
        ).values()
      );

      const options = uniqueGsms.map(paper => ({
        value: paper._id,
        label: paper.gsm,
      }));

      setGsmOptions(options);
    }
  }, [paperGSM]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch({ type: 'purchases/clearError' });
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isEditMode && singlePurchase) {
      setFormData({
        vendorName: (typeof singlePurchase.vendorName === 'object' ? singlePurchase.vendorName?._id : singlePurchase.vendorName) || '',
        billNumber: singlePurchase.billNumber || '',
        companyName: singlePurchase.companyName?._id || '',
        for: singlePurchase.for?._id || '',
        forCompany: singlePurchase.forCompany?._id || '',
        type: singlePurchase.type || '',
        kantan: singlePurchase.kantan?._id || '',
        deckal: singlePurchase.deckal || '',
        gsm: singlePurchase.gsm || '',
        kg: singlePurchase.kg || '',
        reel: singlePurchase.reel || '',
        reelBatchNo: singlePurchase.reelBatchNo || '', // Added for edit mode
        category: singlePurchase.category || '',
        paperMil: singlePurchase.paperMil || '',
        bf: singlePurchase.bf || '',
        color: singlePurchase.color || '',
      });

      if (singlePurchase.for?._id) {
        dispatch(getStaffByRoleThunk(singlePurchase.for._id));
      }
    }
  }, [isEditMode, singlePurchase, dispatch]);

  useEffect(() => {
    if (formData.for) dispatch(getStaffByRoleThunk(formData.for));
    else dispatch({ type: 'purchases/clearStaff' });
  }, [formData.for, dispatch]);

  useEffect(() => {
    if (qualityPackagingCompany && !formData.companyName)
      setFormData(prev => ({
        ...prev,
        companyName: qualityPackagingCompany._id,
      }));
  }, [qualityPackagingCompany, formData.companyName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) =>
    setFormData(prev => ({
      ...prev,
      [name]: value || '',
      ...(name === 'type'
        ? { kantan: '', kg: '', deckal: '', gsm: '', reel: '', reelBatchNo: '', paperMil: '', bf: '', color: '' }
        : {}),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const requiredFields = ['vendorName', 'billNumber', 'companyName', 'for', 'forCompany', 'type'];

      if (formData.type === 'kantan') {
        requiredFields.push('kantan', 'reel'); // Added reelBatchNo as required
      } else if (formData.type === 'glue' || formData.type === 'wire') {
        requiredFields.push('kg');
      } else if (formData.type === 'paper') {
        requiredFields.push('deckal', 'gsm', 'kg', 'paperMil', 'bf', 'color');
      }

      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const purchaseData = {
        ...formData,
        kg: (formData.type === 'paper' || formData.type === 'glue' || formData.type === 'wire') ? Number(formData.kg) : 0,
        reel: formData.type === 'kantan' ? Number(formData.reel) : 0,
      };

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: isEditMode ? 'You are about to update this purchase record.' : 'You are about to create a new purchase record.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#A409F8',
        cancelButtonColor: '#d33',
        confirmButtonText: isEditMode ? 'Yes, update it!' : 'Yes, create it!',
      });

      if (result.isConfirmed) {
        if (isEditMode && purchaseId) {
          await dispatch(updateQpPurchaseThunk({ id: purchaseId, data: purchaseData })).unwrap();
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

  // Current type ke according deckal options decide karein
  const getCurrentDeckalOptions = () => {
    if (formData.type === 'paper') {
      return deckalOptions;
    }
    return [];
  };

  return (
    <Box>

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
            disabled={!!qualityPackagingCompany}
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

          {formData.type === 'kantan' && (
            <>
              <ThemeSelect
                label="KANTAN"
                options={kantanOptions}
                value={kantanOptions.find(opt => opt.value === formData.kantan) || null}
                onChange={(e, newValue) => handleSelectChange('kantan', newValue?.value)}
                required
                fullWidth
              />
              <ThemeInput
                labelName="TAKA"
                name="reel"
                type="number"
                value={formData.reel}
                onChange={handleChange}
                fullWidth
                required
              />
              {/* <ThemeInput
                labelName="REEL/BATCH NO"
                name="reelBatchNo"
                value={formData.reelBatchNo}
                onChange={handleChange}
                fullWidth
                required
                placeholder="Enter reel/batch number"
              /> */}
            </>
          )}

          {(formData.type === 'glue' || formData.type === 'wire') && (
            <ThemeInput
              labelName={formData.type === 'glue' ? "KG/PCS" : "KG"}
              name="kg"
              type="number"
              value={formData.kg}
              onChange={handleChange}
              fullWidth
              required
            />
          )}

          {formData.type === 'paper' && (
            <>
              <ThemeInput
                labelName="PAPER MILL NAME"
                name="paperMil"
                value={formData.paperMil}
                onChange={handleChange}
                fullWidth
                required
                placeholder="Enter paper mill name"
              />
            </>
          )}
        </Stack>

        {/* DECKAL FIELD - Ab yeh kantan aur paper dono ke liye dikhega */}
        {(formData.type === 'paper') && (
          <Stack direction="row" spacing={2} mb={2}>
            <ThemeSelect
              label="DECKAL"
              options={getCurrentDeckalOptions()}
              value={getCurrentDeckalOptions().find(opt => opt.value === formData.deckal) || null}
              onChange={(e, newValue) => handleSelectChange('deckal', newValue?.value)}
              required
              fullWidth
            />

            {/* GSM FIELD - Sirf paper type ke liye */}
            {formData.type === 'paper' && (
              <>
                <ThemeSelect
                  label="GSM"
                  options={gsmOptions}
                  value={gsmOptions.find(opt => opt.value === formData.gsm) || null}
                  onChange={(e, newValue) => handleSelectChange('gsm', newValue?.value)}
                  required
                  fullWidth
                />
                <ThemeInput
                  labelName="BF"
                  name="bf"
                  value={formData.bf}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Enter BF"
                />
                <ThemeInput
                  labelName="TAKA/BATCH NO"
                  name="reelBatchNo"
                  value={formData.reelBatchNo}
                  onChange={handleChange}
                  fullWidth
                  // required
                  placeholder="Enter TAKA/batch number"
                />
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={[...colorOptions.map(opt => opt.label), "White"]}
                  value={formData.color || ""}
                  sx={{ width: '100%' }}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, color: newValue || '' }));
                  }}
                  onInputChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, color: newValue || '' }));
                  }}
                  renderInput={(params) => (
                    <ThemeInput {...params} labelName="COLOR" required />
                  )}
                />


              </>
            )}

            {/* KG FIELD - Paper, glue, wire ke liye */}
            {(formData.type === 'paper' || formData.type === 'glue' || formData.type === 'wire') && (
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
        )}

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="DELIVER TO"
            options={roleOptions}
            value={roleOptions.find(opt => opt.value === formData.for) || null}
            onChange={(e, newValue) => {
              const label = newValue?.label?.toLowerCase().trim();
              if (label?.includes('factory')) {
                setFormData(prev => ({ ...prev, category: 'factory' }));
              } else if (label?.includes('godown')) {
                setFormData(prev => ({ ...prev, category: 'godown' }));
              }
              handleSelectChange('for', newValue?.value);
            }}
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
          <Button variant="outlined" onClick={() => router.push('/admin/purchase')}>
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