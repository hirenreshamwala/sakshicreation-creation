"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Box, TextField, FormControlLabel, Checkbox, Chip } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomDialog from "@/component/customdialog";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch } from "@/store";
import { updateOrderThunk } from "@/store/slices/orderSlice";
import moment from "moment";

interface FormData {
  quantity: number;
  unitPrice: number;
  applyGST: boolean;
  gstPercentage: number;
  total: number;
  gstAmount: number;
  finalAmount: number;
}

interface AddNewQuotationProps {
  open: boolean;
  onClose: () => void;
  data?: any;
  refreshData?: () => void;
  onInvoiceSaved?: () => void;
}

const validationSchema = Yup.object({
  quantity: Yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
  unitPrice: Yup.number().required("Unit Price is required").min(0, "Unit Price cannot be negative"),
  applyGST: Yup.boolean(),
  gstPercentage: Yup.number()
    .min(0, "GST Percentage cannot be negative")
    .max(100, "GST Percentage cannot exceed 100%")
    .when("applyGST", {
      is: true,
      then: (schema) => schema.required("GST Percentage is required when GST is applied"),
      otherwise: (schema) => schema.optional(),
    }),
});

const AddNewQuotation: React.FC<AddNewQuotationProps> = ({
  open,
  onClose,
  data,
  refreshData,
  onInvoiceSaved,
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const lastQuotation = data?.quotation?.[data?.quotation?.length - 1];

  const formik = useFormik<FormData>({
    initialValues: {
      quantity: lastQuotation?.qty ? lastQuotation?.qty : data?.qty,
      unitPrice: lastQuotation?.unitPrice || 0,
      applyGST: lastQuotation?.gst > 0,
      gstPercentage: lastQuotation?.gst || 0,
      total: 0,
      gstAmount: 0,
      finalAmount: 0,
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!hasChanges) {
        toast.warning("No changes made to save");
        return;
      }

      setIsLoading(true);
      setSubmitting(true);

      try {
        const newQuotationEntry = {
          unitPrice: values.unitPrice,
          qty: values.quantity,
          gst: values.applyGST ? values.gstPercentage : 0,
          timestamp: new Date().toISOString(),
        };

        const updatedQuotation = data?.quotation
          ? [...data.quotation, newQuotationEntry]
          : [newQuotationEntry];

        await dispatch(
          updateOrderThunk({
            id: data._id,
            data: { quotation: updatedQuotation },
          })
        ).unwrap();

        toast.success("Quotation added successfully");
        setIsSaved(true);
        setHasChanges(false);

        if (refreshData) refreshData();
        if (onInvoiceSaved) onInvoiceSaved();
      } catch (err: any) {
        console.error("Submission error:", err);
        toast.error(err.message || "Operation failed");
      } finally {
        setIsLoading(false);
        setSubmitting(false);
      }
    },
  });

  const checkForChanges = (currentValues: FormData) => {
    if (!lastQuotation) {
      return currentValues.quantity > 0 || currentValues.unitPrice > 0;
    }

    const initialTotal = (lastQuotation.qty || 0) * (lastQuotation.unitPrice || 0);
    const currentTotal = (currentValues.quantity || 0) * (currentValues.unitPrice || 0);
    const initialGst = lastQuotation.gst || 0;
    const currentGst = currentValues.applyGST ? currentValues.gstPercentage : 0;

    return (
      currentValues.quantity !== lastQuotation.qty ||
      currentValues.unitPrice !== lastQuotation.unitPrice ||
      currentGst !== initialGst ||
      currentTotal !== initialTotal
    );
  };

  // Recalculate totals on change
  useEffect(() => {
    const total = (formik.values.quantity || 0) * (formik.values.unitPrice || 0);
    const gstAmount = formik.values.applyGST
      ? total * (Number(formik.values.gstPercentage) / 100)
      : 0;
    const finalAmount = total + gstAmount;

    formik.setFieldValue("total", total);
    formik.setFieldValue("gstAmount", gstAmount);
    formik.setFieldValue("finalAmount", finalAmount);

    setHasChanges(checkForChanges({ ...formik.values, total, gstAmount, finalAmount }));
  }, [
    formik.values.quantity,
    formik.values.unitPrice,
    formik.values.gstPercentage,
    formik.values.applyGST,
  ]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    formik.setFieldValue("applyGST", checked);

    if (checked) {
      // अगर यूज़र ने पहले कुछ नहीं डाला तो 18 डाल दो
      const current = formik.values.gstPercentage;
      formik.setFieldValue("gstPercentage", current && current > 0 ? current : 18);
    } else {
      formik.setFieldValue("gstPercentage", 0);
    }
  };


  // Reset form when dialog opens with last quotation totals
  useEffect(() => {
    if (open && data) {
      const lastQuote = data?.quotation?.[data?.quotation?.length - 1];

      if (lastQuote) {
        const total = (lastQuote.qty || 0) * (lastQuote.unitPrice || 0);
        const gstAmount = lastQuote.gst > 0 ? total * (Number(lastQuote.gst) / 100) : 0;
        const finalAmount = total + gstAmount;

        formik.setValues({
          quantity: lastQuote.qty,
          unitPrice: lastQuote.unitPrice,
          applyGST: lastQuote.gst > 0,
          gstPercentage: lastQuote.gst || 0,
          total,
          gstAmount,
          finalAmount,
        });
      } else {
        formik.setValues({
          quantity: data?.qty || 0,
          unitPrice: 0,
          applyGST: false,
          gstPercentage: 0,
          total: 0,
          gstAmount: 0,
          finalAmount: 0,
        });
      }

      setIsSaved(false);
      setHasChanges(false);
    }
  }, [open, data]);

  const handleClose = () => {
    formik.resetForm();
    setIsSaved(false);
    setHasChanges(false);
    onClose();
  };

  const disabledLabelStyle = {
    "& .MuiInputLabel-root": {
      fontWeight: "bold",
      borderRadius: "4px",
      color: "#333",
    },
    "& .MuiInputLabel-root.Mui-disabled": {
      color: "#333",
    },
    "& .MuiInputBase-input.Mui-disabled": {
      WebkitTextFillColor: "#333",
      fontWeight: "bold",
    },
  };

  return (
    <CustomDialog
      open={open}
      maxWidth="md"
      onClose={handleClose}
      title={`${data?.orderNumber || "Order"} Quotation`}
    >
      <Box sx={{ background: "#fff", borderRadius: 2 }} component="form" onSubmit={formik.handleSubmit}>
        <Box display="flex" flexDirection="column" gap={2} mb={1} width="100%">
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              value={formik.values.quantity}
              onChange={handleFieldChange}
              onBlur={formik.handleBlur}
              error={formik.touched.quantity && Boolean(formik.errors.quantity)}
              helperText={formik.touched.quantity && formik.errors.quantity}
              required
              fullWidth
            />

            <TextField
              label="Unit Price"
              name="unitPrice"
              type="number"
              value={formik.values.unitPrice}
              onChange={handleFieldChange}
              onBlur={formik.handleBlur}
              error={formik.touched.unitPrice && Boolean(formik.errors.unitPrice)}
              helperText={formik.touched.unitPrice && formik.errors.unitPrice}
              required
              fullWidth
            />
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.applyGST}
                  onChange={handleCheckboxChange}
                  name="applyGST"
                  color="primary"
                />
              }
              label="Apply GST"
            />

            {formik.values.applyGST && (
              <TextField
                label="GST Percentage"
                name="gstPercentage"
                value={formik.values.gstPercentage}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value === "") value = "0";
                  if (value.length > 1) value = value.replace(/^0+/, "");
                  formik.setFieldValue("gstPercentage", Number(value));
                  setHasChanges(true);
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.gstPercentage && Boolean(formik.errors.gstPercentage)}
                helperText={formik.touched.gstPercentage && formik.errors.gstPercentage}
                required={formik.values.applyGST}
                fullWidth
              />
            )}
          </Box>

          <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 2, backgroundColor: "#f9f9f9" }}>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                label="Total Amount"
                type="number"
                value={formik.values.total || 0}
                disabled
                fullWidth
                sx={disabledLabelStyle}
              />

              {formik.values.applyGST && (
                <TextField
                  label="GST Amount"
                  type="number"
                  value={formik.values.gstAmount ? formik.values.gstAmount.toFixed(2) : "0.00"}
                  disabled
                  fullWidth
                  sx={disabledLabelStyle}
                />
              )}
            </Box>

            <Box mt={2}>
              <TextField
                label="Final Amount (Including GST)"
                type="number"
                value={formik.values.finalAmount ? formik.values.finalAmount.toFixed(2) : "0.00"}
                disabled
                fullWidth
                sx={{
                  ...disabledLabelStyle,
                  "& .MuiInputBase-input": {
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#1976d2",
                  },
                }}
                InputProps={{
                  endAdornment: formik.values.applyGST ? (
                    <Chip
                      label={`GST: ${formik.values.gstPercentage}%`}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ ml: 1, fontWeight: "bold" }}
                    />
                  ) : null,
                }}
              />
            </Box>

            <Box display="flex" justifyContent="flex-end" mt={1}>
              {formik.values.applyGST ? (
                <Chip
                  label={`Total: ₹${formik.values.total} + GST: ₹${formik.values.gstAmount.toFixed(2)} = Final: ₹${formik.values.finalAmount.toFixed(2)}`}
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: "bold" }}
                />
              ) : (
                <Chip
                  label={`Total Amount: ₹${formik.values.finalAmount.toFixed(2)} (No GST)`}
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} gap={2}>
          <Box>
            {!hasChanges && (
              <Chip
                label="No changes made"
                color="warning"
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          <ThemeButton
            type="submit"
            sx={{ minWidth: 120, height: 40 }}
            disabled={isLoading || formik.isSubmitting || !formik.isValid || !hasChanges}
          >
            {isLoading || formik.isSubmitting ? "Saving..." : "Save Quotation"}
          </ThemeButton>
        </Box>

        {data?.quotation && data.quotation.length > 0 && (
          <Box mt={3}>
            <h4>Quotation History:</h4>
            {data.quotation.map((quote: any, index: number) => {
              const total = (quote.qty || 0) * (quote.unitPrice || 0);
              const gstAmount = quote.gst > 0 ? total * (Number(quote.gst) / 100) : 0;
              const finalAmount = total + gstAmount;

              return (
                <Box key={index} p={1} border={1} borderColor="grey.300" borderRadius={1} mb={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <div>
                      Price: ₹{quote.unitPrice} | Qty: {quote.qty} | Total: ₹{total} |
                      {quote.gst > 0 ? ` GST: ₹${gstAmount.toFixed(2)} | ` : " "}
                      Final: ₹{finalAmount.toFixed(2)}
                      {quote.gst > 0 ? (
                        <Chip label={`GST: ${quote.gst}%`} size="small" color="primary" sx={{ ml: 1 }} />
                      ) : (
                        <Chip label="No GST" size="small" color="default" variant="outlined" sx={{ ml: 1 }} />
                      )}
                    </div>
                    <small>{moment(quote.createdAt).format('DD-MM-YYYY HH:mm')}</small>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </CustomDialog>
  );
};

export default AddNewQuotation;