"use client";
 
import React from "react";
import { Box, Button } from "@mui/material";
import { generateInvoicePDF } from "@/utills/generateInvoicePDF"; // Import the utility function
 
interface InvoicePDFGeneratorProps {
  formData: {
    orderNumber: string;
    companyName: string;
    remarks: string;
    ownerMobileNo: string;
    partyName: string;
    addressName: string;
    GSTNo: string;
    servicePerformance: string;
    quantity: number;
    unitPrice: number;
    total: number;
    finalAmount: number;
    color?: string;
    size?: string;
    pType?: string;
    applyGST: boolean;
    gstPercentage?: number;
    daysAfterConfirmation?: number;
  };
  isSaved: boolean;
  onClose: () => void;
}
 
const InvoicePDFGenerator: React.FC<InvoicePDFGeneratorProps> = ({
  formData,
  isSaved,
  onClose,
}) => {
  const handleGenerate = () => {
    generateInvoicePDF(formData);
    onClose();
  };
 
  return (
    <Box display="flex" justifyContent="flex-end" mt={2}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerate}
        disabled={!isSaved}
        sx={{ minWidth: 120, height: 40 }}
      >
        Download PDF
      </Button>
    </Box>
  );
};
 
export default InvoicePDFGenerator;