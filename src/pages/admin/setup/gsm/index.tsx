import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    TableCell,
    Stack,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import BasicTable from '@/component/common_component/Table/themetable';
import Input from '@/component/common_component/themeinput';
import Button from '@/component/common_component/themebutton';
import CustomDialog from '@/component/customdialog';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    getAllGsmThunk,
    createGsmThunk,
    updateGsmThunk,
    deleteGsmThunk,
} from '@/store/slices/gsmSlice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface GsmForm {
    name: string;
}

const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'GSM' },
    { id: 'action', label: 'Actions' },
];

const GsmPage = () => {
    const dispatch = useAppDispatch();
    const { gsm, loading, error } = useAppSelector((state) => state.gsm);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<GsmForm>({
        name: '',
    });

    // Fetch gsm on component mount
    useEffect(() => {
        if (gsm.length === 0) dispatch(getAllGsmThunk())
    }, []);

    // Open dialog for add or edit
    const handleOpenDialog = (gsm?: any) => {
        if (gsm) {
            setEditId(gsm._id);
            setForm({
                name: gsm.name,
            });
        } else {
            setEditId(null);
            setForm({
                name: '',
            });
        }
        setDialogOpen(true);
    };

    // Save new or edited gsm
    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            if (editId) {
                await dispatch(
                    updateGsmThunk({
                        id: editId,
                        data: {
                            name: form.name
                        },
                    })
                ).unwrap();
                toast.success('Gsm updated successfully');
            } else {
                await dispatch(
                    createGsmThunk({
                        name: form.name
                    })
                ).unwrap();
                toast.success('Gsm created successfully');
            }
            setDialogOpen(false);
            setForm({
                companyName: '',
                name: '',
                description: '',
            });
            setEditId(null);
        } catch (err: any) {
            toast.error(err || 'Failed to save gsm');
        }
    };

    // Delete ply with confirmation
    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(deleteGsmThunk(id))
                    .unwrap()
                    .then(() => {
                        toast.success(`${name} has been deleted.`);
                    })
                    .catch((err) => toast.error(err || 'Failed to delete gsm'));
            }
        });
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight={600}>
                    GSM
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, fontWeight: 600, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
                >
                    New Gsm
                </Button>
            </Box>
            <BasicTable
                showFillter={false}
                showDatePicker={false}
                showSearch={false}
                tableHeader={columns}
                rowData={gsm}
                loading={loading}
                renderRow={(row: any, idx: number) => (
                    <>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                            <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                                <Edit />
                            </IconButton>
                            <IconButton
                                color="error"
                                onClick={() => handleDelete(row._id, row.name)}
                            >
                                <Delete />
                            </IconButton>
                        </TableCell>
                    </>
                )}
            />

            {/* Add/Edit Dialog */}
            <CustomDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editId ? 'Edit Gsm' : 'New Gsm'}
                maxWidth="sm"
                fullWidth
            >
                <Stack direction="column" spacing={2} mb={2}>
                    <Input
                        labelName="Gsm Name"
                        value={form.name}
                        onChange={(e: any) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        fullWidth
                        required
                    />
                </Stack>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2, borderColor: '#A409F8', color: '#A409F8', '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' } }}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        sx={{ borderRadius: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
                        disabled={loading}
                    >
                        Save
                    </Button>
                </Box>
            </CustomDialog>
        </Box>
    );
};

export default GsmPage;