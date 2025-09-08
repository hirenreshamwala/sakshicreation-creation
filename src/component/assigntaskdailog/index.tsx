"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  getAllAssignTasksThunk,
  getAssignTaskByIdThunk,
  clearSuccessMessage,
  clearError,
} from "@/store/slices/assignTaskSlice";
import { getAllAccountMastersThunk } from "@/store/slices/accountMasterSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import type { CreateAssignTask, UpdateAssignTask } from "@/services/assignTask.service";
import Swal from "sweetalert2";
import CompanySelect from "../reusablecomponents/CompanyWithPartyName";

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
}

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
  feedback: Yup.string(),
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

const AssignTaskDialog: React.FC<AssignTaskDialogProps> = ({
  open,
  onClose,
  taskId,
  selectedParties = [],
  refreshData,
}) => {
  const dispatch = useAppDispatch();
  const {
    accountMasters = [],
    loading: accountLoading,
    error: accountError,
  } = useAppSelector((state) => state.accountMasters || {});
  const { staffList = [], loading: staffLoading, error: staffError } = useAppSelector(
    (state) => state.staff || {}
  );
  const {
    singleAssignTask,
    loading: taskLoading,
    error: taskError,
    successMessage,
  } = useAppSelector((state) => state.assignTasks || {});

  const [isLoading, setIsLoading] = useState(false);
  const [inputReasonOpen, setInputReasonOpen] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [partyDetails, setPartyDetails] = useState({
    unitNo: "",
    marketName: "",
    area: "",
    ownerWhatsAppNo: "",
  });
  const isEditMode = !!taskId;
  const isBulkMode = selectedParties.length > 0;

  const formik = useFormik<CreateAssignTask>({
    initialValues: {
      companyName: "",
      partyName: "",
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
          Swal.fire({
            title: "Success!",
            text: "Task updated successfully",
            icon: "success",
            confirmButtonColor: "#7F56D9",
          });
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
        console.error("Update error:", err); // Debug log
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

  const staffOptions = useMemo(() => {
    return staffList
      .filter((staff) => staff.role?.roleName === "Sales Staff")
      .map((staff) => ({
        label: `${staff.firstName} ${staff.lastName}`,
        value: staff._id,
      }));
  }, [staffList]);

  const reasonOptions = useMemo(
    () => [
      { label: "Delivery", value: "Delivery" },
      { label: "Get Payment", value: "Get Payment" },
      { label: "Visit", value: "Get Visit" },
      { label: "Order", value: "Order" },
      { label: "Complain", value: "Complain" },
      { label: "Sample Approval", value: "Sample Approval" },
      { label: "Other", value: "Other" },
    ],
    []
  );

  const handleCompanyChange = (event: any, newValue: any) => {
    if (isBulkMode) return;
    const companyId = newValue ? newValue.value : "";
    formik.setFieldValue("companyName", companyId, false);
    formik.setFieldValue("partyName", "", false);
    formik.setFieldValue("assignTo", "", false);
    setPartyDetails({
      unitNo: "",
      marketName: "",
      area: "",
      ownerWhatsAppNo: "",
    });
  };

  const handlePartyChange = (event: any, newValue: any) => {
    if (isBulkMode) return;
    const partyId = newValue ? newValue.value : "";
    formik.setFieldValue("partyName", partyId, false);

    const selectedParty = accountMasters?.find((account) => account.party?._id === partyId);
    const createdById = selectedParty?.createdBy?._id || "";
    if (createdById) {
      const isSalesStaff = staffList.find(
        (staff) => staff._id === createdById && staff.role?.roleName === "Sales Staff"
      );
      if (isSalesStaff) {
        formik.setFieldValue("assignTo", createdById, false);
      } else {
        formik.setFieldValue("assignTo", "", false);
      }
    } else {
      formik.setFieldValue("assignTo", "", false);
    }

    setPartyDetails({
      unitNo: selectedParty?.party?.address?.unitNo || "",
      marketName: selectedParty?.party?.address?.marketName || "",
      area: selectedParty?.party?.address?.area || "",
      ownerWhatsAppNo: selectedParty?.party?.ownerWhatsAppNo || "",
    });
  };

  useEffect(() => {
    if (open) {
      if (!accountMasters?.length) {
        dispatch(getAllAccountMastersThunk());
      }
      if (!staffList?.length) {
        dispatch(getAllStaffThunk());
      }
      if (isEditMode && taskId && singleAssignTask?._id !== taskId) {
        dispatch(getAssignTaskByIdThunk(taskId));
      }
      if (!isEditMode && !isBulkMode) {
        formik.resetForm();
        setCustomReason("");
        setPartyDetails({
          unitNo: "",
          marketName: "",
          area: "",
          ownerWhatsAppNo: "",
        });
      }
      dispatch(clearSuccessMessage());
      dispatch(clearError());
    }
  }, [open, isEditMode, taskId, isBulkMode, dispatch]);

  useEffect(() => {
    if (isEditMode && singleAssignTask && taskId === singleAssignTask._id) {
      const assignToId =
        typeof singleAssignTask.assignTo === "string"
          ? singleAssignTask.assignTo
          : singleAssignTask.assignTo?._id || "";
      const partyNameId =
        typeof singleAssignTask.partyName === "string"
          ? singleAssignTask.partyName
          : singleAssignTask.partyName?._id || "";
      const companyNameId =
        typeof singleAssignTask.companyName === "string"
          ? singleAssignTask.companyName
          : singleAssignTask.companyName?._id || "";
      const visitDate = singleAssignTask.visitDate
        ? new Date(singleAssignTask.visitDate).toISOString().split("T")[0]
        : "";
      const rescheduleDate = singleAssignTask.rescheduleDate
        ? new Date(singleAssignTask.rescheduleDate).toISOString().split("T")[0]
        : "";

      const newValues = {
        companyName: companyNameId,
        partyName: partyNameId,
        date: singleAssignTask.date ? new Date(singleAssignTask.date).toISOString().split("T")[0] : "",
        time: singleAssignTask.time || "",
        reasonForVisit: singleAssignTask.reasonForVisit || "",
        remarks: singleAssignTask.remarks || "",
        assignTo: assignToId,
        visitDate,
        visitTime: singleAssignTask.visitTime || "",
        feedback: singleAssignTask.feedback || "",
        status: singleAssignTask.status || "Pending",
        rescheduleDate,
      };

      if (JSON.stringify(formik.values) !== JSON.stringify(newValues)) {
        formik.setValues(newValues, false);
      }

      const selectedParty = accountMasters?.find((account) => account.party?._id === partyNameId);
      setPartyDetails({
        unitNo: selectedParty?.party?.address?.unitNo || "",
        marketName: selectedParty?.party?.address?.marketName || "",
        area: selectedParty?.party?.address?.area || "",
        ownerWhatsAppNo: selectedParty?.party?.ownerWhatsAppNo || "",
      });

      if (!reasonOptions.some((opt) => opt.value === singleAssignTask.reasonForVisit)) {
        setCustomReason(singleAssignTask.reasonForVisit || "");
      }
    } else if (isBulkMode && selectedParties.length > 0) {
      setPartyDetails({
        unitNo: "",
        marketName: "",
        area: "",
        ownerWhatsAppNo: "",
      });
    }
  }, [isEditMode, taskId, singleAssignTask?._id, isBulkMode, selectedParties.length, accountMasters]);

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
            />
          </Box>
          )}

          {!isBulkMode && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
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
              value={partyDetails?.area?.area}
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
              disabled={isEditMode}
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
                {/* <ThemeInput
                  labelName="Visit Date"
                  type="date"
                  value={formik.values.visitDate}
                  onChange={(e) => formik.setFieldValue("visitDate", e.target.value, false)} // Avoid triggering validation
                  onBlur={() => formik.setFieldTouched("visitDate", true)}
                  name="visitDate"
                  error={formik.touched.visitDate && Boolean(formik.errors.visitDate)}
                  helperText={formik.touched.visitDate && formik.errors.visitDate}
                  fullWidth
                />
                <ThemeInput
                  labelName="Visit Time"
                  type="time"
                  value={formik.values.visitTime}
                  onChange={(e) => formik.setFieldValue("visitTime", e.target.value, false)} // Avoid triggering validation
                  onBlur={() => formik.setFieldTouched("visitTime", true)}
                  name="visitTime"
                  error={formik.touched.visitTime && Boolean(formik.errors.visitTime)}
                  helperText={formik.touched.visitTime && formik.errors.visitTime}
                  fullWidth
                /> */}
              </Stack>
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
            disabled={isLoading || formik.isSubmitting}
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
};

export default AssignTaskDialog;