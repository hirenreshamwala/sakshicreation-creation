"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CustomDialog from "@/component/customdialog";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import InputReasonDialog from "@/component/assigntaskdailog/InputReasonDialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createAssignTaskThunk,
  updateAssignTaskThunk,
  clearSuccessMessage,
  clearError,
} from "@/store/slices/assignTaskSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import type { CreateAssignTask, UpdateAssignTask } from "@/services/assignTask.service";
import Swal from "sweetalert2";
import CompanySelect from "../reusablecomponents/CompanyWithPartyName";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { StaticCompanyOptions } from "@/constants";
import moment from "moment";

// API service import - आपके project के structure के according adjust करें
import { partyService } from "@/services/party.service"; // या जहाँ भी आपकी party API service हो

interface OptionType {
  label: string;
  value: string;
}

interface Party {
  partyId: string;
  companyId: string;
}

interface AssignTaskDialogProps {
  open: boolean;
  onClose: () => void;
  taskId?: string | null;
  selectedParties?: Party[];
  refreshData?: () => void;
  toggleScDialog?: any;
  toggleQpDialog?: any;
  companyTab?: any;
  partyOptions?: OptionType[];
  companyOptions?: OptionType[];
  accountMasters?: any[];
  rowData?: any;
}

const AssignTaskDialog: React.FC<AssignTaskDialogProps> = memo(({
  open,
  onClose,
  taskId,
  selectedParties = [],
  refreshData,
  partyOptions,
  companyOptions,
  toggleScDialog,
  toggleQpDialog,
  accountMasters = [],
  rowData,
  companyTab
}) => {
  const router = useRouter()
  const dispatch = useAppDispatch();
  const singleAssignTask = rowData;

  const {
    loading: accountLoading,
    error: accountError,
  } = useAppSelector((state) => state.accountMasters || {});

  const { staffList = [], loading: staffLoading, error: staffError } = useAppSelector(
    (state) => state.staff || {}
  );

  const {
    loading: taskLoading,
    error: taskError,
    successMessage,
  } = useAppSelector((state) => state.assignTasks || {});

  const [isLoading, setIsLoading] = useState(false);
  const [inputReasonOpen, setInputReasonOpen] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [isFetchingParty, setIsFetchingParty] = useState(false);

  const isEditMode = !!taskId;
  const isBulkMode = selectedParties.length > 0;

  const getValidationSchema = (isBulkMode: boolean) =>
    Yup.object({
      companyName: isBulkMode
        ? Yup.string().notRequired()
        : Yup.string().required("Company Name is required"),
      partyName: isBulkMode
        ? Yup.string().notRequired()
        : Yup.string().required("Party Name is required"),
      date: Yup.string().required("Date is required"),
      time: Yup.string().matches(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (use HH:MM)"
      ),
      reasonForVisit: Yup.string().required("Reason for Visit is required"),
      remarks: Yup.string(),
      assignTo: Yup.string().required("Assign To is required"),
      visitDate: Yup.string(),
      visitTime: Yup.string().matches(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (use HH:MM)"
      ),
      feedback: isEditMode
        ? Yup.string()
          .required('Call feedback is required')
          .min(20, 'Call feedback must be at least 20 characters')
        : Yup.string(),
      status: Yup.string().required("Status is required"),
      rescheduleDate: Yup.string().when("status", {
        is: "Rescheduled",
        then: () =>
          Yup.string()
            .required("Reschedule Date is required when status is Rescheduled")
            .test("is-future-date", "Reschedule Date must be a future date", (value) => {
              if (!value) return false;
              const selectedDate = new Date(value);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return selectedDate >= today;
            }),
        otherwise: () => Yup.string().nullable(),
      }),
    });

  const formik = useFormik<CreateAssignTask>({
    initialValues: {
      companyName: companyOptions?.value || "",
      partyName: partyOptions?.value || "",
      date: "",
      time: "",
      reasonForVisit: "",
      remarks: "",
      assignTo: "",
      visitDate: "",
      visitTime: "",
      feedback: "",
      status: "Pending",
      rescheduleDate: "",
      unitNo: "",
      marketName: "",
      area: "",
      ownerWhatsAppNo: "",
    },
    validationSchema: getValidationSchema(isBulkMode),
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setTouched(
          Object.keys(errors).reduce((touched, key) => {
            touched[key] = true;
            return touched;
          }, {} as any)
        );
        formik.setErrors(errors);
        return;
      }
      setIsLoading(true);
      try {
        if (isEditMode && taskId) {
          await dispatch(
            updateAssignTaskThunk({
              id: taskId,
              data: {
                ...values,
                rescheduleDate: values.status === "Rescheduled" ? values.rescheduleDate : null,
              } as UpdateAssignTask,
            })
          ).unwrap();
          toast.success("Task updated successfully");

          if (values.reasonForVisit === "Order" && companyTab === 0 && values.status === "Completed") toggleScDialog()
          if (values.reasonForVisit === "Order" && companyTab === 1 && values.status === "Completed") toggleQpDialog()
          if (refreshData) refreshData();
        } else if (isBulkMode) {
          const tasks = selectedParties.map((party) => ({
            ...values,
            companyName: party.companyId,
            partyName: party.partyId,
          }));
          await Promise.all(
            tasks.map((task) => dispatch(createAssignTaskThunk(task)).unwrap())
          );
          Swal.fire({
            title: "Success!",
            text: `Assigned ${tasks.length} tasks successfully`,
            icon: "success",
            confirmButtonColor: "#7F56D9",
          });
          if (refreshData) refreshData();
        } else {
          await dispatch(createAssignTaskThunk(values)).unwrap();
          Swal.fire({
            title: "Success!",
            text: "Task assigned successfully",
            icon: "success",
            confirmButtonColor: "#7F56D9",
          });
          if (refreshData) refreshData();
        }
        handleClose();
      } catch (err: any) {
        console.error("Update error:", err);
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

  const statusOptions = useMemo(
    () => [
      { label: "Pending", value: "Pending" },
      { label: "Rescheduled", value: "Rescheduled" },
      { label: "Completed", value: "Completed" },
      { label: "Cancelled", value: "Cancelled" },
    ],
    []
  );

  useEffect(() => {
    if (open && router.pathname === "/admin/account-master/view-company/[id]") {
      formik.resetForm({
        values: {
          ...formik.initialValues,
          companyName: companyOptions[0]?.value || "",
          partyName: partyOptions[0]?.value || "",
        }
      });
    }
  }, [open, companyOptions, partyOptions]);

  const staffOptions = useMemo(() => {
    const reason = (formik.values.reasonForVisit || "").trim().toLowerCase();

    // If reason contains "delivery" → show Drivers
    if (reason.includes("delivery")) {
      return staffList
        .filter((staff) => staff.role?.roleName === "Driver")
        .map((staff) => ({
          label: `${staff.firstName} ${staff.lastName}`,
          value: staff._id,
        }));
    } else if (reason.includes("payment")) {
      return staffList
        .filter((staff) => staff.role?.roleName === "Driver" || staff.role?.roleName === "Sales Staff")
        .map((staff) => ({
          label: `${staff.firstName} ${staff.lastName}`,
          value: staff._id,
        }));
    }
    return staffList
      .filter((staff) => staff.role?.roleName === "Sales Staff" || staff.role?.roleName === "Driver" || staff.role?.roleName === "Admin" || staff.role?.roleName === "Manager")
      .map((staff) => ({
        label: `${staff.firstName} ${staff.lastName}`,
        value: staff._id,
      }));
  }, [staffList, formik.values.reasonForVisit]);

  const reasonOptions = useMemo(
    () => [
      { label: "Delivery", value: "Delivery" },
      { label: "Get Payment", value: "Get Payment" },
      { label: "Visit", value: "Visit" },
      { label: "Order", value: "Order" },
      { label: "Complain", value: "Complain" },
      { label: "Sample Approval", value: "Sample Approval" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  // Function to fetch party details by ID
  const fetchPartyDetails = async (partyId: string) => {
    if (!partyId) return;

    setIsFetchingParty(true);
    try {
      // API call to get party details
      const partyData = await partyService.getPartyById(partyId);

      if (partyData && partyData.success) {
        const party = partyData.data;

        // Set party details in form
        formik.setFieldValue("unitNo", party.address?.unitNo || "", false);
        formik.setFieldValue("marketName", party.address?.marketName?.marketName || "", false);
        formik.setFieldValue("area", party.address?.area?.area || "", false);
        formik.setFieldValue("ownerWhatsAppNo", party.ownerWhatsAppNo || "", false);

        // Auto-assign to staff if available
        const createdById = party.createdBy?._id || "";
        if (createdById) {
          const isSalesStaff = staffList.find(
            (staff) => staff._id === createdById && staff.role?.roleName === "Sales Staff"
          );
          if (isSalesStaff) {
            formik.setFieldValue("assignTo", createdById, false);
          }
        }

      } else {
        console.error("Failed to fetch party details");
        // Clear party details if fetch fails
        formik.setFieldValue("unitNo", "", false);
        formik.setFieldValue("marketName", "", false);
        formik.setFieldValue("area", "", false);
        formik.setFieldValue("ownerWhatsAppNo", "", false);
      }
    } catch (error) {
      console.error("Error fetching party details:", error);
      toast.error("Failed to fetch party details");

      // Clear party details on error
      formik.setFieldValue("unitNo", "", false);
      formik.setFieldValue("marketName", "", false);
      formik.setFieldValue("area", "", false);
      formik.setFieldValue("ownerWhatsAppNo", "", false);
    } finally {
      setIsFetchingParty(false);
    }
  };

  const handleCompanyChange = (event: any, newValue: any) => {
    if (isBulkMode) return;
    const companyId = newValue ? newValue.value : "";
    formik.setFieldValue("companyName", companyId, false);
    formik.setFieldValue("partyName", "", false);
    formik.setFieldValue("assignTo", "", false);
    formik.setFieldValue("unitNo", "", false);
    formik.setFieldValue("marketName", "", false);
    formik.setFieldValue("area", "", false);
    formik.setFieldValue("ownerWhatsAppNo", "", false);
  };

  const handlePartyChange = (event: any, newValue: any) => {
    if (isBulkMode) return;

    const partyId = newValue ? newValue.value : "";
    formik.setFieldValue("partyName", partyId, false);

    // Clear previous party details immediately
    formik.setFieldValue("unitNo", "", false);
    formik.setFieldValue("marketName", "", false);
    formik.setFieldValue("area", "", false);
    formik.setFieldValue("ownerWhatsAppNo", "", false);
    formik.setFieldValue("assignTo", "", false);

    // If party is selected, fetch details
    if (partyId) {
      fetchPartyDetails(partyId);
    }
  };

  // Function to fetch party details for edit mode
  const fetchPartyDetailsForEdit = async (partyId: string) => {
    if (!partyId) return;

    try {
      const partyData = await partyService.getPartyById(partyId);

      if (partyData && partyData.success) {
        const party = partyData.data;

        formik.setFieldValue("unitNo", party.address?.unitNo || "", false);
        formik.setFieldValue("marketName", party.address?.marketName?.marketName || "", false);
        formik.setFieldValue("area", party.address?.area?.area || "", false);
        formik.setFieldValue("ownerWhatsAppNo", party.ownerWhatsAppNo || "", false);

      }
    } catch (error) {
      console.error("Error fetching party details in edit mode:", error);
    }
  };

  useEffect(() => {
    if (open) {
      if (!staffList?.length) {
        dispatch(getAllStaffThunk());
      }
      if (!isEditMode && !isBulkMode) {
        formik.resetForm();
        setCustomReason("");
        formik.setFieldValue("unitNo", "", false);
        formik.setFieldValue("marketName", "", false);
        formik.setFieldValue("area", "", false);
        formik.setFieldValue("ownerWhatsAppNo", "", false);
      }
      dispatch(clearSuccessMessage());
      dispatch(clearError());
    }
  }, [open, isEditMode, taskId, isBulkMode, dispatch]);

  useEffect(() => {
    if (isEditMode && singleAssignTask && taskId === singleAssignTask._id) {
      const assignToId =
        typeof singleAssignTask.AssignTo === "string"
          ? singleAssignTask.AssignTo
          : singleAssignTask.AssignTo?._id || "";
      const partyNameId =
        typeof singleAssignTask.partyName === "string"
          ? singleAssignTask.partyName
          : singleAssignTask.partyName?._id || "";
      const companyNameId =
        typeof singleAssignTask.companyName === "string"
          ? singleAssignTask.companyName
          : singleAssignTask.companyName?._id || "";
      const visitDate = singleAssignTask.visitDate
        ? new Date(singleAssignTask.visitDate).toISOString()?.split("T")[0]
        : "";
      const rescheduleDate = singleAssignTask.rescheduleDate
        ? new Date(singleAssignTask.rescheduleDate).toISOString()?.split("T")[0]
        : "";

      const newValues = {
        companyName: companyNameId,
        partyName: partyNameId,
        date: singleAssignTask.date ? moment(singleAssignTask.taskDate).format("YYYY-MM-DD") : "",
        time: singleAssignTask.time === "" ? "" : singleAssignTask.time,
        reasonForVisit: singleAssignTask.reasonForVisit || "",
        remarks: singleAssignTask.remarks || "",
        assignTo: singleAssignTask.AssignTo?._id,
        visitDate,
        visitTime: singleAssignTask.visitTime || "",
        feedback: singleAssignTask.feedback || "",
        status: singleAssignTask.status || "Pending",
        rescheduleDate,
        unitNo: "", // Initially empty, will be fetched
        marketName: "", // Initially empty, will be fetched
        area: "", // Initially empty, will be fetched
        ownerWhatsAppNo: "", // Initially empty, will be fetched
      };

      if (JSON.stringify(formik.values) !== JSON.stringify(newValues)) {
        formik.setValues(newValues, false);
      }

      // Fetch party details for edit mode
      if (partyNameId) {
        fetchPartyDetailsForEdit(partyNameId);
      }

      if (!reasonOptions.some((opt) => opt.value === singleAssignTask.reasonForVisit)) {
        setCustomReason(singleAssignTask.reasonForVisit || "");
      }
    } else if (isBulkMode && selectedParties.length > 0) {
      formik.setFieldValue("unitNo", "", false);
      formik.setFieldValue("marketName", "", false);
      formik.setFieldValue("area", "", false);
      formik.setFieldValue("ownerWhatsAppNo", "", false);
    }
  }, [isEditMode, taskId, singleAssignTask?._id, isBulkMode, selectedParties.length]);

  useEffect(() => {
    if (open && taskError) {
      Swal.fire({
        title: "Error!",
        text: taskError,
        icon: "error",
        confirmButtonColor: "#7F56D9",
      });
      dispatch(clearError());
    }
    if (open && accountError) {
      Swal.fire({
        title: "Error!",
        text: accountError,
        icon: "error",
        confirmButtonColor: "#7F56D9",
      });
      dispatch(clearError());
    }
    if (open && staffError) {
      Swal.fire({
        title: "Error!",
        text: staffError,
        icon: "error",
        confirmButtonColor: "#7F56D9",
      });
      dispatch(clearError());
    }
  }, [taskError, accountError, staffError, open, dispatch]);

  useEffect(() => {
    if (open && successMessage) {
      Swal.fire({
        title: "Success!",
        text: successMessage,
        icon: "success",
        confirmButtonColor: "#7F56D9",
      });
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, open, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearSuccessMessage());
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleClose = () => {
    formik.resetForm();
    setCustomReason("");
    setInputReasonOpen(false);
    formik.setFieldValue("unitNo", "", false);
    formik.setFieldValue("marketName", "", false);
    formik.setFieldValue("area", "", false);
    formik.setFieldValue("ownerWhatsAppNo", "", false);
    onClose();
  };

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };

  const handleSaveReason = (reason: string) => {
    if (reason) {
      formik.setFieldValue("reasonForVisit", reason, false);
      formik.setFieldTouched("reasonForVisit", true);
      setCustomReason(reason);
    }
    setInputReasonOpen(false);
  };

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={
          isEditMode
            ? "Edit Task"
            : isBulkMode
              ? `Assign Tasks to ${selectedParties.length} Parties`
              : "Assign New Task"
        }
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
          {isBulkMode ? (
            <Typography mb={2}>
              Assigning tasks to {selectedParties.length} selected parties
            </Typography>
          ) : (
            <Box mb={2}>
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
                disabled={isFetchingParty}
              />
            </Box>
          )}

          {!isBulkMode && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
              <ThemeInput
                labelName="Unit No"
                type="text"
                value={formik.values.unitNo}
                disabled
                fullWidth
                InputProps={{
                  endAdornment: isFetchingParty ? (
                    <Typography variant="caption" color="textSecondary">
                      Loading...
                    </Typography>
                  ) : null
                }}
              />
              <ThemeInput
                labelName="Market Name"
                type="text"
                value={formik.values.marketName}
                disabled
                fullWidth
                InputProps={{
                  endAdornment: isFetchingParty ? (
                    <Typography variant="caption" color="textSecondary">
                      Loading...
                    </Typography>
                  ) : null
                }}
              />
              <ThemeInput
                labelName="Area"
                type="text"
                value={formik.values.area}
                disabled
                fullWidth
                InputProps={{
                  endAdornment: isFetchingParty ? (
                    <Typography variant="caption" color="textSecondary">
                      Loading...
                    </Typography>
                  ) : null
                }}
              />
              <ThemeInput
                labelName="Owner WhatsApp No"
                type="text"
                value={formik.values.ownerWhatsAppNo}
                disabled
                fullWidth
                InputProps={{
                  endAdornment: isFetchingParty ? (
                    <Typography variant="caption" color="textSecondary">
                      Loading...
                    </Typography>
                  ) : null
                }}
              />
            </Stack>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
            <ThemeInput
              labelName="Task Date"
              type="date"
              value={formik.values.date}
              onChange={(e) => formik.setFieldValue("date", e.target.value, false)}
              onBlur={() => formik.setFieldTouched("date", true)}
              name="date"
              error={formik.touched.date && Boolean(formik.errors.date)}
              helperText={formik.touched.date && formik.errors.date}
              fullWidth
              required
            />
            <ThemeInput
              labelName="Time"
              type="time"
              value={formik.values.time}
              onChange={(e) => formik.setFieldValue("time", e.target.value, false)}
              onBlur={() => formik.setFieldTouched("time", true)}
              name="time"
              error={formik.touched.time && Boolean(formik.errors.time)}
              helperText={formik.touched.time && formik.errors.time}
              fullWidth
              disabled={isEditMode}
            />
            <ThemeSelect
              label="Assign to"
              options={staffOptions}
              value={getSelectedOption(formik.values.assignTo, staffOptions)}
              onChange={(event, newValue) => {
                formik.setFieldValue("assignTo", newValue ? newValue.value : "", false);
              }}
              onBlur={() => formik.setFieldTouched("assignTo", true)}
              name="assignTo"
              error={formik.touched.assignTo && Boolean(formik.errors.assignTo)}
              helperText={formik.touched.assignTo && formik.errors.assignTo}
              required
              sx={{ mb: 3 }}
              disabled={isFetchingParty}
            />
          </Stack>

          <Box mb={2}>
            <Typography fontWeight={600} mb={1} fontSize={14}>
              Reason for Visit
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {reasonOptions.map((reason) => (
                <Button
                  key={reason.value}
                  variant={
                    reason.value === formik.values.reasonForVisit || (reason.value === "Other" && customReason)
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => {
                    if (reason.value === "Other") {
                      setInputReasonOpen(true);
                    } else {
                      formik.setFieldValue("reasonForVisit", reason.value, false);
                      setCustomReason("");
                    }
                  }}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 500,
                    px: 2,
                    py: 0.8,
                    minWidth: 110,
                    backgroundColor:
                      reason.value === formik.values.reasonForVisit || (reason.value === "Other" && customReason)
                        ? "#28C76F"
                        : "transparent",
                    color:
                      reason.value === formik.values.reasonForVisit || (reason.value === "Other" && customReason)
                        ? "#fff"
                        : "inherit",
                    borderColor: "#ccc",
                    "&:hover": {
                      backgroundColor:
                        reason.value === formik.values.reasonForVisit || (reason.value === "Other" && customReason)
                          ? "#28C76F"
                          : "#f0f0f0",
                    },
                  }}
                >
                  {reason.value === "Other" && customReason ? customReason : reason.label}
                </Button>
              ))}
            </Box>
            {formik.touched.reasonForVisit && formik.errors.reasonForVisit && (
              <Typography color="error" fontSize={12} mt={1}>
                {formik.errors.reasonForVisit}
              </Typography>
            )}
          </Box>

          <Box mb={2}>
            <ThemeInput
              labelName="Remarks"
              type="text"
              value={formik.values.remarks}
              onChange={(e) => formik.setFieldValue("remarks", e.target.value, false)}
              onBlur={() => formik.setFieldTouched("remarks", true)}
              name="remarks"
              error={formik.touched.remarks && Boolean(formik.errors.remarks)}
              helperText={formik.touched.remarks && formik.errors.remarks}
              fullWidth
              multiline
              rows={3}
            />
          </Box>

          {isEditMode && (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                <ThemeSelect
                  label="Status"
                  options={statusOptions}
                  value={getSelectedOption(formik.values.status, statusOptions)}
                  onChange={(event, newValue) => {
                    const newStatus = newValue ? newValue.value : "Pending";
                    formik.setFieldValue("status", newStatus, false);
                    if (newStatus !== "Rescheduled") {
                      formik.setFieldValue("rescheduleDate", "", false);
                    }
                  }}
                  onBlur={() => formik.setFieldTouched("status", true)}
                  name="status"
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                  required
                  fullWidth
                />
                {formik.values.status === "Rescheduled" && (
                  <ThemeInput
                    labelName="Reschedule Date"
                    type="date"
                    value={formik.values.rescheduleDate}
                    onChange={(e) => formik.setFieldValue("rescheduleDate", e.target.value, false)}
                    onBlur={() => formik.setFieldTouched("rescheduleDate", true)}
                    name="rescheduleDate"
                    error={formik.touched.rescheduleDate && Boolean(formik.errors.rescheduleDate)}
                    helperText={formik.touched.rescheduleDate && formik.errors.rescheduleDate}
                    fullWidth
                    required
                  />
                )}
              </Stack>
              <Box mb={2}>
                <ThemeInput
                  labelName="Feedback"
                  type="text"
                  value={formik.values.feedback}
                  onChange={(e) => formik.setFieldValue("feedback", e.target.value, false)}
                  onBlur={() => formik.setFieldTouched("feedback", true)}
                  name="feedback"
                  error={formik.touched.feedback && Boolean(formik.errors.feedback)}
                  helperText={formik.touched.feedback && formik.errors.feedback}
                  fullWidth
                  multiline
                  required
                  rows={3}
                />
              </Box>
            </>
          )}

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
            disabled={isLoading || formik.isSubmitting || isFetchingParty}
          >
            {isLoading || formik.isSubmitting
              ? isEditMode
                ? "Updating..."
                : isBulkMode
                  ? "Assigning Tasks..."
                  : "Assigning..."
              : isEditMode
                ? "Update Task"
                : isBulkMode
                  ? "Assign Tasks"
                  : "Assign Task"}
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
});

export default AssignTaskDialog;