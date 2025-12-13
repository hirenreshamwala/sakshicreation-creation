import React, { useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  TableCell,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Button from "@/component/common_component/themebutton";
import BasicTable from "@/component/common_component/Table/themetable";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  getAllRolesThunk,
  deleteRoleThunk,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/roleSlice";
import { Role } from "@/services/role.service";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";

interface RoleRow {
  id: string;
  name: string;
  totalStaff: number;
  canDelete: boolean;
}

const columns = [
  { id: "name", label: "Role Name" },
  { id: "options", label: "Options", align: "right" as const },
];

const RoleTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const rolesState = useSelector((state: RootState) => state.roles || {
    roles: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  const { roles, loading, error, successMessage } = rolesState;

  const prevErrorRef = useRef<string | null>(null);
  const prevSuccessRef = useRef<string | null>(null);

  const roleRows: RoleRow[] = roles.map((role: Role) => ({
    id: role._id,
    name: role.roleName,
    totalStaff: role.totalUser,
    canDelete: role.totalUser === 0,
  }));

  useEffect(() => {
    if (router.pathname === "/admin/setup/role")
      dispatch(getAllRolesThunk());
  }, [router.pathname, dispatch]);

  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      toast.error(error);
      prevErrorRef.current = error;
      dispatch(clearError());
    }
    if (successMessage && successMessage !== prevSuccessRef.current) {
      toast.success(successMessage);
      prevSuccessRef.current = successMessage;
      dispatch(clearSuccessMessage());
    }
  }, [error, successMessage, dispatch]);

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: `Delete Role ?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteRoleThunk(id));
        Swal.fire("Deleted!", `${name} has been deleted.`, "success");
      }
    });
  };

  return (
    <Box p={3}>
      {/* Top Actions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/admin/setup/role/add-role")}
        >
          New Role
        </Button>
      </Box>

      {/* Loading */}
      {loading && <Loader />}

      {/* Empty */}
      {!loading && roleRows.length === 0 && (
        <Typography sx={{ mt: 2 }}>No roles found.</Typography>
      )}

      {/* Table */}
      {!loading && roleRows.length > 0 && (
        <BasicTable
          tableHeader={columns}
          rowData={roleRows}
          showSearch
          renderRow={(row: RoleRow) => (
            <>
              <TableCell>
                <Box>
                  <Typography fontWeight={600}>{row.name}</Typography>
                  <Typography fontSize={13} color="text.secondary">
                    Total Staff: {row.totalStaff}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => router.push(`/admin/setup/role/edit-role/${row?.id}`)}>
                  <EditIcon color="primary" />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => row.canDelete && handleDelete(row.id, row.name)}
                  disabled={!row.canDelete}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </>
          )}
        />
      )}
    </Box>
  );
};

export default RoleTable;