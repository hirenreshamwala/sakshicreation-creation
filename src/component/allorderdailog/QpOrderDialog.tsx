"use client";
import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Box, Stack, CircularProgress, Autocomplete, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
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

const AddQPOrderDialog: React.FC<AddOrderDialogProps> = ({ company, open, onClose, refreshData, editData, party }) => {
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
        uom: "",
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
        isPasting: true, // true or false - DEFAULT: true (Pasting selected by default)
    });

    useEffect(() => {
        if (open && editData) {
            setQpFormData({
                companyName: editData.companyName || company,
                date: editData.date || "",
                orderFrom: editData.orderFrom || "",
                ply: editData.orderdata?.ply || "",
                uom: editData.orderdata?.uom || "",
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
                isPinning: editData.isPinning || false,
                isPasting: editData.isPasting !== undefined ? editData.isPasting : true, // Default to true for new forms
            });
        } else if (open && !editData) {
            // Set default values for new form
            setQpFormData(prev => ({
                ...prev,
                uv: false, // Default UV to "No"
                isPasting: true, // Default process to "Pasting"
                isPinning: false,
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

            // Handle conditional logic
            if (field === "varnish" && value === true) {
                // If varnish is true, disable lamination and uv
                newState.lamination = false;
                newState.laminationType = "";
                newState.uv = false;
                newState.uvType = "";
            } else if (field === "lamination" && value === false) {
                // If lamination is false, clear lamination type and disable uv
                newState.laminationType = "";
                newState.uv = false;
                newState.uvType = "";
            } else if (field === "laminationType") {
                // If lamination type changes, handle uv visibility
                if (value === "glossy") {
                    // If lamination type is "glossy", disable uv and set to "no"
                    newState.uv = false;
                    newState.uvType = "";
                } else if (value === "mate") {
                    // If lamination type is "mate", uv can be enabled (keep current uv value)
                    // Don't change uv value, let user choose
                } else {
                    // If lamination type is cleared, disable uv
                    newState.uv = false;
                    newState.uvType = "";
                }
            } else if (field === "uv" && value === false) {
                // If uv is false, clear uv type
                newState.uvType = "";
            } else if (field === "isPinning" && value === true) {
                // If pinning is selected, unselect pasting
                newState.isPasting = false;
            } else if (field === "isPasting" && value === true) {
                // If pasting is selected, unselect pinning
                newState.isPinning = false;
            }

            return newState;
        });
    };

    const handleQpSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { paper1Kg, paper2Kg, paper3Kg, totalKgss } = calculatePaperKg(
                parseFloat(qpFormData.length),
                parseFloat(qpFormData.width),
                parseFloat(qpFormData.height),
                parseFloat(qpFormData.deckal),
                parseInt(qpFormData.ply),
                parseFloat(qpFormData.paper3GSM),
                parseFloat(qpFormData.paper2GSM),
                parseFloat(qpFormData.paper1GSM),
                parseFloat(qpFormData.noOfPieces)
            );

            const orderData = {
                isQp: true,
                companyName: qpFormData?.companyName?._id ? qpFormData?.companyName?._id : qpFormData.companyName,
                date: qpFormData.date || undefined,
                orderFrom: qpFormData.orderFrom || undefined,
                gsm: qpFormData.gsm || undefined,
                deckalCalculation: qpFormData.deckalCalculation || undefined,
                noOfPieces: qpFormData.noOfPieces ? Number(qpFormData.noOfPieces) : undefined,
                ratePerPiece: qpFormData.ratePerPiece ? Number(qpFormData.ratePerPiece) : undefined,
                amount: qpFormData.amount ? Number(qpFormData.amount) : undefined,
                kgPerUnit: qpFormData.kgPerUnit ? Number(qpFormData.kgPerUnit) : undefined,
                totalKg: qpFormData.totalKg ? Number(qpFormData.totalKg) : undefined,
                kantan: qpFormData.kantan || undefined,
                kantanPerUnit: qpFormData.kantanPerUnit ? Number(qpFormData.kantanPerUnit) : undefined,
                totalKantan: {
                    reel: qpFormData.totalKantan.reel || "0",
                    inch: qpFormData.totalKantan.inch || "0",
                },
                kantanDeckal: qpFormData.kantanDeckal || undefined,
                salesRemark: qpFormData.salesRemark || undefined,
                // New fields - using boolean values for API
                lamination: qpFormData.lamination,
                laminationType: qpFormData.laminationType || undefined,
                uv: qpFormData.uv,
                uvType: qpFormData.uvType || undefined,
                varnish: qpFormData.varnish,
                isPinning: qpFormData.isPinning,
                isPasting: qpFormData.isPasting,
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

            if (editData?._id) {
                await dispatch(updateQPOrderThunk({ id: editData?._id, data: orderData })).unwrap();
                toast.success("Order updated successfully");
            } else {
                await dispatch(createQpOrderThunk(orderData)).unwrap();
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
            uom: "",
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
            isPasting: true, // Default to "Pasting"
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
        const standardUomOptions = [
            { value: "inch", label: "Inch" },
            { value: "cm", label: "Centimeter" },
            { value: "mm", label: "Millimeter" },
        ];

        const uniqueUoms = [...new Set(filteredPackagingOptions.map((item: any) => item.uom))].sort();
        const packagingUomOptions = uniqueUoms.map((uom) => ({
            value: uom,
            label: `${uom}`,
        }));

        const allOptions = [...standardUomOptions];
        packagingUomOptions.forEach(option => {
            if (!standardUomOptions.some(std => std.value.toLowerCase() === option.value.toLowerCase())) {
                allOptions.push(option);
            }
        });

        return allOptions;
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
                            handleQpChange("uom", val?.value || "");
                            setAllData("uom", val?.value || "");
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

                {/* Process Field - Pinning and Pasting as separate boolean fields */}
                <Stack direction="row" spacing={2} mb={2}>
                    <FormControl fullWidth>
                        <InputLabel>Process</InputLabel>
                        <Select
                            value={qpFormData.isPinning ? "pinning" : qpFormData.isPasting ? "pasting" : ""}
                            label="Process"
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "pinning") {
                                    handleQpChange("isPinning", true);
                                    handleQpChange("isPasting", false);
                                } else if (value === "pasting") {
                                    handleQpChange("isPinning", false);
                                    handleQpChange("isPasting", true);
                                } else {
                                    handleQpChange("isPinning", false);
                                    handleQpChange("isPasting", false);
                                }
                            }}
                        >
                            {/* <MenuItem value="">Select Process</MenuItem> */}
                            <MenuItem value="pinning">Pinning</MenuItem>
                            <MenuItem value="pasting">Pasting</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                {/* New Options Section */}
                <Stack direction="row" spacing={2} mb={2}>
                    {/* Lamination */}
                    <FormControl fullWidth>
                        <InputLabel>Lamination</InputLabel>
                        <Select
                            value={qpFormData.lamination ? "yes" : "no"}
                            label="Lamination"
                            onChange={(e) => handleQpChange("lamination", e.target.value === "yes")}
                            disabled={qpFormData.varnish}
                        >
                            <MenuItem value="no">No</MenuItem>
                            <MenuItem value="yes">Yes</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Lamination Type (only show if lamination is true) */}
                    {qpFormData.lamination && (
                        <FormControl fullWidth>
                            <InputLabel>Lamination Type</InputLabel>
                            <Select
                                value={qpFormData.laminationType}
                                label="Lamination Type"
                                onChange={(e) => handleQpChange("laminationType", e.target.value)}
                            >
                                <MenuItem value="glossy">Glossy</MenuItem>
                                <MenuItem value="mate">Mate</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    {/* UV - Always show, but disable when lamination type is "glossy" */}
                    <FormControl fullWidth>
                        <InputLabel>UV</InputLabel>
                        <Select
                            value={qpFormData.uv ? "yes" : "no"}
                            label="UV"
                            onChange={(e) => handleQpChange("uv", e.target.value === "yes")}
                            disabled={qpFormData.varnish || qpFormData.laminationType === "glossy"}
                        >
                            <MenuItem value="no">No</MenuItem>
                            <MenuItem value="yes">Yes</MenuItem>
                        </Select>
                    </FormControl>

                    {/* UV Type (only show if UV is true) */}
                    {qpFormData.uv && (
                        <FormControl fullWidth>
                            <InputLabel>UV Type</InputLabel>
                            <Select
                                value={qpFormData.uvType}
                                label="UV Type"
                                onChange={(e) => handleQpChange("uvType", e.target.value)}
                            >
                                <MenuItem value="uv">UV</MenuItem>
                                <MenuItem value="uv_mate">UV + Mate Lamination</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                </Stack>

                {/* Varnish */}
                <Stack direction="row" spacing={2} mb={2}>
                    <FormControl fullWidth>
                        <InputLabel>Varnish</InputLabel>
                        <Select
                            value={qpFormData.varnish ? "yes" : "no"}
                            label="Varnish"
                            onChange={(e) => handleQpChange("varnish", e.target.value === "yes")}
                        >
                            <MenuItem value="no">No</MenuItem>
                            <MenuItem value="yes">Yes</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <Stack direction="row" spacing={2} mb={2}>
                    {/* <ThemeInput
                        labelName="Deckal Calculation"
                        placeholder="Deckal Calculation"
                        fullWidth
                        value={qpFormData.deckalCalculation}
                        disabled
                    /> */}
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
                    <ThemeInput
                        labelName="Kantan Deckal"
                        placeholder="Kantan Deckal"
                        fullWidth
                        value={qpFormData.kantanDeckal}
                        onChange={(e) => handleQpChange("kantanDeckal", e.target.value)}
                    />
                </Stack>
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
        const { length, width, height, ply, deckal, noOfPieces, ratePerPiece, paper1GSM, paper2GSM, paper3GSM } = qpFormData;

        let deckalValue: number | null = null;
        if (width && height) {
            deckalValue = calculateDeckal(Number(width), Number(height));
            handleQpChange("deckalCalculation", deckalValue.toFixed(2));
        } else {
            handleQpChange("deckalCalculation", "");
        }

        let gsmValue: number | null = null;
        if (ply && paper1GSM && paper2GSM && paper3GSM) {
            gsmValue = calculateGSM(Number(ply), Number(paper3GSM), Number(paper2GSM), Number(paper1GSM));
            handleQpChange("gsm", gsmValue.toFixed(2));
        } else {
            handleQpChange("gsm", "");
        }

        if (length && width && deckalValue && gsmValue) {
            const kgPerPiece = calculateKgPerPiece(Number(length), Number(width), Number(deckal), Number(gsmValue));
            handleQpChange("kgPerUnit", kgPerPiece.toFixed(4));
        } else {
            handleQpChange("kgPerUnit", "");
        }

        if (Number(noOfPieces) && qpFormData.kgPerUnit) {
            const totalKg = calculateTotalKg(Number(noOfPieces), Number(qpFormData.kgPerUnit));
            handleQpChange("totalKg", totalKg.toFixed(2));
        } else {
            handleQpChange("totalKg", "");
        }

        if (Number(noOfPieces) && Number(ratePerPiece)) {
            const amount = calculateTotalAmount(Number(noOfPieces), Number(ratePerPiece));
            handleQpChange("amount", amount.toFixed(2));
        } else {
            handleQpChange("amount", "");
        }

        if (length && width && Number(noOfPieces)) {
            const { kantanPerUnit, reel, inch } = calculateKantan(Number(length), Number(width), Number(noOfPieces));
            handleQpChange("kantanPerUnit", kantanPerUnit.toString());
            handleQpChange("totalKantan", { reel: reel.toString(), inch: inch.toString() });
        } else {
            handleQpChange("kantanPerUnit", "");
            handleQpChange("totalKantan", { reel: "", inch: "" });
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
        packagingOptions,
    ]);

    return (
        <CustomDialog open={open} onClose={handleClose} maxWidth="md" title={editData?._id ? "Update Order" : "Place New Order"}>
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
                        onPartyChange={() => { }}
                        disableCompanySelect={true}
                        showPartyName={false}
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