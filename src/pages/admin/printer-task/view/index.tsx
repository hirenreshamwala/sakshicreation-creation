"use client"
import { useEffect, useState } from "react"
import { Box, Button, Typography, Paper, CircularProgress, Stack } from "@mui/material"
import { AiOutlineEye } from "react-icons/ai"
import AddIcon from '@mui/icons-material/Add';
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { getAllBinderTypesThunk } from "@/store/slices/binderTypeSlice"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import ThemeSelect from "@/component/common_component/themeselect";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import { authService } from "@/services/auth.service";

type PaperField = {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
  wastage: string;
};

type OptionType = {
  label: string;
  value: string | number;
};

const PrinterTaskView = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { id: orderId } = router.query
  const { singleOrder } = useAppSelector((state) => state.orders)
  const { binderTypes } = useAppSelector((state) => state.binderType);
  const { materials } = useAppSelector(state => state.materials);
  const [pageLoading, setPageLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [printerRemarks, setPrinterRemarks] = useState("")
  const [printerWastedSheet, setPrinterWastedSheet] = useState("")
  const [printerPapers, setPrinterPapers] = useState<PaperField[]>([])
  const [binding, setBinding] = useState(false);
  const [bindingType, setBindingType] = useState("");

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
    dispatch(getAllMaterialsThunk());
    if (!binderTypes.length) dispatch(getAllBinderTypesThunk());
  }, [dispatch, binderTypes.length]);

  useEffect(() => {
    if (singleOrder) {
      setPrinterRemarks(singleOrder.printerRemarks || "")
      setPrinterWastedSheet(singleOrder.printerWastedSheet?.toString() || "")
      const bindingValue = !!singleOrder.binding && singleOrder.binding !== "false";
      setBinding(bindingValue);
      setBindingType(singleOrder.bindingType?._id || "");

      if (singleOrder.printerPapers && singleOrder.printerPapers.length > 0) {
        setPrinterPapers(singleOrder.printerPapers.map((paper: any) => ({
          ...paper,
          wastage: paper.wastage?.toString() || "0"
        })))
      } else {
        setPrinterPapers([{
          paperName: "Paper-1",
          numberOfSheetsUsed: "",
          sheetSize: "",
          paperType: "",
          gsm: "",
          wastage: "0"
        }])
      }
    }
  }, [singleOrder])

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };

  useEffect(() => {
    const totalWastage = printerPapers.reduce((sum, paper) => {
      return sum + (parseFloat(paper.wastage) || 0)
    }, 0)

    setPrinterWastedSheet(totalWastage.toString())
  }, [printerPapers])

  const handleViewDesignFiles = () => setOpenDesignFilesDialog(true)
  const handleCloseDesignFilesDialog = () => setOpenDesignFilesDialog(false)

  const handleUpdateStatus = async (orderId: string, statusType: string, status: string) => {
    try {
      setSubmitLoading(true)
      const token = authService.getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType,
          status,
        }),
      })
      if (response.ok) {
        await dispatch(getOrderByIdThunk(orderId)).unwrap()
        toast.success(`Status updated to ${status}`)
      } else {
        console.error("Failed to update status")
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Error updating status")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleAddPrinterPaper = () => {
    const paperCount = printerPapers.length
    setPrinterPapers([...printerPapers, {
      paperName: `Paper-${paperCount + 1}`,
      numberOfSheetsUsed: "",
      sheetSize: "",
      paperType: "",
      gsm: "",
      wastage: "0"
    }])
  }

  const handlePrinterPaperChange = (index: number, field: keyof PaperField, value: string) => {
    const updatedPapers = [...printerPapers]
    updatedPapers[index] = {
      ...updatedPapers[index],
      [field]: value
    }
    setPrinterPapers(updatedPapers)
  }

  const handleSubmit = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }

    for (const paper of printerPapers) {
      if (!paper.numberOfSheetsUsed || !paper.sheetSize || !paper.paperType || !paper.gsm) {
        toast.error("All paper fields must be filled")
        return
      }
    }

    setSubmitLoading(true)
    try {
      const updateData: any = {
        printerStatus: "Done",
        printerRemarks,
        printerWastedSheet: parseFloat(printerWastedSheet) || 0,
        printerPapers,
        binding,
        bindingType: binding ? bindingType : null,
      }

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Printer task updated successfully!")
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error updating printer task:", error)
      toast.error(error?.message || "Failed to update printer task")
    } finally {
      setSubmitLoading(false)
    }
  }

  const materialNameOptions = Array.from(
    new Set(materials.map(material => material.materialName))
  ).map(name => {
    const materialObj = materials.find(m => m.materialName === name)!;
    return {
      value: materialObj._id,
      label: name
    };
  });


  const getMaterialGSMOptions = (materialName: string) => {
    const findName = materials?.find(material => material?._id === materialName);

    // const filteredMaterials = materials?.filter(material => material?.materialName === findName?.materialName);
    return materials?.map(gsm => {
      return {
        value: gsm?._id,
        label: `${gsm?.materialGSM} GSM`
      };
    });
  };

  const getMaterialSizeOptions = (materialName: string, materialGSM: string) => {
    const findName = materials?.find(material => material?._id === materialName);

    // const filteredMaterials = materials?.filter(
    //   material =>
    //     material?.materialGSM === findName?.materialGSM
    // );

    return materials?.map(size => {
      return {
        value: size?._id,
        label: size?.materialSize
      };
    });
  };

  const handleMaterialNameChange = (index: number, value: string) => {
    const updatedFields = [...printerPapers];
    updatedFields[index] = {
      ...updatedFields[index],
      materialName: value,
      paperType: value,
      gsm: "",
      materialSize: "",
    };
    setPrinterPapers(updatedFields);
  };

  const handleMaterialGSMChange = (index: number, value: string) => {
    const updatedFields = [...printerPapers];
    updatedFields[index] = {
      ...updatedFields[index],
      gsm: value,
      materialSize: "",
    };
    setPrinterPapers(updatedFields);
  };

  const handleMaterialSizeChange = (index: number, value: string) => {
    const updatedFields = [...printerPapers];
    updatedFields[index] = {
      ...updatedFields[index],
      materialSize: value,
      sheetSize: value
    };
    setPrinterPapers(updatedFields);
  };

  if (pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!singleOrder) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>No order data found</Typography>
      </Box>
    )
  }

  const isHeld = singleOrder?.status === "Hold"
  const isPrinterWorkDone = singleOrder.printerStatus === "Done"
  const canEditPrinterTask = !isHeld && !isPrinterWorkDone

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600} color="#1976D2">
            Order Details
          </Typography>
          {singleOrder.printerStatus === "Pending" && (
            <ThemeButton
              sx={{
                background: "#1976D2",
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 2,
                py: 1.2,
                "&:hover": { background: "#1565C0" },
                width: "auto",
              }}
              onClick={() => handleUpdateStatus(singleOrder._id, "printer", "In Progress")}
            >
              Start Task
            </ThemeButton>
          )}
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <Box flex={1} minWidth={240}>
            <ThemeInput
              labelName="Order No"
              value={singleOrder.orderNumber || "N/A"}
              InputProps={{ readOnly: true }}
            />
          </Box>
          <ThemeInput
            labelName="Job Name"
            value={singleOrder.jobName || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
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
            labelName="Item Name"
            value={singleOrder.productItem?.itemName || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Quantity"
            value={singleOrder.qty?.toString() || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <Box flex={1} minWidth={240}>
          <ThemeInput
            labelName="Size"
            value={singleOrder.size || "N/A"}
            InputProps={{ readOnly: true }}
          />
          </Box>
          <Box flex={1} minWidth={240}>
            <ThemeInput
              labelName="Printing Type"
              value={singleOrder?.pType || "N/A"}
              InputProps={{ readOnly: true }}
            />
          </Box>
          <Box flex={1} minWidth={240}>
            <ThemeInput
              labelName="Binding Type"
              value={singleOrder?.bindingType?.name || "N/A"}
              InputProps={{ readOnly: true }}
            />
          </Box>
          <Box flex={1} minWidth={240}>
            <ThemeInput
              labelName="Binding Page"
              value={singleOrder?.bindingPage || "N/A"}
              InputProps={{ readOnly: true }}
            />
          </Box>
          <Box flex={1} minWidth={240}>
            <ThemeInput
              labelName="Booklet Folder Type"
              value={singleOrder?.bookletFolderType || "N/A"}
              InputProps={{ readOnly: true }}
            />
          </Box>
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="color"
            value={`color - ${singleOrder.color}` || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="color1"
            value={singleOrder.color1 || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="color2"
            value={singleOrder.color2 || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Printing Rate"
            value={singleOrder.printingrate || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        <Box mb={3}>
          <ThemeInput
            labelName="Printer Remarks"
            placeholder="Enter your remarks about the printing work..."
            value={printerRemarks}
            onChange={(e) => setPrinterRemarks(e.target.value)}
            multiline
            rows={3}
            sx={{ width: "100%" }}
            InputProps={{ readOnly: true }}
          />
        </Box>
      </Paper>

      {singleOrder.approvedFiles && singleOrder.approvedFiles.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#4CAF50">
            Design Files ({singleOrder.approvedFiles.length})
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleViewDesignFiles}
            sx={{
              color: "#4CAF50",
              borderColor: "#4CAF50",
              fontWeight: 600,
              textTransform: "none",
              fontSize: 16,
              py: 1.2,
              background: "#fff",
              "&:hover": { background: "#f0f9f0", borderColor: "#4CAF50" },
            }}
            startIcon={<AiOutlineEye />}
          >
            View All Design Files ({singleOrder.approvedFiles.length})
          </Button>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2} color="#FF9800">
          Printer Work
        </Typography>

        {isHeld && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#FFF0F0", borderRadius: 2, border: "1px solid #F04438" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#F04438">
              🚫 Order On Hold
            </Typography>
            <Typography fontSize={13} color="#666">
              This order is currently on hold. You cannot update the printer task until it is unheld.
            </Typography>
          </Box>
        )}

        {isPrinterWorkDone && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#E8F5E8", borderRadius: 2, border: "1px solid #4CAF50" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#4CAF50">
              ✅ Printer Work Completed
            </Typography>
            <Typography fontSize={13} color="#666">
              This printer task has been marked as done.
            </Typography>
          </Box>
        )}

        <Box mb={3}>
          <Typography fontWeight={600} mb={2}>
            Printer Papers
          </Typography>

          {printerPapers.map((paper, index) => (
            <Box key={`printer-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
              <Typography fontWeight={600}>{paper.paperName}</Typography>
              <Stack direction="row" spacing={2} mt={1}>
                <ThemeSelect
                  label="Paper Type"
                  options={materialNameOptions}
                  value={materialNameOptions.find(opt => opt.value === paper.paperType) || null}
                  onChange={(e, newValue) => handleMaterialNameChange(index, newValue?.value as string || "")}
                  required
                  disabled
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeSelect
                  label="GSM"
                  options={getMaterialGSMOptions(paper.paperType)}
                  value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null}
                  onChange={(e, newValue) => handleMaterialGSMChange(index, newValue?.value as string || "")}
                  required
                  disabled
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeSelect
                  label="Size"
                  options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                  value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.materialSize) || null}
                  onChange={(e, newValue) => handleMaterialSizeChange(index, newValue?.value as string || "")}
                  required
                  disabled
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeInput
                  labelName="Number of Sheets Used"
                  value={paper.numberOfSheetsUsed}
                  onChange={(e) => handlePrinterPaperChange(index, 'numberOfSheetsUsed', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeInput
                  labelName="Wastage"
                  value={paper.wastage}
                  onChange={(e) => handlePrinterPaperChange(index, 'wastage', e.target.value)}
                  type="number"
                  fullWidth
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
              </Stack>
            </Box>
          ))}
        </Box>

        <Box mb={3}>
          <ThemeInput
            labelName="Total Printer Wasted Sheet"
            value={printerWastedSheet}
            sx={{ width: "100%" }}
            InputProps={{ readOnly: true }}
          />
        </Box>

        {singleOrder.printerStatus === "In Progress" && (
          <ThemeButton
            sx={{
              background: "#12B76A",
              color: "#fff",
              fontWeight: 600,
              fontSize: 18,
              borderRadius: 2,
              py: 1.2,
              mt: 1,
              "&:hover": { background: "#079455" },
              width: "100%",
            }}
            onClick={handleSubmit}
            disabled={submitLoading || !canEditPrinterTask}
          >
            {submitLoading ? "Updating..." : "Mark As Done"}
          </ThemeButton>
        )}
      </Paper>

      <ViewFilesDialog
        open={openDesignFilesDialog}
        onClose={handleCloseDesignFilesDialog}
        files={singleOrder?.approvedFiles?.map((file: any) => file) || []}
        title="Design Files"
        showDownload={true}
        showView={true}
      />
    </Box>
  )
}

export default PrinterTaskView
