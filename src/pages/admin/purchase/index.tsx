import React, { useEffect, useState } from 'react';
import { Box, TableCell, IconButton } from '@mui/material';
import { Edit, Delete, CloudUpload } from '@mui/icons-material';
import ThemeButton from '@/component/common_component/themebutton';
import BasicTable from '@/component/common_component/Table/themetable';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllPurchasesThunk, deletePurchaseThunk } from '@/store/slices/purchaseSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import AddNewPurchaseBulkDialog from '@/component/AddNewPurchaseBulkDialog';

const columns = [
  { id: 'vendor', label: 'VENDOR' },
  { id: 'billNumber', label: 'BILL NUMBER' },
  { id: 'material', label: 'MATERIAL' },
  { id: 'size', label: 'SIZE' },
  { id: 'qty', label: 'QTY' },
  { id: 'gsm', label: 'GSM' },
  { id: 'rate', label: 'RATE / SHEET/UNIT' },
  { id: 'kg', label: 'KG' },
  { id: 'forValue', label: 'FOR' },
  { id: 'actions', label: 'ACTIONS' },
];

const PurchasePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { purchases, loading } = useAppSelector((state) => state.purchase);
  const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);

  useEffect(() => {
    dispatch(getAllPurchasesThunk());
    dispatch(getAllVendorsThunk());
  }, [dispatch]);

  const handleEdit = (id: string) => {
    router.push(`/admin/purchase/edit-purchase/${id}`);
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
      try {
        await dispatch(deletePurchaseThunk(id)).unwrap();
        toast.success('Purchase deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete purchase');
      }
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
    material: purchase.material?.materialName || 'N/A',
    size: purchase.material?.materialSize || 'N/A',
    qty: purchase.quantity,
    gsm: purchase.material?.materialGSM || 'N/A',
    rate: purchase.ratePerSheet,
    kg: purchase.kg,
    forValue: purchase.forCompany ? `${purchase.forCompany.firstName} ${purchase.forCompany.lastName}` : 'N/A',
  }));

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mb: 2 }}>
        <ThemeButton onClick={() => router.push('/admin/purchase/add-purchase')}>
          + Add New Purchase
        </ThemeButton>
        <ThemeButton sx={{m:2}} onClick={handleBulkUploadClick} startIcon={<CloudUpload />}>
          Bulk Upload
        </ThemeButton>
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={rows}
        renderRow={(row) => (
          <>
            <TableCell>{row.vendor}</TableCell>
            <TableCell>{row.billNumber}</TableCell>
            <TableCell>{row.material}</TableCell>
            <TableCell>{row.size}</TableCell>
            <TableCell>{row.qty}</TableCell>
            <TableCell>{row.gsm}</TableCell>
            <TableCell>{row.rate}</TableCell>
            <TableCell>{row.kg}</TableCell>
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

        <AddNewPurchaseBulkDialog
        open={openBulkUploadDialog}
        onClose={handleBulkUploadClose}
        refreshData={() => dispatch(getAllPurchasesThunk())}
      />
    </>
  );
};

export default PurchasePage;