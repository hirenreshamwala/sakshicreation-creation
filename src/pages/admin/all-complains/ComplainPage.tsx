import ThemeButton from '@/component/common_component/themebutton'
import DateRangePicker from '@/component/daterangepicker'
import FilterDropdown from '@/component/fillter'
import { Box, IconButton, InputBase, TableCell } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import ComplainDialogue from './ComplainDialogue'
import ComplainViewDialogue from "./ComplainViewDialogue";
import { StaticCompanyOptions } from '@/constants'
import { useAppDispatch, useAppSelector } from '@/store'
import { getAllCompaniesThunk } from '@/store/slices/compnaySlice'
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk } from '@/store/slices/qpOrderSlice'
import { deleteComplainThunk, getAllComplainsThunk, getComplainsByStaffThunk } from '@/store/slices/complainSlice'
import BasicTable from '@/component/common_component/Table/themetable'
import { Delete, Edit, Visibility } from '@mui/icons-material'
import { toast } from 'react-toastify'
import Swal from "sweetalert2";

const columns = [
    { id: 'sr', label: 'Sr no' },
    { id: 'orderno', label: 'OrderNo' },
    { id: 'partyName', label: 'Party' },
    { id: 'subject', label: 'SUBJECT' },
    { id: 'status', label: 'STATUS' },
    { id: 'createdBy', label: 'CREATED BY' },
    { id: 'actions', label: 'ACTION' },
];

interface Complaint {
    _id: string;
    subject: string;
    details: string;
    company: {
        _id: string;
        companyName: string;
    };
    status: string;
    response: string;
    createdBy: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    assignTo: string[];
    scorder: {
        _id: string;
        orderNumber: string;
    } | null;
    qporder: {
        _id: string;
        orderNo: number;
    } | null;
    createdAt: string;
    updatedAt: string;
}

const ComplainPage = ({ company }: { company: { _id: string; companyName: string } }) => {
    const dispatch = useAppDispatch()
    const [open, setOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false);
    const [editData, setEditData] = useState<Complaint | null>(null)
    const [viewData, setViewData] = useState<Complaint | null>(null);
    const { companies } = useAppSelector((state) => state.company)
    const { user } = useAppSelector((state) => state.auth)
    const { complains } = useAppSelector((state) => state.complains)

    const canViewGlobal = user?.role?.permissions?.all_complains?.view_global
    const canViewOwn = user?.role?.permissions?.all_complains?.view_own
    const canCreate = user?.role?.permissions?.all_complains?.create
    const canEdit = user?.role?.permissions?.all_complains?.edit
    const canDelete = user?.role?.permissions?.all_complains?.delete

    const refreshData = () => {
        if (canViewGlobal) {
            dispatch(getAllQPOrdersThunk())
            dispatch(getAllComplainsThunk())
        } else if (canViewOwn && user?.id) {
            dispatch(getQPOrdersByStaffIdThunk(user.id))
            dispatch(getComplainsByStaffThunk(user.id))
        }
    }

    useEffect(() => {
        if (!companies.length) dispatch(getAllCompaniesThunk(true))
        refreshData()
    }, [companies.length, dispatch])

    // Find the company ID based on the company prop
    const selectedCompany = companies.find((item) => item.companyName === company.companyName) || company

    const handleAddNewOrder = () => {
        setEditData(null)
        setOpen(true)
    }

    const handleEdit = (id: string) => {
        const complaint = complains.find((c) => c?._id === id)
        if (complaint) {
            setEditData(complaint)
            setOpen(true)
        }
    }

    const handleDelete = async (id: string) => {
    // Show SweetAlert2 confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this complaint? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    // Proceed with deletion only if the user confirms
    if (result.isConfirmed) {
      try {
        await dispatch(deleteComplainThunk(id)).unwrap();
        toast.success("Complaint deleted successfully");
        refreshData();
        // Optional: Show success confirmation
        Swal.fire({
          title: "Deleted!",
          text: "The complaint has been deleted.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        toast.error(
          "Error deleting complaint: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
        Swal.fire({
          title: "Error!",
          text: "Failed to delete the complaint.",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    }
  };

    const handleView = (id: string) => {
        const complaint = complains.find((c) => c?._id === id);
        if (complaint) {
            setViewData(complaint);
            setViewOpen(true);
        }
    };

    const rows = complains
        .filter((complaint) => complaint.company?._id === company?._id)
        .map((complaint, index) => ({
            id: complaint?._id,
            orderid: complaint.qporder?.orderNo ? `QP-${complaint.qporder.orderNo}` : complaint.scorder?.orderNumber || "N/A",
            partyName: complaint?.party?.partyName,
            subject: complaint.subject,
            status: complaint.status,
            createdBy: `${complaint.createdBy.firstName} ${complaint.createdBy.lastName}`,
        }));

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "right",
                    justifyContent: "right",
                    gap: 2,
                }}
            >
            {canCreate && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <ThemeButton onClick={handleAddNewOrder}>+ Add New Complain</ThemeButton>
                </Box>
            )}
            </Box>
            <BasicTable
                tableHeader={columns}
                rowData={rows}
                renderRow={(row, index) => (
                    <>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.orderid}</TableCell>
                        <TableCell>{row.partyName}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>{row.createdBy}</TableCell>
                        <TableCell>
                            <IconButton onClick={() => handleView(row.id)} color="info">
                                <Visibility />
                            </IconButton>
                            {canEdit && (
                            <IconButton onClick={() => handleEdit(row.id)} color="primary">
                                <Edit />
                            </IconButton>
                            )}
                            {canDelete && (
                            <IconButton onClick={() => handleDelete(row.id)} color="error">
                                <Delete />
                            </IconButton>
                            )}
                        </TableCell>
                    </>
                )}
            />

            {open && (
                <ComplainDialogue
                    company={selectedCompany}
                    open={open}
                    onClose={() => {
                        setOpen(false)
                        refreshData()
                    }}
                    refreshData={refreshData}
                    editData={editData}
                />
            )}
            {viewOpen && (
                <ComplainViewDialogue
                    open={viewOpen}
                    onClose={() => {
                        setViewOpen(false);
                        setViewData(null);
                    }}
                    complaint={viewData}
                />
            )}
        </>
    )
}

export default ComplainPage