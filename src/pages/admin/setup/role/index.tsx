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
import { getAllRolesThunk, deleteRoleThunk, clearError, clearSuccessMessage } from "@/store/slices/roleSlice";
import { Role } from "@/services/role.service";
import { toast } from "react-toastify";
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

  // Select roles state with fallback
  const rolesState = useSelector((state: RootState) => state.roles || {
    roles: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  const { roles, loading, error, successMessage } = rolesState;

  // Track previous messages to avoid duplicate toasts
  const prevErrorRef = useRef<string | null>(null);
  const prevSuccessRef = useRef<string | null>(null);

  // Map Role data to RoleRow interface
  const roleRows: RoleRow[] = roles.map((role: Role) => ({
    id: role._id,
    name: role.roleName,
    totalStaff: role.totalUser,
    canDelete: role.totalUser === 0,
  }));

  // Fetch roles only if on the role list page
  useEffect(() => {
    if (router.pathname === '/admin/setup/role') {
      console.log("Fetching all roles for RoleTable");
      dispatch(getAllRolesThunk());
    }
  }, [router.pathname, dispatch]);

  // Handle toast notifications
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

  const handleEdit = (id: string) => {
    console.log("Navigating to edit role:", id);
    router.push(`/admin/setup/role/edit-role/${id}`);
  };

  const handleDelete = (id: string) => {
    console.log("Deleting role:", id);
    dispatch(deleteRoleThunk(id));
  };

  const handleAddRole = () => {
    console.log("Navigating to add role");
    router.push('/admin/setup/role/add-role');
  };

  return (
    <Box p={3}>
      {/* Top Actions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddRole}
        >
          New Role
        </Button>
      </Box>

      {/* Loading State */}
      {loading && <Loader />}

      {/* Empty State */}
      {!loading && roleRows.length === 0 && (
        <Typography sx={{ mt: 2 }}>
          No roles found.
        </Typography>
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
                <IconButton onClick={() => handleEdit(row.id)}>
                  <EditIcon sx={{ color: "#4F46E5" }} />
                </IconButton>
                <IconButton
                  onClick={() => row.canDelete && handleDelete(row.id)}
                  disabled={!row.canDelete}
                >
                  <DeleteIcon sx={{ color: row.canDelete ? "#EF4444" : "#D1D5DB" }} />
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