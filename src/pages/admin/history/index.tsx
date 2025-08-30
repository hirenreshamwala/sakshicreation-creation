"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TableCell,
  Typography,
  Avatar,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllAccountMastersThunk,
  deleteAccountMasterThunk,
  approvePartyThunk,
  clearError,
  clearSuccessMessage,
  getAccountMasterByStaffIdThunk,
} from "@/store/slices/accountMasterSlice";
import Dashboard from "@/component/Dashboard";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddNewPartyDialog from "@/component/AddNewPartyDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { authService } from "@/services/auth.service";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import DesignerTask from "../designer-task";
import PrinterTask from "../printer-task";
import BindrTask from "../binder-task";
import BookletBinderTask from "../bookletbinder-task";
const STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REWORK: "Rework",
  DONE: "Done",
};
const Index = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accountMasters, loading, error, successMessage } = useAppSelector(
    (state) => state.accountMasters
  );
  const { user } = useAppSelector((state) => state.auth);
  const { orders } = useAppSelector((state) => state.orders);
  console.log("🚀 ~ Index ~ singleOrder:", orders);
  const getRoleSpecificTasks = () => {
    if (!orders || orders.length === 0) return [];

    switch (role) {
      case "designer":
        return orders.filter(
          (order) => order.designerStatus === STATUS.APPROVED
        );
      case "printer":
        return orders.filter(
          (order) =>
            order.designerStatus === STATUS.APPROVED &&
            order.printerStatus === STATUS.DONE
        );
      case "binder":
        return orders.filter(
          (order) =>
            order.printerStatus === STATUS.DONE &&
            order.binderStatus === STATUS.DONE
        );
      case "booklet & folder binder":
        return orders.filter(
          (order) =>
            order.binderStatus === STATUS.DONE &&
            order.bookletBinderStatus === STATUS.DONE
        );
      case "admin":
        return orders; // Admin sees all tasks
      default:
        return [];
    }
  };

  // const designerStatus = orders[0]?.designerStatus;
  // console.log("🚀 ~ Index ~ orders?.designerStatus:", orders?.designerStatus)

  // Get role name in lowercase for consistent comparison
  const role = user?.role?.roleName?.toLowerCase();

  // Render different components based on role
  const renderRoleSpecificComponent = () => {
    const tasks = getRoleSpecificTasks();
    console.log(`Tasks for ${role}:`, tasks);
    switch (role) {
      case "designer":
        return <DesignerTask tasks={tasks} />;
      case "printer":
        return <PrinterTask tasks={tasks} />;
      case "binder":
        return <BindrTask tasks={tasks} />;
      case "booklet & folder binder":
        return <BookletBinderTask tasks={tasks} />;
      // Add more cases as needed
      default:
        return <div>No component available for your role: {role}</div>;
    }
  };

  return <>{renderRoleSpecificComponent()}</>;
};

export default Index;
