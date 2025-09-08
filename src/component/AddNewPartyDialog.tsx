"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, Checkbox, debounce, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import CustomDialog from "@/component/customdialog";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createAccountMasterThunk,
  updateAccountMasterThunk,
  getAccountMasterByIdThunk,
  clearSuccessMessage,
  clearError,
  searchPartiesThunk,
  clearSuggestions,
  getAccountMasterByCompanyAndPartyThunk,
  bulkCreateAccountMastersThunk,
} from "@/store/slices/accountMasterSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import CompanySelect from "./reusablecomponents/CompanyWithPartyName";
import type { PartySuggestion } from "@/types/partySuggestion" // Import PartySuggestion type
import { authService } from "@/services/auth.service";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { getAllMarketsThunk } from "@/store/slices/marketDataSlice";

interface Address {
  unitNo: string;
  marketName: string;
  streetAddress: string;
  landMark?: string;
  area: string;
  pincode: string;
}

interface FormData {
  companyName: string;
  partyName: string;
  ownerName?: string;
  ownerMobileNo: string;
  ownerWhatsAppNo: string;
  ownerEmail?: string;
  contactPerson: string;
  personMobileNo: string;
  personWhatsAppNo: string;
  contactPersonEmail?: string;
  contactForPayment: string;
  contactMobileNo: string;
  contactWhatsAppNo: string;
  contactForPaymentEmail?: string;
  GSTNo: string;
  address: Address;
  reasonToVisit: string;
  reference: string;
  createdBy: string;
  isRequestMode?: boolean;
}

interface AddNewPartyDialogProps {
  open: boolean;
  onClose: () => void;
  accountId?: string;
  refreshData?: () => void;
  isRequestMode?: boolean;
  isBulkUpload?: boolean; // New prop to handle bulk upload mode
}

const validationSchema = Yup.object({
  companyName: Yup.string().required("Company Name is required"),
  partyName: Yup.string().required("Party Name is required"),
  ownerMobileNo: Yup.string().matches(/^[0-9]{10}$/, "Owner Mobile No. must be 10 digits"),
  ownerWhatsAppNo: Yup.string()
    .matches(/^[0-9]{10}$/, "Owner WhatsApp No. must be 10 digits")
    .required("Owner WhatsApp No. is required"),
  GSTNo: Yup.string(),
  address: Yup.object({
    unitNo: Yup.string().required("Unit No. is required"),
    marketName: Yup.string().required("Market Name is required"),
    streetAddress: Yup.string().required("Street Address is required"),
    landMark: Yup.string(),
    area: Yup.string().required("Area is required"),
    pincode: Yup.string()
      .required("Pincode is required"),
  }),
  reasonToVisit: Yup.string().required("Reason to Visit is required"),
  createdBy: Yup.string().required("Created By is required"),
});

const AddNewPartyDialog: React.FC<AddNewPartyDialogProps> = ({
  open,
  onClose,
  accountId,
  refreshData,
  isRequestMode = false,
  isBulkUpload = false,
}) => {
  const dispatch = useAppDispatch();
  const { staffList, loading: staffLoading, error: staffError } = useAppSelector(
    (state) => state.staff
  );
  const {
    loading: accountLoading,
    error: accountError,
    successMessage,
    partySuggestions,
  } = useAppSelector((state) => state.accountMasters);
  const { markets } = useAppSelector((state) => state.markets);

  const [isLoading, setIsLoading] = useState(false);
  const [partyOptions, setPartyOptions] = useState<PartySuggestion[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hasReference, setHasReference] = useState("no");
  const isEditMode = !!accountId;

  const currentUser = authService.getUser();

  useEffect(() => {
    if (open) {
      dispatch(clearSuccessMessage());
      dispatch(clearError());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (!markets.length) dispatch(getAllMarketsThunk());
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.length >= 2) {
        dispatch(searchPartiesThunk(query));
      } else {
        dispatch(clearSuggestions());
      }
    }, 300),
    [dispatch]
  );

  useEffect(() => {
    setPartyOptions(partySuggestions);
  }, [partySuggestions]);

  const formik = useFormik<FormData>({
    initialValues: {
      companyName: "",
      partyName: "",
      ownerName: "",
      ownerMobileNo: "",
      ownerWhatsAppNo: "",
      ownerEmail: "",
      contactPerson: "",
      personMobileNo: "",
      personWhatsAppNo: "",
      contactPersonEmail: "",
      contactForPayment: "",
      contactMobileNo: "",
      contactWhatsAppNo: "",
      contactForPaymentEmail: "",
      GSTNo: "",
      address: {
        unitNo: "",
        marketName: "",
        streetAddress: "",
        landMark: "",
        area: "",
        pincode: "",
      },
      reasonToVisit: "Visit",
      reference: "",
      partyTag: "New",
      createdBy: isRequestMode ? (currentUser?.id || "") : "",
      isRequestMode,
    },
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setErrors(errors);
        return;
      }
      const submissionValues = {
        ...values,
        reference: hasReference === "yes" ? values.reference : "",
      };
      setIsLoading(true);
      try {
        if (isEditMode && accountId) {
          await dispatch(updateAccountMasterThunk({ id: accountId, data: submissionValues })).unwrap();
        } else if (!isBulkUpload) {
          await dispatch(createAccountMasterThunk(submissionValues)).unwrap();
        }
        formik.resetForm();
        if (refreshData) refreshData();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Operation failed");
      } finally {
        setIsLoading(false);
      }
    },
  });

  //  useEffect(() => {
  //   if (isEditMode && formik.values.reference) {
  //     setHasReference("yes");
  //   } else {
  //     setHasReference("no");
  //   }
  // }, [isEditMode, formik.values.reference]);

  console.log(markets, 'markets')

  const handleDownloadSample = () => {
    const csvContent = `partyName,ownerName,ownerMobileNo,ownerWhatsAppNo,ownerEmail,contactPerson,personMobileNo,personWhatsAppNo,contactPersonEmail,contactForPayment,contactMobileNo,contactWhatsAppNo,contactForPaymentEmail,GSTNo,unitNo,marketName,streetAddress,landMark,area,pincode,reasonToVisit,reference,isRequestMode,partyTag\nTest Party 1,John Doe,9876543210,9876543210,john.doe@example.com,Jane Smith,9123456789,9123456789,jane.smith@example.com,Payment Contact,9123456780,9123456780,payment@example.com,22AAAAA0000A1Z5,Unit 101,Market A,Street 1,Near Park,Area A,400001,Visit,Ref123,FALSE,New\nTest Party 2,Mary Jane,8765432109,8765432109,mary.jane@example.com,Tom Brown,9234567890,9234567890,tom.brown@example.com,Payment Contact 2,9234567880,9234567880,payment2@example.com,22AAAAA0000A1Z6,Unit 102,Market B,Street 2,Near Mall,Area B,400002,Order,Ref456,TRUE,Customer`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_upload_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        await dispatch(getAllStaffThunk());

        if (isEditMode && accountId) {
          const result = await dispatch(getAccountMasterByIdThunk(accountId)).unwrap();
          formik.setValues({
            companyName: result.companyName || "",
            partyName: result.partyName || "",
            ownerName: result.ownerName || "",
            ownerMobileNo: result.ownerMobileNo || "",
            ownerWhatsAppNo: result.ownerWhatsAppNo || "",
            ownerEmail: result.ownerEmail || "",
            contactPerson: result.contactPerson || "",
            personMobileNo: result.personMobileNo || "",
            personWhatsAppNo: result.personWhatsAppNo || "",
            contactPersonEmail: result.contactPersonEmail || "",
            contactForPayment: result.contactForPayment || "",
            contactMobileNo: result.contactMobileNo || "",
            contactWhatsAppNo: result.contactWhatsAppNo || "",
            contactForPaymentEmail: result.contactForPaymentEmail || "",
            GSTNo: result.GSTNo || "",
            partyTag: result.partyTag,
            address: {
              unitNo: result.address?.unitNo || "",
              marketName: result.address?.marketName || "",
              streetAddress: result.address?.streetAddress || "",
              landMark: result.address?.landMark || "",
              area: result.address?.area || "",
              pincode: result.address?.pincode || "",
            },
            reasonToVisit: result.reasonToVisit || "Visit",
            reference: result.reference || "",
            createdBy:
              result.createdById || (typeof result.createdBy === "object" ? result.createdBy._id : ""),
            isRequestMode,
          });
          setInputValue(result.partyName || "");
        } else {
          formik.resetForm({
            values: {
              ...formik.initialValues,
              createdBy: isRequestMode ? (currentUser?.id || "") : "",
              isRequestMode,
            },
          });
          setInputValue("");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, isEditMode, accountId, dispatch, isRequestMode, currentUser?.id]);

  useEffect(() => {
    if (accountError) {
      toast.error(accountError);
    }
    if (staffError) {
      toast.error(staffError);
    }
  }, [accountError, staffError]);

  const reasonOptions = [
    { label: "Visit", value: "Visit" },
    { label: "Order", value: "Order" },
    { label: "Reference", value: "Reference" },
  ];

  const staffOptions = isRequestMode
    ? []
    : staffList
      .filter((staff) => staff.role.roleName === "Sales Staff")
      .map((staff) => ({
        label: staff.name,
        value: staff.id,
      }));

  const getSelectedOption = (value: string, options: { label: string; value: string }[]) => {
    const selected = options.find((option) => option.value === value);
    return selected || null;
  };

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : "";
    formik.setFieldValue("companyName", companyId);
    formik.setFieldValue("partyName", "");
    setInputValue("");
    dispatch(clearSuggestions());
  }

  console.log(markets, 'markets')

  const loadPartyDetails = async (selectedParty: PartySuggestion) => {
    if (!formik.values.companyName) {
      toast.error("Please select a company first")
      return
    }

    try {
      const response = await dispatch(
        getAccountMasterByCompanyAndPartyThunk({
          companyId: formik.values.companyName,
          partyId: selectedParty._id,
        }),
      ).unwrap()

      const partyData = response.data?.party || response.accountMaster?.party
      if (partyData) {
        formik.setValues({
          ...formik.values,
          partyName: partyData.partyName,
          ownerName: partyData.ownerName || "",
          ownerMobileNo: partyData.ownerMobileNo || "",
          ownerWhatsAppNo: partyData.ownerWhatsAppNo || "",
          ownerEmail: partyData.ownerEmail || "",
          contactPerson: partyData.contactPerson || "",
          personMobileNo: partyData.personMobileNo || "",
          personWhatsAppNo: partyData.personWhatsAppNo || "",
          contactPersonEmail: partyData.contactPersonEmail || "",
          contactForPayment: partyData.contactForPayment || "",
          contactMobileNo: partyData.contactMobileNo || "",
          contactWhatsAppNo: partyData.contactWhatsAppNo || "",
          contactForPaymentEmail: partyData.contactForPaymentEmail || "",
          GSTNo: partyData.GSTNo || "",
          partyTag: partyData.partyTag || "",
          address: {
            unitNo: partyData.address?.unitNo || "",
            marketName: partyData.address?.marketName || "",
            streetAddress: partyData.address?.streetAddress || "",
            landMark: partyData.address?.landMark || "",
            area: partyData.address?.area || "",
            pincode: partyData.address?.pincode || "",
          },
          reference: partyData.reference || "",
        })
        toast.success("Existing party data loaded successfully")
      } else {
        toast.error("No party data found in response")
      }
    } catch (err) {
      toast.error("Failed to load party details: " + err.message)
    }
  }

  const getFilteredData = (array = [], value, label) => {
    if (!array?.length) return [];

    const foundItem = array.find((item) => item?._id === value);
    if (!foundItem) return [];

    const valueLabel = foundItem[label];
    return array.filter((item) => item[label] === valueLabel);
  };

  // Utility to get unique dropdown options by label key
  const getUniqueOptions = (array = [], labelKey = "marketName", valueKey = "_id") => {
    if (!array?.length) return [];

    const unique = array.filter(
      (item, index, self) =>
        index === self.findIndex((m) => m[labelKey] === item[labelKey])
    );

    return unique.map((item) => ({
      value: item[valueKey],
      label: item[labelKey],
    }));
  };



  return (
    <CustomDialog
      open={open}
      maxWidth="xl"
      onClose={onClose}
      title={
        isEditMode
          ? "Edit Party"
          : isRequestMode
            ? "Add New Party Request"
            : isBulkUpload
              ? "Bulk Upload Parties"
              : "Add New Party"
      }
    >
      <Box sx={{ background: "#fff", borderRadius: 2 }} component="form" onSubmit={formik.handleSubmit}>
        {!isBulkUpload && (
          <>
            <Box display="flex" gap={2} mb={1} justifyContent="space-between" width="100%">
              <CompanySelect
                name="companyName"
                value={formik.values.companyName}
                onChange={handleCompanyChange}
                error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                helperText={formik.touched.companyName && formik.errors.companyName}
                hasParties={false}
                required
                showPartyName={false}
                partyName={formik.values.partyName}
                onPartyChange={(event, newValue) => {
                  const partyId = newValue ? newValue.value : ""
                  formik.setFieldValue("partyName", partyId)
                  setInputValue(partyId)

                  const selectedParty = partyOptions.find((option) => option.partyName === partyId)
                  if (selectedParty && selectedParty._id) {
                    loadPartyDetails(selectedParty)
                  }
                }}
              />
              <ThemeInput
                labelName="Party Name"
                placeholder="Party Name"
                fullWidth
                required
                name="partyName"
                value={formik.values.partyName}
                onChange={(e) => {
                  const value = e.target.value
                  formik.setFieldValue("partyName", value)
                  setInputValue(value)
                  debouncedSearch(value)
                }}
                error={formik.touched.partyName && Boolean(formik.errors.partyName)}
                helperText={formik.touched.partyName && formik.errors.partyName}
                autocomplete
                options={partyOptions.map((option) => `${option.partyName} - ${option.address.unitNo}, ${option.address.marketName}`)}
                onOptionSelect={async (selectedValue) => {
                  const selectedPartyName = selectedValue.split(" - ")[0];
                  formik.setFieldValue("partyName", selectedPartyName)
                  setInputValue(selectedPartyName)

                  const selectedParty = partyOptions.find((option) => option.partyName === selectedPartyName)
                  if (selectedParty && selectedParty._id) {
                    loadPartyDetails(selectedParty)
                  }
                }}
              />
            </Box>

            <Box display="flex" gap={2} mb={1}>
              <ThemeInput
                labelName="Owner Name"
                placeholder="Owner Name"
                fullWidth
                name="ownerName"
                value={formik.values.ownerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerName)}
                helperText={formik.touched.ownerName && formik.errors.ownerName}
              />
              <ThemeInput
                labelName="Owner WhatsApp No."
                placeholder="xxxxx-xxxxx"
                mobile
                fullWidth
                name="ownerWhatsAppNo"
                value={formik.values.ownerWhatsAppNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("ownerWhatsAppNo", value);
                  formik.setFieldError(
                    "ownerWhatsAppNo",
                    value.length !== 10 ? "WhatsApp No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerWhatsAppNo)}
                helperText={formik.touched.ownerWhatsAppNo && formik.errors.ownerWhatsAppNo}
                required
              />
              <ThemeInput
                labelName="Owner Mobile No."
                placeholder="xxxxx-xxxxx"
                mobile
                fullWidth
                name="ownerMobileNo"
                value={formik.values.ownerMobileNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("ownerMobileNo", value);
                  formik.setFieldError(
                    "ownerMobileNo",
                    value.length !== 10 ? "Mobile No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerMobileNo)}
                helperText={formik.touched.ownerMobileNo && formik.errors.ownerMobileNo}
              />
              <ThemeInput
                labelName="Owner Email"
                placeholder="owner@example.com"
                fullWidth
                name="ownerEmail"
                value={formik.values.ownerEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerEmail)}
                helperText={formik.touched.ownerEmail && formik.errors.ownerEmail}
              />
            </Box>

            <Box display="flex" gap={2} mb={1}>
              <ThemeInput
                labelName="Contact Person"
                placeholder="Contact Person"
                fullWidth
                name="contactPerson"
                value={formik.values.contactPerson}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactPerson)}
                helperText={formik.touched.contactPerson && formik.errors.contactPerson}
              />
              <ThemeInput
                labelName="Person WhatsApp No."
                placeholder="xxxxx-xxxxx"
                mobile
                fullWidth
                name="personWhatsAppNo"
                value={formik.values.personWhatsAppNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("personWhatsAppNo", value);
                  formik.setFieldError(
                    "personWhatsAppNo",
                    value.length !== 10 ? "WhatsApp No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.personWhatsAppNo)}
                helperText={formik.touched.personWhatsAppNo && formik.errors.personWhatsAppNo}
              />
              <ThemeInput
                labelName="Person Mobile No."
                placeholder="xxxxx-xxxxx"
                mobile
                fullWidth
                name="personMobileNo"
                value={formik.values.personMobileNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("personMobileNo", value);
                  formik.setFieldError(
                    "personMobileNo",
                    value.length !== 10 ? "Mobile No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.personMobileNo)}
                helperText={formik.touched.personMobileNo && formik.errors.personMobileNo}
              />
              <ThemeInput
                labelName="Contact Person Email"
                placeholder="contact@example.com"
                fullWidth
                name="contactPersonEmail"
                value={formik.values.contactPersonEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactPersonEmail)}
                helperText={formik.touched.contactPersonEmail && formik.errors.contactPersonEmail}
              />
            </Box>

            <Box display="flex" gap={2} mb={1}>
              <ThemeInput
                labelName="Contact For Payment"
                placeholder="Contact Name"
                fullWidth
                sx={{ mb: 2 }}
                name="contactForPayment"
                value={formik.values.contactForPayment}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactForPayment)}
                helperText={formik.touched.contactForPayment && formik.errors.contactForPayment}
              />
              <ThemeInput
                labelName="Contact WhatsApp No."
                placeholder="xxxxx-xxxxx"
                mobile
                fullWidth
                name="contactWhatsAppNo"
                value={formik.values.contactWhatsAppNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("contactWhatsAppNo", value);
                  formik.setFieldError(
                    "contactWhatsAppNo",
                    value.length !== 10 ? "WhatsApp No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactWhatsAppNo)}
                helperText={formik.touched.contactWhatsAppNo && formik.errors.contactWhatsAppNo}
              />
              <ThemeInput
                labelName="Contact Mobile No."
                placeholder="xxxxx-xxxxx"
                mobile
                fullWidth
                name="contactMobileNo"
                value={formik.values.contactMobileNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("contactMobileNo", value);
                  formik.setFieldError(
                    "contactMobileNo",
                    value.length !== 10 ? "Mobile No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactMobileNo)}
                helperText={formik.touched.contactMobileNo && formik.errors.contactMobileNo}
              />
              <ThemeInput
                labelName="Contact For Payment Email"
                placeholder="payment@example.com"
                fullWidth
                name="contactForPaymentEmail"
                value={formik.values.contactForPaymentEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactForPaymentEmail)}
                helperText={formik.touched.contactForPaymentEmail && formik.errors.contactForPaymentEmail}
              />
            </Box>

            <Box display="flex" gap={2} mb={1} alignItems="flex-end">
              {/* GST Field */}
              <Box sx={{ width: '24.2%' }}>
                <ThemeInput
                  labelName="GST No."
                  placeholder="22AAAAA0000A1Z5"
                  fullWidth
                  name="GSTNo"
                  value={formik.values.GSTNo}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
                    formik.setFieldValue("GSTNo", value);
                    if (value) {
                      if (value.length !== 15) {
                        formik.setFieldError("GSTNo", "GST No. must be exactly 15 characters");
                      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(value)) {
                        formik.setFieldError("GSTNo", "Invalid GST format (e.g. 22AAAAA0000A1Z5)");
                      } else {
                        formik.setFieldError("GSTNo", undefined);
                      }
                    }
                  }}
                  onBlur={formik.handleBlur}
                  error={Boolean(formik.errors.GSTNo)}
                  helperText={formik.touched.GSTNo && formik.errors.GSTNo}
                />
              </Box>
              <Box sx={{ width: '24.2%' }}>
                <ThemeSelect
                  label="Party Tag"
                  placeholder="Select Tag"
                  options={[
                    { value: "Customer", label: "Customer" },
                    { value: "New", label: "New" },
                  ]}
                  value={
                    formik.values.partyTag
                      ? { value: formik.values.partyTag, label: formik.values.partyTag }
                      : null
                  }
                  onChange={(e, val: any) => {
                    formik.setFieldValue("partyTag", val?.value || "");
                  }}
                  error={Boolean(formik.errors.partyTag)}
                  helperText={formik.touched.partyTag && formik.errors.partyTag}
                />
              </Box>

              {/* Reference Radio Buttons */}
              <Box sx={{ width: '20%', mt: 2 }}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">Reference</FormLabel>
                  <RadioGroup
                    row
                    name="hasReference"
                    value={hasReference}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHasReference(value);
                      if (value === "no") {
                        formik.setFieldValue("reference", "");
                      }
                    }}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Box>

              {/* Reference Input Field - Only shows when "Yes" is selected */}
              {hasReference === "yes" && (
                <Box sx={{ width: '50%' }}>
                  <ThemeInput
                    labelName="Reference Details"
                    placeholder="Enter Reference"
                    fullWidth
                    name="reference"
                    value={formik.values.reference}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.reference)}
                    helperText={formik.touched.reference && formik.errors.reference}
                  />
                </Box>
              )}
            </Box>

            <Box>
              <Typography fontWeight={500} fontSize={14} mb={-3}>
                Address
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box display="flex" gap={2}>
                  <ThemeInput
                    label="Unit No."
                    sx={{ mt: 3.5 }}
                    name="address.unitNo"
                    value={formik.values.address.unitNo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.address?.unitNo)}
                    helperText={formik.touched.address?.unitNo && formik.errors.address?.unitNo}
                    required
                  />
                  <ThemeSelect
                    label="Market Name"
                    options={getUniqueOptions(markets, "marketName", "_id")}
                    value={getSelectedOption(
                      formik.values?.address?.marketName,
                      getUniqueOptions(markets, "marketName", "_id")
                    )}
                    onChange={(event, newValue) =>
                      formik.setFieldValue("address.marketName", newValue ? newValue.value : "")
                    }
                    name="address.marketName"
                    error={Boolean(formik.errors.address?.marketName)}
                    helperText={formik.touched.address?.marketName && formik.errors.address?.marketName}
                    required
                  />

                  <ThemeSelect
                    label="Area"
                    options={getUniqueOptions(
                      getFilteredData(markets, formik.values?.address?.marketName, "marketName"),
                      "area",
                      "_id"
                    )}
                    value={getSelectedOption(
                      formik.values?.address?.area,
                      getUniqueOptions(
                        getFilteredData(markets, formik.values?.address?.marketName, "marketName"),
                        "area",
                        "_id"
                      )
                    )}
                    onChange={(event, newValue) => {
                      formik.setFieldValue("address.area", newValue ? newValue.value : "");
                    }}
                    name="address.area"
                    error={Boolean(formik.errors.address?.area)}
                    helperText={formik.touched.address?.area && formik.errors.address?.area}
                    required
                  />
                  <ThemeSelect
                    label="Street Address"
                    options={getUniqueOptions(
                      getFilteredData(markets, formik.values?.address?.area, "streetAddress"),
                      "streetAddress",
                      "_id"
                    )}
                    value={getSelectedOption(
                      formik.values?.address?.streetAddress,
                      getUniqueOptions(
                        getFilteredData(markets, formik.values?.address?.area, "area"),
                        "streetAddress",
                        "_id"
                      )
                    )}
                    onChange={(event, newValue) => {
                      formik.setFieldValue("address.streetAddress", newValue ? newValue.value : "");
                    }}
                    name="address.streetAddress"
                    error={Boolean(formik.errors.address?.streetAddress)}
                    helperText={formik.touched.address?.streetAddress && formik.errors.address?.streetAddress}
                    required
                  />
                  <ThemeSelect
                    label="Land Mark"
                    options={getUniqueOptions(
                      getFilteredData(markets, formik.values?.address?.streetAddress, "streetAddress"),
                      "landmark",
                      "_id"
                    )}
                    value={getSelectedOption(
                      formik.values?.address?.landMark,
                      getUniqueOptions(
                        getFilteredData(markets, formik.values?.address?.streetAddress, "streetAddress"),
                        "landmark",
                        "_id"
                      )
                    )}
                    onChange={(event, newValue) => {
                      formik.setFieldValue("address.landMark", newValue ? newValue.value : "");
                    }}
                    name="address.landMark"
                    error={Boolean(formik.errors.address?.landMark)}
                    helperText={formik.touched.address?.landMark && formik.errors.address?.landMark}
                    required
                  />
                  <ThemeSelect
                    label="Pin Code"
                    options={getUniqueOptions(
                      getFilteredData(markets, formik.values?.address?.landMark, "landmark"),
                      "pincode",
                      "_id"
                    )}
                    value={getSelectedOption(
                      formik.values?.address?.pincode,
                      getUniqueOptions(
                        getFilteredData(markets, formik.values?.address?.landMark, "landmark"),
                        "pincode",
                        "_id"
                      )
                    )}
                    onChange={(event, newValue) => {
                      formik.setFieldValue("address.pincode", newValue ? newValue.value : "");
                    }}
                    name="address.pincode"
                    error={Boolean(formik.errors.address?.pincode)}
                    helperText={formik.touched.address?.pincode && formik.errors.address?.pincode}
                    required
                  />
                </Box>
              </Box>

              <Box mt={3}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box display="flex" width="260px">
                    <ThemeSelect
                      label="Reason to Visit"
                      options={reasonOptions}
                      value={getSelectedOption(formik.values.reasonToVisit, reasonOptions)}
                      onChange={(event, newValue) => {
                        formik.setFieldValue("reasonToVisit", newValue ? newValue.value : "");
                      }}
                      name="reasonToVisit"
                      error={Boolean(formik.errors.reasonToVisit)}
                      helperText={formik.touched.reasonToVisit && formik.errors.reasonToVisit}
                      required
                    />
                  </Box>
                  {!isRequestMode && (
                    <Box display="flex" width="100%">
                      <ThemeSelect
                        label="Created By"
                        options={staffOptions}
                        value={getSelectedOption(formik.values.createdBy, staffOptions)}
                        onChange={(event, newValue) => {
                          formik.setFieldValue("createdBy", newValue ? newValue.value : "");
                        }}
                        name="createdBy"
                        error={Boolean(formik.errors.createdBy)}
                        helperText={formik.touched.createdBy && formik.errors.createdBy}
                        required
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}

        {isBulkUpload && (
          <>
            <Box display="flex" gap={2} mb={1} justifyContent="space-between" width="100%">
              <CompanySelect
                name="companyName"
                value={formik.values.companyName}
                onChange={handleCompanyChange}
                error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                helperText={formik.touched.companyName && formik.errors.companyName}
                hasParties={false}
                required
                showPartyName={false}
              />
              {!isRequestMode && (
                <ThemeSelect
                  label="Created By"
                  options={staffOptions}
                  value={getSelectedOption(formik.values.createdBy, staffOptions)}
                  onChange={(event, newValue) => {
                    formik.setFieldValue("createdBy", newValue ? newValue.value : "");
                  }}
                  name="createdBy"
                  error={Boolean(formik.errors.createdBy)}
                  helperText={formik.touched.createdBy && formik.errors.createdBy}
                  required
                />
              )}
            </Box>

            <Box mt={2}>
              <Typography fontWeight={500} fontSize={14} mb={1}>
                Bulk Upload
              </Typography>
              <Box
                sx={{
                  border: "2px dashed #e0e0e0",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "#fafafa",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "#1976d2",
                    backgroundColor: "#f5f5f5",
                  },
                  ...(file && {
                    borderColor: "#4caf50",
                    backgroundColor: "#f1f8e9",
                  }),
                }}
                onClick={() => document.getElementById("bulk-file-input")?.click()}
              >
                <input
                  id="bulk-file-input"
                  type="file"
                  accept=".csv, .xlsx"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) setFile(selectedFile);
                  }}
                  style={{ display: "none" }}
                />

                {!file ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                        📁 Choose File to Upload
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Click here to select CSV or Excel file
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        Supported formats: .csv, .xlsx
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                        ✅ File Selected
                      </Typography>
                      <Typography variant="body2" color="textPrimary" fontWeight={500}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        Size: {(file.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              <Box display="flex" gap={2} alignItems="center" justifyContent="center" mt={2}>
                <ThemeButton
                  disabled={!formik.values.companyName || !formik.values.createdBy || !file}
                  onClick={async () => {
                    if (file) {
                      setIsLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("companyName", formik.values.companyName);
                        formData.append("createdBy", formik.values.createdBy);
                        await dispatch(bulkCreateAccountMastersThunk(formData)).unwrap();
                        toast.success("Bulk upload completed successfully");
                        if (refreshData) refreshData();
                        setFile(null);
                        onClose();
                      } catch (err: any) {
                        toast.error(err.message || "Bulk upload failed");
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  sx={{ minWidth: 150 }}
                >
                  {isLoading ? "Uploading..." : "Upload Bulk File"}
                </ThemeButton>

                {file && (
                  <ThemeButton
                    variant="outlined"
                    onClick={() => {
                      setFile(null);
                      const input = document.getElementById("bulk-file-input") as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                    sx={{ minWidth: 100 }}
                  >
                    Clear File
                  </ThemeButton>
                )}
                <ThemeButton
                  variant="outlined"
                  onClick={handleDownloadSample}
                  sx={{ minWidth: 180 }}
                >
                  Download Sample CSV
                </ThemeButton>
              </Box>
            </Box>
          </>
        )}

        <Box display="flex" justifyContent="flex-end" mt={2}>
          {!isBulkUpload && (
            <ThemeButton
              type="submit"
              sx={{ minWidth: 120 }}
              disabled={isLoading || formik.isSubmitting}
            >
              {isLoading || formik.isSubmitting ? "Saving..." : "Save"}
            </ThemeButton>
          )}
        </Box>
      </Box>
    </CustomDialog>
  );
};

export default AddNewPartyDialog;