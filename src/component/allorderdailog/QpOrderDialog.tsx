"use client";
import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Box, Stack, CircularProgress, Autocomplete, TextField, FormControlLabel, Checkbox } from "@mui/material";
import CustomDialog from "@/component/customdialog";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import CompanySelect from "../reusablecomponents/CompanyWithPartyName";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAccountMasterByCompanyAndPartyThunk } from "@/store/slices/accountMasterSlice";
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice";
import { clearOrderError, clearOrderSuccessMessage } from "@/store/slices/orderSlice";
import { toast } from "react-toastify";
import { createQpOrderThunk, updateQPOrderThunk } from "@/store/slices/qpOrderSlice";
import { getAllPackagingOptionsThunk } from "@/store/slices/packagingOptionSlice";
import { getAllKantansThunk } from "@/store/slices/kantanSlice";
import { calculateDeckal, calculateGSM, calculateKgPerPiece, calculateTotalKg, calculateTotalAmount, calculateKantan, calculatePaperKg } from "@/utills/qpCalculations";
import { createSaleQpOrderThunk, updateSaleQpOrderThunk } from "@/store/slices/saleQpOrderSlice";

interface OptionType {
    label: string;
    value: string;
    id?: string;
}

interface AddOrderDialogProps {
    company: string;
    open: boolean;
    onClose: () => void;
    refreshData?: () => void;
    editData?: any;
}

const AddQPOrderDialog: React.FC<AddOrderDialogProps> = ({ company, open, onClose, refreshData, editData, party, orderNo, type = "job" }) => {
    const dispatch = useAppDispatch();
    const { packagingOptions } = useAppSelector((state) => state.packagingOptions);
    const { kantans } = useAppSelector((state) => state.kantans);
    const { loading: accountLoading } = useAppSelector((state) => state.accountMasters);
    const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [qpFormData, setQpFormData] = useState({
        companyName: company,
        date: "",
        orderFrom: "",
        ply: "",
        uom: "inch",
        length: "",
        width: "",
        height: "",
        deckal: "",
        paper1GSM: "",
        paper2GSM: "",
        paper3GSM: "",
        gsm: "",
        deckalCalculation: "",
        noOfPieces: "",
        ratePerPiece: "",
        amount: "",
        kgPerUnit: "",
        totalKg: "",
        kantan: null as string | null,
        kantanPerUnit: "",
        totalKantan: {
            reel: "",
            inch: "",
        },
        kantanDeckal: "",
        salesRemark: "",
        // New fields - using boolean for API
        lamination: false, // true or false
        laminationType: "", // "glossy" or "mate"
        uv: false, // true or false - DEFAULT: false (No)
        uvType: "", // "uv" or "uv_mate"
        varnish: false, // true or false
        isPinning: false, // true or false - DEFAULT: false
        isPasting: false, // true or false - DEFAULT: true (Pasting selected by default)
        isKantan: false, // true or false - DEFAULT: false
    });

    useEffect(() => {
        if (open && editData) {
            setQpFormData({
                companyName: editData.companyName || company,
                date: editData.date || "",
                orderFrom: editData.orderFrom || "",
                ply: editData.orderdata?.ply || "",
                uom: editData.orderdata?.uom || "inch",
                length: editData.orderdata?.length || "",
                width: editData.orderdata?.width || "",
                height: editData.orderdata?.height || "",
                deckal: editData.orderdata?.deckal || "",
                paper1GSM: editData.orderdata?.paper1GSM || "",
                paper2GSM: editData.orderdata?.paper2GSM || "",
                paper3GSM: editData.orderdata?.paper3GSM || "",
                gsm: editData.gsm || "",
                deckalCalculation: editData.deckalCalculation || "",
                noOfPieces: editData.noOfPieces?.toString() || "",
                ratePerPiece: editData.ratePerPiece?.toString() || "",
                amount: editData.amount?.toString() || "",
                kgPerUnit: editData.kgPerUnit?.toString() || "",
                totalKg: editData.totalKg || "",
                kantan: editData.kantan?._id || null,
                kantanPerUnit: editData.kantanPerUnit?.toString() || "",
                totalKantan: {
                    reel: editData.totalKantan?.reel?.toString() || "",
                    inch: editData.totalKantan?.inch?.toString() || "",
                },
                kantanDeckal: editData.kantanDeckal || "",
                salesRemark: editData.salesRemark || "",
                // New fields with edit data - converting to boolean
                lamination: editData.lamination || false,
                laminationType: editData.laminationType || "",
                uv: editData.uv || false, // Default to false if no edit data
                uvType: editData.uvType || "",
                varnish: editData.varnish || false,
                isPinning: editData.isPinning,
                isPasting: editData.isPasting,
                // Set isKantan based on whether kantan data exists
                isKantan: !!(editData.kantan || editData.kantanPerUnit || editData.totalKantan),
            });
        } else if (open && !editData) {
            // Set default values for new form
            setQpFormData(prev => ({
                ...prev,
                uv: false,
                isPasting: false,
                isPinning: false,
                isKantan: false, // Default to false for new orders
                uom: "inch",
            }));
        }
    }, [open, editData, company]);

    // Clear messages when dialog opens
    useEffect(() => {
        if (open) {
            dispatch(clearOrderError());
            dispatch(clearOrderSuccessMessage());
        }
    }, [open, dispatch]);

    // Handle success message
    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            dispatch(clearOrderSuccessMessage());
        }
    }, [successMessage, dispatch]);

    // Handle error message
    useEffect(() => {
        if (orderError) {
            toast.error(orderError);
            dispatch(clearOrderError());
        }
    }, [orderError, dispatch]);

    // Fetch data when dialog opens
    useEffect(() => {
        if (open) {
            dispatch(getAllProductItemsThunk());
            if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
            if (!kantans.length) dispatch(getAllKantansThunk());
        }
    }, [open, dispatch, packagingOptions.length, kantans.length]);

    const handleQpChange = (field: string, value: any) => {
        setQpFormData((prev) => {
            const newState = { ...prev, [field]: value };

            return newState;
        });
    };

    const handleQpSubmit = async () => {

        setIsSubmitting(true);
        try {
            const packagingOption = {
                party: qpFormData.partyName, // Include party ID in packagingOption
                ply: qpFormData.ply,
                uom: qpFormData.uom,
                length: qpFormData.length,
                width: qpFormData.width,
                height: qpFormData.height,
                deckal: qpFormData.deckal,
                paper1GSM: qpFormData.paper1GSM,
                paper2GSM: qpFormData.paper2GSM,
                paper3GSM: qpFormData.paper3GSM,
            };
            // Convert mm to inch helper
            const mmToInch = (value) => value / 25.4;

            // Before calling calculatePaperKg
            let length = parseFloat(qpFormData.length);
            let width = parseFloat(qpFormData.width);
            let height = parseFloat(qpFormData.height);
            let deckal = parseFloat(qpFormData.deckal);

            // Check UOM and convert if needed
            if (qpFormData.uom === "mm" || qpFormData.uom === "millimeter") {
                length = mmToInch(length);
                width = mmToInch(width);
                height = mmToInch(height);
                deckal = mmToInch(deckal);
            }

            // Now pass converted values to calculatePaperKg
            const { paper1Kg, paper2Kg, paper3Kg, totalKgss } = calculatePaperKg(
                length,
                width,
                height,
                deckal,
                parseInt(qpFormData.ply),
                // qpFormData.uom,
                parseFloat(qpFormData.paper3GSM),
                parseFloat(qpFormData.paper2GSM),
                parseFloat(qpFormData.paper1GSM),
                parseFloat(qpFormData.noOfPieces)
            );

            // Prepare order data with conditional Kantan fields
            const orderData: any = {
                isQp: true,
                companyName: qpFormData?.companyName?._id ? qpFormData?.companyName?._id : qpFormData.companyName,
                party: qpFormData.partyName,
                packagingOption,
                date: qpFormData.date || undefined,
                orderFrom: qpFormData.orderFrom || undefined,
                gsm: qpFormData.gsm || undefined,
                deckalCalculation: qpFormData.deckalCalculation || undefined,
                noOfPieces: qpFormData.noOfPieces ? Number(qpFormData.noOfPieces) : undefined,
                ratePerPiece: qpFormData.ratePerPiece ? Number(qpFormData.ratePerPiece) : undefined,
                amount: qpFormData.amount ? Number(qpFormData.amount) : undefined,
                kgPerUnit: qpFormData.kgPerUnit ? Number(qpFormData.kgPerUnit) : undefined,
                totalKg: qpFormData.totalKg ? Number(qpFormData.totalKg) : undefined,
                salesRemark: qpFormData.salesRemark || undefined,
                isKantan:qpFormData.isKantan,
                paperKG: {
                    paper1: {
                        deckal: qpFormData.deckal,
                        gsm: qpFormData.paper1GSM,
                        totalKg: paper3Kg?.toFixed(2).toString(),
                    },
                    paper2: {
                        deckal: qpFormData.deckal,
                        gsm: qpFormData.paper2GSM,
                        totalKg: paper2Kg?.toFixed(2).toString(),
                    },
                    paper3: {
                        deckal: qpFormData.deckal,
                        gsm: qpFormData.paper3GSM,
                        totalKg: paper1Kg?.toFixed(2).toString(),
                    },
                },
            };

            if (qpFormData.isKantan) {
                orderData.kantan =qpFormData?.kantan?._id || qpFormData.kantan || undefined;
                orderData.kantanPerUnit = qpFormData.kantanPerUnit ? Number(qpFormData.kantanPerUnit) : undefined;
                orderData.totalKantan = {
                    reel: qpFormData.totalKantan.reel || "0",
                    inch: qpFormData.totalKantan.inch || "0",
                };
                orderData.kantanDeckal = qpFormData.kantanDeckal || undefined;
            }

            if (editData?._id) {
                // Update existing order
                await dispatch(type === 'sell' ? updateSaleQpOrderThunk({ id: editData._id, data: orderData }) : updateQPOrderThunk({ id: editData._id, data: orderData })).unwrap();
                toast.success("Order updated successfully");
            } else {
                // Create new order
                await dispatch(type === 'sell' ? createSaleQpOrderThunk(orderData) : createQpOrderThunk(orderData)).unwrap();
                toast.success("Order created successfully");
            }

            if (refreshData) refreshData();
            resetForm();
            onClose();
        } catch (error: any) {
            console.error("QP Order error:", error);
            toast.error(error?.message || `Failed to ${editData?._id ? "update" : "create"} QP order`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setQpFormData({
            companyName: "",
            date: "",
            orderFrom: "",
            ply: "",
            uom: "inch",
            length: "",
            width: "",
            height: "",
            deckal: "",
            paper1GSM: "",
            paper2GSM: "",
            paper3GSM: "",
            gsm: "",
            deckalCalculation: "",
            noOfPieces: "",
            ratePerPiece: "",
            amount: "",
            kgPerUnit: "",
            totalKg: "",
            kantan: null,
            kantanPerUnit: "",
            totalKantan: {
                reel: "",
                inch: "",
            },
            kantanDeckal: "",
            salesRemark: "",
            // Reset new fields to default values
            lamination: false,
            laminationType: "",
            uv: false, // Default to "No"
            uvType: "",
            varnish: false,
            isPinning: false,
            isPasting: false,
            isKantan: false,
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const getSelectedOption = (value: string, options: OptionType[]) => {
        return options.find((option) => option.value === value) || null;
    };

    const filteredPackagingOptions = useMemo(() => {
        return qpFormData.partyName
            ? packagingOptions.filter((option: any) => option.party?._id === qpFormData.partyName)
            : packagingOptions;
    }, [qpFormData.partyName, packagingOptions]);

    const getUniquePlyOptions = () => {
        const uniquePlies = [...new Set(filteredPackagingOptions.map((item: any) => item.ply))].sort();
        return uniquePlies.map((ply) => ({
            value: ply,
            label: `${ply}`,
        }));
    };

    const getUniqueUomOptions = () => {
        // Only return inch and millimeter options
        return [
            { value: "inch", label: "Inch" },
            { value: "mm", label: "Millimeter" },
        ];
    };

    const getUniqueLengthOptions = () => {
        const uniqueLengths = [...new Set(filteredPackagingOptions.map((item: any) => item.length))].sort();
        return uniqueLengths.map((length) => ({
            value: length,
            label: length,
        }));
    };

    const getUniqueWidthOptions = () => {
        const uniqueWidths = [...new Set(filteredPackagingOptions.map((item: any) => item.width))].sort();
        return uniqueWidths.map((width) => ({
            value: width,
            label: width,
        }));
    };

    const getUniqueHeightOptions = () => {
        const uniqueHeights = [...new Set(filteredPackagingOptions.map((item: any) => item.height))].sort();
        return uniqueHeights.map((height) => ({
            value: height,
            label: height,
        }));
    };

    const getUniqueDeckalOptions = () => {
        const uniqueDeckals = [...new Set(filteredPackagingOptions.map((item: any) => item.deckal))].sort();
        return uniqueDeckals.map((deckal) => ({
            value: deckal,
            label: deckal,
        }));
    };

    const getUniquePaper1GSMOptions = () => {
        const uniquePaper1GSMs = [...new Set(filteredPackagingOptions.map((item: any) => item.paper1GSM))].sort();
        return uniquePaper1GSMs.map((gsm) => ({
            value: gsm,
            label: gsm,
        }));
    };

    const getUniquePaper2GSMOptions = () => {
        const uniquePaper2GSMs = [...new Set(filteredPackagingOptions.map((item: any) => item.paper2GSM))].sort();
        return uniquePaper2GSMs.map((gsm) => ({
            value: gsm,
            label: gsm,
        }));
    };

    const getUniquePaper3GSMOptions = () => {
        const uniquePaper3GSMs = [...new Set(filteredPackagingOptions.map((item: any) => item.paper3GSM))].sort();
        return uniquePaper3GSMs.map((gsm) => ({
            value: gsm,
            label: gsm,
        }));
    };

    const setAllData = (label: string, value: string) => {
        const fields = [
            "ply",
            "uom",
            "length",
            "width",
            "height",
            "deckal",
            "paper1GSM",
            "paper2GSM",
            "paper3GSM",
        ];

        const matchedOption = filteredPackagingOptions.find(
            (opt) => String((opt as any)[label]).trim().toLowerCase() === String(value).trim().toLowerCase()
        );

        if (matchedOption) {
            setQpFormData((prev) => {
                const updated = { ...prev };
                fields.forEach((field) => {
                    (updated as any)[field] = (matchedOption as any)[field];
                });
                return updated;
            });
        } else {
            setQpFormData((prev) => ({
                ...prev,
                [label]: value,
            } as any));
        }
    };

    const handlePartyChange = async (event: any, newValue: any) => {
        const partyId = typeof newValue === "object" && newValue !== null
            ? newValue.value
            : newValue;

        handleQpChange("partyName", partyId);

        if (company && partyId) {
            try {
                await dispatch(
                    getAccountMasterByCompanyAndPartyThunk({
                        companyId: company,
                        partyId: partyId,
                    })
                ).unwrap();
                const partyOptions = packagingOptions.filter((opt: any) => opt.party?._id === partyId);

                if (partyOptions.length > 0) {
                    // Sort by createdAt in descending order to get the latest option first
                    const sortedOptions = partyOptions.sort((a: any, b: any) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    const latestOption = sortedOptions[0];

                    setQpFormData((prev) => ({
                        ...prev,
                        ply: latestOption.ply || "",
                        uom: latestOption.uom || "",
                        length: latestOption.length || "",
                        width: latestOption.width || "",
                        height: latestOption.height || "",
                        deckal: latestOption.deckal || "",
                        paper1GSM: latestOption.paper1GSM || "",
                        paper2GSM: latestOption.paper2GSM || "",
                        paper3GSM: latestOption.paper3GSM || "",
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch account master data:", error);
                toast.error("Failed to load party details");
            }
        }
    };

    const renderQpForm = () => {
        return (
            <>
                <Stack direction="row" spacing={2} mb={2}>
                    <Autocomplete
                        options={getUniquePlyOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.ply, getUniquePlyOptions())}
                        onChange={(_, val) => { handleQpChange("ply", val?.value || ""); setAllData("ply", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Ply"
                                onChange={(e) => {
                                    handleQpChange("ply", e.target.value)
                                }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Autocomplete
                        options={getUniqueUomOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.uom, getUniqueUomOptions())}
                        onChange={(_, val) => {
                            handleQpChange("uom", val?.value || "inch");
                            // Don't call setAllData for UOM as it's a standalone field
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Unit of Measurement"
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Autocomplete
                        options={getUniqueLengthOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.length, getUniqueLengthOptions())}
                        onChange={(_, val) => { handleQpChange("length", val?.value || ""); setAllData("length", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Length"
                                onChange={(e) => { handleQpChange("length", e.target.value) }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Autocomplete
                        options={getUniqueWidthOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.width, getUniqueWidthOptions())}
                        onChange={(_, val) => { handleQpChange("width", val?.value || ""); setAllData("width", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Width"
                                onChange={(e) => { handleQpChange("width", e.target.value) }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Autocomplete
                        options={getUniqueHeightOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.height, getUniqueHeightOptions())}
                        onChange={(_, val) => { handleQpChange("height", val?.value || ""); setAllData("height", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Height"
                                onChange={(e) => { handleQpChange("height", e.target.value) }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                </Stack>
                <Stack direction="row" spacing={2} mb={2}>
                    <Autocomplete
                        options={getUniqueDeckalOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.deckal, getUniqueDeckalOptions())}
                        onChange={(_, val) => { handleQpChange("deckal", val?.value || ""); setAllData("deckal", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Deckal"
                                onChange={(e) => { handleQpChange("deckal", e.target.value) }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Autocomplete
                        options={getUniquePaper1GSMOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.paper1GSM, getUniquePaper1GSMOptions())}
                        onChange={(_, val) => { handleQpChange("paper1GSM", val?.value || ""); setAllData("paper1GSM", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Paper 1 GSM"
                                onChange={(e) => { handleQpChange("paper1GSM", e.target.value) }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Autocomplete
                        options={getUniquePaper2GSMOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.paper2GSM, getUniquePaper2GSMOptions())}
                        onChange={(_, val) => { handleQpChange("paper2GSM", val?.value || ""); setAllData("paper2GSM", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Paper 2 GSM"
                                onChange={(e) => { handleQpChange("paper2GSM", e.target.value) }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                    <Autocomplete
                        options={getUniquePaper3GSMOptions()}
                        getOptionLabel={(option) => option.label}
                        value={getSelectedOption(qpFormData.paper3GSM, getUniquePaper3GSMOptions())}
                        onChange={(_, val) => { handleQpChange("paper3GSM", val?.value || ""); setAllData("paper3GSM", val?.value || "") }}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Paper 3 GSM"
                                onChange={(e) => { handleQpChange("paper3GSM", e.target.value) }}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />
                </Stack>

                <Stack direction="row" spacing={2} mb={2}>
                    <ThemeInput
                        labelName="No of Pieces"
                        placeholder="No of Pieces"
                        fullWidth
                        value={qpFormData.noOfPieces}
                        onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                            handleQpChange("noOfPieces", numericValue);
                        }}
                    />
                    <ThemeInput
                        labelName="Rate Per Piece"
                        placeholder="Rate Per Piece"
                        fullWidth
                        value={qpFormData.ratePerPiece}
                        onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                            handleQpChange("ratePerPiece", numericValue);
                        }}
                    />
                    <ThemeInput
                        labelName="Amount"
                        placeholder="Amount"
                        fullWidth
                        value={qpFormData.amount}
                        disabled
                    />
                </Stack>
                <Stack direction="row" spacing={2} mb={2}>
                    <ThemeInput
                        labelName="GSM"
                        placeholder="GSM"
                        fullWidth
                        value={qpFormData.gsm}
                        disabled
                    />
                    <ThemeInput
                        labelName="KG Per Unit"
                        placeholder="KG Per Unit"
                        fullWidth
                        value={qpFormData.kgPerUnit}
                        disabled
                    />
                    <ThemeInput
                        labelName="Total KG"
                        placeholder="Total KG"
                        fullWidth
                        value={qpFormData.totalKg}
                        disabled
                    />
                </Stack>

                {/* Kantan Toggle Checkbox */}
                <Box mb={2}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={qpFormData.isKantan}
                                onChange={(e) => handleQpChange("isKantan", e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Include Kantan"
                    />
                </Box>

                {/* Kantan Fields - Conditionally Rendered */}
                {qpFormData.isKantan && (
                    <Stack direction="row" spacing={2} mb={2}>
                        <Autocomplete
                            options={kantans.map((item: any) => ({ value: item?._id, label: item.kantanName }))}
                            getOptionLabel={(option) => option.label}
                            value={kantans
                                .map((item: any) => ({ value: item?._id, label: item.kantanName }))
                                .find((item) => item.value === qpFormData.kantan) || null}
                            onChange={(_, val) => handleQpChange("kantan", val?.value || null)}
                            renderInput={(params) => <TextField {...params} label="Kantan" sx={{ width: 200, mt: 2 }} />}
                            sx={{ flex: 1 }}
                        />
                        <ThemeInput
                            labelName="Kantan Per Unit"
                            placeholder="Kantan Per Unit"
                            fullWidth
                            value={qpFormData.kantanPerUnit}
                            disabled
                        />
                        <ThemeInput
                            labelName="Total Kantan"
                            placeholder="Total Kantan"
                            fullWidth
                            value={
                                qpFormData.totalKantan.reel && qpFormData.totalKantan.inch
                                    ? `${qpFormData.totalKantan.reel} reel ${qpFormData.totalKantan.inch} inch`
                                    : ""
                            }
                            disabled
                        />
                        {/* <ThemeInput
                            labelName="Kantan Deckal"
                            placeholder="Kantan Deckal"
                            fullWidth
                            value={qpFormData.kantanDeckal}
                            onChange={(e) => handleQpChange("kantanDeckal", e.target.value)}
                        /> */}
                    </Stack>
                )}

                <ThemeInput
                    labelName="Sales Remarks"
                    placeholder="Sales Remarks"
                    fullWidth
                    value={qpFormData.salesRemark}
                    onChange={(e) => handleQpChange("salesRemark", e.target.value)}
                    sx={{ mb: 2 }}
                    multiline
                    rows={3}
                />
            </>
        );
    };

    useEffect(() => {
        const { length, width, height, ply, deckal, noOfPieces, ratePerPiece, paper1GSM, paper2GSM, paper3GSM, uom } = qpFormData;

        // Convert dimensions to inches if uom is 'mm'
        let lengthInInches = Number(length) || 0;
        let widthInInches = Number(width) || 0;
        let heightInInches = Number(height) || 0;
        let deckalInInches = Number(deckal) || 0;

        if (uom === 'mm') {
            lengthInInches = lengthInInches / 25.4;
            widthInInches = widthInInches / 25.4;
            heightInInches = heightInInches / 25.4;
            deckalInInches = deckalInInches / 25.4;
        }

        let deckalValue: number | null = null;
        if (widthInInches && heightInInches) {
            deckalValue = calculateDeckal(widthInInches, heightInInches);
            handleQpChange("deckalCalculation", deckalValue.toFixed(2));
        } else handleQpChange("deckalCalculation", "");

        let gsmValue: number | null = null;
        if (ply && paper1GSM && paper2GSM && paper3GSM) {
            gsmValue = calculateGSM(Number(ply), Number(paper3GSM), Number(paper2GSM), Number(paper1GSM));
            handleQpChange("gsm", gsmValue.toFixed(2));
        } else handleQpChange("gsm", "");

        if (lengthInInches && widthInInches && deckalValue && gsmValue) {
            const kgPerPiece = calculateKgPerPiece(lengthInInches, widthInInches, deckalInInches, gsmValue);
            handleQpChange("kgPerUnit", kgPerPiece.toFixed(4));
        } else handleQpChange("kgPerUnit", "");

        if (Number(noOfPieces) && qpFormData.kgPerUnit) {
            const totalKg = calculateTotalKg(Number(noOfPieces), Number(qpFormData.kgPerUnit));
            handleQpChange("totalKg", totalKg.toFixed(2));
        } else handleQpChange("totalKg", "");

        if (Number(noOfPieces) && Number(ratePerPiece)) {
            const amount = calculateTotalAmount(Number(noOfPieces), Number(ratePerPiece));
            handleQpChange("amount", amount.toFixed(2));
        } else handleQpChange("amount", "");

        if (qpFormData.isKantan && lengthInInches && widthInInches && Number(noOfPieces)) {
            const { kantanPerUnit, reel, inch } = calculateKantan(lengthInInches, widthInInches, Number(noOfPieces));
            handleQpChange("kantanPerUnit", kantanPerUnit.toString());
            handleQpChange("totalKantan", { reel: reel.toString(), inch: inch.toString() });
        } else if (!qpFormData.isKantan) {
            handleQpChange("kantanPerUnit", "");
            handleQpChange("totalKantan", { reel: "", inch: "" });
            handleQpChange("kantan", null);
        }
    }, [
        qpFormData.length,
        qpFormData.width,
        qpFormData.height,
        qpFormData.ply,
        qpFormData.paper1GSM,
        qpFormData.paper2GSM,
        qpFormData.paper3GSM,
        qpFormData.noOfPieces,
        qpFormData.ratePerPiece,
        qpFormData.totalKg,
        qpFormData.uom,
        qpFormData.isKantan,
        packagingOptions,
        qpFormData
    ]);

    return (
        <CustomDialog open={open} onClose={handleClose} maxWidth="md" title={editData?._id ? `Update Order QP-${editData?.orderNo || ""}` : `Place New Order QP-${orderNo + 1 || ""}`}>
            <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
                <Box mb={2}>
                    <CompanySelect
                        name="companyName"
                        value={company}
                        onChange={() => { }}
                        hasParties={true}
                        required
                        showPartyName={true}
                        partyName={qpFormData.partyName}
                        onPartyChange={handlePartyChange}
                        disableCompanySelect={true}
                    />
                </Box>
                {renderQpForm()}
                <ThemeButton
                    onClick={handleQpSubmit}
                    disabled={isSubmitting || accountLoading || orderLoading}
                    sx={{
                        background: "#12B76A",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 2,
                        py: 1.2,
                        width: "100%",
                        mt: 1,
                        "&:hover": { background: "#079455" },
                        "&:disabled": {
                            background: "#ccc",
                            color: "#666",
                        },
                    }}
                >
                    {isSubmitting || orderLoading ? (
                        <Box display="flex" alignItems="center" gap={1}>
                            <CircularProgress size={20} color="inherit" />
                            {editData?._id ? "Updating Order..." : "Creating Order..."}
                        </Box>
                    ) : accountLoading ? (
                        <Box display="flex" alignItems="center" gap={1}>
                            <CircularProgress size={20} color="inherit" />
                            Loading Party Details...
                        </Box>
                    ) : (
                        editData?._id ? "Update Order" : "Place New Order"
                    )}
                </ThemeButton>
            </Box>
        </CustomDialog>
    );
};

export default AddQPOrderDialog;