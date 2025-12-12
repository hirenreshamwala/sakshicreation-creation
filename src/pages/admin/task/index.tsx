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
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order.types"; // Make sure to import Order type

const STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REWORK: "Rework",
  DONE: "Done",
};

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  // Get role name in lowercase for consistent comparison
  const role = user?.role?.roleName?.toLowerCase();

  // Fetch role-specific orders from API
  const fetchRoleSpecificOrders = async () => {
    if (!role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      // Use your existing service methods
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
          // Admin के लिए सभी orders fetch करें (अगर admin API है)
          // या designer orders ही लें (temporary solution)
          response = await orderService.getDesignerOrders();
          break;
        default:
          throw new Error(`Unknown role: ${role}`);
      }

      if (response.success) {
        setFetchedOrders(response.data || []);
      } else {
        throw new Error(response.message || "Failed to fetch orders");
      }

    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Failed to fetch orders");
      setFetchedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when component mounts or role changes
  useEffect(() => {
    fetchRoleSpecificOrders();
  }, [role]);

  // Apply client-side filtering on fetched orders
  const getRoleSpecificTasks = () => {
    if (!fetchedOrders || fetchedOrders.length === 0) return [];

    switch (role) {
      case "designer":
        return fetchedOrders.filter(
          (order) => order.designerStatus !== STATUS.APPROVED
        );
      case "printer":
        return fetchedOrders.filter(
          (order) =>
            order.designerStatus === STATUS.APPROVED &&
            order.printerStatus !== STATUS.DONE
        );
      case "binder":
        return fetchedOrders.filter(
          (order) =>
            order.printerStatus === STATUS.DONE &&
            order.binderStatus !== STATUS.DONE
        );
      case "booklet & folder binder":
        return fetchedOrders.filter(
          (order) =>
            (order.binderStatus === STATUS.DONE ||
              order.binderStatus === STATUS.PENDING) &&
            order.bookletBinderStatus !== STATUS.DONE
        );
      case "admin":
        return fetchedOrders; 
      default:
        return [];
    }
  };

  // Get filtered tasks
  const filteredTasks = getRoleSpecificTasks();

  // Render different components based on role
  const renderRoleSpecificComponent = () => {

    if (loading) {
      return <Loader />;
    }

    if (error) {
      return (
        <Box sx={{ padding: '20px', textAlign: 'center' }}>
          <Typography color="error">Error: {error}</Typography>
          <ThemeButton onClick={fetchRoleSpecificOrders}>
            Retry
          </ThemeButton>
        </Box>
      );
    }

    if (filteredTasks.length === 0) {
      return (
        <Box sx={{ padding: '20px', textAlign: 'center' }}>
          <Typography>No tasks available for your role: {role}</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Total orders fetched: {fetchedOrders.length}
          </Typography>
        </Box>
      );
    }

    switch (role) {
      case "designer":
        return <DesignerTask tasks={filteredTasks} />;
      case "printer":
        return <PrinterTask tasks={filteredTasks} />;
      case "binder":
        return <BindrTask tasks={filteredTasks} />;
      case "booklet & folder binder":
        return <BookletBinderTask tasks={filteredTasks} />;
      case "admin":
        // Admin के लिए कोई specific component या table show करें
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Total Orders: {fetchedOrders.length} | 
              Filtered Tasks: {filteredTasks.length}
            </Typography>
            {/* यहाँ आप BasicTable या कोई और component use कर सकते हैं */}
          </Box>
        );
      default:
        return <div>No component available for your role: {role}</div>;
    }
  };

  return <>{renderRoleSpecificComponent()}</>;
};

export default Index;