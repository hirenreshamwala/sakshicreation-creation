"use client";

import { memo } from "react";
import {
    Box,
    Typography,
    TableCell,
    Stack,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    Chip,
    TableBody,
    Paper,
} from "@mui/material";
import ThemeButton from "../common_component/themebutton";
import moment from "moment";
import CustomDialog from "../customdialog";

const PaymentHistoryDialog = memo(({ open, onClose, paymentData }: any) => {
    return (
        <CustomDialog
            open={open}
            onClose={onClose}
            title="Payment History"
            maxWidth="lg"
            fullWidth
        >
            <Box
                sx={{
                    p: { xs: 2, sm: 3 },
                    background: "#fff",
                    borderRadius: 2,
                    maxHeight: "70vh",
                    overflowY: "auto",
                }}
            >
                {/* Summary Section */}
                <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <Stack direction="row" spacing={3} justifyContent="space-between">
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Total Payment Amount</Typography>
                            <Typography variant="h6" fontWeight="bold">
                                ₹{paymentData?.paymentAmount?.toLocaleString() || 0}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Received Amount</Typography>
                            <Typography variant="h6" fontWeight="bold" color="green">
                                ₹{paymentData?.receivedAmount?.toLocaleString() || 0}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Pending Amount</Typography>
                            <Typography variant="h6" fontWeight="bold" color="red">
                                ₹{paymentData?.pendingAmount?.toLocaleString() || 0}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Payment History Table */}
                <Typography variant="h6" sx={{ mb: 2 }}>Payment Transactions</Typography>
                {paymentData?.payments?.length > 0 ? (
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Payment Method</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Received By</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Notes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paymentData.payments.map((payment: any, index: number) => (
                                    <TableRow key={payment._id || index} hover>
                                        <TableCell>
                                            {moment(payment.date).format('DD/MM/YYYY')}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            ₹{payment.amount}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={payment.paymentMethod}
                                                size="small"
                                                color={
                                                    payment.paymentMethod === 'Cash' ? 'primary' :
                                                        payment.paymentMethod === 'Cheque' ? 'secondary' :
                                                            payment.paymentMethod === 'NEFT' ? 'success' :
                                                                payment.paymentMethod === 'UPI' ? 'info' : 'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {payment.receivedBy ?
                                                `${payment.receivedBy.firstName} ${payment.receivedBy.lastName}` :
                                                'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {payment.note || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No payment history found
                        </Typography>
                    </Box>
                )}

                <ThemeButton
                    onClick={onClose}
                    sx={{
                        background: "#A409F8",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 2,
                        py: 1.2,
                        width: "100%",
                        mt: 3,
                        "&:hover": { background: "#7B06C2" },
                    }}
                >
                    Close
                </ThemeButton>
            </Box>
        </CustomDialog>
    );
});

export default PaymentHistoryDialog;