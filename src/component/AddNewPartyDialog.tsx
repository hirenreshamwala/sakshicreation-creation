"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, Checkbox, debounce, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";
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
import { downloadSkippedRecordsAsCSV } from "@/utills/utills";

interface Address {
  unitNo: string;
  marketName: string;
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
  company: any;
  isBulkUpload?: boolean; // New prop to handle bulk upload mode
}

const validationSchema = Yup.object({
  companyName: Yup.string().required("Company Name is required"),
  partyName: Yup.string().required("Party Name is required"),
  ownerMobileNo: Yup.string().matches(/^[0-9]{10}$/, "Owner Mobile No. must be 10 digits").required("Owner Mobile No. is required"),
  ownerWhatsAppNo: Yup.string()
    .matches(/^[0-9]{10}$/, "Owner WhatsApp No. must be 10 digits")
    .required("Owner WhatsApp No. is required"),
  GSTNo: Yup.string(),
  address: Yup.object({
    unitNo: Yup.string().required("Unit No. is required"),
    marketName: Yup.string().required("Market Name is required"),
    // streetAddress: Yup.string(),
    landMark: Yup.string(),
    area: Yup.string().required("Area is required"),
    pincode: Yup.string()
      .required("Pincode is required"),
  }),
  reasonToVisit: Yup.string().required("Reason to Visit is required"),
  // createdBy: Yup.string().required("Created By is required"),
});

const AddNewPartyDialog: React.FC<AddNewPartyDialogProps> = ({
  open,
  onClose,
  accountId,
  refreshData,
  isRequestMode = false,
  isBulkUpload = false,
  company
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
  const [referenceOptions, setReferenceOptions] = useState<PartySuggestion[]>([]);
  const [recordSkipped, setRecordSkipped] = useState(false)
  const [skippedRecords, setSkippedRecords] = useState([])
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
    debounce((query: string, companyId: string) => {
      if (query.length >= 2 && companyId) {
        dispatch(searchPartiesThunk({ query, companyId }));
      } else {
        dispatch(clearSuggestions());
      }
    }, 300),
    [dispatch]
  );

  const debouncedReferenceSearch = useCallback(
    debounce((query: string, companyId: string) => {
      if (query.length >= 2 && companyId) {
        dispatch(searchPartiesThunk({ query, companyId }));
      } else {
        dispatch(clearSuggestions());
      }
    }, 300),
    [dispatch]
  );

  // Update partyOptions effect to also update referenceOptions
  useEffect(() => {
    setPartyOptions(partySuggestions);
    setReferenceOptions(partySuggestions);
  }, [partySuggestions]);

  useEffect(() => {
    setPartyOptions(partySuggestions);
  }, [partySuggestions]);

  const formik = useFormik<FormData>({
    initialValues: {
      companyName: company?._id,
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
        // streetAddress: "",
        landMark: "",
        area: "",
        pincode: "",
      },
      reasonToVisit: "VISIT",
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
        setSkippedRecords([])
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

  // console.log(markets, 'markets')

  const handleDownloadSample = () => {
    const csvContent = `partyName,ownerName,ownerMobileNo,ownerWhatsAppNo,ownerEmail,contactPerson,personMobileNo,personWhatsAppNo,contactPersonEmail,contactForPayment,contactMobileNo,contactWhatsAppNo,contactForPaymentEmail,GSTNo,unitNo,marketName,landMark,area,pincode,reasonToVisit,reference,isRequestMode,partyTag,createdBy\nTest Party 1,John Doe,9876543210,9876543210,john.doe@example.com,Jane Smith,9123456789,9123456789,jane.smith@example.com,Payment Contact,9123456780,9123456780,payment@example.com,22AAAAA0000A1Z5,Unit 101,Market A,Near Abc,Area A,400001,Visit,Ref123,FALSE,New,SUSHIL CHHAJER\nTest Party 2,Mary Jane,8765432109,8765432109,mary.jane@example.com,Tom Brown,9234567890,9234567890,tom.brown@example.com,Payment Contact 2,9234567880,9234567880,payment2@example.com,22AAAAA0000A1Z6,Unit 102,Market B,Near Mall,Area B,400002,Order,Ref456,TRUE,Customer,SUSHIL CHHAJER`;
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
          // console.log(result, 'partyData')
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
            partyTag: result.party.partyTag,
            address: {
              unitNo: result.party.address?.unitNo || "",
              marketName: result.party.address?.marketName?._id || "",
              // streetAddress: result.address?.streetAddress?._id || "",
              landMark: result.party.address?.landMark?._id || "",
              area: result.party.address?.area?._id || "",
              pincode: result.party.address?.pincode?._id || "",
            },
            reasonToVisit: result.reasonToVisit.toUpperCase() || "VISIT",
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
    { label: "Visit", value: "VISIT" },
    { label: "Order", value: "ORDER" },
    { label: "Reference", value: "REFERNCE" },
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
  if (!value || !options?.length) return null;
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
      // console.log(partyData, 'partyData')
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
            marketName: partyData.address?.marketName?._id || "",
            // streetAddress: partyData.address?.streetAddress?._id || "",
            landMark: partyData.address?.landMark?._id || "",
            area: partyData.address?.area?._id || "",
            pincode: partyData.address?.pincode?._id || "",
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

// Fix the getFilteredData function
const getFilteredData = (array = [], value, label) => {
  if (!array?.length || !value) return [];
  
  console.log(`Filtering by ${label} = ${value}`); // Debug log
  
  const foundItem = array.find((item) => item?._id === value);
  console.log("Found item:", foundItem); // Debug log
  
  if (!foundItem) return [];

  const valueLabel = foundItem[label];
  console.log(`Value label for ${label}:`, valueLabel); // Debug log
  
  const filtered = array.filter((item) => {
    const itemLabel = item[label];
    // Handle both object and string cases
    const compareValue = typeof itemLabel === 'object' ? itemLabel?.[label] : itemLabel;
    return compareValue === valueLabel;
  });
  
  console.log("Filtered result:", filtered); // Debug log
  return filtered;
};

// Fix the getUniqueOptions function
const getUniqueOptions = (array = [], labelKey = "marketName", valueKey = "_id") => {
  if (!array?.length) return [];

  console.log(`Creating unique options for ${labelKey} from:`, array); // Debug log

  const unique = array.filter((item, index, self) => {
    const currentLabel = item[labelKey];
    const currentLabelValue = typeof currentLabel === 'object' ? currentLabel?.[labelKey] : currentLabel;
    
    return index === self.findIndex((m) => {
      const compareLabel = m[labelKey];
      const compareLabelValue = typeof compareLabel === 'object' ? compareLabel?.[labelKey] : compareLabel;
      return compareLabelValue === currentLabelValue;
    });
  });

  const options = unique.map((item) => {
    const labelValue = item[labelKey];
    const labelText = typeof labelValue === 'object' ? labelValue?.[labelKey] : labelValue;
    
    return {
      value: item[valueKey],
      label: labelText || 'Unknown',
    };
  });

  console.log(`Unique options for ${labelKey}:`, options); // Debug log
  return options;
};

  const filteredReferenceOptions = React.useMemo(() => {
    return referenceOptions.filter(option => option.partyName !== formik.values.partyName);
  }, [referenceOptions, formik.values.partyName]);

  const handleDialogClose = () => {
    formik.resetForm();
    setInputValue("");
    setFile(null);
    setSkippedRecords([]);
    setHasReference("no");
    dispatch(clearSuggestions());
    onClose();
  };
// Add this debug useEffect
// Add this debug useEffect
useEffect(() => {
  if (open && markets.length > 0) {
    console.log("=== MARKET DEBUG INFO ===");
    console.log("All markets:", markets);
    console.log("Selected market ID:", formik.values?.address?.marketName);
    
    const marketOptions = getUniqueOptions(markets, "marketName", "_id");
    console.log("Market options:", marketOptions);
    
    const selectedMarket = getSelectedOption(formik.values?.address?.marketName, marketOptions);
    console.log("Selected market option:", selectedMarket);
    
    // Debug filtered data
    const filteredByMarket = getFilteredData(markets, formik.values?.address?.marketName, "marketName");
    console.log("Filtered by market:", filteredByMarket);
    
    const areaOptions = getUniqueOptions(filteredByMarket, "area", "_id");
    console.log("Area options:", areaOptions);
  }
}, [open, markets, formik.values?.address?.marketName]);

  console.log( formik.values, 'hasReference')
  return (
    <CustomDialog
      open={open}
      maxWidth="xl"
      onClose={handleDialogClose}
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
                  const value = e.target.value.toUpperCase()
                  formik.setFieldValue("partyName", value)
                  setInputValue(value)

                  // Company selected होने पर ही search करें
                  if (formik.values.companyName) {
                    debouncedSearch(value, formik.values.companyName)
                  } else {
                    dispatch(clearSuggestions());
                  }
                }}
                error={formik.touched.partyName && Boolean(formik.errors.partyName)}
                helperText={formik.touched.partyName && formik.errors.partyName}
                autocomplete
                options={partyOptions.map((option) => `${option.partyName} - ${option.address.unitNo || ""}, ${option.address.marketName?.marketName || ""}`)}
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
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase();
                  formik.setFieldValue("ownerName", value);
                }}
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
                required
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
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase();
                  formik.setFieldValue("contactPerson", value);
                }}
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
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "").toUpperCase();
                  formik.setFieldValue("contactForPayment", value);
                }}
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
                    value={hasReference.toLowerCase()}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
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
              {hasReference.toLowerCase() === "yes" && (
                <Box sx={{ width: '50%' }}>
                  <Autocomplete
                    freeSolo
                    options={filteredReferenceOptions.map(option =>
                      `${option.partyName} - ${option.address?.unitNo || ""}, ${option.address?.marketName?.marketName || ""}`
                    )}
                    value={formik.values.reference}
                    onChange={(event, newValue) => {
                      const selectedPartyName = newValue ? newValue.split(" - ")[0] : "";
                      formik.setFieldValue("reference", selectedPartyName);
                    }}
                    onInputChange={(event, newInputValue) => {
                      formik.setFieldValue("reference", newInputValue);

                      // Company selected होने पर ही search करें
                      if (formik.values.companyName) {
                        debouncedReferenceSearch(newInputValue, formik.values.companyName);
                      } else {
                        dispatch(clearSuggestions());
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Reference Details"
                        placeholder="Enter Reference"
                        fullWidth
                        error={Boolean(formik.errors.reference)}
                        helperText={formik.touched.reference && formik.errors.reference}
                      />
                    )}
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
      onChange={(e) => formik.setFieldValue("address.unitNo", e.target.value.toUpperCase())}
      onBlur={formik.handleBlur}
      error={Boolean(formik.errors.address?.unitNo)}
      helperText={formik.touched.address?.unitNo && formik.errors.address?.unitNo}
      required
    />
    
    {/* Market Name */}
    <ThemeSelect
      label="Market Name"
      options={markets.map(market => ({
        value: market._id, // Use _id as value
        label: market.marketName // Show marketName as label
      }))}
      value={markets.find(market => market._id === formik.values?.address?.marketName) ? {
        value: formik.values?.address?.marketName,
        label: markets.find(market => market._id === formik.values?.address?.marketName)?.marketName
      } : null}
      onChange={(event, newValue) => {
        formik.setFieldValue("address.marketName", newValue ? newValue.value : "");
        // Reset dependent fields when market changes
        formik.setFieldValue("address.area", "");
        formik.setFieldValue("address.landMark", "");
        formik.setFieldValue("address.pincode", "");
      }}
      name="address.marketName"
      error={Boolean(formik.errors.address?.marketName)}
      helperText={formik.touched.address?.marketName && formik.errors.address?.marketName}
      required
    />

    {/* Area */}
    <ThemeSelect
      label="Area"
      options={(() => {
        if (!formik.values?.address?.marketName) return [];
        const selectedMarket = markets.find(market => market._id === formik.values?.address?.marketName);
        if (!selectedMarket) return [];
        
        // Get all markets with the same marketName to get areas
        const sameMarketMarkets = markets.filter(market => 
          market.marketName === selectedMarket.marketName
        );
        
        // Get unique areas with their _ids
        const uniqueAreas = sameMarketMarkets
          .filter(market => market.area && market._id) // Ensure area and _id exist
          .reduce((acc, market) => {
            const existing = acc.find(item => item.area === market.area);
            if (!existing) {
              acc.push({
                _id: market._id, // Use market _id as value
                area: market.area // Show area as label
              });
            }
            return acc;
          }, []);
        
        return uniqueAreas.map(item => ({
          value: item._id, // Use _id as value
          label: item.area // Show area as label
        }));
      })()}
      value={(() => {
        if (!formik.values?.address?.area) return null;
        // Find the market that has this area to get the correct _id
        const marketWithArea = markets.find(market => 
          market._id === formik.values?.address?.area
        );
        return marketWithArea ? {
          value: marketWithArea._id,
          label: marketWithArea.area
        } : null;
      })()}
      onChange={(event, newValue) => {
        formik.setFieldValue("address.area", newValue ? newValue.value : "");
        formik.setFieldValue("address.landMark", "");
        formik.setFieldValue("address.pincode", "");
      }}
      name="address.area"
      error={Boolean(formik.errors.address?.area)}
      helperText={formik.touched.address?.area && formik.errors.address?.area}
      required
    />

    {/* Land Mark */}
    <ThemeSelect
      label="Land Mark"
      options={(() => {
        if (!formik.values?.address?.area) return [];
        
        // Find the market with the selected area _id to get landmarks
        const selectedMarket = markets.find(market => 
          market._id === formik.values?.address?.area
        );
        if (!selectedMarket) return [];
        
        // Get all markets with the same area to get landmarks
        const sameAreaMarkets = markets.filter(market => 
          market.area === selectedMarket.area
        );
        
        // Get unique landmarks with their _ids
        const uniqueLandmarks = sameAreaMarkets
          .filter(market => market.landmark && market._id)
          .reduce((acc, market) => {
            const existing = acc.find(item => item.landmark === market.landmark);
            if (!existing) {
              acc.push({
                _id: market._id, // Use market _id as value
                landmark: market.landmark // Show landmark as label
              });
            }
            return acc;
          }, []);
        
        return uniqueLandmarks.map(item => ({
          value: item._id, // Use _id as value
          label: item.landmark // Show landmark as label
        }));
      })()}
      value={(() => {
        if (!formik.values?.address?.landMark) return null;
        // Find the market that has this landmark to get the correct _id
        const marketWithLandmark = markets.find(market => 
          market._id === formik.values?.address?.landMark
        );
        return marketWithLandmark ? {
          value: marketWithLandmark._id,
          label: marketWithLandmark.landmark
        } : null;
      })()}
      onChange={(event, newValue) => {
        formik.setFieldValue("address.landMark", newValue ? newValue.value : "");
        formik.setFieldValue("address.pincode", "");
      }}
      name="address.landMark"
      error={Boolean(formik.errors.address?.landMark)}
      helperText={formik.touched.address?.landMark && formik.errors.address?.landMark}
    />

    {/* Pin Code */}
    <ThemeSelect
      label="Pin Code"
      options={(() => {
        if (!formik.values?.address?.landMark) return [];
        
        // Find the market with the selected landmark _id to get pincodes
        const selectedMarket = markets.find(market => 
          market._id === formik.values?.address?.landMark
        );
        if (!selectedMarket) return [];
        
        // Get all markets with the same landmark to get pincodes
        const sameLandmarkMarkets = markets.filter(market => 
          market.landmark === selectedMarket.landmark
        );
        
        // Get unique pincodes with their _ids
        const uniquePincodes = sameLandmarkMarkets
          .filter(market => market.pincode && market._id)
          .reduce((acc, market) => {
            const existing = acc.find(item => item.pincode === market.pincode);
            if (!existing) {
              acc.push({
                _id: market._id, // Use market _id as value
                pincode: market.pincode // Show pincode as label
              });
            }
            return acc;
          }, []);
        
        return uniquePincodes.map(item => ({
          value: item._id, // Use _id as value
          label: item.pincode // Show pincode as label
        }));
      })()}
      value={(() => {
        if (!formik.values?.address?.pincode) return null;
        // Find the market that has this pincode to get the correct _id
        const marketWithPincode = markets.find(market => 
          market._id === formik.values?.address?.pincode
        );
        return marketWithPincode ? {
          value: marketWithPincode._id,
          label: marketWithPincode.pincode
        } : null;
      })()}
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
              {/* {!isRequestMode && (
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
              )} */}
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
                  accept=".csv"
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
                        Click here to select CSV file
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        Supported formats: .csv
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

              {skippedRecords?.length ? <Box
                sx={{
                  display: "flex",
                  flexDirection: "column", // stack items vertically
                  justifyContent: "center",
                  alignItems: "center",
                  pt: 2,
                  textAlign: "center", // optional for Typography centering
                }}
              >
                <Typography color="error" mb={1}>
                  Note: Some records are not uploaded. Click the button below to download skipped records.
                </Typography>
                <ThemeButton onClick={() => {
                  downloadSkippedRecordsAsCSV(skippedRecords)
                  setSkippedRecords([])
                  onClose()
                }}>
                  Download Skipped Records
                </ThemeButton>
              </Box> : null}


              <Box display="flex" gap={2} alignItems="center" justifyContent="center" mt={2}>
                <ThemeButton
                  disabled={!formik.values.companyName || !file}
                  onClick={async () => {
                    if (file) {
                      setIsLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("companyName", formik.values.companyName);
                        formData.append("createdBy", formik.values.createdBy);
                        const res = await dispatch(bulkCreateAccountMastersThunk(formData)).unwrap();
                        // console.log(res, 'jdshbfjkdhbjkn')
                        if (res?.skippedCount > 0) {
                          setRecordSkipped(true)
                          setSkippedRecords(res?.skippedRecords)
                          setFile(null);
                          if (refreshData) refreshData();
                          toast.success("Bulk upload completed successfully");
                          return
                        }
                        toast.success("Bulk upload completed successfully");
                        if (refreshData) refreshData();
                        setFile(null);
                        onClose();
                        setSkippedRecords([])
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