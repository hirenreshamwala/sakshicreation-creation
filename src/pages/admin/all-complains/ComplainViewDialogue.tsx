import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import { useAppSelector } from "@/store";

interface Complaint {
  _id: string;
  subject: string;
  details: string;
  company: {
    _id: string;
    companyName: string;
  };
  status: string;
  response: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignTo: string[];
  scorder: {
    _id: string;
    orderNumber: string;
  } | null;
  qporder: {
    _id: string;
    orderNo: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface ComplainViewDialogueProps {
  open: boolean;
  onClose: () => void;
  complaint: Complaint | null;
}

const ComplainViewDialogue: React.FC<ComplainViewDialogueProps> = ({
  open,
  onClose,
  complaint,
}) => {
  const { companies } = useAppSelector((state) => state.company);
  const { orderList: orders } = useAppSelector((state) => state.orders);
  const { orders: qporders } = useAppSelector((state) => state.qpOrders);

  if (!complaint) return null;

  // Determine the order number and ID
  const orderId = complaint.scorder?._id || complaint.qporder?._id || "";
  const orderNumber = complaint.qporder?.orderNo
    ? `QP-${complaint.qporder.orderNo}`
    : complaint.scorder?.orderNumber || "N/A";

  // Prepare order options for display (read-only)
  const orderOptions = (complaint.company.companyName === "Sakshi Creation" ? orders : qporders)
    ?.map((order: any) => ({
      value: order._id,
      label: order.orderNumber || `QP-${order.orderNo}` || "Order",
    })) || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>View Complaint</DialogTitle>

      <DialogContent dividers>
        <Stack direction="row" spacing={2} mb={2}>
          {/* Company (read-only) */}
          <ThemeSelect
            label="Company"
            options={companies.map((item) => ({
              value: item._id,
              label: item.companyName,
            }))}
            value={
              companies
                .map((item) => ({ value: item._id, label: item.companyName }))
                .find((opt) => opt.value === complaint.company._id) || null
            }
            disabled
            sx={{ mb: 2 }}
          />
          {/* Related Order (read-only) */}
          <ThemeSelect
            label="Related Order"
            options={orderOptions}
            value={orderOptions.find((opt) => opt.value === orderId) || null}
            disabled
            sx={{ mb: 2 }}
          />
        </Stack>

        {/* Complaint Subject (read-only) */}
        <ThemeInput
          labelName="Complaint Subject"
          value={complaint.subject}
          disabled
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Details (read-only) */}
        <ThemeInput
          labelName="Details"
          value={complaint.details}
          disabled
          multiline
          minRows={3}
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Status (read-only)
        <ThemeSelect
          label="Status"
          options={[
            { value: "Pending", label: "Pending" },
            { value: "In Progress", label: "In Progress" },
            { value: "Completed", label: "Completed" },
          ]}
          value={{ value: complaint.status, label: complaint.status }}
          disabled
          sx={{ mb: 2 }}
        /> */}

        {/* Response (read-only) */}
        <ThemeInput
          labelName="Response"
          value={complaint.response}
          disabled
          multiline
          minRows={2}
          fullWidth
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComplainViewDialogue;