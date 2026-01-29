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
    getAllDeckalsThunk,
    createDeckalThunk,
    updateDeckalThunk,
    deleteDeckalThunk,
} from '@/store/slices/deckalSlice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface DeckalForm {
    name: string;
}

const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Deckal Name' },
    { id: 'action', label: 'Actions' },
];

const DeckalPage = () => {
    const dispatch = useAppDispatch();
    const { deckals, loading, error } = useAppSelector((state) => state.deckals);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<DeckalForm>({
        name: '',
    });

    useEffect(() => {
        if (deckals.length === 0) dispatch(getAllDeckalsThunk())
    }, []);

    const handleOpenDialog = (deckal?: any) => {
        if (deckal) {
            setEditId(deckal._id);
            setForm({
                name: deckal.name,
            });
        } else {
            setEditId(null);
            setForm({
                name: '',
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            if (editId) {
                await dispatch(
                    updateDeckalThunk({
                        id: editId,
                        data: {
                            name: form.name
                        },
                    })
                ).unwrap();
                toast.success('Deckal updated successfully');
            } else {
                await dispatch(
                    createDeckalThunk({
                        name: form.name
                    })
                ).unwrap();
                toast.success('Deckal created successfully');
            }
            setDialogOpen(false);
            setForm({
                name: '',
            });
            setEditId(null);
        } catch (err: any) {
            toast.error(err || 'Failed to save Deckal');
        }
    };

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
                dispatch(deleteDeckalThunk(id))
                    .unwrap()
                    .then(() => {
                        toast.success(`${name} has been deleted.`);
                    })
                    .catch((err: any) => toast.error(err || 'Failed to delete Deckal'));
            }
        });
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight={600}>
                    Deckal
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, fontWeight: 600, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
                >
                    New Deckal
                </Button>
            </Box>
            <BasicTable
                showFillter={false}
                showDatePicker={false}
                showSearch={false}
                tableHeader={columns}
                rowData={deckals}
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
                title={editId ? 'Edit Deckal' : 'New Deckal'}
                maxWidth="sm"
                fullWidth
            >
                <Stack direction="column" spacing={2} mb={2}>
                    <Input
                        labelName="Deckal Name"
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

export default DeckalPage;