"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Chip,
  Button,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  getAllRolesThunk,
  deleteRoleThunk,
  setRoleFilters,
  getRoleFiltersThunk,
} from "@/store/slices/roleSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";

const columns = [
  { id: "name", label: "Role Name" },
  { id: "totalStaff", label: "Total Staff" },
  { id: "options", label: "Options", align: "right" as const },
];

const RoleTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const {
    roles = [],
    loading,
    pagination,
    filters,
    availableFilters = { roleNames: [] , totalStaff: []  },
  } = useSelector((state: RootState) => state.roles);

  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

  const fetchData = useCallback(() => {
    const apiFilters: any = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || "",
    };

    if (activeFilters["Role Name"]?.length) {
      apiFilters.roleNames = activeFilters["Role Name"];
    }
    if (activeFilters["Total Staff"]?.length) {
  apiFilters.totalStaff = activeFilters["Total Staff"];
}

    dispatch(getAllRolesThunk(apiFilters));
  }, [dispatch, filters, activeFilters]);

  useEffect(() => {
    dispatch(getRoleFiltersThunk());
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.search, activeFilters]);

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Delete Role?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      await dispatch(deleteRoleThunk(id)).unwrap();
      toast.success(`${name} deleted successfully`);
      fetchData();
    }
  };

  const handleFilterChange = (newFilters: { [key: string]: string[] }) => {
    setActiveFilters(newFilters);
    dispatch(setRoleFilters({ page: 1 }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    dispatch(setRoleFilters({ page: 1, search: "" }));
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Roles
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/admin/setup/role/add-role")}
        >
          New Role
        </Button>
      </Box>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <Box mb={2} display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Typography variant="body2" color="textSecondary">
            Filters:
          </Typography>
          {Object.entries(activeFilters).map(([field, values]) =>
            values.map((val) => (
              <Chip
                key={`${field}-${val}`}
                label={`${field}: ${val}`}
                onDelete={() => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    [field]: prev[field].filter((v) => v !== val),
                  }));
                }}
                size="small"
                color="primary"
              />
            ))
          )}
          <Button size="small" onClick={clearAllFilters}>
            Clear All
          </Button>
        </Box>
      )}

      {/* Table with Server-side Pagination + Filtering */}
      {loading ? (
        <Loader />
      ) : roles.length === 0 ? (
        <Typography textAlign="center" mt={4}>
          No roles found.
        </Typography>
      ) : (
        <BasicTable
          serverSide={true}
          tableHeader={columns}
          rowData={roles}
          loading={loading}
          totalCount={pagination?.totalItems || 0}
          pagination={pagination}
          onPageChange={(page) => dispatch(setRoleFilters({ page }))}
          onSearchChange={(search) => dispatch(setRoleFilters({ search, page: 1 }))}
          onFilterChange={handleFilterChange}
availableFilters={{
  "Role Name": availableFilters.roleNames || [],
  "Total Staff": availableFilters.totalStaff || [],   // <-- NEW
}}
          renderRow={(row: any, idx: number) => (
            <>
              <TableCell>
                <Typography fontWeight={600}>{row.roleName}</Typography>
              </TableCell>
              <TableCell>{row.totalUser || 0}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => router.push(`/admin/setup/role/edit-role/${row._id}`)}
                >
                  <Edit color="primary" />
                </IconButton>
                <IconButton
                  color="error"
                  disabled={row.totalUser > 0}
                  onClick={() => row.totalUser === 0 && handleDelete(row._id, row.roleName)}
                >
                  <Delete />
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