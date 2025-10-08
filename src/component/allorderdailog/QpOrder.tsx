import React from "react"
import { useAppSelector } from "@/store"
import AdminManagerSalesView from "./AdminManagerSalesView"
import OperatorView from "./OperatorView"
import { Typography } from "@mui/material"
import DriverView from "./DriverView"

const AllOrdersPage = () => {
  const { user } = useAppSelector((state) => state.auth)
  const roleName = (user?.role?.roleName || '').toLowerCase().trim();

  if (['admin', 'manager', 'sales staff'].includes(roleName)) {
    return <AdminManagerSalesView />;
  } else if (['operator', 'cutting'].includes(roleName)) {
    return <OperatorView />;
  }  else if (roleName === 'driver') {
    return <DriverView />;
  } else {
    // Default or error view if role doesn't match
    return <Typography>Access Denied</Typography>;
  }
};

export default AllOrdersPage;