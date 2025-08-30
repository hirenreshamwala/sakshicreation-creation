import React, { useState, SyntheticEvent, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  TableContainer,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import BasicTable from '@/component/common_component/Table/themetable';
import Input from '@/component/common_component/themeinput';
import Button from '@/component/common_component/themebutton';
import CustomDialog from '@/component/customdialog';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  getAllRoleDepartmentsThunk,
  createRoleDepartmentThunk,
  updateRoleDepartmentThunk,
  deleteRoleDepartmentThunk,
  getAllRoleDepartmentCompaniesThunk,
  createRoleDepartmentCompanyThunk,
  updateRoleDepartmentCompanyThunk,
  deleteRoleDepartmentCompanyThunk,
  getAllCompaniesThunk,
  clearError,
  clearSuccessMessage,
} from '@/store/slices/roleDepartmentSlice';
import ThemeSelect from '@/component/common_component/themeselect';

// --- TabPanel Component ---
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

// --- Table Headers ---
const departmentTableHeader = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Department Name' },
  { id: 'company', label: 'Company' },
  { id: 'options', label: 'Actions' },
];

const companyTableHeader = [
  { id: 'id', label: 'ID' },
  { id: 'companyName', label: 'Sub Company Name' },
  { id: 'roleDepartment', label: 'Department' },
  { id: 'options', label: 'Actions' },
];

// --- Main Component ---
const DepartmentCompany = () => {
  const dispatch = useAppDispatch();
  const {
    roleDepartments,
    roleDepartmentCompanies,
    companies,
    loading,
    error,
    successMessage,
  } = useAppSelector((state) => state.roleDepartments);

  const [activeTab, setActiveTab] = useState(0);

  // Department Dialog State
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [isEditDepartmentMode, setIsEditDepartmentMode] = useState(false);
  const [departmentForm, setDepartmentForm] = useState<{
    roleDepartment: string;
    CompanyName: string;
  }>({ roleDepartment: '', CompanyName: '' });
  const [editDepartmentId, setEditDepartmentId] = useState<string | null>(null);

  // Company Dialog State
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [isEditCompanyMode, setIsEditCompanyMode] = useState(false);
  const [companyForm, setCompanyForm] = useState<{
    roleDepartmentCompanyName: string;
    roleDepartment: string;
  }>({
    roleDepartmentCompanyName: '',
    roleDepartment: '',
  });
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);

  // Fetch data on component mount and tab change
  useEffect(() => {
    dispatch(getAllCompaniesThunk());
    if (activeTab === 0) {
      dispatch(getAllRoleDepartmentsThunk());
    } else {
      dispatch(getAllRoleDepartmentCompaniesThunk());
    }
  }, [activeTab, dispatch]);

  // Handle success and error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [successMessage, error, dispatch]);

  // Handle tab change
  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Department CRUD
  const handleOpenDepartmentDialog = async (department?: any) => {
    try {
      await dispatch(getAllCompaniesThunk()).unwrap();
      if (department) {
        setEditDepartmentId(department._id);
        setDepartmentForm({
          roleDepartment: department.roleDepartment,
          CompanyName: typeof department.CompanyName === 'string' ? department.CompanyName : department.CompanyName?._id || '',
        });
        setIsEditDepartmentMode(true);
      } else {
        setEditDepartmentId(null);
        setDepartmentForm({
          roleDepartment: '',
          CompanyName: companies.length > 0 ? companies[0]._id : '',
        });
        setIsEditDepartmentMode(false);
      }
      setOpenDepartmentDialog(true);
    } catch (error) {
      toast.error('Failed to load companies');
    }
  };

  const handleSaveDepartment = async () => {
    if (!departmentForm.roleDepartment.trim() || !departmentForm.CompanyName) {
      toast.error('Department name and company are required');
      return;
    }

    try {
      if (isEditDepartmentMode && editDepartmentId) {
        await dispatch(
          updateRoleDepartmentThunk({
            id: editDepartmentId,
            data: {
              roleDepartment: departmentForm.roleDepartment,
              CompanyName: departmentForm.CompanyName,
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createRoleDepartmentThunk({
            roleDepartment: departmentForm.roleDepartment,
            CompanyName: departmentForm.CompanyName,
          })
        ).unwrap();
      }
      setOpenDepartmentDialog(false);
      setDepartmentForm({ roleDepartment: '', CompanyName: '' });
      setEditDepartmentId(null);
    } catch (error) {
      // Error handling is done in the Redux slice
    }
  };

  const handleDeleteDepartment = (id: string, name: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${name}? This will also delete associated companies.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteRoleDepartmentThunk(id));
      }
    });
  };

  const departmentOptions = roleDepartments.map((dept) => ({
    value: dept._id,
    label: dept.roleDepartment,
  }));

  const companyOptions = companies.map((company) => ({
    value: company._id,
    label: company.companyName,
  }));

  // Get current selected department and company for the form
  const selectedDepartment = departmentOptions.find(
    (opt) => opt.value === companyForm.roleDepartment
  ) || null;

  const selectedCompany = companyOptions.find(
    (opt) => opt.value === departmentForm.CompanyName
  ) || null;

  // Handle department selection change
  const handleDepartmentChange = (
    event: React.SyntheticEvent,
    newValue: { value: string; label: string } | null
  ) => {
    setCompanyForm((prev) => ({
      ...prev,
      roleDepartment: newValue?.value || '',
    }));
  };

  // Handle company selection change
  const handleCompanyChange = (
    event: React.SyntheticEvent,
    newValue: { value: string; label: string } | null
  ) => {
    setDepartmentForm((prev) => ({
      ...prev,
      CompanyName: newValue?.value || '',
    }));
  };

  // Company CRUD
  const handleOpenCompanyDialog = async (company?: any) => {
    try {
      await dispatch(getAllRoleDepartmentsThunk()).unwrap();
      if (company) {
        setEditCompanyId(company._id);
        setCompanyForm({
          roleDepartmentCompanyName: company.roleDepartmentCompanyName,
          roleDepartment: typeof company.roleDepartment === 'string'
            ? company.roleDepartment
            : company.roleDepartment?._id || '',
        });
        setIsEditCompanyMode(true);
      } else {
        setEditCompanyId(null);
        setCompanyForm({
          roleDepartmentCompanyName: '',
          roleDepartment: roleDepartments.length > 0 ? roleDepartments[0]._id : '',
        });
        setIsEditCompanyMode(false);
      }
      setOpenCompanyDialog(true);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const handleSaveCompany = async () => {
    if (!companyForm.roleDepartmentCompanyName.trim() || !companyForm.roleDepartment) {
      toast.error('Company name and department are required');
      return;
    }

    try {
      if (isEditCompanyMode && editCompanyId) {
        await dispatch(
          updateRoleDepartmentCompanyThunk({
            id: editCompanyId,
            data: {
              roleDepartmentCompanyName: companyForm.roleDepartmentCompanyName,
              roleDepartment: companyForm.roleDepartment,
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createRoleDepartmentCompanyThunk({
            roleDepartmentCompanyName: companyForm.roleDepartmentCompanyName,
            roleDepartment: companyForm.roleDepartment,
          })
        ).unwrap();
      }
      setOpenCompanyDialog(false);
      setCompanyForm({ roleDepartmentCompanyName: '', roleDepartment: '' });
      setEditCompanyId(null);
    } catch (error) {
      // Error handling is done in the Redux slice
    }
  };

  const handleDeleteCompany = (id: string, companyName: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${companyName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteRoleDepartmentCompanyThunk(id));
      }
    });
  };

  const getDepartmentName = (departmentRef: string | { _id: string; roleDepartment: string }) => {
    if (typeof departmentRef === 'string') {
      const department = roleDepartments.find((dept) => dept._id === departmentRef);
      return department ? department.roleDepartment : 'Unknown Department';
    }
    return departmentRef?.roleDepartment || 'Unknown Department';
  };

  const getCompanyName = (companyRef: string | { _id: string; companyName: string } | undefined) => {
    if (!companyRef) {
      return 'Unknown Company';
    }
    if (typeof companyRef === 'string') {
      const company = companies.find((comp) => comp._id === companyRef);
      return company ? company.companyName : 'Unknown Company';
    }
    return companyRef.companyName || 'Unknown Company';
  };

  return (
    <Box p={3}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="department company tabs"
        >
          <Tab label="Departments" {...a11yProps(0)} />
          <Tab label="Companies" {...a11yProps(1)} />
        </Tabs>
      </Box>

      {/* --- Departments Tab --- */}
      <TabPanel value={activeTab} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={600}>
            Departments
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDepartmentDialog()}
            sx={{ borderRadius: 2, fontWeight: 600 }}
            disabled={loading || companies.length === 0}
          >
            New Department
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <BasicTable
            showFilter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={departmentTableHeader}
            rowData={roleDepartments}
            renderRow={(row: any, idx: number) => (
              <>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{row.roleDepartment}</TableCell>
                <TableCell>{getCompanyName(row.CompanyName)}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDepartmentDialog(row)}
                    disabled={loading}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteDepartment(row._id, row.roleDepartment)}
                    disabled={loading}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </>
            )}
          />
        )}
      </TabPanel>

      {/* --- Companies Tab --- */}
      <TabPanel value={activeTab} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={600}>
            Companies
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenCompanyDialog()}
            sx={{ borderRadius: 2, fontWeight: 600 }}
            disabled={loading}
          >
            New Company
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <BasicTable
            showFilter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={companyTableHeader}
            rowData={roleDepartmentCompanies}
            renderRow={(row: any, idx: number) => (
              <>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{row.roleDepartmentCompanyName}</TableCell>
                <TableCell>{getDepartmentName(row.roleDepartment)}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenCompanyDialog(row)}
                    disabled={loading}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteCompany(row._id, row.roleDepartmentCompanyName)}
                    disabled={loading}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </>
            )}
          />
        )}
      </TabPanel>

      {/* --- Department Dialog --- */}
      <CustomDialog
        open={openDepartmentDialog}
        onClose={() => {
          setOpenDepartmentDialog(false);
          setDepartmentForm({ roleDepartment: '', CompanyName: '' });
          setEditDepartmentId(null);
        }}
        title={isEditDepartmentMode ? 'Edit Department' : 'New Department'}
        maxWidth="xs"
        fullWidth
      >
        <ThemeSelect
          label="Company"
          options={companyOptions}
          value={selectedCompany}
          onChange={handleCompanyChange}
          required
          disabled={loading || companies.length === 0}
          helperText={companies.length === 0 ? 'No companies available. Please create a company first.' : ''}
          sx={{ mb: 2, mt: 1 }}
        />
        <Input
          labelName="Department Name"
          value={departmentForm.roleDepartment}
          onChange={(e: any) => setDepartmentForm((prev) => ({ ...prev, roleDepartment: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2 }}
          disabled={loading}
        />
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            onClick={() => {
              setOpenDepartmentDialog(false);
              setDepartmentForm({ roleDepartment: '', CompanyName: '' });
              setEditDepartmentId(null);
            }}
            variant="outlined"
            sx={{ borderRadius: 2 }}
            disabled={loading}
          >
            Close
          </Button>
          <Button
            onClick={handleSaveDepartment}
            variant="contained"
            sx={{ borderRadius: 2 }}
            disabled={loading || !departmentForm.CompanyName}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </CustomDialog>

      {/* --- Company Dialog --- */}
      <CustomDialog
        open={openCompanyDialog}
        onClose={() => {
          setOpenCompanyDialog(false);
          setCompanyForm({ roleDepartmentCompanyName: '', roleDepartment: '' });
          setEditCompanyId(null);
        }}
        title={isEditCompanyMode ? 'Edit Company' : 'New Company'}
        maxWidth="xs"
        fullWidth
      >
        <ThemeSelect
          label="Department"
          options={departmentOptions}
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          required
          disabled={loading || roleDepartments.length === 0}
          helperText={roleDepartments.length === 0 ? 'No departments available. Please create a department first.' : ''}
          sx={{ mb: 2, mt: 1 }}
        />
        <Input
          labelName="Sub Company Name"
          value={companyForm.roleDepartmentCompanyName}
          onChange={(e: any) =>
            setCompanyForm((prev) => ({
              ...prev,
              roleDepartmentCompanyName: e.target.value,
            }))
          }
          fullWidth
          required
          sx={{ mb: 2 }}
          disabled={loading}
        />
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            onClick={() => {
              setOpenCompanyDialog(false);
              setCompanyForm({ roleDepartmentCompanyName: '', roleDepartment: '' });
              setEditCompanyId(null);
            }}
            variant="outlined"
            sx={{ borderRadius: 2 }}
            disabled={loading}
          >
            Close
          </Button>
          <Button
            onClick={handleSaveCompany}
            variant="contained"
            sx={{ borderRadius: 2 }}
            disabled={loading || roleDepartments.length === 0}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default DepartmentCompany;