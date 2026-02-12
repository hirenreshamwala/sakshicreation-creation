"use client";

import { useState, useEffect, memo } from "react";
import { Box, Stack } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CustomDialog from "@/component/customdialog";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { paymentFolderService } from "@/services/paymentFolder.service";
import { toast } from "react-toastify";
import moment from "moment";

interface AssignTaskToFolderDialogProps {
  open: boolean;
  onClose: () => void;
  folderData: any;
}

const AssignTaskToFolderDialog: React.FC<AssignTaskToFolderDialogProps> = memo(({
  open,
  onClose,
  folderData
}) => {
  const dispatch = useAppDispatch();
  const { staffList } = useAppSelector((state) => state.staff || {});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!staffList?.length) {
      dispatch(getAllStaffThunk());
    }
  }, [dispatch, staffList?.length]);

  const staffOptions = staffList.map((staff: any) => ({
    label: `${staff.firstName} ${staff.lastName}`,
    value: staff._id,
  }));

  const validationSchema = Yup.object({
    assignedTo: Yup.string().required("Staff is required"),
    assignedDate: Yup.string().required("Date is required"),
    remarks: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      assignedTo: folderData?.assignedTo?._id || "",
      assignedDate: folderData?.assignedDate ? moment(folderData.assignedDate).format('YYYY-MM-DD') : "",
      remarks: "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await paymentFolderService.assignTaskToFolder(folderData._id, values);
        toast.success("Task assigned successfully");
        // onSuccess();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Failed to assign task");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Assign Task"
      maxWidth="sm"
      fullWidth
    >
      <Box
        sx={{ p: 3 }}
        component="form"
        onSubmit={formik.handleSubmit}
      >
        <Stack spacing={3}>
          <ThemeSelect
            label="Assign To Staff"
            options={staffOptions}
            value={staffOptions.find((opt: any) => opt.value === formik.values.assignedTo)}
            onChange={(e, newValue) => formik.setFieldValue("assignedTo", newValue ? newValue.value : "")}
            error={formik.touched.assignedTo && Boolean(formik.errors.assignedTo)}
            helperText={formik.touched.assignedTo && formik.errors.assignedTo}
            required
          />

          <ThemeInput
            labelName="Assignment Date"
            type="date"
            value={formik.values.assignedDate}
            onChange={(e) => formik.setFieldValue("assignedDate", e.target.value)}
            error={formik.touched.assignedDate && Boolean(formik.errors.assignedDate)}
            helperText={formik.touched.assignedDate && formik.errors.assignedDate}
            required
            InputLabelProps={{ shrink: true }}
          />

          <ThemeInput
            labelName="Remarks"
            value={formik.values.remarks}
            onChange={(e) => formik.setFieldValue("remarks", e.target.value)}
            multiline
            rows={3}
          />

          <ThemeButton
            type="submit"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? "Assigning..." : "Assign Task"}
          </ThemeButton>
        </Stack>
      </Box>
    </CustomDialog>
  );
});

export default AssignTaskToFolderDialog;
