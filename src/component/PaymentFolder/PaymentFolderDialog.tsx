"use client";

import React, { useState, useEffect, memo } from "react";
import { Box, Stack } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CustomDialog from "@/component/customdialog";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createPaymentFolderThunk,
  updatePaymentFolderThunk,
} from "@/store/slices/paymentFolderSlice";
import { getAllAccountMastersThunk } from "@/store/slices/accountMasterSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import moment from "moment";

const areaOptions = [
  { label: "K-1", value: "K-1" },
  { label: "K-2", value: "K-2" },
  { label: "K-3", value: "K-3" },
  { label: "K-4", value: "K-4" },
]

const monthOptions = [
  { label: "Jan", value: "Jan" },
  { label: "Feb", value: "Feb" },
  { label: "Mar", value: "Mar" },
  { label: "Apr", value: "Apr" },
  { label: "May", value: "May" },
  { label: "Jun", value: "Jun" },
  { label: "Jul", value: "Jul" },
  { label: "Aug", value: "Aug" },
  { label: "Sep", value: "Sep" },
  { label: "Oct", value: "Oct" },
  { label: "Nov", value: "Nov" },
  { label: "Dec", value: "Dec" },
]

const paymentTypeOptions = [
  { label: "NEFT", value: "NEFT" },
  { label: "Cash", value: "Cash" },
  { label: "Cheque", value: "Cheque" },
]

interface OptionType {
  label: string;
  value: string;
}

interface PaymentFolderDialogProps {
  open: boolean;
  onClose: () => void;
  folderId?: string | null;
  refreshData?: () => void;
  companyTab?: number;
  company?: any;
}

const PaymentFolderDialog: React.FC<PaymentFolderDialogProps> = memo(({
  open,
  onClose,
  rowData,
  modalType
}: any) => {

  const dispatch = useAppDispatch();
  const { accountMasters } = useAppSelector((state) => state.accountMasters || {});
  const { staffList } = useAppSelector((state) => state.staff || {});
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = modalType === 'Edit';

  const staffOptions = staffList.map((staff: any) => ({
    label: `${staff.firstName} ${staff.lastName}`,
    value: staff._id,
  }))

  const validationSchema = Yup.object({
    companyName: Yup.string().required("Company Name is required"),
    partyName: Yup.string().required("Party Name is required"),
    area: Yup.string().required("Area is required"),
    month: Yup.string().required("Month is required"),
    paymentAmount: Yup.number().required("Payment Amount is required").positive("Must be positive"),
    // paymentType: Yup.string().required("Payment Type is required"),
    assignTo: Yup.string().required("Assign To is required"),
    assignedDate: Yup.string().required("Assigned Date is required"),
    remarks: Yup.string(),
  });

  // Get initial values based on modal type and rowData
  const getInitialValues = () => {
    if (isEditMode && rowData) {
      return {
        companyName: rowData?.company?._id || "",
        partyName: rowData?.party?._id || "",
        area: rowData?.area || "",
        month: rowData?.month || "",
        paymentAmount: rowData?.paymentAmount || 0,
        paymentType: rowData?.paymentType || "",
        assignTo: rowData?.assignedTo?._id || "",
        assignedDate: moment(rowData?.assignedDate).format('YYYY-MM-DD') || "",
        remarks: rowData?.remarks || "",
        receivedAmount: rowData?.receivedAmount || 0,
      };
    }
    return {
      companyName: "",
      partyName: "",
      area: "",
      month: "",
      paymentAmount: 0,
      paymentType: "",
      assignTo: "",
      assignedDate: "",
      remarks: "",
      receivedAmount: 0,
    };
  };

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema,
    enableReinitialize: true, // This is important to update form when props change
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const submitData = {
          ...values,
          company: values.companyName,
          party: values.partyName,
          assignedTo: values.assignTo,
          assignedDate: values.assignedDate,
          paymentType: values.paymentType,
          month: values.month,
          paymentAmount: values.paymentAmount,
          area: values.area,
          remarks: values.remarks,
          ...(isEditMode && { receivedAmount: values.receivedAmount }),
        };

        if (isEditMode) {
          await dispatch(updatePaymentFolderThunk({ id: rowData._id, data: submitData })).unwrap();
          toast.success("Payment folder updated successfully");
        } else {
          await dispatch(createPaymentFolderThunk(submitData)).unwrap();
          toast.success("Payment folder created successfully");
        }

        handleClose();
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Operation failed",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    if (!accountMasters?.length) dispatch(getAllAccountMastersThunk());
    if (!staffList?.length) dispatch(getAllStaffThunk());
  }, []);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      formik.resetForm({ values: getInitialValues() });
    }
  }, [open, modalType, rowData]);

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : "";
    formik.setFieldValue("companyName", companyId);
    formik.setFieldValue("partyName", "");
  };

  const handlePartyChange = (event: any, newValue: any) => {
    const partyId = newValue ? newValue.value : "";
    formik.setFieldValue("partyName", partyId);
  };

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title={`${modalType} Payment Folder`}
      maxWidth="md"
      fullWidth
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          background: "#fff",
          borderRadius: 2,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
        component="form"
        onSubmit={formik.handleSubmit}
      >
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={formik.values.companyName}
            onChange={handleCompanyChange}
            error={formik.touched.companyName && Boolean(formik.errors.companyName)}
            helperText={formik.touched.companyName && formik.errors.companyName as any}
            hasParties={true}
            required
            showPartyName={true}
            partyName={formik.values.partyName}
            onPartyChange={handlePartyChange}
            partyError={formik.touched.partyName && Boolean(formik.errors.partyName)}
            partyHelperText={formik.touched.partyName && formik.errors.partyName as any}
          />
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <ThemeSelect
            label="Area"
            options={areaOptions}
            value={areaOptions.find((item) => item.value === formik.values.area)}
            onChange={(event, newValue) => formik.setFieldValue("area", newValue ? newValue.value : "")}
            error={formik.touched.area && Boolean(formik.errors.area)}
            helperText={formik.touched.area && formik.errors.area}
            required
          />
          <ThemeSelect
            label="Month"
            options={monthOptions}
            value={monthOptions.find((item) => item.value === formik.values.month)}
            onChange={(event, newValue) => formik.setFieldValue("month", newValue ? newValue.value : "")}
            error={formik.touched.month && Boolean(formik.errors.month)}
            helperText={formik.touched.month && formik.errors.month}
            required
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Payment Amount"
            type="number"
            value={formik.values.paymentAmount}
            onChange={(e) => formik.setFieldValue("paymentAmount", parseFloat(e.target.value) || 0)}
            error={formik.touched.paymentAmount && Boolean(formik.errors.paymentAmount)}
            helperText={formik.touched.paymentAmount && formik.errors.paymentAmount}
            required
          />
          <ThemeInput
            labelName="Assigned Date"
            type="date"
            value={formik.values.assignedDate}
            onChange={(e) => formik.setFieldValue("assignedDate", e.target.value)}
            error={formik.touched.assignedDate && Boolean(formik.errors.assignedDate)}
            helperText={formik.touched.assignedDate && formik.errors.assignedDate}
            required
          />
          {/* {isEditMode && (
            <ThemeInput
              labelName="Received Amount"
              type="number"
              value={formik.values.receivedAmount}
              onChange={(e) => formik.setFieldValue("receivedAmount", parseFloat(e.target.value) || 0)}
              error={formik.touched.receivedAmount && Boolean(formik.errors.receivedAmount)}
              helperText={formik.touched.receivedAmount && formik.errors.receivedAmount}
              required
              fullWidth
            />
          )} */}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          {/* <ThemeSelect
            label="Payment Type"
            options={paymentTypeOptions}
            value={getSelectedOption(formik.values.paymentType, paymentTypeOptions)}
            onChange={(event, newValue) => formik.setFieldValue("paymentType", newValue ? newValue.value : "")}
            error={formik.touched.paymentType && Boolean(formik.errors.paymentType)}
            helperText={formik.touched.paymentType && formik.errors.paymentType}
            required
          /> */}
          <ThemeSelect
            label="Assign To"
            options={staffOptions}
            value={getSelectedOption(formik.values.assignTo, staffOptions)}
            onChange={(event, newValue) => formik.setFieldValue("assignTo", newValue ? newValue.value : "")}
            error={formik.touched.assignTo && Boolean(formik.errors.assignTo)}
            helperText={formik.touched.assignTo && formik.errors.assignTo}
            required
          />
        </Stack>

        {/* <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
            <ThemeInput
              labelName="Assigned Date"
              type="date"
              value={formik.values.assignedDate}
              onChange={(e) => formik.setFieldValue("assignedDate", e.target.value)}
              error={formik.touched.assignedDate && Boolean(formik.errors.assignedDate)}
              helperText={formik.touched.assignedDate && formik.errors.assignedDate}
              required
              fullWidth
            />
          </Stack> */}

        {/* <Box mb={2}>
          <ThemeInput
            labelName="Remarks"
            type="text"
            value={formik.values.remarks}
            onChange={(e) => formik.setFieldValue("remarks", e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box> */}

        <ThemeButton
          type="submit"
          sx={{
            background: "#A409F8",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: "100%",
            mt: 1,
            "&:hover": { background: "#7B06C2" },
          }}
          disabled={isLoading || formik.isSubmitting}
        >
          {isLoading || formik.isSubmitting
            ? isEditMode ? "Updating..." : "Creating..."
            : isEditMode ? "Update Payment Folder" : "Create Payment Folder"}
        </ThemeButton>
      </Box>
    </CustomDialog>
  );
});

export default PaymentFolderDialog;