import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeButton from '@/component/common_component/themebutton';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

// Define the correct type for the staff form data
interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  mobileCode: string;
  whatsapp: string;
  whatsappCode: string;
  address: string;
  aadhar: string;
  joining: string;
  birth: string;
}
const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;

// Static staff data for demo (should match main page)
const staffList1 = [
  { name: 'Staff 1', department: 'Department1', joining: '01/04/25', left: '-' },
  { name: 'Staff 2', department: 'Department2', joining: '01/04/25', left: '-' },
  { name: 'Staff 3', department: 'Department3', joining: '01/04/25', left: '-' },
];
const staffList2 = [
  { name: 'Staff A', department: 'DepartmentA', joining: '02/04/25', left: '-' },
  { name: 'Staff B', department: 'DepartmentB', joining: '02/04/25', left: '-' },
  { name: 'Staff C', department: 'DepartmentC', joining: '02/04/25', left: '-' },
];

const StaffView = () => {
  const router = useRouter();
  const { mode, id } = router.query;

  // For demo: use staffList1, you can enhance to use tab param if needed
  let editData: Partial<StaffFormData> = {};
  if (mode === 'edit' && typeof id === 'string') {
    const idx = parseInt(id, 10);
    const staff = staffList1[idx];
    if (staff) {
      editData = {
        firstName: staff.name.split(' ')[0] || '',
        lastName: staff.name.split(' ')[1] || '',
        email: '',
        mobile: '',
        mobileCode: '91',
        whatsapp: '',
        whatsappCode: '91',
        address: '',
        aadhar: '',
        joining: staff.joining.split('/').reverse().join('-'),
        birth: '',
      };
    }
  }

  const emptyState: StaffFormData = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    mobileCode: '91',
    whatsapp: '',
    whatsappCode: '91',
    address: '',
    aadhar: '',
    joining: '',
    birth: '',
  };

  const initialState: StaffFormData =
    mode === 'add' ? emptyState : { ...emptyState, ...editData };

  const [formData, setFormData] = useState<StaffFormData>(initialState);
  const [backupData, setBackupData] = useState<StaffFormData>(initialState);
  const [saving, setSaving] = useState(false);

  // Generic handler for input changes
  const handleChange = (field: keyof StaffFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || 'Failed to save staff');
        return;
      }
      toast.success('Staff saved successfully!');
      setBackupData(formData); // Save current as latest backup
    } catch {
      toast.error('Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFormData(backupData); // Reset to last saved
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="First name"
            value={formData.firstName}
            onChange={e => handleChange('firstName', e.target.value)}
            fullWidth

          />
          <ThemeInput
            labelName="Last Name"
            value={formData.lastName}
            onChange={e => handleChange('lastName', e.target.value)}
            fullWidth

          />
        </Stack>
        <ThemeInput
          labelName="Email"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
          fullWidth
  
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Mobile No."
            value={formData.mobile}
            onChange={e => handleChange('mobile', e.target.value)}
            mobile
            countryCode={formData.mobileCode}
            onCountryCodeChange={code => handleChange('mobileCode', code)}
            fullWidth

          />
          <ThemeInput
            labelName="WhatsApp No."
            value={formData.whatsapp}
            onChange={e => handleChange('whatsapp', e.target.value)}
            mobile
            countryCode={formData.whatsappCode}
            onCountryCodeChange={code => handleChange('whatsappCode', code)}
            fullWidth

          />
        </Stack>
        <ThemeInput
          labelName="Address"
          value={formData.address}
          onChange={e => handleChange('address', e.target.value)}
          fullWidth
  
          sx={{ mb: 2 }}
        />
        <ThemeInput
          labelName="Aadhar No."
          value={formData.aadhar}
          onChange={e => handleChange('aadhar', e.target.value)}
          fullWidth
  
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={2} mb={4}>
          <ThemeInput
            labelName="Joining date"
            type="date"
            value={formData.joining}
            onChange={e => handleChange('joining', e.target.value)}
            fullWidth

            InputLabelProps={{ shrink: true }}
          />
          <ThemeInput
            labelName="Birth Day"
            type="date"
            value={formData.birth}
            onChange={e => handleChange('birth', e.target.value)}
            fullWidth

            InputLabelProps={{ shrink: true }}
          />
        </Stack>

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <ThemeButton
            sx={{
              background: mode === 'add' ? '#7F56D9' : '#12B76A',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              width: 180,
              '&:hover': { background: mode === 'add' ? '#5B3FB4' : '#079455' },
            }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (mode === 'add' ? 'Adding...' : 'Saving...') : (mode === 'add' ? 'Add Staff' : 'Save Changes')}
          </ThemeButton>
          <ThemeButton
            sx={{
              background: '#D92D20',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              width: 180,
              '&:hover': { background: '#B42318' },
            }}
            onClick={handleDiscard}
            disabled={saving}
          >
            Discard Changes
          </ThemeButton>
        </Box>
      </Box>
    </>
  );
};

export default StaffView;