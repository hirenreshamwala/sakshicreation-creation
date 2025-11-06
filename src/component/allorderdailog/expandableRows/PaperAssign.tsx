import {
    Box,
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
    Stack
} from "@mui/material";
import { useCallback } from "react";
import { toast } from "react-toastify";
import RemoveIcon from '@mui/icons-material/Remove';
import { PaperOption, InventoryPaper } from "@/constants/interface";

function PaperAssign({
    row,
    isCompleted,
    paperRequirements,
    allAllocations,
    paperSelections,
    isPaperSelectionRequired,
    newAllocations,
    availablePapers,
    setPaperSelections
}: any) {

    if (!row.paperKG)
        return null;

    const paperData = row.paperKG;
    const hasPaperRequirements = paperRequirements?.paper1 > 0 || paperRequirements?.paper2 > 0 || paperRequirements?.paper3 > 0;

    if (!hasPaperRequirements)
        return null;

    const addPaperToSelection = useCallback((paperType: keyof typeof paperSelections, paperId: any) => {
        if (paperSelections[paperType].includes(paperId)) {
            toast.info("This paper is already selected for this paper type");
            return;
        }

        setPaperSelections((prev: any) => ({
            ...prev,
            [paperType]: [...prev[paperType], paperId]
        }));
        toast.success("Paper added to selection");
    }, [paperSelections]);

    const removePaperFromSelection = useCallback((paperType: keyof typeof paperSelections, paperId: string) => {
        setPaperSelections((prev: any) => ({
            ...prev,
            [paperType]: prev[paperType].filter((id: any) => id !== paperId)
        }));
        toast.info("Paper removed from selection");
    }, []);

    const renderPaperTypeSelection = (paperType: any, paperInfo: any) => {
        const requirement = paperRequirements[paperType];
        if (requirement <= 0) return null;

        const allocations = allAllocations[paperType].allocations;
        const totalAllocated = allocations.reduce((sum: any, a: any) => sum + a.allocatedKg, 0);
        const isSufficient = allAllocations[paperType].isSufficient;

        const gsm1 = Number(row.paperKG.paper1.gsm);
        const gsm2 = Number(row.paperKG.paper2.gsm);
        const gsm3 = Number(row.paperKG.paper3.gsm);

        return (
            <Grid item xs={12} md={4} key={paperType}>
                <Typography variant="subtitle1" gutterBottom>
                    {paperType.toUpperCase() as any} ({paperInfo.gsm} GSM) - Required: {requirement.toFixed(2)} KG
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
                    getOptionLabel={(option: any) => {
                        return `${option.label} ( BF:${option.bf || ""} ) ( COLOR:${option.color || ""} ) ( REEL/BATCH NO:${option.reelBatchNo || ""} )`;
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Available Papers" placeholder="Select a paper to add" />
                    )}
                    onChange={(e, newValue) => {
                        if (newValue) addPaperToSelection(paperType, newValue.value);
                    }}
                    disabled={isCompleted}
                />

                <List
                    dense
                    sx={{
                        mt: 1,
                        maxHeight: 200,
                        overflow: "auto",
                        border: "1px solid #f0f0f0",
                        borderRadius: 1,
                    }}
                >
                    {paperSelections[paperType].length === 0 ? (
                        <ListItem>
                            <ListItemText
                                primary="No papers selected"
                                sx={{ textAlign: "center", color: "text.secondary" }}
                            />
                        </ListItem>
                    ) : (
                        paperSelections[paperType].map((paperId: any, index: any) => {
                            const paper = availablePapers.find((p: any) => p._id === paperId);
                            if (!paper) {
                                console.warn(`Paper with ID ${paperId} not found in available papers`);
                                return null;
                            }

                            const allocation = allocations.find((a: any) => a.paperId === paperId);
                            const allocatedQuantity = allocation?.allocatedKg || 0;

                            let showKg =
                                Number(paper.kg) -
                                (paper.allocations?.length
                                    ? paper.allocations.filter((item: any) => item.qpOrder !== row._id).reduce(
                                        (sum: any, item: any) => sum + (item?.allocatedKg || 0),
                                        0
                                    )
                                    : 0);

                            if (paperType === "paper2") {
                                if (gsm1 === gsm2) {
                                    const relatedAlloc = newAllocations.paper1?.find(
                                        (x: any) => x.paperId === paperId
                                    );
                                    if (relatedAlloc) showKg -= relatedAlloc.allocatedKg;
                                }
                            }

                            if (paperType === "paper3") {
                                if (gsm1 === gsm2 && gsm2 === gsm3) {
                                    const related1 = newAllocations.paper1?.find(
                                        (x: any) => x.paperId === paperId
                                    );
                                    const related2 = newAllocations.paper2?.find(
                                        (x: any) => x.paperId === paperId
                                    );
                                    if (related1) showKg -= related1.allocatedKg;
                                    if (related2) showKg -= related2.allocatedKg;
                                }
                                else if (gsm1 === gsm3 && gsm2 !== gsm3) {
                                    const related1 = newAllocations.paper1?.find(
                                        (x: any) => x.paperId === paperId
                                    );
                                    if (related1) showKg -= related1.allocatedKg;
                                }
                                else if (gsm2 === gsm3 && gsm1 !== gsm3) {
                                    const related2 = newAllocations.paper2?.find(
                                        (x: any) => x.paperId === paperId
                                    );
                                    if (related2) showKg -= related2.allocatedKg;
                                }
                            }

                            return (
                                <ListItem key={`${paperType}-${paperId}-${index}`} divider>
                                    <ListItemText
                                        primary={paper.paperName}
                                        secondary={
                                            <span>
                                                {showKg.toFixed(2)} KG Roll {paper.bf && `(BF: ${paper.bf})`}
                                                <br />
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
                            Insufficient allocation (Required: {requirement.toFixed(2)} KG, Shortage:{" "}
                            {(requirement - totalAllocated).toFixed(2)} KG)
                        </Typography>
                    )}
                </Box>
            </Grid>
        );
    };

    const getAllAvailablePapersForRequirement = useCallback((
        gsm: string,
        deckal: string,
        requiredKg: number,
        paperType: keyof typeof paperSelections
    ): PaperOption[] => {

        const matchingPapers = availablePapers.filter((item: InventoryPaper) => {
            const itemDeckal = typeof item.deckal === "string" ? item.deckal.trim() : item.deckal;
            const targetDeckal = typeof deckal === "string" ? deckal.trim() : deckal;

            return Number(itemDeckal) === Number(targetDeckal) && Number(item.gsm) === Number(gsm);
        });

        return matchingPapers
            .map((item: any) => {
                let allocatedKg = (item.allocations || []).reduce(
                    (sum: number, a: any) => sum + (a.allocatedKg || 0),
                    0
                );

                const gsm1 = Number(row.paperKG.paper1.gsm);
                const gsm2 = Number(row.paperKG.paper2.gsm);
                const gsm3 = Number(row.paperKG.paper3.gsm);

                if (paperType === "paper2") {
                    if (gsm1 === gsm2) {
                        const paper1Allocations =
                            newAllocations?.paper1?.filter((a: any) => a.paperId === item._id) ||
                            [];
                        const totalPaper1Alloc = paper1Allocations.reduce(
                            (sum: number, a: any) => sum + (a.allocatedKg || 0),
                            0
                        );
                        allocatedKg += totalPaper1Alloc;
                    }
                }

                if (paperType === "paper3") {
                    const sameAsPaper1 = gsm3 === gsm1;
                    const sameAsPaper2 = gsm3 === gsm2;
                    const diffFromPaper1 = gsm3 !== gsm1;
                    const diffFromPaper2 = gsm3 !== gsm2;

                    if (sameAsPaper1 && diffFromPaper2) {
                        const paper1Allocations =
                            newAllocations?.paper1?.filter((a: any) => a.paperId === item._id) ||
                            [];
                        const totalPaper1Alloc = paper1Allocations.reduce(
                            (sum: number, a: any) => sum + (a.allocatedKg || 0),
                            0
                        );
                        allocatedKg += totalPaper1Alloc;
                    }

                    if (sameAsPaper2 && diffFromPaper1) {
                        const paper2Allocations =
                            newAllocations?.paper2?.filter((a: any) => a.paperId === item._id) ||
                            [];
                        const totalPaper2Alloc = paper2Allocations.reduce(
                            (sum: number, a: any) => sum + (a.allocatedKg || 0),
                            0
                        );
                        allocatedKg += totalPaper2Alloc;
                    }

                    if (sameAsPaper1 && sameAsPaper2) {
                        const paper1Allocations =
                            newAllocations?.paper1?.filter((a: any) => a.paperId === item._id) ||
                            [];
                        const paper2Allocations =
                            newAllocations?.paper2?.filter((a: any) => a.paperId === item._id) ||
                            [];
                        const totalAlloc = [...paper1Allocations, ...paper2Allocations].reduce(
                            (sum: number, a: any) => sum + (a.allocatedKg || 0),
                            0
                        );
                        allocatedKg += totalAlloc;
                    }

                    if (gsm2 === gsm3 && gsm1 !== gsm3) {
                        const paper2Allocations =
                            newAllocations?.paper2?.filter((a: any) => a.paperId === item._id) ||
                            [];
                        const totalPaper2Alloc = paper2Allocations.reduce(
                            (sum: number, a: any) => sum + (a.allocatedKg || 0),
                            0
                        );
                        allocatedKg += totalPaper2Alloc;
                    }
                }

                const availableKg = Math.max(0, Number(item.kg) - allocatedKg);

                return {
                    value: item._id,
                    bf: item.bf,
                    color: item.color,
                    reelBatchNo: item.reelBatchNo,
                    label: `${availableKg.toFixed(2)} KG`,
                    kg: item.kg,
                    usedKg: allocatedKg,
                    availableKg,
                    isSufficient: availableKg >= requiredKg,
                };
            })
            .filter((option: any) => option.availableKg > 0);
    }, [availablePapers, newAllocations, row.paperKG]);

    return (
        <>
            {row?.paperUsageSummary &&
                Object.entries(row?.paperUsageSummary).some(([_, arr]) => arr?.length > 0) ? (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#7f56d9' }}>
                        📋 Paper Allocation Summary
                    </Typography>

                    <Stack spacing={1}>
                        {Object.entries(row?.paperUsageSummary)?.map(([paperType, usageArray]) => {
                            if (!usageArray || usageArray.length === 0) return null;

                            return (
                                <Box key={paperType}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {paperType.toUpperCase()}:
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {usageArray?.map((usage: any, index: any) => (
                                            <Chip
                                                key={index}
                                                label={usage}
                                                color="primary"
                                                size="small"
                                                sx={{
                                                    mb: 0.5,
                                                    fontWeight: 500,
                                                    backgroundColor: '#e6e6e6ff',
                                                    color: '#7f56d9',
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            ) : (
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

                        {(paperSelections?.paper1?.length > 0 || paperSelections?.paper2?.length > 0 || paperSelections?.paper3?.length > 0) && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    📋 Paper Allocation Summary:
                                </Typography>
                                {Object.entries(paperSelections as any).map(([paperType, paperIds]) => {
                                    if (paperIds.length === 0) return null;

                                    const requirement = paperRequirements[paperType as keyof typeof paperRequirements];
                                    const allocations = allAllocations[paperType as keyof typeof allAllocations];
                                    const totalAllocated = allocations.allocations.filter((item: any) => item.qpOrder !== row._id).reduce((sum: any, a: any) => sum + a.allocatedKg, 0);

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
            )}
        </>
    )
}

export default PaperAssign