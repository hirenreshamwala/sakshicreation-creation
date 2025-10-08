import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { getAllInventoryThunk } from "@/store/slices/inventorySlice";
import {
    Box,
    MenuItem,
    Stack,
    TextField,
    Typography,
    Card,
    CardContent,
    Grid,
    Autocomplete,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Switch,
} from "@mui/material";
import moment from "moment";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { calculateKantan, calculatePaperKg } from "@/utills/qpCalculations";
import { ORDER_STATUSES } from "@/constants";
import ViewRemark from "./ViewRemark";
import RemarkModal from "./RemarkModal";
import RemoveIcon from '@mui/icons-material/Remove';
import { ExpandedRowFormProps, Remark, PaperAllocationsResult, PaperAllocation, PaperOption, InventoryPaper } from "@/constants/interface";

export const ExpandedRowForm = ({ row, setEditData, setOpen }: ExpandedRowFormProps) => {
    const dispatch = useAppDispatch();
    const [remarkText, setRemarkText] = useState("");
    const [tempStartDate, setTempStartDate] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);
    const [remarkModalOpen, setRemarkModalOpen] = useState(false);
    const [viewRemarksOpen, setViewRemarksOpen] = useState(false);
    const [isInitialUnitSet, setIsInitialUnitSet] = useState(false);
    const [selectedBinder, setSelectedBinder] = useState<string>("");
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");
    const { allInventory, error } = useAppSelector(state => state.inventory);
    const [isCompleted, setIsCompleted] = useState(row.status === "Completed");
    const [isPaperSelectionRequired, setIsPaperSelectionRequired] = useState(false);
    const { staffList, loading: staffLoading } = useAppSelector((state) => state.staff);
    const [remarkType, setRemarkType] = useState<"startDate" | "onHold" | "canceled" | null>(null);
    const [isPrinterLamination, setIsPrinterLamination] = useState(row.isPrinterLamination || false);
    const [isActualNoOfPiecesUpdated, setIsActualNoOfPiecesUpdated] = useState(!!row.actualNoOfPieces);
    const [showPrinterDropdown, setShowPrinterDropdown] = useState(row.status === "Printer" && !row.printer);
    const [showBinderDropdown, setShowBinderDropdown] = useState(row.status === "Lamination" && !row.binder);
    const [availablePapers, setAvailablePapers] = useState<InventoryPaper[]>([]);
    const [paperSelections, setPaperSelections] = useState({
        paper1: [],
        paper2: [],
        paper3: []
    });
    const [paperRequirements, setPaperRequirements] = useState({
        paper1: 0,
        paper2: 0,
        paper3: 0
    });
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
            paper1: [],
            paper2: [],
            paper3: []
        },
        isPrinterLamination: row.isPrinterLamination || false
    });
    const [initialFormData, setInitialFormData] = useState(formData);

    useEffect(() => {
        if (!staffList.length) dispatch(getAllStaffThunk());
        if (!allInventory.length) dispatch(getAllInventoryThunk());
    }, [dispatch, staffList.length, allInventory.length]);

    // Improved helper function to safely extract inventory IDs from selected papers
    const extractInventoryIds = useCallback((selectedPapers: any) => {

        const result = {
            paper1: [] as string[],
            paper2: [] as string[],
            paper3: [] as string[]
        };

        if (!selectedPapers) {
            return result;
        }

        // Helper function to extract IDs from different formats
        const extractIds = (paperData: any): string[] => {
            if (!paperData) return [];

            if (Array.isArray(paperData)) {
                // New format: array of allocations
                const ids = paperData
                    .filter((alloc: any) => alloc && (alloc.inventoryId || alloc._id || alloc.paperId))
                    .map((alloc: any) => alloc.inventoryId || alloc._id || alloc.paperId);
                return ids;
            } else if (typeof paperData === 'string') {
                // Single ObjectId as string
                return [paperData];
            } else if (paperData._id) {
                // Single ObjectId as object
                return [paperData._id];
            } else if (paperData.inventoryId) {
                // Single allocation object
                return [paperData.inventoryId];
            } else if (paperData.paperId) {
                // Single allocation object with paperId
                return [paperData.paperId];
            }

            return [];
        };

        // Extract from each paper type
        result.paper1 = extractIds(selectedPapers?.paper1);
        result.paper2 = extractIds(selectedPapers?.paper2);
        result.paper3 = extractIds(selectedPapers?.paper3);

        return result;
    }, []);

    // Initialize everything in one effect to avoid timing issues
    useEffect(() => {
        // First, extract paper selections
        const initialSelections = extractInventoryIds(row.selectedPapers);

        // Calculate paper requirements
        let paper1Req = 0;
        let paper2Req = 0;
        let paper3Req = 0;

        if (row.actualPaperKG) {
            paper1Req = parseFloat(row.actualPaperKG?.paper1?.totalKg > 0 ? row.actualPaperKG?.paper1?.totalKg : row.paperKG?.paper1?.totalKg || 0);
            paper2Req = parseFloat(row.actualPaperKG?.paper2?.totalKg > 0 ? row.actualPaperKG?.paper2?.totalKg : row.paperKG?.paper2?.totalKg || 0);
            paper3Req = parseFloat(row.actualPaperKG?.paper3?.totalKg > 0 ? row.actualPaperKG?.paper3?.totalKg : row.paperKG?.paper3?.totalKg || 0);
        }

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
                paper1: [],
                paper2: [],
                paper3: []
            },
            isPrinterLamination: row.isPrinterLamination || false
        };

        // Set all states synchronously
        setFormData(newFormData);
        setInitialFormData(newFormData);
        setPaperSelections(initialSelections);
        setPaperRequirements({
            paper1: paper1Req,
            paper2: paper2Req,
            paper3: paper3Req
        });

        setIsPrinterLamination(row.isPrinterLamination || false);
        setIsInitialUnitSet(!!row.unitNo);
        setIsCompleted(row.status === "Completed");
        setIsActualNoOfPiecesUpdated(!!row.actualNoOfPieces);
        setShowPrinterDropdown(row.status === "Printer" && !row.printer);
        setShowBinderDropdown(row.status === "Lamination" && !row.binder);
        setSelectedPrinter(row.printer?._id || "");
        setSelectedBinder(row.binder?._id || "");

        setIsInitialized(true);
    }, [row, extractInventoryIds]);

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
            const hasPaperRequirements = paperRequirements?.paper1 > 0 || paperRequirements?.paper2 > 0 || paperRequirements?.paper3 > 0;
            setIsPaperSelectionRequired(hasPaperRequirements);

            if (hasPaperRequirements) {
                toast.info("Please select papers from inventory before proceeding");
            }
        }
    }, [formData.status, row.status, paperRequirements]);

    // Debug effect to track state changes
    useEffect(() => {
        if (isInitialized) {

            // Check if selected papers exist in available papers
            Object.entries(paperSelections).forEach(([paperType, paperIds]) => {
                if (paperIds.length > 0) {
                    const foundPapers = paperIds.map(id => availablePapers.find(p => p._id === id));
                    const foundCount = foundPapers.filter(Boolean).length;
                }
            });
        }
    }, [paperSelections, paperRequirements, availablePapers, isInitialized]);

    // Filter staff with role "printer" or "binder" (case-insensitive)
    const printers = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "printer");
    const binders = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "binder");

    // Calculate all paper allocations at once to avoid circular dependency
    const calculateAllPaperAllocations = useCallback((): PaperAllocationsResult => {
        // Create a map to track available quantities for each paper
        const paperQuantities: Record<string, number> = {};
        availablePapers.forEach(paper => {
            paperQuantities[paper._id] = paper.kg;
        });

        // Function to calculate allocations for a single paper type
        const calculateForType = (paperType: keyof typeof paperSelections, requiredKg: number) => {
            const papers = paperSelections[paperType]
                .map(paperId => availablePapers.find(p => p._id === paperId))
                .filter(Boolean) as InventoryPaper[];

            let remainingRequired = requiredKg;
            const allocations: PaperAllocation[] = [];

            // If there's no requirement, return empty allocations
            if (requiredKg <= 0) {
                return {
                    allocations: [],
                    remainingRequired: 0,
                    isSufficient: true
                };
            }

            // Sort papers by available quantity (descending) to use larger papers first
            const sortedPapers = [...papers].sort((a, b) =>
                (paperQuantities[b._id] || 0) - (paperQuantities[a._id] || 0)
            );

            // Greedy allocation: use as much as possible from each paper
            for (const paper of sortedPapers) {
                // If we've already met the requirement, don't allocate from remaining papers
                if (remainingRequired <= 0) {
                    // Add remaining papers with 0 allocation
                    allocations.push({
                        paperId: paper._id,
                        allocatedKg: 0
                    });
                    continue;
                }

                const availableKg = paperQuantities[paper._id] || 0;
                if (availableKg <= 0) {
                    // Add paper with 0 allocation if it's not available
                    allocations.push({
                        paperId: paper._id,
                        allocatedKg: 0
                    });
                    continue;
                }

                // Allocate as much as possible from this paper
                const allocatedKg = Math.min(availableKg, remainingRequired);

                allocations.push({
                    paperId: paper._id,
                    allocatedKg: allocatedKg
                });

                paperQuantities[paper._id] -= allocatedKg;
                remainingRequired -= allocatedKg;
            }

            return {
                allocations,
                remainingRequired,
                isSufficient: remainingRequired <= 0
            };
        };

        // Calculate allocations for all paper types
        const paper1Result = calculateForType("paper1", paperRequirements?.paper1);
        const paper2Result = calculateForType("paper2", paperRequirements?.paper2);
        const paper3Result = calculateForType("paper3", paperRequirements?.paper3);

        // Build the paper allocations map
        const paperAllocationsMap: Record<string, number> = {};
        [...paper1Result.allocations, ...paper2Result.allocations, ...paper3Result.allocations].forEach(allocation => {
            paperAllocationsMap[allocation.paperId] = (paperAllocationsMap[allocation.paperId] || 0) + allocation.allocatedKg;
        });

        return {
            paper1: paper1Result,
            paper2: paper2Result,
            paper3: paper3Result,
            paperAllocationsMap
        };
    }, [paperSelections, paperRequirements, availablePapers]);

    // Memoize the allocations calculation
    const allAllocations = useMemo(() => calculateAllPaperAllocations(), [
        calculateAllPaperAllocations
    ]);

    // Get allocated quantity for a specific paper
    const getAllocatedQuantity = useCallback((paperId: string) => {
        return allAllocations.paperAllocationsMap[paperId] || 0;
    }, [allAllocations]);

    // Get all available papers for a specific requirement
    const getAllAvailablePapersForRequirement = useCallback((
        gsm: string,
        deckal: string,
        requiredKg: number,
        paperType: keyof typeof paperSelections
    ): PaperOption[] => {
        const matchingPapers = availablePapers.filter(
            (item: InventoryPaper) =>
                item.deckal === deckal &&
                Number(item.gsm) === Number(gsm)
        );

        return matchingPapers.map((item) => {
            // Calculate how much is already allocated to this paper
            const allocatedKg = (item.allocations || [])
                .reduce((sum, a) => sum + (a.allocatedKg || 0), 0);

            // Available KG = total KG - allocated KG
            const availableKg = Math.max(0, item.kg - allocatedKg);
            return {
                value: item._id,
                label: `${item.kg} (${availableKg.toFixed(2)} KG available)`,
                kg: item.kg,
                usedKg: allocatedKg,
                availableKg,
                isSufficient: availableKg >= requiredKg,
            };
        }).filter(option => option.availableKg > 0); // Only show papers with available quantity
    }, [availablePapers, getAllocatedQuantity]);

    // Check if paper selection is valid for a paper type
    const isPaperSelectionValid = useCallback((paperType: keyof typeof paperSelections) => {
        const requirement = paperRequirements[paperType];
        if (requirement === 0) return true;

        return allAllocations[paperType].isSufficient;
    }, [allAllocations, paperRequirements]);

    // Check if all paper selections are valid
    const arePaperSelectionsValid = useCallback(() => {
        if (!isPaperSelectionRequired) return true;

        return ['paper1', 'paper2', 'paper3'].every(paperType => {
            const requirement = paperRequirements[paperType as keyof typeof paperSelections];
            if (requirement === 0) return true;

            return isPaperSelectionValid(paperType as keyof typeof paperSelections);
        });
    }, [isPaperSelectionRequired, paperRequirements, isPaperSelectionValid]);

    // Add a paper to a paper type
    const addPaperToSelection = useCallback((paperType: keyof typeof paperSelections, paperId: string) => {
        // Check if paper is already selected for this paper type
        if (paperSelections[paperType].includes(paperId)) {
            toast.info("This paper is already selected for this paper type");
            return;
        }

        setPaperSelections(prev => ({
            ...prev,
            [paperType]: [...prev[paperType], paperId]
        }));
        toast.success("Paper added to selection");
    }, [paperSelections]);

    // Remove a paper from a paper type
    const removePaperFromSelection = useCallback((paperType: keyof typeof paperSelections, paperId: string) => {
        setPaperSelections(prev => ({
            ...prev,
            [paperType]: prev[paperType].filter(id => id !== paperId)
        }));
        toast.info("Paper removed from selection");
    }, []);

    const renderPrinterLaminationToggle = () => {
        return (
            <Card sx={{ mt: 2, border: '1px solid #e0e0e0' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-start' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                🖨️ Printer Lamination Required?
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isPrinterLamination
                                    ? "Printer and binder assignment will be required"
                                    : "No printer/binder assignment needed"
                                }
                            </Typography>
                        </Box>
                        <Switch
                            checked={isPrinterLamination}
                            onChange={(e) => {
                                const value = e.target.checked;
                                setIsPrinterLamination(value);
                                setFormData(prev => ({ ...prev, isPrinterLamination: value }));

                                // Reset dropdown states when toggling off
                                if (!value) {
                                    setShowPrinterDropdown(false);
                                    setShowBinderDropdown(false);
                                    setSelectedPrinter("");
                                    setSelectedBinder("");
                                }
                            }}
                            color="primary"
                            disabled={isCompleted}
                        />
                    </Box>

                    {isPrinterLamination && (
                        <Chip
                            label="Printer & Binder Assignment Required"
                            color="primary"
                            variant="filled"
                            sx={{ mt: 1 }}
                        />
                    )}
                </CardContent>
            </Card>
        );
    };
    
    const handleFormChange = useCallback((field: string, value: string) => {
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
                const hasPaperRequirements = paperRequirements?.paper1 > 0 || paperRequirements?.paper2 > 0 || paperRequirements?.paper3 > 0;

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
    }, [formData, row.status, isInitialUnitSet, isPaperSelectionRequired, paperRequirements, arePaperSelectionsValid, row.printer, row.binder]);

    const handleAssignPrinter = useCallback(async () => {
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
    }, [selectedPrinter, printers, formData, dispatch]);

    const handleAssignBinder = useCallback(async () => {
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
    }, [selectedBinder, binders, formData, dispatch]);

    const handleRemarkSubmit = useCallback(() => {
        const now = new Date().toISOString();
        if (!remarkText.trim()) {
            toast.error("Please enter a remark");
            return;
        }

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
            toast.success("Start date updated with remark");
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
            toast.success("Order put on hold with remark");
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
            toast.success("Order canceled with remark");
        }

        setRemarkText("");
        setTempStartDate("");
        setRemarkType(null);
        setRemarkModalOpen(false);
    }, [remarkText, remarkType, tempStartDate]);

    // Helper function to calculate allocations for a paper type
    const calculatePaperAllocations = useCallback((paperType: keyof typeof paperSelections, requiredKg: number) => {
        const papers = paperSelections[paperType]
            .map(paperId => availablePapers.find(p => p._id === paperId))
            .filter(Boolean) as InventoryPaper[];

        let remainingRequired = requiredKg;
        const allocations: PaperAllocation[] = [];

        // If there's no requirement, return empty allocations
        if (requiredKg <= 0) {
            return allocations;
        }

        // Sort papers by available quantity (descending) to use larger papers first
        const sortedPapers = [...papers].sort((a, b) =>
            (b.kg - (getAllocatedQuantity(b._id) || 0)) - (a.kg - (getAllocatedQuantity(a._id) || 0))
        );

        // Greedy allocation: use as much as possible from each paper
        for (const paper of sortedPapers) {
            // If we've already met the requirement, don't allocate from remaining papers
            if (remainingRequired <= 0) {
                // Add remaining papers with 0 allocation
                allocations.push({
                    paperId: paper._id,
                    allocatedKg: 0
                });
                continue;
            }

            const availableKg = paper.kg - (getAllocatedQuantity(paper._id) || 0);
            if (availableKg <= 0) {
                // Add paper with 0 allocation if it's not available
                allocations.push({
                    paperId: paper._id,
                    allocatedKg: 0
                });
                continue;
            }

            // Allocate as much as possible from this paper
            const allocatedKg = Math.min(availableKg, remainingRequired);

            allocations.push({
                paperId: paper._id,
                allocatedKg: allocatedKg
            });

            remainingRequired -= allocatedKg;
        }

        return allocations;
    }, [paperSelections, availablePapers, getAllocatedQuantity]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

            // Calculate paper allocations for each paper type
            const paper1Allocations = calculatePaperAllocations("paper1", paperRequirements?.paper1);
            const paper2Allocations = calculatePaperAllocations("paper2", paperRequirements?.paper2);
            const paper3Allocations = calculatePaperAllocations("paper3", paperRequirements?.paper3);

            // Prepare paper selections for API using the calculated allocations
            const selectedPapersForApi = {
                paper1: paper1Allocations,
                paper2: paper2Allocations,
                paper3: paper3Allocations
            };

            const newActuals1 = { paper1: [], paper2: [], paper3: [] };

            (["paper1", "paper2", "paper3"] as const).forEach(pt => {
                paperSelections[pt].forEach(paperId => {
                    const allocation = allAllocations[pt]?.allocations?.find(a => a.paperId === paperId);
                    if (allocation) {
                        newActuals1[pt].push({ paperId, allocatedKg: allocation.allocatedKg });
                    }
                });
            });

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
                selectedPapers: newActuals1,
                isPrinterLamination: formData.isPrinterLamination,
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

            // Refresh inventory data
            dispatch(getAllInventoryThunk());

            setInitialFormData({ ...formData, selectedPapers: selectedPapersForApi });
            if (formData.status === "Completed") {
                setIsCompleted(true);
            }
            toast.success("Order updated successfully");
        } catch (err: any) {
            console.error("ExpandedRowForm: Update failed:", err);
            toast.error(err?.message || "Failed to update order");
        }
    }, [formData, row, paperRequirements, calculatePaperAllocations, isPaperSelectionRequired, arePaperSelectionsValid, dispatch]);

    const handleCancel = useCallback(() => {
        setFormData(initialFormData);
        setIsInitialUnitSet(!!initialFormData.unitNo);
        setIsActualNoOfPiecesUpdated(!!initialFormData.actualNoOfPieces);
        setShowPrinterDropdown(initialFormData.status === "Printer" && !row.printer);
        setShowBinderDropdown(initialFormData.status === "Lamination" && !row.binder);
        setSelectedPrinter(initialFormData.printer || "");
        setSelectedBinder(initialFormData.binder || "");

        // Reset paper selections to initial values
        const initialSelections = extractInventoryIds(initialFormData.selectedPapers);
        setPaperSelections(initialSelections);
        toast.info("Changes cancelled");
    }, [initialFormData, row.printer, row.binder, extractInventoryIds]);

    // Render individual paper type selection
    const renderPaperTypeSelection = (paperType: keyof typeof paperSelections, paperInfo: any) => {
        const requirement = paperRequirements[paperType];
        if (requirement <= 0) return null;

        const allocations = allAllocations[paperType].allocations;
        const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedKg, 0);
        const isSufficient = allAllocations[paperType].isSufficient;

        return (
            <Grid item xs={12} md={4} key={paperType}>
                <Typography variant="subtitle1" gutterBottom>
                    {paperType.toUpperCase()} ({paperInfo.gsm} GSM) - Required: {requirement.toFixed(2)} KG
                    <span style={{ marginLeft: '8px', color: isSufficient ? 'green' : 'red' }}>
                        ({isSufficient ? '✓' : '✗'} {totalAllocated.toFixed(2)} KG allocated)
                    </span>
                </Typography>

                <Autocomplete
                    size="small"
                    fullWidth
                    options={getAllAvailablePapersForRequirement(
                        paperInfo.gsm,
                        paperInfo.deckal,
                        requirement,
                        paperType
                    )}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Available Papers"
                            placeholder="Select a paper to add"
                        />
                    )}
                    onChange={(e, newValue) => {
                        if (newValue) {
                            addPaperToSelection(paperType, newValue.value);
                        }
                    }}
                    disabled={isCompleted}
                />


                <List dense sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 1 }}>
                    {paperSelections[paperType].length === 0 ? (
                        <ListItem>
                            <ListItemText
                                primary="No papers selected"
                                sx={{ textAlign: 'center', color: 'text.secondary' }}
                            />
                        </ListItem>
                    ) : (
                        paperSelections[paperType].map((paperId, index) => {
                            const paper = availablePapers.find(p => p._id === paperId);
                            if (!paper) {
                                console.warn(`Paper with ID ${paperId} not found in available papers`);
                                return null;
                            }

                            const allocation = allocations.find(a => a.paperId === paperId);
                            const allocatedQuantity = allocation?.allocatedKg || 0;
                            const remainingQuantity = paper.kg - allocatedQuantity;

                            return (
                                <ListItem key={`${paperType}-${paperId}-${index}`} divider>
                                    <ListItemText
                                        primary={paper.paperName}
                                        secondary={
                                            <span>
                                                {paper.kg.toFixed(2)} KG total, {remainingQuantity.toFixed(2)} KG remaining
                                                <br />
                                                Mill: {paper.paperMillName}
                                            </span>
                                        }
                                    />
                                    {allocatedQuantity > 0 && (
                                        <Chip
                                            label={`Will use: ${allocatedQuantity.toFixed(2)} KG`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    {allocatedQuantity === 0 && (
                                        <Chip
                                            label="Not used"
                                            size="small"
                                            color="default"
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    <IconButton
                                        edge="end"
                                        onClick={() => removePaperFromSelection(paperType, paperId)}
                                        disabled={isCompleted}
                                        size="small"
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                </ListItem>
                            );
                        })
                    )}
                </List>

                <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                        Total Allocated: {totalAllocated.toFixed(2)} KG
                    </Typography>
                    {!isSufficient && (
                        <Typography variant="body2" color="error">
                            Insufficient allocation (Required: {requirement.toFixed(2)} KG, Shortage: {(requirement - totalAllocated).toFixed(2)} KG)
                        </Typography>
                    )}
                </Box>
            </Grid>
        );
    };

    // Render paper selection section
    const renderPaperSelection = () => {
        if (!row.actualPaperKG && !row.paperKG) {
            return null;
        }

        const paperData = row.actualPaperKG || row.paperKG;
        const hasPaperRequirements = paperRequirements?.paper1 > 0 || paperRequirements?.paper2 > 0 || paperRequirements?.paper3 > 0;

        if (!hasPaperRequirements) {
            return null;
        }

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
                        {paperRequirements?.paper1 > 0 && renderPaperTypeSelection("paper1", paperData?.paper1)}
                        {paperRequirements?.paper2 > 0 && renderPaperTypeSelection("paper2", paperData?.paper2)}
                        {paperRequirements?.paper3 > 0 && renderPaperTypeSelection("paper3", paperData?.paper3)}
                    </Grid>

                    {/* Show allocation summary */}
                    {(paperSelections?.paper1?.length > 0 || paperSelections?.paper2?.length > 0 || paperSelections?.paper3?.length > 0) && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                📋 Paper Allocation Summary:
                            </Typography>
                            {Object.entries(paperSelections).map(([paperType, paperIds]) => {
                                if (paperIds.length === 0) return null;

                                const requirement = paperRequirements[paperType as keyof typeof paperRequirements];
                                const allocations = allAllocations[paperType as keyof typeof allAllocations];
                                const totalAllocated = allocations.allocations.reduce((sum, a) => sum + a.allocatedKg, 0);

                                return (
                                    <Typography key={paperType} variant="body2" sx={{ mt: 0.5 }}>
                                        • {paperType.toUpperCase()}: {totalAllocated.toFixed(2)} KG allocated (Required: {requirement.toFixed(2)} KG)
                                        {allocations.remainingRequired > 0 && ` ⚠️ Shortage: ${allocations.remainingRequired.toFixed(2)} KG`}
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

                    {renderPrinterLaminationToggle()}

                    <Stack direction="row" spacing={2}>
                        {/* Show printer/binder assignment only when printer lamination is required */}
                        {isPrinterLamination && (
                            <>
                                {/* Show assigned printer if exists */}
                                {row.printer && (
                                    <TextField
                                        label="Assigned Printer"
                                        value={`${row.printer.firstName} ${row.printer.lastName}`}
                                        variant="outlined"
                                        size="small"
                                        sx={{ minWidth: 100 }}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                )}

                                {/* Show assigned binder if exists */}
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

                                {/* Show printer dropdown when needed */}
                                {showPrinterDropdown && (
                                    <>
                                        <TextField
                                            select
                                            label="Select Printer"
                                            value={selectedPrinter}
                                            onChange={(e) => setSelectedPrinter(e.target.value)}
                                            variant="outlined"
                                            size="small"
                                            sx={{ minWidth: 100 }}
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

                                {/* Show binder dropdown when needed */}
                                {showBinderDropdown && (
                                    <>
                                        <TextField
                                            select
                                            label="Select Binder"
                                            value={selectedBinder}
                                            onChange={(e) => setSelectedBinder(e.target.value)}
                                            variant="outlined"
                                            size="small"
                                            sx={{ minWidth: 100 }}
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
            <RemarkModal remarkModalOpen={remarkModalOpen} setRemarkModalOpen={setRemarkModalOpen} remarkType={remarkType} setRemarkType={setRemarkType} remarkText={remarkText} setRemarkText={setRemarkText} handleRemarkSubmit={handleRemarkSubmit} setTempStartDate={setTempStartDate} />
            <ViewRemark viewRemarksOpen={viewRemarksOpen} setViewRemarksOpen={setViewRemarksOpen} formData={formData} />
        </Box>
    );
};