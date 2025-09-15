import React, { useEffect, useState } from 'react';
import { Box, TableCell, IconButton } from '@mui/material';
import { Edit, Delete, CloudUpload } from '@mui/icons-material';
import ThemeButton from '@/component/common_component/themebutton';
import BasicTable from '@/component/common_component/Table/themetable';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import AddNewPurchaseBulkDialog from '@/component/AddNewPurchaseBulkDialog';
import { deleteQpPurchaseThunk, getAllQpPurchasesThunk } from '@/store/slices/qpPurchaseSlice';
import QualityPurchaseBulkDialog from '@/component/QualityPurchaseBulkDialog';

const columns = [
    { id: 'vendor', label: 'VENDOR' },
    { id: 'billNumber', label: 'BILL NUMBER' },
    { id: 'type', label: 'TYPE' },
    { id: 'forValue', label: 'FOR' },
    { id: 'actions', label: 'ACTIONS' },
];

const QpPurchasePage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { purchases, loading } = useAppSelector((state) => state.qpPurchase);
    const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);

    console.log(purchases, 'purchases')

    useEffect(() => {
        dispatch(getAllQpPurchasesThunk());
        dispatch(getAllVendorsThunk());
    }, [dispatch]);

    const handleEdit = (id: string) => {
        router.push(`/admin/purchase/edit-purchase/${id}?type=1`);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#A409F8',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            await dispatch(deleteQpPurchaseThunk(id))
            toast.success('Purchase deleted successfully');
        }
    };

    const handleBulkUploadClick = () => {
        setOpenBulkUploadDialog(true);
    };

    const handleBulkUploadClose = () => {
        setOpenBulkUploadDialog(false);
    };

    const rows = purchases.map((purchase) => ({
        id: purchase._id,
        vendor: (typeof purchase.vendorName === 'object' && purchase.vendorName?.name) || 'N/A',
        billNumber: purchase.billNumber,
        type: purchase.type || 'N/A',
        forValue: purchase.forCompany ? `${purchase.forCompany.firstName} ${purchase.forCompany.lastName}` : 'N/A',
    }));

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mb: 2 }}>
                <ThemeButton onClick={() => router.push('/admin/purchase/add-purchase?type=1')}>
                    + Add New Purchase
                </ThemeButton>
                {/* <ThemeButton sx={{ m: 2 }} onClick={handleBulkUploadClick} startIcon={<CloudUpload />}>
                    Bulk Upload
                </ThemeButton> */}
            </Box>

            <BasicTable
                tableHeader={columns}
                rowData={rows}
                renderRow={(row) => (
                    <>
                        <TableCell>{row.vendor}</TableCell>
                        <TableCell>{row.billNumber}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.forValue}</TableCell>
                        <TableCell>
                            <IconButton onClick={() => handleEdit(row.id)} color="primary">
                                <Edit />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(row.id)} color="error">
                                <Delete />
                            </IconButton>
                        </TableCell>
                    </>
                )}
            />

            <QualityPurchaseBulkDialog
                open={openBulkUploadDialog}
                onClose={handleBulkUploadClose}
                refreshData={() => dispatch(getAllQpPurchasesThunk())}
            />
        </>
    );
};

export default QpPurchasePage;