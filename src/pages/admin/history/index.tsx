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
import { orderService } from "@/services/order.service"; // Add order service

const STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REWORK: "Rework",
  DONE: "Done",
};

const Index = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accountMasters, loading: accountLoading, error: accountError, successMessage } = useAppSelector(
    (state) => state.accountMasters
  );
  const { user } = useAppSelector((state) => state.auth);
  const { orders } = useAppSelector((state) => state.orders);
  
  // New states for role-specific orders
  const [roleOrders, setRoleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get role name in lowercase for consistent comparison
  const role = user?.role?.roleName?.toLowerCase();

  // Fetch role-specific orders from API
  useEffect(() => {
    const fetchRoleSpecificOrders = async () => {
      if (!role) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let response;

        // Use order service methods based on role
        switch (role) {
          case "designer":
            response = await orderService.getDesignerOrders();
            break;
          case "printer":
            response = await orderService.getPrinterOrders();
            break;
          case "binder":
            response = await orderService.getBinderOrders();
            break;
          case "booklet & folder binder":
            response = await orderService.getBookletBinder();
            break;
          case "admin":
            // Admin के लिए सभी orders (या specific admin API)
            // Temporary: use designer orders
            response = await orderService.getDesignerOrders();
            break;
          default:
            throw new Error(`Unknown role: ${role}`);
        }

        if (response.success) {
          setRoleOrders(response.data || []);
        } else {
          throw new Error(response.message || "Failed to fetch orders");
        }

      } catch (error: any) {
        console.error("Error fetching role orders:", error);
        setError(error.message || "Failed to fetch orders");
        setRoleOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleSpecificOrders();
  }, [role]);

  const getRoleSpecificTasks = () => {
    // Use roleOrders instead of all orders from Redux
    if (!roleOrders || roleOrders.length === 0) return [];

    switch (role) {
      case "designer":
        return roleOrders.filter(
          (order) => order.designerStatus === STATUS.APPROVED
        );
      case "printer":
        return roleOrders.filter(
          (order) =>
            order.printerStatus === STATUS.DONE
        );
      case "binder":
        return roleOrders.filter(
          (order) =>
            order.binderStatus === STATUS.DONE
        );
      case "booklet & folder binder":
        return roleOrders.filter(
          (order) => 
            order.bookletBinderStatus === STATUS.DONE
        );
      case "admin":
        return roleOrders; // Admin sees all tasks
      default:
        return [];
    }
  };

  // Render different components based on role
  const renderRoleSpecificComponent = () => {
    if (loading) {
      return <Loader />;
    }

    if (error) {
      return (
        <Box sx={{ padding: '20px', textAlign: 'center' }}>
          <Typography color="error">Error: {error}</Typography>
          <ThemeButton onClick={() => window.location.reload()}>
            Retry
          </ThemeButton>
        </Box>
      );
    }

    const tasks = getRoleSpecificTasks();

    if (tasks.length === 0) {
      return (
        <Box sx={{ padding: '20px', textAlign: 'center' }}>
          <Typography>No tasks available for your role: {role}</Typography>
        </Box>
      );
    }

    switch (role) {
      case "designer":
        return <DesignerTask tasks={tasks} />;
      case "printer":
        return <PrinterTask tasks={tasks} />;
      case "binder":
        return <BindrTask tasks={tasks} />;
      case "booklet & folder binder":
        return <BookletBinderTask tasks={tasks} />;
      case "admin":
        // Admin के लिए कोई admin-specific component
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" gutterBottom>
              Total Orders: {roleOrders.length}
            </Typography>
            {/* यहाँ admin-specific table या component add करें */}
          </Box>
        );
      default:
        return <div>No component available for your role: {role}</div>;
    }
  };

  return <>{renderRoleSpecificComponent()}</>;
};

export default Index;