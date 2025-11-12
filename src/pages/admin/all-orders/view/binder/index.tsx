"use client"
import { useRef, useEffect, useState } from "react"
import { Box, Typography, Paper, Button, CircularProgress, Stack, IconButton } from "@mui/material"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import StepperProgress from "@/component/common_component/stepperprogress"
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { toast } from "react-toastify"
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect"
import FileUpload from "@/component/reusablecomponents/FileUpload"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import { AiOutlineEye } from "react-icons/ai"
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { downloadVisitingCardPDF } from "@/utills/utills"
import { Download } from "@mui/icons-material"
import moment from "moment"
import ThemeSelect from "@/component/common_component/themeselect"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"

type PaperField = {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
  materialId?: string; // Add materialId to track the selected material
};

const BinderForm = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  const dispatch = useAppDispatch()
  const { singleOrder } = useAppSelector((state) => state.orders)
  const fileUploadRef = useRef<any>(null)
  const { materials } = useAppSelector(state => state.materials);
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedBinderStaff, setSelectedBinderStaff] = useState<any>(null)
  const [openBinderFilesDialog, setOpenBinderFilesDialog] = useState(false)
  const [uploadedBinderFiles, setUploadedBinderFiles] = useState<any[]>([])
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [binderPapers, setBinderPapers] = useState<PaperField[]>([])

  const formik = useFormik({
    initialValues: {
      issuedDate: "",
      receivedDate: "",
      remarks: "",
      size: "",
      binding: "",
      pagesPerBook: "",
      qty: "",
      subPaper: "",
      usedPaper: "",
      rateBook: "",
      totalAmount: "",
      gsm: "",
      gst: "",
      ratePerUnit: "",
      rowPaperSize: "",
      rowPaperUser: "",
    },
    validationSchema: Yup.object({
      issuedDate: Yup.string().required("Issued Date is required"),
      receivedDate: Yup.string()
        .test("is-greater-or-equal", "Received Date must be on or after Issued Date", function (value) {
          const { issuedDate } = this.parent
          if (!issuedDate || !value) return true
          return new Date(value) >= new Date(issuedDate)
        }),
      remarks: Yup.string().required("Remarks are required"),
      size: Yup.string().required("Size is required"),
      binding: Yup.string().required("Binding is required"),
      pagesPerBook: Yup.number()
        .typeError("Must be a number")
        .required("Pages / book is required")
        .min(1, "Must be at least 1"),
      qty: Yup.number().typeError("Must be a number").required("Quantity is required").min(1, "Must be at least 1"),
      usedPaper: Yup.string().required("Used Paper is required"),
      rateBook: Yup.string().required("Rate / book is required"),
      totalAmount: Yup.string().required("Total Amount is required"),
      gsm: Yup.string().required("GSM is required"),
      rowPaperSize: Yup.string().required("Raw Paper Size is required"),
      rowPaperUser: Yup.string().required("Raw Paper Used is required"),
      binderPapers: Yup.array().of(
        Yup.object().shape({
          numberOfSheetsUsed: Yup.string().required("Number of Sheets Used is required"),
          sheetSize: Yup.string().required("Sheet Size is required"),
          paperType: Yup.string().required("Paper Type is required"),
          gsm: Yup.string().required("GSM is required"),
          ratePerUnit: Yup.string().required("Rate Per Unit is required"),
        })
      ),
    }),
    onSubmit: async (values) => {
      if (!orderId || typeof orderId !== "string") {
        toast.error("Order ID not found")
        return
      }
      if (!selectedBinderStaff) {
        toast.error("Please select a binder to assign.")
        return
      }

      setLoading(true)
      try {
        let newBinderFiles: any[] = []
        if (fileUploadRef.current) {
          const selectedFiles = fileUploadRef.current.getSelectedFiles()
          if (selectedFiles.length > 0) {
            newBinderFiles = selectedFiles.map((file: File) => ({
              path: `binder-files/${file.name}`,
              remark: values.remarks,
              uploadedAt: new Date().toISOString(),
            }))
          }
        }

        const allBinderFiles = [...(singleOrder?.binderFiles || []), ...newBinderFiles.filter((f) => !f.isNew)]

        const updateData = {
          binder: selectedBinderStaff.value,
          binderStatus: "Pending",
          status: "Binder",
          issuedDate: values.issuedDate,
          binderRemarks: values.remarks,
          size: values.size,
          binding: values.binding,
          pagesPerBook: values.pagesPerBook,
          qty: values.qty,
          subPaper: values.subPaper,
          usedPaper: values.usedPaper,
          rateBook: values.rateBook,
          totalAmount: values.totalAmount,
          gsm: values.gsm,
          gst: values.gst,
          ratePerUnit: values.ratePerUnit,
          rowPaperSize: values.rowPaperSize,
          rowPaperUser: values.rowPaperUser,
          binderFiles: allBinderFiles,
          binderPapers: binderPapers,
        }

        await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
        toast.success("Order assigned to Binder successfully!")
        await dispatch(getOrderByIdThunk(orderId)).unwrap()
      } catch (error: any) {
        console.error("Error assigning to binder:", error)
        toast.error(error?.message || "Failed to assign to binder")
      } finally {
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && typeof orderId === "string") {
        try {
          setPageLoading(true)
          await dispatch(getOrderByIdThunk(orderId)).unwrap()
        } catch (err) {
          console.error("Failed to fetch order:", err)
          toast.error("Failed to load order data")
        } finally {
          setPageLoading(false)
        }
      }
    }
    fetchOrderData()
  }, [dispatch, orderId])

  useEffect(() => {
    if (!materials.length) dispatch(getAllMaterialsThunk());
  }, [])

  useEffect(() => {
    if (singleOrder) {
      formik.setValues({
        issuedDate: singleOrder.issuedDate
          ? new Date(singleOrder.issuedDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        receivedDate: singleOrder.receivedDate ? new Date(singleOrder.receivedDate).toISOString().split("T")[0] : "",
        remarks: singleOrder.binderRemarks || singleOrder.remarks || "",
        size: singleOrder.size || "",
        binding: singleOrder.binding || "",
        pagesPerBook: singleOrder.pagesPerBook?.toString() || "",
        qty: singleOrder.qty?.toString() || "",
        subPaper: singleOrder.subPaper || "",
        usedPaper: singleOrder.usedPaper || "",
        rateBook: singleOrder.rateBook || "",
        totalAmount: singleOrder.totalAmount || "",
        gsm: singleOrder.gsm || "",
        gst: singleOrder.gst || "",
        ratePerUnit: singleOrder.ratePerUnit || "",
        rowPaperSize: singleOrder.rowPaperSize || "",
        rowPaperUser: singleOrder.rowPaperUser || "",
      })

      if (singleOrder.binder && singleOrder.binder._id) {
        setSelectedBinderStaff({
          value: singleOrder.binder._id,
          label: singleOrder.binder.name || `Binder ${singleOrder.binder._id}`,
        })
      } else {
        setSelectedBinderStaff(null)
      }

      // Initialize binder papers
      const printerPaperCount = singleOrder.printerPapers?.length || 0
      if (singleOrder.binderPapers && singleOrder.binderPapers.length > 0) {
        setBinderPapers(singleOrder.binderPapers)
      } else {
        setBinderPapers([{
          paperName: `Paper-${printerPaperCount + 1}`,
          numberOfSheetsUsed: "",
          sheetSize: "",
          paperType: "",
          gsm: "",
          ratePerUnit: ""
        }])
      }

      setUploadedBinderFiles(singleOrder.binderFiles || [])
    }
  }, [singleOrder])

  const handleBinderStaffChange = (event: any, newValue: any) => {
    setSelectedBinderStaff(newValue)
  }

  const handleHoldToggle = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }
    setLoading(true)
    try {
      const newStatus = singleOrder?.status === "Hold" ? "Binder" : "Hold"
      const updateData: any = { status: newStatus }

      if (newStatus !== "Hold" && singleOrder?.binderStatus === "Hold") {
        updateData.binderStatus = "Pending"
      }

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success(`Order ${newStatus === "Hold" ? "put on hold" : "unheld"} successfully`)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error toggling hold status:", error)
      toast.error(error?.message || "Failed to toggle hold status")
    } finally {
      setLoading(false)
    }
  }

  const handleBinderFilesSelected = (selectedFiles: File[]) => {
    const newFileList = selectedFiles.map((file) => ({
      path: file.name,
      remark: "",
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      isNew: true,
    }))
    setUploadedBinderFiles((prev) => [...prev, ...newFileList])
  }

  const handleBinderFileRemoved = (removedFile: File) => {
    setUploadedBinderFiles((prev) =>
      prev.filter((file) => !(file.isNew && file.file && file.file.name === removedFile.name)),
    )
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
    toast.error(error)
  }

  const handleAssignToBookletFolder = () => {
    router.push(`/admin/all-orders/view/booklet-folder/?id=${orderId}`)
  }

  const handleProceedToDelivery = () => {
    router.push(`/admin/all-orders/view/dilevery/?id=${orderId}`)
  }

  const handleViewUploadedBinderFiles = () => {
    setOpenBinderFilesDialog(true)
  }

  const handleAddBinderPaper = () => {
    const printerPaperCount = singleOrder?.printerPapers?.length || 0
    const binderPaperCount = binderPapers.length
    setBinderPapers([...binderPapers, {
      paperName: `Paper-${printerPaperCount + binderPaperCount + 1}`,
      numberOfSheetsUsed: "",
      sheetSize: "",
      paperType: "",
      gsm: "",
      ratePerUnit: ""
    }])
  }

  const handleBinderPaperChange = (index: number, field: keyof PaperField, value: string) => {
    const updatedPapers = [...binderPapers]
    updatedPapers[index] = {
      ...updatedPapers[index],
      [field]: value
    }
    setBinderPapers(updatedPapers)
  }

  const handleDeleteBinderPaper = (index: number) => {
    if (binderPapers.length === 1) {
      toast.error("At least one paper field is required")
      return
    }
    const updatedPapers = binderPapers.filter((_, i) => i !== index)
    setBinderPapers(updatedPapers)
  }

  // Get unique material names
  // Get unique material names (using _id)
  const materialNameOptions = materials.map(material => ({
    value: material._id, // Use _id as value
    label: material.materialName,
  }));

  // Get GSM options for a specific material (_id)
  const getMaterialGSMOptions = (materialId: string) => {
    const filteredMaterials = materials.filter(m => m._id === materialId);
    return Array.from(
      new Set(filteredMaterials.map(m => m.materialGSM.toString()))
    ).map(gsm => {
      const gsmMaterial = filteredMaterials.find(m => m.materialGSM.toString() === gsm);
      return {
        value: gsmMaterial?._id, // Use _id for GSM too
        label: `${gsm} GSM`,
      };
    });
  };

  // Get size options for a specific material + GSM
  const getMaterialSizeOptions = (materialId: string, materialGSM: string) => {
    const filteredMaterials = materials.filter(
      m => m._id === materialGSM
    );
    return filteredMaterials.map(m => ({
      value: m._id, // Each size option tied to material _id
      label: m.materialSize,
    }));
  };

  // Handle material name selection
  const handleMaterialNameChange = (index: number, id: string) => {
    const updatedPapers = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      paperType: id, // store _id
      gsm: "",       // reset gsm
      sheetSize: "", // reset size
    };
    setBinderPapers(updatedPapers);
  };

  // Handle GSM selection
  const handleMaterialGSMChange = (index: number, id: string) => {
    const updatedPapers = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      gsm: id,       // store _id
      sheetSize: "", // reset size
    };
    setBinderPapers(updatedPapers);
  };

  // Handle size selection
  const handleMaterialSizeChange = (index: number, id: string) => {
    const updatedPapers = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      sheetSize: id, // store _id
    };
    setBinderPapers(updatedPapers);
  };


  const handleDownload = () => {
    const data = {
      ...singleOrder,
      odNo: singleOrder.orderNumber,
      size: singleOrder.size,
      date: moment(singleOrder.issuedDate).format('DD-MM-YYYY'),
      quantity: singleOrder.qty,
      binding: singleOrder.binding,
      col: singleOrder.color,
      printer: `${singleOrder.printer.firstName} ${singleOrder.printer.lastName}`,
      remark: singleOrder.remarks,
      rate: singleOrder.rate,
      partyName: singleOrder?.party?.partyName || "",
      address: "",
    };

    downloadVisitingCardPDF(data);
  };

  if (pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (!singleOrder) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>No order data found</Typography>
      </Box>
    )
  }

  const isHeld = singleOrder?.status === "Hold"
  const isBinderAssigned = !!singleOrder?.binder
  const isBinderStatusDone = singleOrder?.binderStatus === "Done"
  const isBinderStatusInProgress = singleOrder?.binderStatus === "In Progress"
  const isPrinterStatusDone = singleOrder?.printerStatus === "Done"
  const areFieldsReadOnly = isHeld || isBinderStatusDone || isBinderStatusInProgress

  return (
    <>
      <Box>
        <Typography fontWeight={600} fontSize={18} mb={2}>
          {singleOrder.party?.partyName || "Party Name"}
        </Typography>
        <StepperProgress
          activeStep={3}
          orderStatus={singleOrder?.status}
          designerStatus={singleOrder?.designerStatus}
          printerStatus={singleOrder?.printerStatus}
        />
        <Paper
          variant="outlined"
          sx={{
            borderColor: "#12B76A",
            borderWidth: 2,
            borderRadius: 2,
            mt: 2,
            p: 2,
            background: "#fff",
          }}
        >
          <Typography fontWeight={600} fontSize={16} mb={2}>
            Binder
          </Typography>
          {isHeld && (
            <Box mb={3} sx={{ p: 2, bgcolor: "#FFF0F0", borderRadius: 2, border: "1px solid #F04438" }}>
              <Typography fontWeight={500} fontSize={14} mb={1} color="#F04438">
                🚫 Order On Hold
              </Typography>
              <Typography fontSize={13} color="#666">
                This order is currently on hold. You cannot update the binder task until it is unheld.
              </Typography>
            </Box>
          )}
          {isBinderStatusDone && (
            <Box mb={3} sx={{ p: 2, bgcolor: "#E8F5E8", borderRadius: 2, border: "1px solid #4CAF50" }}>
              <Typography fontWeight={500} fontSize={14} mb={1} color="#4CAF50">
                ✅ Binder Work Completed
              </Typography>
              <Typography fontSize={13} color="#666">
                This binder task has been marked as done.
              </Typography>
            </Box>
          )}
          <Box display="flex" gap={2} mb={2} width={"100%"} justifyContent={"space-between"}>
            <ThemeInput
              labelName="Company Name"
              value={singleOrder.companyName?.companyName || "N/A"}
              sx={{ flex: 1 }}
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Party Name"
              value={singleOrder.party?.partyName || "N/A"}
              sx={{ flex: 1 }}
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Order Number"
              value={singleOrder.orderNumber || "N/A"}
              sx={{ flex: 1 }}
              InputProps={{ readOnly: true }}
            />
            <RoleStaffSelect
              label="Assign to Binder"
              name="binderStaff"
              value={selectedBinderStaff}
              onChange={handleBinderStaffChange}
              onStaffChange={handleBinderStaffChange}
              roleFilter="Binder"
              showStaff={true}
              disabled={areFieldsReadOnly || isBinderAssigned}
            />
          </Box>
          <Box display="flex" gap={2} mb={2} justifyContent={"space-between"}>
            <ThemeInput
              labelName="Item Name"
              value={singleOrder.productItem?.itemName || "N/A"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Issued Date"
              type="date"
              name="issuedDate"
              value={formik.values.issuedDate}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
              error={formik.touched.issuedDate && Boolean(formik.errors.issuedDate)}
              helperText={formik.touched.issuedDate && (formik.errors.issuedDate as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.issuedDate }}
            />
            <ThemeInput
              labelName="Received Date"
              type="date"
              name="receivedDate"
              value={formik.values.receivedDate}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
              error={formik.touched.receivedDate && Boolean(formik.errors.receivedDate)}
              helperText={formik.touched.receivedDate && (formik.errors.receivedDate as string)}
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Item Size"
              name="size"
              value={formik.values.size}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.size && Boolean(formik.errors.size)}
              helperText={formik.touched.size && (formik.errors.size as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Item Qty"
              name="qty"
              value={formik.values.qty}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.qty && Boolean(formik.errors.qty)}
              helperText={formik.touched.qty && (formik.errors.qty as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.qty }}
            />

          </Box>
          <Box display="flex" gap={2} mb={2} justifyContent={"space-between"}>
            <ThemeInput
              labelName="Pages / item"
              name="pagesPerBook"
              value={formik.values.pagesPerBook}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.pagesPerBook && Boolean(formik.errors.pagesPerBook)}
              helperText={formik.touched.pagesPerBook && (formik.errors.pagesPerBook as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Binding"
              name="binding"
              value={formik.values.binding}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.binding && Boolean(formik.errors.binding)}
              helperText={formik.touched.binding && (formik.errors.binding as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Used Paper"
              name="usedPaper"
              value={formik.values.usedPaper}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.usedPaper && Boolean(formik.errors.usedPaper)}
              helperText={formik.touched.usedPaper && (formik.errors.usedPaper as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.usedPaper }}
            />
            <ThemeInput
              labelName="Rate / book"
              name="rateBook"
              value={formik.values.rateBook}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.rateBook && Boolean(formik.errors.rateBook)}
              helperText={formik.touched.rateBook && (formik.errors.rateBook as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.rateBook }}
            />
            <ThemeInput
              labelName="Total Amount"
              name="totalAmount"
              value={formik.values.totalAmount}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.totalAmount && Boolean(formik.errors.totalAmount)}
              helperText={formik.touched.totalAmount && (formik.errors.totalAmount as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.totalAmount }}
            />
          </Box>
          <Box display="flex" gap={2} mb={2} justifyContent={"space-between"}>
            <ThemeInput
              labelName="GSM"
              name="gsm"
              value={formik.values.gsm}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.gsm && Boolean(formik.errors.gsm)}
              helperText={formik.touched.gsm && (formik.errors.gsm as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.gsm }}
            />
            <ThemeInput
              labelName="Raw Paper Size"
              name="rowPaperSize"
              value={formik.values.rowPaperSize}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.rowPaperSize && Boolean(formik.errors.rowPaperSize)}
              helperText={formik.touched.rowPaperSize && (formik.errors.rowPaperSize as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.rowPaperSize }}
            />
            <ThemeInput
              labelName="Raw Paper No of Sheet Used"
              name="rowPaperUser"
              value={formik.values.rowPaperUser}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.rowPaperUser && Boolean(formik.errors.rowPaperUser)}
              helperText={formik.touched.rowPaperUser && (formik.errors.rowPaperUser as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.rowPaperUser }}
            />
            {(isBinderStatusDone || isBinderStatusInProgress) && (
              <ThemeInput
                labelName="Binder Wasted Sheet"
                value={singleOrder?.binderWastedSheet?.toString() || "0"}
                type="number"
                sx={{ flex: 1 }}
                InputProps={{ readOnly: true }}
              />
            )}
          </Box>

          {/* Binder Papers Section */}
          <Box mb={3}>
            <Typography fontWeight={600} mb={2}>
              Binder Papers
            </Typography>
            {binderPapers.map((paper, index) => (
              <Box key={`binder-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography fontWeight={600}>
                    {paper.paperName}
                  </Typography>
                  {!areFieldsReadOnly && (
                    <IconButton
                      onClick={() => handleDeleteBinderPaper(index)}
                      disabled={binderPapers.length === 1}
                      sx={{
                        color: '#F04438',
                        '&:hover': { backgroundColor: '#FEE2E2' },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <Stack direction="row" spacing={2} mt={1}>
                  <ThemeSelect
                    label="Paper Type"
                    options={materialNameOptions}
                    value={materialNameOptions.find(opt => opt.value === paper.paperType) || null}
                    onChange={(e, newValue) =>
                      handleMaterialNameChange(index, newValue?.value as string || "")
                    }
                    required
                    // disabled={areFieldsReadOnly}
                  />

                  <ThemeSelect
                    label="GSM"
                    options={getMaterialGSMOptions(paper.paperType)}
                    value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null}
                    onChange={(e, newValue) =>
                      handleMaterialGSMChange(index, newValue?.value as string || "")
                    }
                    required
                    // disabled={!paper.paperType || areFieldsReadOnly}
                  />

                  <ThemeSelect
                    label="Size"
                    options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                    value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.sheetSize) || null}
                    onChange={(e, newValue) =>
                      handleMaterialSizeChange(index, newValue?.value as string || "")
                    }
                    required
                    // disabled={!paper.paperType || !paper.gsm || areFieldsReadOnly}
                  />

                  <ThemeInput
                    labelName="Number of Sheets Used"
                    value={paper.numberOfSheetsUsed}
                    onChange={(e) => handleBinderPaperChange(index, 'numberOfSheetsUsed', e.target.value)}
                    fullWidth
                    required
                    error={!paper.numberOfSheetsUsed && formik.submitCount > 0}
                    helperText={!paper.numberOfSheetsUsed && formik.submitCount > 0 ? "This field is required" : ""}
                    InputProps={{ readOnly: areFieldsReadOnly }}
                  />
                  <ThemeInput
                    labelName="Rate / Unit"
                    value={paper.ratePerUnit}
                    onChange={(e) => handleBinderPaperChange(index, 'ratePerUnit', e.target.value)}
                    fullWidth
                    required
                    error={!paper.ratePerUnit && formik.submitCount > 0}
                    helperText={!paper.ratePerUnit && formik.submitCount > 0 ? "This field is required" : ""}
                    InputProps={{ readOnly: areFieldsReadOnly }}
                  />
                </Stack>
              </Box>
            ))}
            {!areFieldsReadOnly && (
              <Box display="flex" justifyContent="flex-end">
                <ThemeButton
                  onClick={handleAddBinderPaper}
                  disabled={areFieldsReadOnly}
                  startIcon={<AddIcon />}
                  sx={{
                    backgroundColor: "#6366F1",
                    borderRadius: "8px",
                    color: "#fff",
                    "&:hover": { backgroundColor: "#4F46E5" },
                  }}
                >
                  Add Binder Paper
                </ThemeButton>
              </Box>
            )}
          </Box>

          <Box mb={2}>
            <ThemeInput
              labelName="Remarks"
              placeholder="Enter Remarks"
              fullWidth
              multiline
              rows={3}
              name="remarks"
              value={formik.values.remarks}
              onChange={formik.handleChange}
              error={formik.touched.remarks && Boolean(formik.errors.remarks)}
              helperText={formik.touched.remarks && (formik.errors.remarks as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.binderRemarks }}
            />
          </Box>
          <Box mb={2}>
            <FileUpload
              ref={fileUploadRef}
              folder="binder-files"
              multiple={true}
              accept="*/*"
              variant="dropzone"
              onFilesSelected={handleBinderFilesSelected}
              onFileRemoved={handleBinderFileRemoved}
              onUploadError={handleUploadError}
              showPreview={true}
              showUploadButton={false}
              autoUpload={false}
              label="Drop binder files here or click to browse"
              helperText="Upload any relevant files related to the binding process (e.g., proofs, samples)"
              disabled={areFieldsReadOnly}
            />
          </Box>
          <Box mb={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setOpenDesignFilesDialog(true)}
              sx={{
                color: "#344054",
                borderColor: "#D0D5DD",
                fontWeight: 600,
                fontSize: 16,
                py: 1.2,
                background: "#fff",
                "&:hover": { background: "#f6fef9" },
              }}
              startIcon={
                <svg width="20" height="20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="#98A2B3" strokeWidth="2" />
                  <circle cx="10" cy="10" r="3" fill="#98A2B3" />
                </svg>
              }
            >
              View Designer Files ({singleOrder?.approvedFiles?.length || 0})
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexDirection: "row" }}>
            {!isBinderStatusDone && (
              <ThemeButton
                sx={{
                  background: areFieldsReadOnly || !selectedBinderStaff ? "#ccc" : "#12B76A",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 2,
                  py: 1.2,
                  width: "100%",
                  "&:hover": {
                    background: areFieldsReadOnly || !selectedBinderStaff ? "#ccc" : "#079455",
                  },
                }}
                onClick={() => formik.handleSubmit()}
                disabled={areFieldsReadOnly || loading || !selectedBinderStaff}
              >
                {loading || formik.isSubmitting ? "Assigning..." : "Assign to Binder →"}
              </ThemeButton>
            )}
            <ThemeButton
              sx={{
                background: isHeld ? "#6366F1" : "#F04438",
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 2,
                py: 1.2,
                width: "100%",
                "&:hover": { background: isHeld ? "#4F46E5" : "#D92D20" },
              }}
              onClick={handleHoldToggle}
              disabled={loading}
            >
              {loading ? "Processing..." : isHeld ? "Unhold" : "Hold"}
            </ThemeButton>
          </Box>

          {isBinderStatusDone && singleOrder?.binderFiles && singleOrder.binderFiles.length > 0 && (
            <Box mt={3}>
              <Typography fontWeight={600} mb={1}>
                Binder Uploaded Files
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleViewUploadedBinderFiles}
                sx={{
                  color: "#344054",
                  borderColor: "#D0D5DD",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: 16,
                  py: 1.2,
                  background: "#fff",
                  "&:hover": { background: "#f6fef9" },
                }}
                startIcon={<AiOutlineEye />}
              >
                View All Binder Uploaded Files ({singleOrder.binderFiles.length})
              </Button>
            </Box>
          )}

          {isBinderStatusDone && (
            <Box mt={4}>
              <Stack direction='row' mb={2} gap={2}>
                <Typography fontWeight={600} color="#12B76A">
                  ✅ Binder Work Done
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Download />}
                  onClick={handleDownload}
                >
                  Download PDF
                </Button>
              </Stack>
              <Stack direction="row" spacing={2}>
                <ThemeButton
                  sx={{
                    background: isHeld ? "#ccc" : "#6366F1",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    py: 1.2,
                    width: "100%",
                    "&:hover": { background: isHeld ? "#ccc" : "#4F46E5" },
                  }}
                  onClick={handleAssignToBookletFolder}
                  disabled={isHeld || loading}
                >
                  Assign to Booklet & Folder Binder
                </ThemeButton>
                <ThemeButton
                  sx={{
                    background: isHeld ? "#ccc" : "#12B76A",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    py: 1.2,
                    width: "100%",
                    "&:hover": { background: isHeld ? "#ccc" : "#079455" },
                  }}
                  onClick={handleProceedToDelivery}
                  disabled={isHeld || loading}
                >
                  Proceed to Delivery
                </ThemeButton>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
      <ViewFilesDialog
        open={openBinderFilesDialog}
        onClose={() => setOpenBinderFilesDialog(false)}
        files={uploadedBinderFiles.map((file: any) => file.path) || []}
        title="Binder Files"
        showDownload={true}
        showView={true}
      />
      <ViewFilesDialog
        open={openDesignFilesDialog}
        onClose={() => setOpenDesignFilesDialog(false)}
        files={singleOrder?.approvedFiles?.map((file: any) => file) || []}
        title="Designer Files"
        showDownload={true}
        showView={true}
      />
    </>
  )
}

export default BinderForm