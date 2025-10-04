import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { getAllInventoryThunk, updateInventoryItemThunk } from "@/store/slices/inventorySlice";
import {
    Box,
    MenuItem,
    Stack,
    TextField,
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    Button,
    Typography,
    Divider,
    Card,
    CardContent,
    Grid,
    Autocomplete,
    Chip,
} from "@mui/material";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from "@mui/lab";
import { calculateKantan, calculatePaperKg } from "@/utills/qpCalculations";
import { ORDER_STATUSES } from "@/constants";

type Remark = {
    type: string;
    text: string;
    date: string;
    previousValue?: string;
    assignedPrinterId?: string;
    assignedBinderId?: string;
};

interface ExpandedRowFormProps {
    row: any;
    setEditData: React.Dispatch<React.SetStateAction<any | null>>;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface PaperSelection {
    paper1?: string;
    paper2?: string;
    paper3?: string;
}

interface InventoryPaper {
    _id: string;
    paperName: string;
    deckal: string;
    gsm: number;
    paperMillName: string;
    kg: number;
    usedKg: number;
    inventoryType: string;
    type: string;
    qpOrder: string | null;
}

interface PaperOption {
    value: string;
    label: string;
    kg: number;
    usedKg: number;
    availableKg: number;
    isSufficient: boolean;
    isSelectedForOtherType: boolean;
}

export const ExpandedRowForm = ({ row, setEditData, setOpen }: ExpandedRowFormProps) => {
    const dispatch = useAppDispatch();
    const { allInventory, error } = useAppSelector(state => state.inventory);
    const { staffList, loading: staffLoading, error: staffError } = useAppSelector((state) => state.staff);
    const [isInitialUnitSet, setIsInitialUnitSet] = useState(false);
    const [isCompleted, setIsCompleted] = useState(row.status === "Completed");
    const [remarkModalOpen, setRemarkModalOpen] = useState(false);
    const [remarkType, setRemarkType] = useState<"startDate" | "onHold" | "canceled" | null>(null);
    const [tempStartDate, setTempStartDate] = useState("");
    const [remarkText, setRemarkText] = useState("");
    const [viewRemarksOpen, setViewRemarksOpen] = useState(false);
    const [isActualNoOfPiecesUpdated, setIsActualNoOfPiecesUpdated] = useState(!!row.actualNoOfPieces);
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");
    const [selectedBinder, setSelectedBinder] = useState<string>("");
    const [showPrinterDropdown, setShowPrinterDropdown] = useState(row.status === "Printer" && !row.printer);
    const [showBinderDropdown, setShowBinderDropdown] = useState(row.status === "Lamination" && !row.binder);
    const [availablePapers, setAvailablePapers] = useState<InventoryPaper[]>([]);
    const [paperSelections, setPaperSelections] = useState<PaperSelection>({
        paper1: null,
        paper2: null,
        paper3: null
    });
    const [paperRequirements, setPaperRequirements] = useState({
        paper1: 0,
        paper2: 0,
        paper3: 0
    });
    const [isPaperSelectionRequired, setIsPaperSelectionRequired] = useState(false);

    const [formData, setFormData] = useState({
        _id: row._id,
        unitNo: row.unitNo || "",
        startDate: row.startDate || "",
        deliveryDate: row.deliveryDate || "",
        dyeNumber: row.dyeNumber || "",
        dyeSize: row.dyeSize || "",
        glue: row.glue || "",
        wire: row.wire || "",
        actualNoOfPieces: row.actualNoOfPieces || row.operatorNoOfPieces || "",
        dyeRemark: row.dyeRemark || "",
        godownRemark: row.godownRemark || "",
        factoryRemark: row.factoryRemark || "",
        status: row.status || "Pending",
        remarks: (row.remarks as Remark[]) || [],
        printer: row.printer?._id || null,
        binder: row.binder?._id || null,
        selectedPapers: row.selectedPapers || {
            paper1: "",
            paper2: "",
            paper3: ""
        }
    });
    const [initialFormData, setInitialFormData] = useState(formData);

    useEffect(() => {
        if (!staffList.length) dispatch(getAllStaffThunk());
        if (!allInventory.length) dispatch(getAllInventoryThunk());
    }, []);

    useEffect(() => {
        const newFormData = {
            _id: row._id,
            unitNo: row.unitNo || "",
            startDate: row.startDate || "",
            deliveryDate: row.deliveryDate || "",
            dyeNumber: row.dyeNumber || "",
            dyeSize: row.dyeSize || "",
            glue: row.glue || "",
            wire: row.wire || "",
            actualNoOfPieces: row.actualNoOfPieces || row.operatorNoOfPieces || "",
            dyeRemark: row.dyeRemark || "",
            godownRemark: row.godownRemark || "",
            factoryRemark: row.factoryRemark || "",
            status: row.status || "Pending",
            remarks: (row.remarks as Remark[]) || [],
            printer: row.printer?._id || null,
            binder: row.binder?._id || null,
            selectedPapers: row.selectedPapers || {
                paper1: "",
                paper2: "",
                paper3: ""
            }
        };
        setFormData(newFormData);
        setInitialFormData(newFormData);
        setIsInitialUnitSet(!!row.unitNo);
        setIsCompleted(row.status === "Completed");
        setIsActualNoOfPiecesUpdated(!!row.actualNoOfPieces);
        setShowPrinterDropdown(row.status === "Printer" && !row.printer);
        setShowBinderDropdown(row.status === "Lamination" && !row.binder);
        setSelectedPrinter(row.printer?._id || "");
        setSelectedBinder(row.binder?._id || "");
        setPaperSelections(row.selectedPapers || {
            paper1: null,
            paper2: null,
            paper3: null
        });

        // Calculate paper requirements
        if (row.actualPaperKG) {
            setPaperRequirements({
                paper1: parseFloat(row.actualPaperKG.paper1?.totalKg || 0),
                paper2: parseFloat(row.actualPaperKG.paper2?.totalKg || 0),
                paper3: parseFloat(row.actualPaperKG.paper3?.totalKg || 0)
            });
        }
    }, [row]);

    // Filter available papers from inventory
    useEffect(() => {
        if (allInventory.length > 0 && row.orderdata) {
            const papers = allInventory.filter((item: InventoryPaper) =>
                item.inventoryType === 'paper' &&
                item.type === 'inward' &&
                [undefined, null].includes(item.qpOrder)
            );
            setAvailablePapers(papers);
        }
    }, [allInventory, row.orderdata]);

    // Check if paper selection is required when status changes to "In Progress"
    useEffect(() => {
        if (formData.status === "In Progress" && row.status === "Pending") {
            const hasPaperRequirements = paperRequirements.paper1 > 0 || paperRequirements.paper2 > 0 || paperRequirements.paper3 > 0;
            setIsPaperSelectionRequired(hasPaperRequirements);

            if (hasPaperRequirements) {
                toast.info("Please select papers from inventory before proceeding");
            }
        }
    }, [formData.status, row.status, paperRequirements]);

    // Filter staff with role "printer" or "binder" (case-insensitive)
    const printers = staffList.filter(
        (staff) => staff.role?.roleName?.toLowerCase() === "printer"
    );
    const binders = staffList.filter(
        (staff) => staff.role?.roleName?.toLowerCase() === "binder"
    );

    // Calculate available quantity for a paper considering current selections
    const calculateAvailableKg = (paperId: string, currentPaperType: keyof PaperSelection) => {
        const paper = availablePapers.find(p => p._id === paperId);
        if (!paper) return 0;

        let totalAllocated = paper.usedKg || 0;

        // Add requirements from other paper types that are already selected
        Object.entries(paperSelections).forEach(([paperType, selectedPaperId]) => {
            if (paperType !== currentPaperType && selectedPaperId === paperId) {
                totalAllocated += paperRequirements[paperType as keyof PaperSelection];
            }
        });

        return Math.max(0, paper.kg - totalAllocated);
    };

    const handlePaperSelection = (paperType: keyof PaperSelection, value: string) => {
        setPaperSelections(prev => ({
            ...prev,
            [paperType]: value
        }));
    };

    const getAllAvailablePapersForRequirement = (
        gsm: string,
        deckal: string,
        requiredKg: number,
        paperType: keyof PaperSelection
    ): PaperOption[] => {
        const matchingPapers = availablePapers.filter(
            (item: InventoryPaper) =>
                item.deckal === deckal && Number(item.gsm) === Number(gsm)
        );

        return matchingPapers.map((item) => {
            // Calculate total allocated KG for this paper
            const allocatedKg = item.allocations?.reduce(
                (sum, alloc) => sum + (alloc.allocatedKg || 0),
                0
            );

            // Available KG = total KG - allocated KG
            const availableKg = (item.kg || 0) - allocatedKg;

            const isSufficient = availableKg >= requiredKg;

            const isSelectedForOtherType = Object.entries(paperSelections).some(
                ([key, value]) => key !== paperType && value === item._id
            );

            return {
                value: item._id,
                label: `${availableKg.toFixed(2)} KG (available of ${item.kg} KG) ${!isSufficient ? " ⚠️ Insufficient" : ""
                    }`,
                kg: item.kg,
                usedKg: allocatedKg,
                availableKg,
                isSufficient,
                isSelectedForOtherType,
            };
        });
    };


    // Check if specific paper selection is valid
    const isPaperSelectionValid = (paperType: keyof PaperSelection) => {
        const paperId = paperSelections[paperType];
        const requirement = paperRequirements[paperType];

        if (!paperId || requirement === 0) return true;

        const availableKg = calculateAvailableKg(paperId, paperType);
        return availableKg >= requirement;
    };

    // Check if all paper selections are valid
    const arePaperSelectionsValid = () => {
        if (!isPaperSelectionRequired) return true;

        const checks = [];

        if (paperRequirements.paper1 > 0) {
            checks.push(isPaperSelectionValid('paper1'));
        }

        if (paperRequirements.paper2 > 0) {
            checks.push(isPaperSelectionValid('paper2'));
        }

        if (paperRequirements.paper3 > 0) {
            checks.push(isPaperSelectionValid('paper3'));
        }

        return checks.every(check => check === true);
    };

    const handleFormChange = (field: string, value: string) => {
        if (field === "startDate") {
            if (formData.startDate) {
                setTempStartDate(value);
                setRemarkType("startDate");
                setRemarkModalOpen(true);
                return;
            } else {
                setFormData((prev) => ({ ...prev, startDate: value }));
                return;
            }
        }

        if (field === "status") {
            if (value === "Completed") {
                if (!formData.actualNoOfPieces || parseInt(formData.actualNoOfPieces) === 0) {
                    toast.error("You need to fill the actual number of pieces before marking as completed");
                    return;
                }
                const currentDate = new Date().toISOString().split("T")[0];
                setFormData((prev) => ({ ...prev, status: value, deliveryDate: currentDate }));
                setShowPrinterDropdown(false);
                setShowBinderDropdown(false);
                return;
            }

            if (value === "In Progress" && row.status === "Pending") {
                // Check if paper selection is required and valid
                const hasPaperRequirements = paperRequirements.paper1 > 0 || paperRequirements.paper2 > 0 || paperRequirements.paper3 > 0;

                if (hasPaperRequirements && !arePaperSelectionsValid()) {
                    toast.error("Please select valid papers from inventory before changing status to In Progress");
                    return;
                }
            }

            if (value === "On Hold") {
                setRemarkType("onHold");
                setRemarkModalOpen(true);
                setShowPrinterDropdown(false);
                setShowBinderDropdown(false);
                return;
            }
            if (value === "Canceled") {
                setRemarkType("canceled");
                setRemarkModalOpen(true);
                setShowPrinterDropdown(false);
                setShowBinderDropdown(false);
                return;
            }
            if (value === "Printer" && !row.printer) {
                setShowPrinterDropdown(true);
                setShowBinderDropdown(false);
            } else if (value === "Lamination" && !row.binder) {
                setShowPrinterDropdown(false);
                setShowBinderDropdown(true);
            } else {
                setShowPrinterDropdown(false);
                setShowBinderDropdown(false);
                setSelectedPrinter(formData.printer || "");
                setSelectedBinder(formData.binder || "");
            }
        }

        if (field === "unitNo" && value && !isInitialUnitSet && !formData.startDate) {
            const currentDate = new Date().toISOString().split("T")[0];
            setFormData((prev) => ({ ...prev, unitNo: value, startDate: currentDate }));
            setIsInitialUnitSet(true);

            // Auto-change status to In Progress if paper selection is not required
            if (formData.status === "Pending" && !isPaperSelectionRequired) {
                setFormData((prev) => ({ ...prev, status: "In Progress" }));
            }
            return;
        }

        if (field === "actualNoOfPieces") setIsActualNoOfPiecesUpdated(true);

        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAssignPrinter = async () => {
        if (!selectedPrinter) {
            toast.error("Please select a printer before assigning");
            return;
        }

        const selectedPrinterData = printers.find((printer) => printer.id === selectedPrinter);
        if (!selectedPrinterData) {
            toast.error("Invalid printer selected");
            return;
        }

        const now = new Date().toISOString();
        const remarkText = `Assigned to printer: ${selectedPrinterData.name} (ID: ${selectedPrinter})`;

        try {
            const updateData = {
                ...formData,
                printer: selectedPrinter,
                remarks: [
                    ...formData.remarks,
                    {
                        type: "Printer Assigned",
                        text: remarkText,
                        date: now,
                        assignedPrinterId: selectedPrinter,
                    },
                ],
            };

            await dispatch(updateQPOrderThunk({ id: formData._id, data: updateData })).unwrap();
            setFormData((prev) => ({
                ...prev,
                printer: selectedPrinter,
                remarks: [
                    ...prev.remarks,
                    {
                        type: "Printer Assigned",
                        text: remarkText,
                        date: now,
                        assignedPrinterId: selectedPrinter,
                    },
                ],
            }));
            setShowPrinterDropdown(false);
            toast.success("Printer assigned successfully");
        } catch (err: any) {
            console.error("ExpandedRowForm: Assign printer failed:", err);
            toast.error(err?.message || "Failed to assign printer");
        }
    };

    const handleAssignBinder = async () => {
        if (!selectedBinder) {
            toast.error("Please select a binder before assigning");
            return;
        }

        const selectedBinderData = binders.find((binder) => binder.id === selectedBinder);
        if (!selectedBinderData) {
            toast.error("Invalid binder selected");
            return;
        }

        const now = new Date().toISOString();
        const remarkText = `Assigned to binder: ${selectedBinderData.name} (ID: ${selectedBinder})`;

        try {
            const updateData = {
                ...formData,
                binder: selectedBinder,
                remarks: [
                    ...formData.remarks,
                    {
                        type: "Binder Assigned",
                        text: remarkText,
                        date: now,
                        assignedBinderId: selectedBinder,
                    },
                ],
            };

            await dispatch(updateQPOrderThunk({ id: formData._id, data: updateData })).unwrap();
            setFormData((prev) => ({
                ...prev,
                binder: selectedBinder,
                remarks: [
                    ...prev.remarks,
                    {
                        type: "Binder Assigned",
                        text: remarkText,
                        date: now,
                        assignedBinderId: selectedBinder,
                    },
                ],
            }));
            setShowBinderDropdown(false);
            toast.success("Binder assigned successfully");
        } catch (err: any) {
            console.error("ExpandedRowForm: Assign binder failed:", err);
            toast.error(err?.message || "Failed to assign binder");
        }
    };

    const handleRemarkSubmit = () => {
        const now = new Date().toISOString();
        if (!remarkText.trim()) return;

        if (remarkType === "startDate") {
            setFormData((prev) => ({
                ...prev,
                startDate: tempStartDate,
                status: "On Hold",
                remarks: [
                    ...prev.remarks,
                    {
                        type: "StartDate Change",
                        text: remarkText.trim(),
                        date: now,
                        previousValue: prev.startDate || "",
                    },
                ],
            }));
        } else if (remarkType === "onHold") {
            setFormData((prev) => ({
                ...prev,
                status: "On Hold",
                remarks: [
                    ...prev.remarks,
                    {
                        type: "On Hold",
                        text: remarkText.trim(),
                        date: now,
                        previousValue: prev.status || "",
                    },
                ],
            }));
        } else if (remarkType === "canceled") {
            setFormData((prev) => ({
                ...prev,
                status: "Canceled",
                remarks: [
                    ...prev.remarks,
                    {
                        type: "Canceled",
                        text: remarkText.trim(),
                        date: now,
                        previousValue: prev.status || "",
                    },
                ],
            }));
        }

        setRemarkText("");
        setTempStartDate("");
        setRemarkType(null);
        setRemarkModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData._id) {
            toast.error("Cannot submit: Invalid order ID");
            return;
        }

        // Validate paper selections when changing to In Progress
        if (formData.status === "In Progress" && row.status === "Pending") {
            if (isPaperSelectionRequired && !arePaperSelectionsValid()) {
                toast.error("Please select valid papers from inventory before submitting");
                return;
            }
        }

        if (formData.status === "Completed") {
            if (!formData.actualNoOfPieces || parseInt(formData.actualNoOfPieces) === 0) {
                toast.error("You need to fill the actual number of pieces before marking as completed");
                return;
            }
        }

        try {
            const { kantanPerUnit, reel, inch } = calculateKantan(
                parseFloat(row.orderdata.length),
                parseFloat(row.orderdata.width),
                parseFloat(formData.actualNoOfPieces || row.noOfPieces)
            );

            const { paper1Kg, paper2Kg, paper3Kg, totalKgss } = calculatePaperKg(
                parseFloat(row.orderdata.length),
                parseFloat(row.orderdata.width),
                parseFloat(row.orderdata.height),
                parseFloat(row.orderdata.deckal),
                parseInt(row.orderdata.ply),
                parseFloat(row.orderdata.paper3GSM),
                parseFloat(row.orderdata.paper2GSM),
                parseFloat(row.orderdata.paper1GSM),
                parseFloat(formData.actualNoOfPieces || row.noOfPieces)
            );

            // Calculate new usedKg values for inventory updates
            const inventoryUpdates = [];

            // Process each paper selection
            for (const [paperType, paperId] of Object.entries(paperSelections)) {
                if (paperId && paperRequirements[paperType as keyof PaperSelection] > 0) {
                    const paper = availablePapers.find(p => p._id === paperId);
                    if (paper) {
                        const newUsedKg = (paper.usedKg || 0) + paperRequirements[paperType as keyof PaperSelection];
                        inventoryUpdates.push({
                            paperId,
                            newUsedKg
                        });
                    }
                }
            }

            const updateData = {
                unitNo: formData.unitNo,
                startDate: formData.startDate,
                deliveryDate: formData.deliveryDate,
                dyeNumber: formData.dyeNumber,
                dyeSize: formData.dyeSize,
                glue: formData.glue,
                wire: formData.wire,
                actualNoOfPieces: formData.actualNoOfPieces,
                dyeRemark: formData.dyeRemark,
                godownRemark: formData.godownRemark,
                factoryRemark: formData.factoryRemark,
                status: formData.status,
                remarks: formData.remarks,
                printer: formData.printer,
                binder: formData.binder,
                selectedPapers: paperSelections,
                actualTotalKantan: {
                    reel: reel.toString(),
                    inch: inch.toString(),
                },
                actualPaperKG: {
                    paper1: {
                        deckal: row.orderdata.deckal,
                        gsm: row.orderdata.paper1GSM,
                        totalKg: paper3Kg?.toFixed(2).toString(),
                    },
                    paper2: {
                        deckal: row.orderdata.deckal,
                        gsm: row.orderdata.paper2GSM,
                        totalKg: paper2Kg?.toFixed(2).toString(),
                    },
                    paper3: {
                        deckal: row.orderdata.deckal,
                        gsm: row.orderdata.paper3GSM,
                        totalKg: paper1Kg?.toFixed(2).toString(),
                    },
                },
                actualTotalKg: totalKgss?.toFixed(2).toString(),
            };

            // Update the order
            await dispatch(updateQPOrderThunk({ id: formData._id, data: updateData })).unwrap();

            // Update inventory items
            // if (row?.selectedPapers?.paper1 === null || row?.selectedPapers?.paper1 === undefined)
                // for (const update of inventoryUpdates) {
                //     await dispatch(updateInventoryItemThunk({
                //         id: update.paperId,
                //         updateData: { usedKg: update.newUsedKg }
                //     })).unwrap();
                // }

            // Refresh inventory data
            dispatch(getAllInventoryThunk());

            setInitialFormData({ ...formData });
            if (formData.status === "Completed") {
                setIsCompleted(true);
            }
            toast.success("Order updated successfully");
        } catch (err: any) {
            console.error("ExpandedRowForm: Update failed:", err);
            toast.error(err?.message || "Failed to update order");
        }
    };

    const handleCancel = () => {
        setFormData(initialFormData);
        setIsInitialUnitSet(!!initialFormData.unitNo);
        setIsActualNoOfPiecesUpdated(!!initialFormData.actualNoOfPieces);
        setShowPrinterDropdown(initialFormData.status === "Printer" && !row.printer);
        setShowBinderDropdown(initialFormData.status === "Lamination" && !row.binder);
        setSelectedPrinter(initialFormData.printer || "");
        setSelectedBinder(initialFormData.binder || "");
        setPaperSelections(initialFormData.selectedPapers || {
            paper1: null,
            paper2: null,
            paper3: null
        });
    };

    // Render paper selection section
    const renderPaperSelection = () => {
        if (!row.actualPaperKG) return null;

        return (
            <Card sx={{ mt: 2, border: '1px solid #e0e0e0' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        📄 Select Papers from Inventory {isPaperSelectionRequired && "(*Required)"}
                    </Typography>

                    {isPaperSelectionRequired && (
                        <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                            ⚠️ Paper selection is required before changing status to "In Progress"
                        </Typography>
                    )}

                    <Grid container spacing={2}>
                        {paperRequirements.paper1 > 0 && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Autocomplete
                                    size="small"
                                    fullWidth
                                    value={
                                        getAllAvailablePapersForRequirement(
                                            row.actualPaperKG.paper1.gsm,
                                            row.actualPaperKG.paper1.deckal,
                                            paperRequirements.paper1,
                                            "paper1"
                                        ).find((p) => p.value === paperSelections.paper1) || null
                                    }
                                    onChange={(e, newValue) => handlePaperSelection("paper1", newValue ? newValue.value : "")}
                                    options={getAllAvailablePapersForRequirement(
                                        row.actualPaperKG.paper1.gsm,
                                        row.actualPaperKG.paper1.deckal,
                                        paperRequirements.paper1,
                                        "paper1"
                                    )}
                                    getOptionDisabled={(option) => !option.isSufficient}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={`Paper 1 (${row.actualPaperKG.paper1.gsm} GSM)`}
                                            error={!isPaperSelectionValid('paper1')}
                                            helperText={!isPaperSelectionValid('paper1') ? "Insufficient quantity" : ""}
                                        />
                                    )}
                                    disabled={isCompleted}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Required: {paperRequirements.paper1.toFixed(2)} KG
                                </Typography>
                                {paperSelections.paper1 && (
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={`Will use: ${paperRequirements.paper1.toFixed(2)} KG`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                )}
                            </Grid>
                        )}

                        {paperRequirements.paper2 > 0 && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Autocomplete
                                    size="small"
                                    fullWidth
                                    value={
                                        getAllAvailablePapersForRequirement(
                                            row.actualPaperKG.paper2.gsm,
                                            row.actualPaperKG.paper2.deckal,
                                            paperRequirements.paper2,
                                            "paper2"
                                        ).find((p) => p.value === paperSelections.paper2) || null
                                    }
                                    onChange={(e, newValue) => handlePaperSelection("paper2", newValue ? newValue.value : "")}
                                    options={getAllAvailablePapersForRequirement(
                                        row.actualPaperKG.paper2.gsm,
                                        row.actualPaperKG.paper2.deckal,
                                        paperRequirements.paper2,
                                        "paper2"
                                    )}
                                    getOptionDisabled={(option) => !option.isSufficient}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={`Paper 2 (${row.actualPaperKG.paper2.gsm} GSM)`}
                                            error={!isPaperSelectionValid('paper2')}
                                            helperText={!isPaperSelectionValid('paper2') ? "Insufficient quantity" : ""}
                                        />
                                    )}
                                    disabled={isCompleted}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Required: {paperRequirements.paper2.toFixed(2)} KG
                                </Typography>
                                {paperSelections.paper2 && (
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={`Will use: ${paperRequirements.paper2.toFixed(2)} KG`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                )}
                            </Grid>
                        )}

                        {paperRequirements.paper3 > 0 && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Autocomplete
                                    size="small"
                                    fullWidth
                                    value={
                                        getAllAvailablePapersForRequirement(
                                            row.actualPaperKG.paper3.gsm,
                                            row.actualPaperKG.paper3.deckal,
                                            paperRequirements.paper3,
                                            "paper3"
                                        ).find((p) => p.value === paperSelections.paper3) || null
                                    }
                                    onChange={(e, newValue) => handlePaperSelection("paper3", newValue ? newValue.value : "")}
                                    options={getAllAvailablePapersForRequirement(
                                        row.actualPaperKG.paper3.gsm,
                                        row.actualPaperKG.paper3.deckal,
                                        paperRequirements.paper3,
                                        "paper3"
                                    )}
                                    getOptionDisabled={(option) => !option.isSufficient}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={`Paper 3 (${row.actualPaperKG.paper3.gsm} GSM)`}
                                            error={!isPaperSelectionValid('paper3')}
                                            helperText={!isPaperSelectionValid('paper3') ? "Insufficient quantity" : ""}
                                        />
                                    )}
                                    disabled={isCompleted}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Required: {paperRequirements.paper3.toFixed(2)} KG
                                </Typography>
                                {paperSelections.paper3 && (
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={`Will use: ${paperRequirements.paper3.toFixed(2)} KG`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                )}
                            </Grid>
                        )}
                    </Grid>

                    {/* Show allocation summary */}
                    {(paperSelections.paper1 || paperSelections.paper2 || paperSelections.paper3) && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                📋 Paper Allocation Summary:
                            </Typography>
                            {Object.entries(paperSelections).map(([paperType, paperId]) => {
                                if (!paperId || paperRequirements[paperType as keyof PaperSelection] === 0) return null;

                                const paper = availablePapers.find(p => p._id === paperId);
                                if (!paper) return null;

                                const availableAfterAllocation = calculateAvailableKg(paperId, paperType as keyof PaperSelection) - paperRequirements[paperType as keyof PaperSelection];

                                return (
                                    <Typography key={paperType} variant="body2" sx={{ mt: 0.5 }}>
                                        • {paperType.toUpperCase()}: {paperRequirements[paperType as keyof PaperSelection].toFixed(2)} KG from {paper.paperName}
                                        {availableAfterAllocation >= 0 ? ` (${availableAfterAllocation.toFixed(2)} KG remaining)` : ' ⚠️ Over-allocated'}
                                    </Typography>
                                );
                            })}
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ p: 2, backgroundColor: "#f9fafb" }}>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            select
                            label="Unit No"
                            value={formData.unitNo || ""}
                            onChange={(e) => {
                                handleFormChange("unitNo", e.target.value);
                                if (!formData.startDate) {
                                    handleFormChange("startDate", moment().format("YYYY-MM-DD"));
                                }
                            }}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 80 }}
                            disabled={isCompleted}
                        >
                            <MenuItem value="Unit1">Unit1</MenuItem>
                            <MenuItem value="Unit2">Unit2</MenuItem>
                        </TextField>

                        <TextField
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleFormChange("startDate", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            InputLabelProps={{ shrink: true }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Delivery Date"
                            type="date"
                            value={formData.deliveryDate}
                            onChange={(e) => handleFormChange("deliveryDate", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            InputLabelProps={{ shrink: true }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Dye Number"
                            value={formData.dyeNumber}
                            onChange={(e) => handleFormChange("dyeNumber", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Dye Sheet Size"
                            value={formData.dyeSize}
                            onChange={(e) => handleFormChange("dyeSize", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Glue KG"
                            value={formData.glue}
                            onChange={(e) => handleFormChange("glue", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Wire KG"
                            value={formData.wire}
                            onChange={(e) => handleFormChange("wire", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Actual No. of Pieces"
                            value={formData.actualNoOfPieces}
                            onChange={(e) => handleFormChange("actualNoOfPieces", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            disabled={isCompleted}
                        />
                        <TextField
                            select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => handleFormChange("status", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            disabled={isCompleted}
                        >
                            {ORDER_STATUSES.map((item) => (
                                <MenuItem key={item} value={item}>
                                    {item}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>

                    {/* Paper Selection Section */}
                    {renderPaperSelection()}

                    <Stack direction="row" spacing={2}>
                        {row.printer && (
                            <TextField
                                label="Assigned Printer"
                                value={`${row.printer.firstName} ${row.printer.lastName}`}
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 100, mt: 10 }}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        )}
                        {row.binder && (
                            <TextField
                                label="Assigned Binder"
                                value={`${row.binder.firstName} ${row.binder.lastName}`}
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 100 }}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        )}
                        {showPrinterDropdown && (
                            <>
                                <TextField
                                    select
                                    label="Select Printer"
                                    value={selectedPrinter}
                                    onChange={(e) => setSelectedPrinter(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ minWidth: 100, mt: 2 }}
                                    disabled={isCompleted || staffLoading}
                                >
                                    {staffLoading ? (
                                        <MenuItem value="" disabled>
                                            Loading printers...
                                        </MenuItem>
                                    ) : printers.length === 0 ? (
                                        <MenuItem value="" disabled>
                                            No printers available
                                        </MenuItem>
                                    ) : (
                                        printers.map((printer) => (
                                            <MenuItem key={printer.id} value={printer.id}>
                                                {printer.name}
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                                <ThemeButton
                                    type="button"
                                    onClick={handleAssignPrinter}
                                    disabled={isCompleted || !selectedPrinter || staffLoading}
                                >
                                    Assign Printer
                                </ThemeButton>
                            </>
                        )}
                        {showBinderDropdown && (
                            <>
                                <TextField
                                    select
                                    label="Select Binder"
                                    value={selectedBinder}
                                    onChange={(e) => setSelectedBinder(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ minWidth: 100, mt: 2 }}
                                    disabled={isCompleted || staffLoading}
                                >
                                    {staffLoading ? (
                                        <MenuItem value="" disabled>
                                            Loading binders...
                                        </MenuItem>
                                    ) : binders.length === 0 ? (
                                        <MenuItem value="" disabled>
                                            No binders available
                                        </MenuItem>
                                    ) : (
                                        binders.map((binder) => (
                                            <MenuItem key={binder.id} value={binder.id}>
                                                {binder.name}
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                                <ThemeButton
                                    type="button"
                                    onClick={handleAssignBinder}
                                    disabled={isCompleted || !selectedBinder || staffLoading}
                                >
                                    Assign Binder
                                </ThemeButton>
                            </>
                        )}
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                        <TextField
                            label="Dye Remark"
                            value={formData.dyeRemark}
                            onChange={(e) => handleFormChange("dyeRemark", e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            sx={{ flex: 1, minWidth: 150 }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Godown Remark"
                            value={formData.godownRemark}
                            onChange={(e) => handleFormChange("godownRemark", e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            sx={{ flex: 1, minWidth: 150 }}
                            disabled={isCompleted}
                        />
                        <TextField
                            label="Factory Remark"
                            value={formData.factoryRemark}
                            onChange={(e) => handleFormChange("factoryRemark", e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            sx={{ flex: 1, minWidth: 150 }}
                            disabled={isCompleted}
                        />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <ThemeButton
                            type="submit"
                            disabled={isCompleted || (isPaperSelectionRequired && !arePaperSelectionsValid())}
                        >
                            Submit
                        </ThemeButton>
                        <ThemeButton type="button" disabled={isCompleted} onClick={handleCancel} variant="outlined">
                            Cancel
                        </ThemeButton>
                        <ThemeButton
                            type="button"
                            disabled={isCompleted}
                            onClick={() => {
                                setEditData(row);
                                setOpen(true);
                            }}
                        >
                            Edit
                        </ThemeButton>
                        <ThemeButton
                            type="button"
                            variant="outlined"
                            onClick={() => setViewRemarksOpen(true)}
                        >
                            View Remarks
                        </ThemeButton>
                    </Stack>
                </Stack>
            </form>

            <Dialog open={remarkModalOpen} onClose={() => setRemarkModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {remarkType === "startDate" && "Change Start Date"}
                    {remarkType === "onHold" && "Reason for On Hold"}
                    {remarkType === "canceled" && "Reason for Cancel"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Remark"
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        sx={{ mt: 1 }}
                        placeholder="Give a short reason (required)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setRemarkModalOpen(false);
                            setRemarkType(null);
                            setRemarkText("");
                            setTempStartDate("");
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleRemarkSubmit} disabled={!remarkText.trim()}>
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={viewRemarksOpen} onClose={() => setViewRemarksOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Remarks Timeline</DialogTitle>
                <DialogContent>
                    {formData.remarks.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No remarks available
                        </Typography>
                    ) : (
                        <Timeline sx={{ ml: -62 }} position="right">
                            {formData.remarks.map((remark, index) => (
                                <TimelineItem key={index}>
                                    <TimelineSeparator>
                                        <TimelineDot color="primary" />
                                        {index < formData.remarks.length - 1 && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {remark.type}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {moment(remark.date).format("DD MMM YYYY, hh:mm A")}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                                            {remark.text}
                                        </Typography>
                                        {remark.assignedPrinterId && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Printer ID: {remark.assignedPrinterId}
                                            </Typography>
                                        )}
                                        {remark.assignedBinderId && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Binder ID: {remark.assignedBinderId}
                                            </Typography>
                                        )}
                                        {index !== formData.remarks.length - 1 && <Divider sx={{ mt: 1, mb: 1 }} />}
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                        </Timeline>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewRemarksOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};