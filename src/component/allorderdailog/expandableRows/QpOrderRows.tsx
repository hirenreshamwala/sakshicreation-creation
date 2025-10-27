import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { getAllInventoryThunk } from "@/store/slices/inventorySlice";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import moment from "moment";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { calculateKantan, calculatePaperKg } from "@/utills/qpCalculations";
import { ORDER_STATUSES } from "@/constants";
import ViewRemark from "./ViewRemark";
import RemarkModal from "./RemarkModal";
import { ExpandedRowFormProps, Remark, PaperAllocationsResult, PaperAllocation, InventoryPaper } from "@/constants/interface";
import PaperSelection from "./PaperSelection";
import PaperAssign from "./PaperAssign";

export const ExpandedRowForm = ({ row, setEditData, setOpen }: ExpandedRowFormProps) => {
    const dispatch = useAppDispatch();
    const [remarkText, setRemarkText] = useState("");
    const [tempStartDate, setTempStartDate] = useState("");
    // const [isInitialized, setIsInitialized] = useState(false);
    const [remarkModalOpen, setRemarkModalOpen] = useState(false);
    const [viewRemarksOpen, setViewRemarksOpen] = useState(false);
    const [isInitialUnitSet, setIsInitialUnitSet] = useState(false);
    const [selectedBinder, setSelectedBinder] = useState(null);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [selectedDesigner, setSelectedDesigner] = useState(null);
    const { allInventory } = useAppSelector(state => state.inventory);
    const [isCompleted, setIsCompleted] = useState(row.status === "Completed");
    const [isPaperSelectionRequired, setIsPaperSelectionRequired] = useState(false);
    const { staffList, loading: staffLoading } = useAppSelector((state) => state.staff);
    const [remarkType, setRemarkType] = useState<"startDate" | "onHold" | "canceled" | null>(null);
    // const [isActualNoOfPiecesUpdated, setIsActualNoOfPiecesUpdated] = useState(!!row.actualNoOfPieces);
    const [availablePapers, setAvailablePapers] = useState<InventoryPaper[]>([]);
    const [newAllocations, setNewAllocations] = useState<any>(null)
    const [paperSelections, setPaperSelections] = useState<any>({
        paper1: [],
        paper2: [],
        paper3: []
    });
    const [paperRequirements, setPaperRequirements] = useState<any>({
        paper1: 0,
        paper2: 0,
        paper3: 0
    });
    const [paperUsageSummary, setPaperUsageSummary] = useState<Record<string, string[]>>({
        paper1: [],
        paper2: [],
        paper3: [],
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
        lamination: false,
        laminationType: "",
        uv: false,
        uvType: "",
        varnish: false,
        isPinning: false,
        isPasting: false,
        isPunching: false
    });
    const [initialFormData, setInitialFormData] = useState(formData);

    useEffect(() => {
        if (!staffList.length) dispatch(getAllStaffThunk());
        if (!allInventory.length) dispatch(getAllInventoryThunk());
    }, []);

    // Improved helper function to safely extract inventory IDs from selected papers
    const extractInventoryIds = useCallback((selectedPapers: any) => {
        const result = {
            paper1: [] as string[],
            paper2: [] as string[],
            paper3: [] as string[]
        };

        if (!selectedPapers) return result;

        // Helper function to extract IDs from different formats
        const extractIds = (paperData: any): string[] => {
            if (!paperData) return [];

            if (Array.isArray(paperData)) {
                // New format: array of allocations
                const ids = paperData
                    .filter((alloc: any) => alloc && (alloc.inventoryId || alloc._id || alloc.paperId))
                    .map((alloc: any) => alloc.inventoryId || alloc._id || alloc.paperId);
                return ids;
            }
            else if (typeof paperData === 'string') return [paperData];
            else if (paperData._id) return [paperData._id];
            else if (paperData.inventoryId) return [paperData.inventoryId];
            else if (paperData.paperId) return [paperData.paperId];

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
        const initialSelections: any = extractInventoryIds(row.selectedPapers);

        let paper1Req = 0;
        let paper2Req = 0;
        let paper3Req = 0;

        if (row.paperKG) {
            paper1Req = parseFloat(row.paperKG?.paper1?.totalKg > 0 ? row.paperKG?.paper1?.totalKg : row.paperKG?.paper1?.totalKg || 0);
            paper2Req = parseFloat(row.paperKG?.paper2?.totalKg > 0 ? row.paperKG?.paper2?.totalKg : row.paperKG?.paper2?.totalKg || 0);
            paper3Req = parseFloat(row.paperKG?.paper3?.totalKg > 0 ? row.paperKG?.paper3?.totalKg : row.paperKG?.paper3?.totalKg || 0);
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
        };

        setFormData(newFormData);
        setInitialFormData(newFormData);
        setPaperSelections(initialSelections);
        setPaperRequirements({
            paper1: paper1Req,
            paper2: paper2Req,
            paper3: paper3Req
        });
        setIsInitialUnitSet(!!row.unitNo);
        setIsCompleted(row.status === "Completed");
        // setIsActualNoOfPiecesUpdated(!!row.actualNoOfPieces);
        // setIsInitialized(true);
    }, [row, extractInventoryIds]);

    useEffect(() => {
        if (allInventory.length > 0 && row.orderdata) {
            const papers: any = allInventory.filter((item: any) =>
                item.inventoryType === 'paper' &&
                item.type === 'inward' &&
                [undefined, null].includes(item.qpOrder)
            );
            setAvailablePapers(papers);
        }
    }, [allInventory, row.orderdata]);

    useEffect(() => {
        if (formData.status === "In Progress" && row.status === "Pending") {
            const hasPaperRequirements = paperRequirements?.paper1 > 0 || paperRequirements?.paper2 > 0 || paperRequirements?.paper3 > 0;
            setIsPaperSelectionRequired(hasPaperRequirements);

            if (hasPaperRequirements) toast.info("Please select papers from inventory before proceeding");
        }
    }, [formData.status, row.status, paperRequirements]);

    // Filter staff with role "printer" or "binder" (case-insensitive)
    const designers = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "designer");
    const printers = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "printer");
    const binders = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "binder");

    // Calculate all paper allocations at once to avoid circular dependency
    const calculateAllPaperAllocations = useCallback((): PaperAllocationsResult => {

        // Create a map to track available quantities for each paper
        const paperQuantities: Record<string, number> = {};
        availablePapers.forEach((paper: any) => {
            paperQuantities[paper._id] =
                Number(paper.kg) -
                (paper.allocations?.length
                    ? paper.allocations
                        ?.filter((item: any) => item.qpOrder !== row._id)
                        ?.reduce((sum: any, item: any) => sum + item.allocatedKg, 0)
                    : 0);
        });

        // Function to calculate allocations for a single paper type
        const calculateForType = (
            paperType: keyof typeof paperSelections,
            requiredKg: number
        ) => {
            const papers = paperSelections[paperType]
                .map((paperId: any) => availablePapers.find((p) => p._id === paperId))
                .filter(Boolean) as InventoryPaper[];

            let remainingRequired = requiredKg;
            const allocations: PaperAllocation[] = [];

            if (requiredKg <= 0) {
                return {
                    allocations: [],
                    remainingRequired: 0,
                    isSufficient: true
                };
            }

            // Greedy allocation
            for (const paper of papers) {
                if (remainingRequired <= 0) {
                    allocations.push({
                        paperId: paper._id,
                        allocatedKg: 0,
                        bf: paper.bf
                    });
                    continue;
                }

                const availableKg = paperQuantities[paper._id] || 0;
                if (availableKg <= 0) {
                    allocations.push({
                        paperId: paper._id,
                        allocatedKg: 0,
                        bf: paper.bf
                    });
                    continue;
                }

                const allocatedKg = Math.min(availableKg, remainingRequired);

                allocations.push({
                    paperId: paper._id,
                    allocatedKg,
                    bf: paper.bf
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
        const paper1Result = calculateForType("paper1", paperRequirements?.paper1 || 0);
        const paper2Result = calculateForType("paper2", paperRequirements?.paper2 || 0);
        const paper3Result = calculateForType("paper3", paperRequirements?.paper3 || 0);

        // ✅ FIXED: Include bf also in allocations map
        const paperAllocationsMap: Record<
            string,
            { allocatedKg: number; bf: number | string }
        > = {};

        [
            ...paper1Result.allocations,
            ...paper2Result.allocations,
            ...paper3Result.allocations
        ].forEach((allocation) => {
            if (!paperAllocationsMap[allocation.paperId]) {
                paperAllocationsMap[allocation.paperId] = {
                    allocatedKg: 0,
                    bf: allocation.bf
                };
            }
            paperAllocationsMap[allocation.paperId].allocatedKg += allocation.allocatedKg;
        });

        return {
            paper1: paper1Result,
            paper2: paper2Result,
            paper3: paper3Result,
            paperAllocationsMap // ✅ now includes bf
        };
    }, [paperSelections, paperRequirements, availablePapers]);


    // Memoize the allocations calculation
    const allAllocations: any = useMemo(() => calculateAllPaperAllocations(), [
        calculateAllPaperAllocations
    ]);

    // Get allocated quantity for a specific paper
    const getAllocatedQuantity = useCallback((paperId: string) => {
        return allAllocations.paperAllocationsMap[paperId] || 0;
    }, [allAllocations]);

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

    const handleFormChange = useCallback((field: string, value: any) => {
        setFormData((prev) => {
            let newState = { ...prev };

            // ===== Custom Logic Based on Fields =====
            if (field === "startDate") {
                if (prev.startDate) {
                    setTempStartDate(value);
                    setRemarkType("startDate");
                    setRemarkModalOpen(true);
                    return prev;
                } else {
                    newState.startDate = value;
                    return newState;
                }
            }

            if (field === "status") {
                if (value === "Completed") {
                    if (!prev.actualNoOfPieces || parseInt(prev.actualNoOfPieces) === 0) {
                        toast.error("You need to fill the actual number of pieces before marking as completed");
                        return prev;
                    }
                    const currentDate = new Date().toISOString().split("T")[0];
                    newState.status = value;
                    newState.deliveryDate = currentDate;
                    return newState;
                }

                if (value === "In Progress" && row.status === "Pending") {
                    const hasPaperRequirements =
                        paperRequirements?.paper1 > 0 ||
                        paperRequirements?.paper2 > 0 ||
                        paperRequirements?.paper3 > 0;

                    if (hasPaperRequirements && !arePaperSelectionsValid()) {
                        toast.error("Please select valid papers from inventory before changing status to In Progress");
                        return prev;
                    }
                }

                if (value === "On Hold") {
                    setRemarkType("onHold");
                    setRemarkModalOpen(true);
                    return prev;
                }

                if (value === "Canceled") {
                    setRemarkType("canceled");
                    setRemarkModalOpen(true);
                    return prev;
                }

                newState.status = value;
            }

            if (field === "unitNo" && value && !isInitialUnitSet && !prev.startDate) {
                const currentDate = new Date().toISOString().split("T")[0];
                newState.unitNo = value;
                newState.startDate = currentDate;
                setIsInitialUnitSet(true);

                if (prev.status === "Pending" && !isPaperSelectionRequired) {
                    newState.status = "In Progress";
                }
                return newState;
            }

            // ===== Lamination / Varnish / UV Logic =====
            if (field === "varnish" && value === true) {
                newState.varnish = true;
                newState.lamination = false;
                newState.laminationType = "";
                newState.uv = false;
                newState.uvType = "";
            } else if (field === "lamination") {
                newState.lamination = value;
                if (!value) {
                    newState.laminationType = "";
                    newState.uv = false;
                    newState.uvType = "";
                }
            } else if (field === "laminationType") {
                newState.laminationType = value;
                if (value !== "mate") {
                    newState.uv = false;
                    newState.uvType = "";
                }
            } else if (field === "uv") {
                newState.uv = value;
                if (!value) newState.uvType = "";
            }
            // Process checkboxes - allow multiple selection
            else if (field === "isPinning" || field === "isPasting" || field === "isPunching") {
                newState[field] = value;
            } else {
                newState[field] = value;
            }

            return newState;
        });
    }, [
        formData,
        row.status,
        isInitialUnitSet,
        isPaperSelectionRequired,
        paperRequirements,
        arePaperSelectionsValid,
        row.printer,
        row.binder
    ]);

    // Handle process checkbox changes
    const handleProcessChange = useCallback((process: "isPinning" | "isPasting" | "isPunching", checked: boolean) => {
        handleFormChange(process, checked);
    }, [handleFormChange]);

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
            .map((paperId: any) => availablePapers.find(p => p._id === paperId))
            .filter(Boolean) as InventoryPaper[];

        let remainingRequired = requiredKg;
        const allocations: PaperAllocation[] = [];

        if (requiredKg <= 0) return allocations;

        // Sort papers by available quantity (descending) to use larger papers first
        // const sortedPapers = papers

        // Greedy allocation: use as much as possible from each paper
        for (const paper of papers) {
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

    useEffect(() => {
        const newActuals1: any = { paper1: [], paper2: [], paper3: [] };

        (["paper1", "paper2", "paper3"] as const).forEach(pt => {
            paperSelections[pt].forEach((paperId: any) => {
                const allocation: any = allAllocations[pt]?.allocations?.find((a: any) => a.paperId === paperId);
                if (allocation) {
                    newActuals1[pt].push({ paperId, allocatedKg: allocation.allocatedKg });
                }
            });
        });

        setNewAllocations(newActuals1)
    }, [paperSelections])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate punching process requirements
        if (formData.isPunching && (!formData.dyeNumber || !formData.dyeSize)) {
            toast.error("Dye Number and Dye Sheet Size are required when Punching process is selected");
            return;
        }

        const currentDate = moment().startOf('day');
        const selectedDeliveryDate = moment(formData.deliveryDate);
        if (selectedDeliveryDate.isBefore(currentDate)) {
            toast.error("Delivery date cannot be before the current date");
            return;
        }
        if (!formData._id) {
            toast.error("Cannot submit: Invalid order ID");
            return;
        }

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

            const newActuals1: any = { paper1: [], paper2: [], paper3: [] };

            (["paper1", "paper2", "paper3"] as const).forEach(pt => {
                paperSelections[pt].forEach((paperId: any) => {
                    const allocation: any = allAllocations[pt]?.allocations?.find((a: any) => a.paperId === paperId);
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
                designer: selectedDesigner,
                printer: selectedPrinter,
                binder: selectedBinder,
                selectedPapers: row.selectedPapers.paper1.length ? row.selectedPapers : newActuals1,
                paperUsageSummary,
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
                isPinning: formData.isPinning,
                isPasting: formData.isPasting,
                isPunching: formData.isPunching,
            };

            const rowPapers = row.selectedPapers
            const updatePapers = updateData.selectedPapers

            if (rowPapers.paper1.length === 0 &&
                rowPapers.paper2.length === 0 &&
                rowPapers.paper3.length === 0 &&
                updatePapers.paper1.length > 0 &&
                updatePapers.paper2.length > 0 &&
                updatePapers.paper3.length > 0 &&
                selectedDesigner
            ) {
                updateData.status = 'Designer';
            }
            else if (
                rowPapers.paper1.length === 0 &&
                rowPapers.paper2.length === 0 &&
                rowPapers.paper3.length === 0 &&
                updatePapers.paper1.length > 0 &&
                updatePapers.paper2.length > 0 &&
                updatePapers.paper3.length > 0 &&
                !selectedDesigner
            ) {
                updateData.status = 'Paper cutting';
            }

            await dispatch(updateQPOrderThunk({ id: formData._id, data: updateData })).unwrap();

            dispatch(getAllInventoryThunk());

            setInitialFormData({ ...formData, selectedPapers: selectedPapersForApi });
            if (formData.status === "Completed") setIsCompleted(true);

            toast.success("Order updated successfully");
        } catch (err: any) {
            console.error("ExpandedRowForm: Update failed:", err);
            toast.error(err?.message || "Failed to update order");
        }
    }

    const handleCancel = useCallback(() => {
        setFormData(initialFormData);
        setIsInitialUnitSet(!!initialFormData.unitNo);
        // setIsActualNoOfPiecesUpdated(!!initialFormData.actualNoOfPieces);

        // Reset paper selections to initial values
        const initialSelections: any = extractInventoryIds(initialFormData.selectedPapers);
        setPaperSelections(initialSelections);
        toast.info("Changes cancelled");
    }, [initialFormData, row.printer, row.binder, extractInventoryIds]);

    useEffect(() => {
        const summaries: Record<string, string[]> = { paper1: [], paper2: [], paper3: [] };

        ["paper1", "paper2", "paper3"].forEach((type) => {
            const allocations = allAllocations[type]?.allocations || [];
            const selections = paperSelections[type] || [];

            selections.forEach((paperId: any) => {
                const paper = availablePapers.find((p) => p._id === paperId);
                const alloc = allocations.find((a: any) => a.paperId === paperId);
                if (!paper || !alloc) return;

                // Base used KG = allocated in this order
                let usedKg = alloc.allocatedKg || 0;

                // Adjust used KG if GSM matches other papers
                const gsm1 = Number(row.paperKG.paper1.gsm);
                const gsm2 = Number(row.paperKG.paper2.gsm);
                const gsm3 = Number(row.paperKG.paper3.gsm);

                if (type === "paper2" && gsm1 === gsm2) {
                    const relatedAlloc = newAllocations.paper1?.find((x: any) => x.paperId === paperId);
                    if (relatedAlloc) usedKg += relatedAlloc.allocatedKg;
                }

                if (type === "paper3") {
                    if (gsm3 === gsm1) {
                        const related1 = newAllocations.paper1?.find((x: any) => x.paperId === paperId);
                        if (related1) usedKg += related1.allocatedKg;
                    }
                    if (gsm3 === gsm2) {
                        const related2 = newAllocations.paper2?.find((x: any) => x.paperId === paperId);
                        if (related2) usedKg += related2.allocatedKg;
                    }
                }

                summaries[type].push(`${usedKg.toFixed(2)} KG used from ${paper.kg.toFixed(0)} KG roll`);
            });
        });

        setPaperUsageSummary(summaries);
    }, [paperSelections, allAllocations, availablePapers, newAllocations, row.paperKG]);


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
                            inputProps={{
                                min: moment().format("YYYY-MM-DD"), // Restrict to today or future dates
                            }}
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
                            required={formData.isPunching}
                            error={formData.isPunching && !formData.dyeNumber}
                            helperText={formData.isPunching && !formData.dyeNumber ? "Required for punching" : ""}
                        />
                        <TextField
                            label="Dye Sheet Size"
                            value={formData.dyeSize}
                            onChange={(e) => handleFormChange("dyeSize", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 100 }}
                            disabled={isCompleted}
                            required={formData.isPunching}
                            error={formData.isPunching && !formData.dyeSize}
                            helperText={formData.isPunching && !formData.dyeSize ? "Required for punching" : ""}
                        />
                        {/* <TextField
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
                    /> */}
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

                    <Stack direction="row" spacing={2} mb={2}>
                        {/* Process Selection - Multiple Checkboxes */}
                        <FormControl component="fieldset">
                            <FormGroup row>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.isPinning}
                                            onChange={(e) => handleProcessChange("isPinning", e.target.checked)}
                                            name="pinning"
                                        />
                                    }
                                    label="Pinning"
                                    disabled={isCompleted}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.isPasting}
                                            onChange={(e) => handleProcessChange("isPasting", e.target.checked)}
                                            name="pasting"
                                        />
                                    }
                                    label="Pasting"
                                    disabled={isCompleted}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.isPunching}
                                            onChange={(e) => handleProcessChange("isPunching", e.target.checked)}
                                            name="punching"
                                        />
                                    }
                                    label="Punching"
                                    disabled={isCompleted}
                                />
                            </FormGroup>
                        </FormControl>

                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>Varnish</InputLabel>
                            <Select
                                value={formData.varnish ? "yes" : "no"}
                                label="Varnish"
                                onChange={(e) => handleFormChange("varnish", e.target.value === "yes")}
                            >
                                <MenuItem value="no">No</MenuItem>
                                <MenuItem value="yes">Yes</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>Lamination</InputLabel>
                            <Select
                                value={formData.lamination ? "yes" : "no"}
                                label="Lamination"
                                onChange={(e) => handleFormChange("lamination", e.target.value === "yes")}
                                disabled={formData.varnish}
                            >
                                <MenuItem value="no">No</MenuItem>
                                <MenuItem value="yes">Yes</MenuItem>
                            </Select>
                        </FormControl>

                        {formData.lamination && (
                            <FormControl sx={{ width: 200 }}>
                                <InputLabel>Lamination Type</InputLabel>
                                <Select
                                    value={formData.laminationType}
                                    label="Lamination Type"
                                    onChange={(e) => handleFormChange("laminationType", e.target.value)}
                                >
                                    <MenuItem value="glossy">Glossy</MenuItem>
                                    <MenuItem value="mate">Mate</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {formData.laminationType !== "glossy" && (
                            <>
                                <FormControl sx={{ width: 200 }}>
                                    <InputLabel>UV</InputLabel>
                                    <Select
                                        value={formData.uv ? "yes" : "no"}
                                        label="UV"
                                        onChange={(e) => handleFormChange("uv", e.target.value === "yes")}
                                        disabled={formData.varnish}
                                    >
                                        <MenuItem value="no">No</MenuItem>
                                        <MenuItem value="yes">Yes</MenuItem>
                                    </Select>
                                </FormControl>

                                {formData.uv && formData.laminationType === "mate" && (
                                    <FormControl sx={{ width: 220 }}>
                                        <InputLabel>UV Type</InputLabel>
                                        <Select
                                            value={formData.uvType}
                                            label="UV Type"
                                            onChange={(e) => handleFormChange("uvType", e.target.value)}
                                        >
                                            <MenuItem value="uv">UV</MenuItem>
                                            <MenuItem value="uv_mate">UV + Mate Lamination</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            </>
                        )}
                    </Stack>
                    <PaperAssign
                        row={row}
                        isCompleted={isCompleted}
                        paperRequirements={paperRequirements}
                        allAllocations={allAllocations}
                        paperSelections={paperSelections}
                        isPaperSelectionRequired={isPaperSelectionRequired}
                        newAllocations={newAllocations}
                        availablePapers={availablePapers}
                        setPaperSelections={setPaperSelections}
                    />

                    <PaperSelection
                        setSelectedPrinter={setSelectedPrinter}
                        setSelectedBinder={setSelectedBinder}
                        setSelectedDesigner={setSelectedDesigner}
                        isCompleted={isCompleted}
                        selectedPrinter={selectedPrinter}
                        printers={printers}
                        staffLoading={staffLoading}
                        selectedBinder={selectedBinder}
                        selectedDesigner={selectedDesigner}
                        binders={binders}
                        designers={designers}
                        data={row}
                    />

                    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                        <TextField
                            label="Dye Remark"
                            value={formData.dyeRemark}
                            onChange={(e) => handleFormChange("dyeRemark", e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            sx={{ flex: 1, minWidth: 150, maxWidth: 350 }}
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
                            sx={{ flex: 1, minWidth: 150, maxWidth: 350 }}
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
                            sx={{ flex: 1, minWidth: 150, maxWidth: 350 }}
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