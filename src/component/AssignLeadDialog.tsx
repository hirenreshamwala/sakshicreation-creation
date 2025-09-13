import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CustomDialog from '@/component/customdialog';
import ThemeSelect from '@/component/common_component/themeselect';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeButton from '@/component/common_component/themebutton';
import InputReasonDialog from '@/component/assigntaskdailog/InputReasonDialog';
import { useAppDispatch, useAppSelector } from '@/store';
import { createLeadThunk, updateLeadThunk, bulkCreateLeadsThunk, clearSuccessMessage, clearError } from '@/store/slices/leadSlice';
import { getAllAccountMastersThunk } from '@/store/slices/accountMasterSlice';
import { getAllStaffThunk } from '@/store/slices/staffSlice';
import { Lead, OptionType } from '@/services/types';
import Swal from 'sweetalert2';
import CompanySelect from "./reusablecomponents/CompanyWithPartyName"

interface AssignLeadDialogProps {
    open: boolean;
    onClose: () => void;
    lead?: Lead;
    partyIds?: string[];
    onSuccess?: () => void;
}

const AssignLeadDialog: React.FC<AssignLeadDialogProps> = ({ open, onClose, lead, partyIds, onSuccess }) => {
    const dispatch = useAppDispatch();
    const { accountMasters, loading: accountLoading, error: accountError } = useAppSelector(
        (state) => state.accountMasters || {}
    );
    const { staffList, loading: staffLoading, error: staffError } = useAppSelector(
        (state) => state.staff || {}
    );
    const { loading: leadLoading, error: leadError, successMessage } = useAppSelector(
        (state) => state.leads || {}
    );
    const [isLoading, setIsLoading] = useState(false);
    const [inputReasonOpen, setInputReasonOpen] = useState(false);
    const [customReason, setCustomReason] = useState(lead?.reason === 'Other' ? lead?.customReason || '' : '');
    const [partyDetails, setPartyDetails] = useState({
        unitNo: '',
        marketName: '',
        area: '',
        ownerWhatsAppNo: '',
    });

    const validationSchema = Yup.object({
        date: Yup.string().required('Date is required'),
        time: Yup.string(),
        reason: Yup.string().required('Reason for Visit is required'),
        assignedTo: Yup.string().required('Assign To is required'),
        remark: Yup.string(),
        status: Yup.string().required('Status is required'),
        rescheduleDate: Yup.string().when('status', {
            is: 'rescheduled',
            then: () =>
                Yup.string()
                    .required('Reschedule Date is required when status is Rescheduled')
                    .test('is-future-date', 'Reschedule Date must be a future date', (value) => {
                        if (!value) return false;
                        const selectedDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selectedDate >= today;
                    }),
            otherwise: () => Yup.string().nullable(),
        }),
        callFeedback: lead ? Yup.string().required('Call feedback is required') : Yup.string(),
        ...(partyIds
            ? {}
            : {
                companyName: Yup.string().required('Company Name is required'),
                partyName: Yup.string().required('Party Name is required'),
            }),
    });

    const formik = useFormik<Partial<Lead>>({
        initialValues: {
            companyName: lead?.companyName?._id || '',
            partyName: lead?.partyName?._id || '',
            date: lead?.date ? new Date(lead.date).toISOString().split('T')[0] : '',
            time: lead?.time || '',
            reason: lead?.reason || '',
            assignedTo: lead?.assignedTo?._id || '',
            remark: lead?.remark || '',
            status: lead?._id ? 'rescheduled' : 'pending',
            rescheduleDate: lead?.rescheduleDate ? new Date(lead.rescheduleDate).toISOString().split('T')[0] : '',
            dateType: lead?.dateType || 'today',
            statusOfParty: lead?.partyName?.partyTag || 'New',
            address: lead?.partyName?.address
                ? `${lead.partyName.address.unitNo}, ${lead.partyName.address.streetAddress}`
                : '',
            market: lead?.partyName?.address?.marketName || '',
            mobile: lead?.partyName?.personMobileNo || '',
            area: lead?.partyName?.address?.area || '',
            callFeedback: lead?.callFeedback || '',
        },
        validationSchema,
        enableReinitialize: true,
        validateOnBlur: true, // Enable validation on blur for better UX
        validateOnChange: true, // Enable validation on change
        onSubmit: async (values) => {
            setIsLoading(true);
            try {

                if (partyIds && partyIds.length > 0) {
                    // Bulk lead creation
                    if (!values.reason || !values.assignedTo || !values.date) {
                        toast.error('Please fill all required fields: Reason, Assigned To, and Date');
                        setIsLoading(false);
                        return;
                    }
                    // Bulk lead creation
                    const leadsData = partyIds.map((partyId) => {
                        const account = accountMasters.find((acc) => acc.party?._id === partyId);
                        if (!account) {
                            console.error(`Account not found for party ID: ${partyId}`);
                            throw new Error(`Account not found for party ID: ${partyId}`);
                        }
                        const leadData = {
                            companyName: account.companyName?._id,
                            partyName: partyId,
                            reason: values.reason === 'Other' ? customReason : values.reason,
                            customReason: values.reason === 'Other' ? customReason : undefined,
                            assignedTo: values.assignedTo,
                            date: values.date,
                            time: values.time || undefined,
                            status: values.status,
                            remark: values.remark || undefined,
                            callFeedback: values.callFeedback || undefined,
                            rescheduleDate: values.rescheduleDate || undefined,
                        };
                        return leadData;
                    });

                    // Dispatch bulk create and handle response
                    const response = await dispatch(bulkCreateLeadsThunk(leadsData)).unwrap();

                    // Check for errors in the response
                    if (response.errors && response.errors.length > 0) {
                        response.errors.forEach((error: any) => {
                            toast.error(`Error for party ${error.partyName}: ${error.message}`);
                        });
                    } else {
                        toast.success('Leads created successfully for selected parties');
                    }
                } else if (lead?._id) {
                    // Update existing lead
                    const leadData = {
                        ...values,
                        reason: values.reason === 'Other' ? customReason : values.reason,
                        customReason: values.reason === 'Other' ? customReason : undefined,
                    };
                    await dispatch(updateLeadThunk({ id: lead._id, data: leadData })).unwrap();
                    toast.success('Party Call updated successfully');
                } else {
                    // Create single lead
                    const leadData = {
                        ...values,
                        reason: values.reason === 'Other' ? customReason : values.reason,
                        customReason: values.reason === 'Other' ? customReason : undefined,
                    };
                    await dispatch(createLeadThunk(leadData)).unwrap();
                    toast.success('Party Call created successfully');
                }
                formik.resetForm();
                setCustomReason('');
                if (onSuccess) onSuccess();
                handleClose();
            } catch (err: any) {
                console.error("Error in form submission:", err);
                toast.error(err.message || `Failed to ${lead?._id ? 'update' : 'create'} Party Call(s)`);
            } finally {
                setIsLoading(false);
            }
        },
    });

    const staffOptions = useMemo(() => {
        const currentAssignedTo = lead?._id && formik.values.assignedTo
            ? staffList.find((staff) => staff._id === formik.values.assignedTo)
            : null;

        const filteredStaff = staffList.filter((staff) => {
            const isSalesStaff = staff.role?.roleName === 'Sales Staff';
            const isCurrentAssignedTo = currentAssignedTo && staff._id === currentAssignedTo._id;
            return isSalesStaff || isCurrentAssignedTo;
        });

        return filteredStaff.map((staff) => ({
            label: staff.name,
            value: staff._id,
        }));
    }, [staffList, lead?._id, formik.values.assignedTo]);

    const reasonOptions = useMemo(
        () => [
            { label: 'Cold Call', value: 'Cold Call' },
            { label: 'Proof Approval', value: 'Proof Approval' },
            // { label: 'Sample Approval', value: 'Sample Approval' },
            // { label: 'Delivery', value: 'Delivery' },
            { label: 'Inquiry Call', value: 'Inquiry Call' },
            { label: 'Confirmation Call', value: 'Confirmation Call' },
            { label: 'Other', value: 'Other' },
        ],
        []
    );

    const statusOptions = useMemo(
        () => [
            { label: 'Pending', value: 'pending' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Rescheduled', value: 'rescheduled' },
        ],
        []
    );

    useEffect(() => {
        if (open) {
            dispatch(clearSuccessMessage());
            dispatch(clearError());
            dispatch(getAllAccountMastersThunk());
            dispatch(getAllStaffThunk());
            if (!lead) {
                formik.resetForm();
                setCustomReason('');
                setPartyDetails({
                    unitNo: "",
                    marketName: "",
                    area: "",
                    ownerWhatsAppNo: "",
                });
            }
        }
    }, [open, dispatch, lead]);

    useEffect(() => {
        if (open && lead?._id) {
            const selectedParty = accountMasters?.find((account) => account.party?._id === formik.values.partyName);
            setPartyDetails({
                unitNo: selectedParty?.party?.address?.unitNo || "",
                marketName: selectedParty?.party?.address?.marketName || "",
                area: selectedParty?.party?.address?.area || "",
                ownerWhatsAppNo: selectedParty?.party?.ownerWhatsAppNo || "",
            });
        }
    }, [open, lead, formik.values.partyName, accountMasters]);

    useEffect(() => {
        if (open) {
            if (leadError) {
                toast.error(leadError);
                dispatch(clearError());
            }
            if (accountError) {
                toast.error(accountError);
                dispatch(clearError());
            }
            if (staffError) {
                toast.error(staffError);
                dispatch(clearError());
            }
            if (successMessage) {
                toast.success(successMessage);
                dispatch(clearSuccessMessage());
            }
        }
    }, [leadError, accountError, staffError, successMessage, open, dispatch]);

    useEffect(() => {
        return () => {
            dispatch(clearSuccessMessage());
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleClose = () => {
        formik.resetForm();
        setCustomReason('');
        setInputReasonOpen(false);
        setPartyDetails({
            unitNo: "",
            marketName: "",
            area: "",
            ownerWhatsAppNo: "",
        });
        onClose();
    };

    const getSelectedOption = (value: string, options: OptionType[]) => {
        return options.find((option) => option.value === value) || null;
    };

    const handleCompanyChange = (event: any, newValue: any) => {
        const companyId = newValue ? newValue.value : '';
        formik.setFieldValue('companyName', companyId);
        formik.setFieldValue('partyName', '');
        formik.setFieldValue('assignedTo', '');
        setPartyDetails({
            unitNo: "",
            marketName: "",
            area: "",
            ownerWhatsAppNo: "",
        });
    };

    const handlePartyChange = (event: any, newValue: any) => {
        const partyId = newValue ? newValue.value : '';
        formik.setFieldValue('partyName', partyId);

        // Find the selected party's createdBy and details from accountMasters
        const selectedParty = accountMasters?.find((account) => account.party?._id === partyId);
        const createdById = selectedParty?.createdBy?._id || "";
        if (createdById) {
            const isSalesStaff = staffList.find(
                (staff) => staff._id === createdById && staff.role?.roleName === "Sales Staff"
            );
            if (isSalesStaff) {
                formik.setFieldValue('assignedTo', createdById);
            } else {
                formik.setFieldValue('assignedTo', '');
            }
        } else {
            formik.setFieldValue('assignedTo', '');
        }

        // Set party details for display
        setPartyDetails({
            unitNo: selectedParty?.party?.address?.unitNo || "",
            marketName: selectedParty?.party?.address?.marketName || "",
            area: selectedParty?.party?.address?.area || "",
            ownerWhatsAppNo: selectedParty?.party?.ownerWhatsAppNo || "",
        });
    };

    const handleSaveReason = (reason: string) => {
        if (reason) {
            formik.setFieldValue('reason', "Other");
            formik.setFieldTouched('reason', true);
            setCustomReason(reason);
        }
        setInputReasonOpen(false);
    };

    return (
        <>
            <CustomDialog
                open={open}
                onClose={handleClose}
                title={lead?._id ? 'Update Party' : partyIds ? 'Create Party Call for Selected Parties' : 'Assign New Party Call'}
                maxWidth="md"
                fullWidth
            >
                <Box
                    sx={{ p: { xs: 2, sm: 3 }, background: '#fff', borderRadius: 2, maxHeight: '70vh', overflowY: 'auto' }}
                    component="form"
                    onSubmit={formik.handleSubmit}
                >
                    {!partyIds && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                            <CompanySelect
                                name="companyName"
                                value={formik.values.companyName}
                                onChange={handleCompanyChange}
                                error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                                helperText={formik.touched.companyName && formik.errors.companyName}
                                hasParties={true}
                                required
                                showPartyName={true}
                                partyName={formik.values.partyName}
                                onPartyChange={handlePartyChange}
                                partyError={formik.touched.partyName && Boolean(formik.errors.partyName)}
                                partyHelperText={formik.touched.partyName && formik.errors.partyName}
                            />
                        </Stack>
                    )}

                    {/* Party Details Fields (only shown for single lead creation/editing) */}
                    {!partyIds && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                            <ThemeInput
                                labelName="Unit No"
                                type="text"
                                value={partyDetails.unitNo}
                                disabled
                                fullWidth
                            />
                            <ThemeInput
                                labelName="Market Name"
                                type="text"
                                value={partyDetails.marketName?.marketName}
                                disabled
                                fullWidth
                            />
                            <ThemeInput
                                labelName="Area"
                                type="text"
                                value={partyDetails.area?.area}
                                disabled
                                fullWidth
                            />
                            <ThemeInput
                                labelName="Owner WhatsApp No"
                                type="text"
                                value={partyDetails.ownerWhatsAppNo}
                                disabled
                                fullWidth
                            />
                        </Stack>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                        <ThemeInput
                            labelName="Date"
                            type="date"
                            value={formik.values.date}
                            onChange={formik.handleChange}
                            name="date"
                            error={formik.submitCount > 0 && Boolean(formik.errors.date)}
                            helperText={formik.submitCount > 0 && (formik.errors.date as string)}
                            fullWidth
                            required
                        />
                        <ThemeInput
                            labelName="Time"
                            type="time"
                            value={formik.values.time}
                            onChange={formik.handleChange}
                            name="time"
                            error={formik.submitCount > 0 && Boolean(formik.errors.time)}
                            helperText={formik.submitCount > 0 && (formik.errors.time as string)}
                            fullWidth
                        />
                        <ThemeSelect
                            label="Assign to"
                            options={staffOptions}
                            value={getSelectedOption(formik.values.assignedTo || '', staffOptions)}
                            onChange={(event, newValue) => {
                                formik.setFieldValue('assignedTo', newValue ? newValue.value : '');
                            }}
                            name="assignedTo"
                            error={formik.submitCount > 0 && Boolean(formik.errors.assignedTo)}
                            helperText={formik.submitCount > 0 && formik.errors.assignedTo}
                            required
                            sx={{ mb: 3 }}
                        />
                    </Stack>

                    <Box mb={2}>
                        <Typography fontWeight={600} mb={1} fontSize={14}>
                            Reason for Call
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                            {reasonOptions.map((reason) => (
                                <Button
                                    key={reason.value}
                                    variant={reason.value === formik.values.reason || (reason.value === 'Other' && customReason) ? 'contained' : 'outlined'}
                                    onClick={() => {
                                        if (reason.value === 'Other') {
                                            setInputReasonOpen(true);
                                        } else {
                                            formik.setFieldValue('reason', reason.value);
                                            setCustomReason('');
                                        }
                                    }}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        fontWeight: 500,
                                        px: 2,
                                        py: 0.8,
                                        minWidth: 110,
                                        backgroundColor:
                                            reason.value === formik.values.reason || (reason.value === 'Other' && customReason)
                                                ? '#28C76F'
                                                : 'transparent',
                                        color:
                                            reason.value === formik.values.reason || (reason.value === 'Other' && customReason)
                                                ? '#fff'
                                                : 'inherit',
                                        borderColor: '#ccc',
                                        '&:hover': {
                                            backgroundColor:
                                                reason.value === formik.values.reason || (reason.value === 'Other' && customReason)
                                                    ? '#28C76F'
                                                    : '#f0f0f0',
                                        },
                                    }}
                                >
                                    {reason.value === 'Other' && customReason ? customReason : reason.label}
                                </Button>
                            ))}
                        </Box>
                        {formik.submitCount > 0 && formik.errors.reason && (
                            <Typography color="error" fontSize={12} mt={1}>
                                {formik.errors.reason}
                            </Typography>
                        )}
                    </Box>

                    {lead?._id && (
                        <>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                                <ThemeSelect
                                    label="Status"
                                    options={statusOptions}
                                    value={getSelectedOption(formik.values.status || '', statusOptions)}
                                    onChange={(event, newValue) => {
                                        formik.setFieldValue('status', newValue ? newValue.value : '');
                                    }}
                                    name="status"
                                    error={formik.submitCount > 0 && Boolean(formik.errors.status)}
                                    helperText={formik.submitCount > 0 && formik.errors.status}
                                    required
                                    sx={{ mb: 3 }}
                                />
                                {formik.values.status === 'rescheduled' && (
                                    <ThemeInput
                                        labelName="Reschedule Date"
                                        type="date"
                                        value={formik.values.rescheduleDate}
                                        onChange={formik.handleChange}
                                        name="rescheduleDate"
                                        error={formik.submitCount > 0 && Boolean(formik.errors.rescheduleDate)}
                                        helperText={formik.submitCount > 0 && formik.errors.rescheduleDate}
                                        fullWidth
                                        required
                                    />
                                )}
                            </Stack>
                            <Box mb={2}>
                                <ThemeInput
                                    labelName="Call Feedback"
                                    value={formik.values.callFeedback}
                                    onChange={formik.handleChange}
                                    name="callFeedback"
                                    error={formik.submitCount > 0 && Boolean(formik.errors.callFeedback)}
                                    helperText={formik.submitCount > 0 && formik.errors.callFeedback}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    required
                                />
                            </Box>
                        </>
                    )}

                    <ThemeButton
                        type="submit"
                        sx={{
                            background: '#12B76A',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 16,
                            borderRadius: 2,
                            py: 1.2,
                            width: '100%',
                            '&:hover': { background: '#0E9D5D' },
                        }}
                        disabled={isLoading || formik.isSubmitting}
                    >
                        {isLoading || formik.isSubmitting
                            ? lead?._id
                                ? 'Updating...'
                                : 'Assigning...'
                            : lead?._id
                                ? 'Update Party Call'
                                : partyIds
                                    ? 'Create Party Call'
                                    : 'Assign Party Call'}
                    </ThemeButton>
                </Box>
            </CustomDialog>

            <InputReasonDialog
                open={inputReasonOpen}
                onClose={() => setInputReasonOpen(false)}
                onSave={handleSaveReason}
            />
        </>
    );
};

export default AssignLeadDialog;
