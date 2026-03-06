import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TablePagination,
} from "@mui/material";
import { useRouter } from "next/router";
import { inventoryService } from "@/services/inventory.service";
import Loader from "@/component/common_component/loader";
import { useSelector } from "react-redux";

interface PaperInventoryItem {
    materialId: string;
    materialName: string;
    materialSize: string;
    materialGSM: string;
    totalPurchased: number;
    totalUsed: number;
    balance: number;
}

interface PaperInventorySummary {
    totalPurchased: number;
    totalUsed: number;
    totalBalance: number;
}

const categoryTitles: Record<string, string> = {
    printer: "Printer Paper Inventory",
    binder: "Binder Paper Inventory",
    booklet: "Booklet Binder Paper Inventory",
};

const categorySubtitles: Record<string, string> = {
    printer: "Track paper purchased and used for printing",
    binder: "Track paper purchased and used for binding",
    booklet: "Track paper purchased and used for booklet binding",
};

const PaperInventoryPage = () => {
    const router = useRouter();
    const { user } = useSelector((state: any) => state.auth);
    const [loading, setLoading] = useState(true);
    const [inventoryData, setInventoryData] = useState<PaperInventoryItem[]>([]);
    const [summary, setSummary] = useState<PaperInventorySummary>({
        totalPurchased: 0,
        totalUsed: 0,
        totalBalance: 0,
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const categoryKey = user?.role?._id;

    useEffect(() => {
        fetchPaperInventory();
    }, []);

    const fetchPaperInventory = async () => {
        setLoading(true);
        try {
            const response = await inventoryService.getStaffPaperInventory(categoryKey, {
                page: page + 1,
                pageSize: rowsPerPage,
                isPagination: true,
            });
            console.log(response, 'response')
            if (response.success) {
                setInventoryData(response.data || []);
                setSummary(response.summary || { totalPurchased: 0, totalUsed: 0, totalBalance: 0 });
                if (response.pagination) {
                    setTotalCount(response.pagination.totalCount || 0);
                }
            }
            setLoading(false);
        } catch (error) {
            console.log("Error fetching paper inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusColor = (balance: number): "error" | "warning" | "success" => {
        if (balance <= 0) return "error";
        if (balance < 100) return "warning";
        return "success";
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                    {categoryTitles[categoryKey] || "Paper Inventory"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {categorySubtitles[categoryKey] || "Track paper inventory"}
                </Typography>
            </Box>

            {/* Summary Cards - Using Flexbox instead of Grid */}
            <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
                <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <Card sx={{ bgcolor: "#e3f2fd", borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Total Purchased
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1565c0" }}>
                                {summary.totalPurchased.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sheets
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <Card sx={{ bgcolor: "#fff3e0", borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Total Used
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: "#e65100" }}>
                                {summary.totalUsed.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sheets
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                    <Card sx={{ bgcolor: "#e8f5e9", borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Current Balance
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: "#2e7d32" }}>
                                {summary.totalBalance.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sheets
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Inventory Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>GSM</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Purchased</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Used</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventoryData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No paper inventory found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            inventoryData.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>{item.materialName}</TableCell>
                                    <TableCell>{item.materialSize}</TableCell>
                                    <TableCell>{item.materialGSM}</TableCell>
                                    <TableCell align="right">{item.totalPurchased.toLocaleString()}</TableCell>
                                    <TableCell align="right">{item.totalUsed.toLocaleString()}</TableCell>
                                    <TableCell align="right">{item.balance.toLocaleString()}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={item.balance <= 0 ? "Out of Stock" : item.balance < 100 ? "Low Stock" : "In Stock"}
                                            color={getStatusColor(item.balance)}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ mt: 2 }}
            />
        </Box>
    );
};

export default PaperInventoryPage;
