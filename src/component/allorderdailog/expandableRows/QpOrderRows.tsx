import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { getAllInventoryThunk } from "@/store/slices/inventorySlice";
import { Box, Stack } from "@mui/material";
import moment from "moment";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { calculateKantan, calculatePaperKg } from "@/utills/qpCalculations";
import ViewRemark from "./ViewRemark";
import RemarkModal from "./RemarkModal";
import { ExpandedRowFormProps, PaperAllocationsResult, PaperAllocation, InventoryPaper } from "@/constants/interface";
import PaperSelection from "./PaperSelection";
import PaperAssign from "./PaperAssign";
import QpOrderStep1 from "./QpOrderStep1";
import StackSelection from "./StackSelection";
import DriverSelection from "./DriverSelection";

export const ExpandedRowForm = ({ row, setEditData, setOpen }: ExpandedRowFormProps) => {
    const dispatch = useAppDispatch();
    const [remarkText, setRemarkText] = useState("");
    const [tempStartDate, setTempStartDate] = useState("");
    // const [isInitialized, setIsInitialized] = useState(false);
    const [remarkModalOpen, setRemarkModalOpen] = useState(false);
    const [viewRemarksOpen, setViewRemarksOpen] = useState(false);
    const [isInitialUnitSet, setIsInitialUnitSet] = useState(false);
    const [selectedBinder, setSelectedBinder] = useState(row.binder?._id || null);
    const [selectedPrinter, setSelectedPrinter] = useState(row.printer?._id || null);
    const [selectedDesigner, setSelectedDesigner] = useState(row.designer?._id || null);
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
        ...row,
        actualNoOfPieces: row.actualNoOfPieces || row.operatorNoOfPieces || "",
        printer: row.printer?._id || null,
        binder: row.binder?._id || null,
        designer: row.designer?._id || null,
        selectedPapers: row.selectedPapers || {
            paper1: [],
            paper2: [],
            paper3: []
        },
        lamination: row.lamination || false,
        uv: row.uv || false,
        varnish: row.varnish || false,
        isPinning: row.isPinning || false,
        isPasting: row.isPasting || false,
        isPunching: row.isPunching || false
    });

    const [initialFormData, setInitialFormData] = useState(formData);

    useEffect(() => {
        if (!staffList.length) dispatch(getAllStaffThunk());
        if (!allInventory.length) dispatch(getAllInventoryThunk());
    }, []);

    const extractInventoryIds = useCallback((selectedPapers: any) => {
        const result = {
            paper1: [] as string[],
            paper2: [] as string[],
            paper3: [] as string[]
        };

        if (!selectedPapers) return result;

        const extractIds = (paperData: any): string[] => {
            if (!paperData) return [];

            if (Array.isArray(paperData)) {

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

        result.paper1 = extractIds(selectedPapers?.paper1);
        result.paper2 = extractIds(selectedPapers?.paper2);
        result.paper3 = extractIds(selectedPapers?.paper3);

        return result;
    }, []);

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
            ...row,
            actualNoOfPieces: row.actualNoOfPieces || row.operatorNoOfPieces || "",
            printer: row.printer?._id || null,
            binder: row.binder?._id || null,
            designer: row.designer?._id || null,
            selectedPapers: row.selectedPapers || {
                paper1: [],
                paper2: [],
                paper3: []
            },

            lamination: Boolean(row.lamination),
            uv: Boolean(row.uv),
            varnish: Boolean(row.varnish),
            isPinning: Boolean(row.isPinning),
            isPasting: Boolean(row.isPasting),
            isPunching: Boolean(row.isPunching)
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

        setSelectedBinder(row.binder?._id || null);
        setSelectedPrinter(row.printer?._id || null);
        setSelectedDesigner(row.designer?._id || null);
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
        // if (formData.status === "In Progress" && row.status === "Pending") {
        //     const hasPaperRequirements = paperRequirements?.paper1 > 0 || paperRequirements?.paper2 > 0 || paperRequirements?.paper3 > 0;
        //     setIsPaperSelectionRequired(hasPaperRequirements);

        //     if (hasPaperRequirements) toast.info("Please select papers from inventory before proceeding");
        // }
    }, [formData.status, row.status, paperRequirements]);

    const designers = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "designer");
    const printers = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "printer");
    const binders = staffList.filter((staff) => staff.role?.roleName?.toLowerCase() === "binder");

    const calculateAllPaperAllocations = useCallback((): PaperAllocationsResult => {

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

            for (const paper of papers) {
                if (remainingRequired <= 0) {
                    allocations.push({
                        paperId: paper._id,
                        allocatedKg: 0,
                        bf: paper.bf,
                        color: paper.color,
                        reelBatchNo: paper.reelBatchNo,
                    });
                    continue;
                }

                const availableKg = paperQuantities[paper._id] || 0;
                if (availableKg <= 0) {
                    allocations.push({
                        paperId: paper._id,
                        allocatedKg: 0,
                        bf: paper.bf,
                        color: paper.color,
                        reelBatchNo: paper.reelBatchNo,
                    });
                    continue;
                }

                const allocatedKg = Math.min(availableKg, remainingRequired);

                allocations.push({
                    paperId: paper._id,
                    allocatedKg,
                    bf: paper.bf,
                    color: paper.color,
                    reelBatchNo: paper.reelBatchNo,
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

        const paper1Result = calculateForType("paper1", paperRequirements?.paper1 || 0);
        const paper2Result = calculateForType("paper2", paperRequirements?.paper2 || 0);
        const paper3Result = calculateForType("paper3", paperRequirements?.paper3 || 0);

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
                    bf: allocation.bf,
                    color: allocation.color,
                    reelBatchNo: allocation.reelBatchNo,
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

            if (field === "startDate" && row.startDate === "") {
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
            setFormData((prev: any) => ({
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
            setFormData((prev: any) => ({
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
            setFormData((prev: any) => ({
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

        if (formData.status === "In Progress" && row.status === "Pending" && row.step > 0) {
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
                ...formData,
                kantan: formData?.kantan?._id || undefined,
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
            )
                updateData.status = 'Designer';

            else if (
                rowPapers.paper1.length === 0 &&
                rowPapers.paper2.length === 0 &&
                rowPapers.paper3.length === 0 &&
                updatePapers.paper1.length > 0 &&
                updatePapers.paper2.length > 0 &&
                updatePapers.paper3.length > 0 &&
                !selectedDesigner
            )
                updateData.status = 'Paper cutting';

            await dispatch(updateQPOrderThunk({ id: formData._id, data: { ...updateData, step: row.step === 0 ? row.step + 1 : row.step } })).unwrap();

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
        // Reset paper selections to initial values
        const initialSelections: any = extractInventoryIds(initialFormData.selectedPapers);
        setPaperSelections(initialSelections);
        // ✅ CORRECTED: Reset staff selections
        setSelectedBinder(initialFormData.binder);
        setSelectedPrinter(initialFormData.printer);
        setSelectedDesigner(initialFormData.designer);
        toast.info("Changes cancelled");
    }, [initialFormData, extractInventoryIds]);

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

    console.log(row, 'row', row.driver, row.status === "Completed" && row?.driver?._id === undefined)

    return (
        <Box sx={{ p: 2, backgroundColor: "#f9fafb" }}>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    {row.step === 4 && row.status !== "Completed" ? <QpOrderStep1
                        formData={formData}
                        handleFormChange={handleFormChange}
                        isCompleted={isCompleted}
                        handleProcessChange={handleProcessChange}
                    /> : null}
                    {row.step === 4 && row.status !== "Completed" ? <>
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
                            formData={formData}
                            handleFormChange={handleFormChange}
                        />
                    </> : null}

                    {row.step === 0 ? <StackSelection
                        formData={formData}
                        row={row}
                        isCompleted={isCompleted}
                        paperRequirement={paperRequirements}
                    /> : null}

                    {row.status === "Completed" && row?.driver?._id === undefined ? <DriverSelection row={row} /> : null}
                    {row.status === "Completed" && row?.driver?._id !== undefined ?
                        <Stack>  {row?.deliveryStatus ? `Delivery Status :${row?.deliveryStatus || ""}` : `Order Will Going to ${row?.deliverTo || ""}`}</Stack> : null
                    }

                    <Stack direction="row" spacing={2}>
                        {(row.step === 0 || row.step === 4) || row.step === 4 || row.step === 1 ? <>
                            <ThemeButton
                                type="submit"
                                disabled={isCompleted || (row.step > 0 && isPaperSelectionRequired && !arePaperSelectionsValid())}
                            >
                                Submit
                            </ThemeButton>
                            <ThemeButton type="button" disabled={isCompleted} onClick={handleCancel} variant="outlined">
                                Cancel
                            </ThemeButton>
                        </> : null}
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