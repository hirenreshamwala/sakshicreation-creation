'use client'

import React, { useEffect, useState } from "react";
import { CircularProgress, Box } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getRoleThunk } from "@/store/slices/staffSlice";
import ThemeSelect from "../common_component/themeselect";
import { toast } from "react-toastify";

interface StaffOption {
  label: string;
  value: string;
}

interface RoleStaffSelectProps {
  label?: string;
  name: string;
  value: any;
  onChange: (event: any, newValue: any) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  roleFilter?: string;
  showStaff?: boolean;
  staffName?: string;
  onStaffChange?: (event: any, newValue: any) => void;
  staffError?: boolean;
  staffHelperText?: string;
  disabled?:boolean;
}

const RoleStaffSelect: React.FC<RoleStaffSelectProps> = ({
  label = "Role",
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  roleFilter = "",
  showStaff = false,
  staffName = "",
  onStaffChange,
  staffError = false,
  staffHelperText = "",
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const { roleDetails, loading, error: roleError } = useAppSelector((state) => state.staff);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  useEffect(() => {
    if (roleFilter) {
      const fetchStaff = async () => {
        try {
          const result = await dispatch(getRoleThunk(roleFilter)).unwrap();
          
          if (!result.success) {
            toast.error(result.message || "Failed to fetch staff data");
            return;
          }

          if (result.totalStaff === 0) {
            toast.warning(`No staff members found for role: ${roleFilter}`);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to fetch staff data");
          console.error("Staff fetch error:", err);
        }
      };

      fetchStaff();
    }
  }, [dispatch, roleFilter]);

  useEffect(() => {
    if (roleError) {
      toast.error(roleError);
    }
  }, [roleError]);

  useEffect(() => {
    console.log("roleDetails.staffMembers:", roleDetails?.staffMembers);
    
    if (roleDetails?.staffMembers) {
      const options = roleDetails.staffMembers.map((staff: any) => {
        // Handle both possible data structures
        const name = staff.name || `${staff.firstName} ${staff.lastName}`.trim();
        const id = staff.id || staff._id;
        
        return {
          label: name,
          value: id
        };
      });
      
      setStaffOptions(options);
    } else {
      setStaffOptions([]);
    }
  }, [roleDetails]);

  const getSelectedStaffValue = () => {
    if (!value || !staffOptions.length) return null;

    if (typeof value === "object" && value.value) {
      return staffOptions.find((option) => option.value === value.value) || null;
    }

    if (typeof value === "string") {
      return staffOptions.find((option) => option.value === value) || null;
    }

    return null;
  };

  const selectedStaffValue = getSelectedStaffValue();

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={56}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  return (
    <Box width="100%">
      <ThemeSelect
        label={label}
        options={staffOptions}
        value={selectedStaffValue}
        onChange={showStaff ? onStaffChange : onChange}
        name={name}
        error={showStaff ? error || staffError : error}
        helperText={showStaff ? helperText || staffHelperText : helperText}
        required={required}
        disabled={disabled || staffOptions.length === 0}
        noOptionsMessage={() => "No staff members found"}
      />
    </Box>
  );
};

export default RoleStaffSelect;