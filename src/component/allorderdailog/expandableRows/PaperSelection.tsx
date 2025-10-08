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
} from "@mui/material";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { calculateKantan, calculatePaperKg } from "@/utills/qpCalculations";
import { ORDER_STATUSES } from "@/constants";
import ViewRemark from "./ViewRemark";
import RemarkModal from "./RemarkModal";


const RenderPaperSelection = ({row, isPaperSelectionValid, isPaperSelectionRequired, paperRequirements, getAllAvailablePapersForRequirement, handlePaperSelection, paperSelections, isCompleted, availablePapers }) => {
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
                                multiple
                                size="small"
                                fullWidth
                                value={
                                    (paperSelections.paper1 || []).map(id =>
                                        getAllAvailablePapersForRequirement(
                                            row.actualPaperKG.paper1.gsm,
                                            row.actualPaperKG.paper1.deckal,
                                            paperRequirements.paper1,
                                            "paper1"
                                        ).find((p) => p.value === id)
                                    ).filter(Boolean) as PaperOption[]
                                }
                                onChange={(e, newValue) =>
                                    handlePaperSelection("paper1", newValue.map(option => option.value))
                                }
                                options={getAllAvailablePapersForRequirement(
                                    row.actualPaperKG.paper1.gsm,
                                    row.actualPaperKG.paper1.deckal,
                                    paperRequirements.paper1,
                                    "paper1"
                                )}
                                getOptionDisabled={(option) => option.isSelectedForOtherType}
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
                            {paperSelections.paper1 && paperSelections.paper1.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                        Selected: {(paperSelections.paper1 || []).reduce((total, paperId) => {
                                            const paper = availablePapers.find(p => p._id === paperId);
                                            return total + (paper ? (paper.kg - (paper.usedKg || 0)) : 0);
                                        }, 0).toFixed(2)} KG
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                    )}

                    {paperRequirements.paper2 > 0 && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Autocomplete
                                multiple
                                size="small"
                                fullWidth
                                value={
                                    (paperSelections.paper2 || []).map(id =>
                                        getAllAvailablePapersForRequirement(
                                            row.actualPaperKG.paper2.gsm,
                                            row.actualPaperKG.paper2.deckal,
                                            paperRequirements.paper2,
                                            "paper2"
                                        ).find((p) => p.value === id)
                                    ).filter(Boolean) as PaperOption[]
                                }
                                onChange={(e, newValue) =>
                                    handlePaperSelection("paper2", newValue.map(option => option.value))
                                }
                                options={getAllAvailablePapersForRequirement(
                                    row.actualPaperKG.paper2.gsm,
                                    row.actualPaperKG.paper2.deckal,
                                    paperRequirements.paper2,
                                    "paper2"
                                )}
                                getOptionDisabled={(option) => option.isSelectedForOtherType}
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
                            {paperSelections.paper2 && paperSelections.paper2.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                        Selected: {(paperSelections.paper2 || []).reduce((total, paperId) => {
                                            const paper = availablePapers.find(p => p._id === paperId);
                                            return total + (paper ? (paper.kg - (paper.usedKg || 0)) : 0);
                                        }, 0).toFixed(2)} KG
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                    )}

                    {paperRequirements.paper3 > 0 && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Autocomplete
                                multiple
                                size="small"
                                fullWidth
                                value={
                                    (paperSelections.paper3 || []).map(id =>
                                        getAllAvailablePapersForRequirement(
                                            row.actualPaperKG.paper3.gsm,
                                            row.actualPaperKG.paper3.deckal,
                                            paperRequirements.paper3,
                                            "paper3"
                                        ).find((p) => p.value === id)
                                    ).filter(Boolean) as PaperOption[]
                                }
                                onChange={(e, newValue) =>
                                    handlePaperSelection("paper3", newValue.map(option => option.value))
                                }
                                options={getAllAvailablePapersForRequirement(
                                    row.actualPaperKG.paper3.gsm,
                                    row.actualPaperKG.paper3.deckal,
                                    paperRequirements.paper3,
                                    "paper3"
                                )}
                                getOptionDisabled={(option) => option.isSelectedForOtherType}
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
                            {paperSelections.paper3 && paperSelections.paper3.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                        Selected: {(paperSelections.paper3 || []).reduce((total, paperId) => {
                                            const paper = availablePapers.find(p => p._id === paperId);
                                            return total + (paper ? (paper.kg - (paper.usedKg || 0)) : 0);
                                        }, 0).toFixed(2)} KG
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                    )}
                </Grid>

                {/* Allocation Summary */}
                {(paperSelections.paper1?.length || paperSelections.paper2?.length || paperSelections.paper3?.length) && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            📋 Paper Allocation Summary:
                        </Typography>
                        {Object.entries(paperSelections).map(([paperType, paperIds]) => {
                            if (!paperIds || paperIds.length === 0 || paperRequirements[paperType as keyof PaperSelection] === 0) return null;

                            const requirement = paperRequirements[paperType as keyof PaperSelection];
                            let totalSelectedKg = 0;
                            const paperDetails = paperIds.map(paperId => {
                                const paper = availablePapers.find(p => p._id === paperId);
                                if (paper) {
                                    const availableKg = paper.kg - (paper.usedKg || 0);
                                    totalSelectedKg += availableKg;
                                    return `${paper.paperName} (${availableKg.toFixed(2)} KG)`;
                                }
                                return '';
                            }).filter(Boolean);

                            return (
                                <Typography key={paperType} variant="body2" sx={{ mt: 0.5 }}>
                                    • {paperType.toUpperCase()}: {paperDetails.join(', ')}
                                    (Total: {totalSelectedKg.toFixed(2)} KG, Required: {requirement.toFixed(2)} KG)
                                    {totalSelectedKg < requirement && ' ⚠️ Insufficient'}
                                </Typography>
                            );
                        })}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default RenderPaperSelection;