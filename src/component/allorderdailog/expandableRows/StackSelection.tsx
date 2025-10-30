import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Chip,
    CircularProgress,
    Alert,
    Grid,
    Divider
} from '@mui/material';
import { inventoryService } from '@/services/inventory.service';
// import { inventoryService } from '@/services'; // Adjust import path as needed

function StackSelection({
    formData,
    row,
    isCompleted,
    paperRequirements
}: any) {
    console.log(row, 'lkxdnflkdfnj')
    const [inventorySummary, setInventorySummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSource, setSelectedSource] = useState<'godown' | 'factory' | 'new' | null>(null);

    // Prepare data for inventory summary API
    const getInventorySummaryData = () => {
        return {
            orderId: row._id,
            paperKG:row.paperKG,
            paperRequirements: {
                paper1: paperRequirements?.paper1 || 0,
                paper2: paperRequirements?.paper2 || 0,
                paper3: paperRequirements?.paper3 || 0
            },
            boxSpecifications: {
                length: row.orderdata?.length,
                width: row.orderdata?.width,
                height: row.orderdata?.height,
                deckal: row.orderdata?.deckal,
                ply: row.orderdata?.ply,
                paper1GSM: row.orderdata?.paper1GSM,
                paper2GSM: row.orderdata?.paper2GSM,
                paper3GSM: row.orderdata?.paper3GSM
            },
            quantity: formData.actualNoOfPieces || row.noOfPieces
        };
    };

    const fetchInventorySummary = async () => {
        try {
            setLoading(true);
            setError('');
            const requestData = getInventorySummaryData();
            const response = await inventoryService.getInventorySummery(requestData);
            setInventorySummary(response.data);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch inventory summary');
            console.error('Inventory summary error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.step === 1) { // Only fetch when in step 2
            fetchInventorySummary();
        }
    }, [formData.step]);

    const handleSourceSelect = (source: 'godown' | 'factory' | 'new') => {
        setSelectedSource(source);
        // You can call your API here to update the order with the selected source
        // updateOrderSource(source);
    };

    const calculateAvailability = (locationData: any) => {
        if (!locationData) return { available: 0, totalRequired: 0, percentage: 0 };

        const totalRequired = paperRequirements?.paper1 + paperRequirements?.paper2 + paperRequirements?.paper3;
        const available = locationData.availableKg || 0;
        const percentage = totalRequired > 0 ? (available / totalRequired) * 100 : 0;

        return { available, totalRequired, percentage };
    };

    const getAvailabilityColor = (percentage: number) => {
        if (percentage >= 100) return 'success';
        if (percentage >= 50) return 'warning';
        return 'error';
    };

    const getAvailabilityText = (percentage: number) => {
        if (percentage >= 100) return 'Fully Available';
        if (percentage >= 50) return 'Partially Available';
        return 'Insufficient';
    };

    if (loading) {
        return (
            <Card sx={{ mt: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Checking inventory availability...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Alert severity="error">{error}</Alert>
                    <Button
                        variant="outlined"
                        onClick={fetchInventorySummary}
                        sx={{ mt: 2 }}
                    >
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!inventorySummary) {
        return null;
    }

    const godownAvailability = calculateAvailability(inventorySummary.godown);
    const factoryAvailability = calculateAvailability(inventorySummary.factory);

    return (
        <Card sx={{ mt: 2, border: "1px solid #e0e0e0" }}>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}>
                    📦 Select Box Source
                </Typography>

                {/* Requirements Summary */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Paper Requirements:
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Chip
                            label={`Paper 1: ${row?.paperKG?.paper1?.totalKg} KG`}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            label={`Paper 2: ${row?.paperKG?.paper2?.totalKg} KG`}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            label={`Paper 3: ${row?.paperKG?.paper3?.totalKg} KG`}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            label={`Total: ${row?.totalKg} KG`}
                            color="primary"
                            size="small"
                        />
                    </Stack>
                </Box>

                <Grid container spacing={3}>
                    {/* Godown Option */}
                    <Grid item xs={12} md={4}>
                        <Card
                            variant={selectedSource === 'godown' ? 'elevation' : 'outlined'}
                            elevation={selectedSource === 'godown' ? 4 : 0}
                            sx={{
                                cursor: isCompleted ? 'default' : 'pointer',
                                borderColor: selectedSource === 'godown' ? 'primary.main' : 'grey.300',
                                height: '100%',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: isCompleted ? 0 : 4
                                }
                            }}
                            onClick={() => !isCompleted && handleSourceSelect('godown')}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    🏬 Godown
                                </Typography>

                                <Chip
                                    label={getAvailabilityText(godownAvailability.percentage)}
                                    color={getAvailabilityColor(godownAvailability.percentage)}
                                    sx={{ mb: 2 }}
                                />

                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Available: <strong>{godownAvailability.available.toFixed(2)} KG</strong>
                                </Typography>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Required: <strong>{godownAvailability.totalRequired.toFixed(2)} KG</strong>
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Coverage: {godownAvailability.percentage.toFixed(1)}%
                                    </Typography>
                                </Box>

                                <Button
                                    variant={selectedSource === 'godown' ? "contained" : "outlined"}
                                    disabled={isCompleted || godownAvailability.available === 0}
                                    fullWidth
                                >
                                    {godownAvailability.available === 0 ? 'Not Available' : 'Select Godown'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Factory Option */}
                    <Grid item xs={12} md={4}>
                        <Card
                            variant={selectedSource === 'factory' ? 'elevation' : 'outlined'}
                            elevation={selectedSource === 'factory' ? 4 : 0}
                            sx={{
                                cursor: isCompleted ? 'default' : 'pointer',
                                borderColor: selectedSource === 'factory' ? 'primary.main' : 'grey.300',
                                height: '100%',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: isCompleted ? 0 : 4
                                }
                            }}
                            onClick={() => !isCompleted && handleSourceSelect('factory')}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    🏭 Factory
                                </Typography>

                                <Chip
                                    label={getAvailabilityText(factoryAvailability.percentage)}
                                    color={getAvailabilityColor(factoryAvailability.percentage)}
                                    sx={{ mb: 2 }}
                                />

                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Available: <strong>{factoryAvailability.available.toFixed(2)} KG</strong>
                                </Typography>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Required: <strong>{factoryAvailability.totalRequired.toFixed(2)} KG</strong>
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Coverage: {factoryAvailability.percentage.toFixed(1)}%
                                    </Typography>
                                </Box>

                                <Button
                                    variant={selectedSource === 'factory' ? "contained" : "outlined"}
                                    disabled={isCompleted || factoryAvailability.available === 0}
                                    fullWidth
                                >
                                    {factoryAvailability.available === 0 ? 'Not Available' : 'Select Factory'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Create New Option */}
                    <Grid item xs={12} md={4}>
                        <Card
                            variant={selectedSource === 'new' ? 'elevation' : 'outlined'}
                            elevation={selectedSource === 'new' ? 4 : 0}
                            sx={{
                                cursor: isCompleted ? 'default' : 'pointer',
                                borderColor: selectedSource === 'new' ? 'primary.main' : 'grey.300',
                                height: '100%',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: isCompleted ? 0 : 4
                                }
                            }}
                            onClick={() => !isCompleted && handleSourceSelect('new')}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    🆕 Create New
                                </Typography>

                                <Chip
                                    label="Always Available"
                                    color="info"
                                    sx={{ mb: 2 }}
                                />

                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Create new boxes in factory
                                </Typography>

                                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                    Use when boxes are not available in stock
                                </Typography>

                                <Box sx={{ mb: 2, minHeight: '24px' }}>
                                    {/* Spacer for alignment */}
                                </Box>

                                <Button
                                    variant={selectedSource === 'new' ? "contained" : "outlined"}
                                    color="secondary"
                                    disabled={isCompleted}
                                    fullWidth
                                >
                                    Create New
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Selected Source Info */}
                {selectedSource && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            ✅ Selected: {selectedSource === 'godown' ? 'Move from Godown' :
                                selectedSource === 'factory' ? 'Move from Factory' :
                                    'Create New in Factory'}
                        </Typography>
                    </Box>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={fetchInventorySummary}
                        disabled={loading}
                    >
                        Refresh Availability
                    </Button>

                    {selectedSource && (
                        <Button
                            variant="contained"
                        // Add your submit handler here
                        // onClick={handleSubmitSource}
                        >
                            Confirm Selection
                        </Button>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

export default StackSelection;