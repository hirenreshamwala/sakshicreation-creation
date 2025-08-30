import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  ListItem,
  Collapse,
  useTheme,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  MdDashboard,
  MdAssignment,
  MdSettings,
  MdWork,
  MdGroup,
  MdInventory,
  MdShoppingCart,
  MdPeople,
  MdLibraryBooks,
  MdExpandMore,
  MdExpandLess,
  MdMenu,
  MdLogout,
} from "react-icons/md";
import { IoChevronBack } from "react-icons/io5";
import { useRouter } from "next/router";
import Loader from "@/component/common_component/loader";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearAuth, fetchUserThunk } from "@/store/slices/authSlice";
import { authService } from "@/services/auth.service";
import Slide from "@mui/material/Slide";

const permissionMapping: { [key: string]: string } = {
  "Account Master": "account_master",
  "Assign Task": "assign_task",
  "Party call": "party_call",
  "All Orders": "all_orders",
  "Quality Packaging": "quality_packaging",
  "Performance invoice": "proforma_invoice",
  Reports: "reports",
  Inventory: "inventory",
  Purchase: "purchase",
  Task: "task",
  History: "history",
  "Designer-Task": "designer_task",
  "Printer-Task": "printer_task",
  "Binder-Task": "blinder_task",
  "Booklet-Binder-Task": "booklet_blinder_task",
  Setup: "setup",
  // Sub-menu items for Reports
  Designer: "reports.designer",
  Printers: "reports.printers",
  Binder: "reports.binder",
  "Booklet & Folder Intention": "reports.booklet-and-binder",
  Staff: "reports.staff",
  // Sub-menu items for Setup
  "Add Role": "setup.role",
  Staff: "setup.staff",
  Products: "setup.products",
  "Paper Material": "setup.paper-material",
  "Company Name": "setup.company-name",
};

const menuItems = [
  { label: "Dashboard", icon: <MdDashboard size={18} />, path: "/" },
  { label: "Account Master", icon: <MdAssignment size={18} />, path: "/admin/account-master" },
  { label: "Assign Task", icon: <MdWork size={18} />, path: "/admin/assign-task" },
  { label: "Party call", icon: <MdGroup size={18} />, path: "/admin/party-call" },
  { label: "All Orders", icon: <MdAssignment size={18} />, path: "/admin/all-orders" },
  { label: "Quality Packaging", icon: <MdSettings size={18} />, path: "/admin/quality-packageing" },
  { label: "Performance invoice", icon: <MdSettings size={18} />, path: "/admin/performance-invoice" },
  {
    label: "Reports",
    icon: <MdLibraryBooks size={18} />,
    path: "/admin/reports",
    children: [
      { label: "Designer", path: "/admin/reports/designer", icon: <MdPeople size={18} /> },
      { label: "Printers", path: "/admin/reports/printers", icon: <MdPeople size={18} /> },
      { label: "Binder", path: "/admin/reports/binder", icon: <MdPeople size={18} /> },
      { label: "Booklet & Folder Intention", path: "/admin/reports/booklet-and-binder", icon: <MdLibraryBooks size={18} /> },
      { label: "Staff", path: "/admin/reports/staff", icon: <MdGroup size={18} /> },
    ],
  },
  { label: "Inventory", icon: <MdInventory size={18} />, path: "/admin/inventory" },
  { label: "Purchase", icon: <MdShoppingCart size={18} />, path: "/admin/purchase" },
  { label: "Task", icon: <MdShoppingCart size={18} />, path: "/admin/task" },
  { label: "History", icon: <MdShoppingCart size={18} />, path: "/admin/history" },
  {
    label: "Setup",
    icon: <MdSettings size={18} />,
    path: "/admin/setup",
  },
];

const Dashboard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [selectedItem, setSelectedItem] = useState("");
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [activeSubSidebar, setActiveSubSidebar] = useState<string | null>(
    router.pathname.startsWith("/admin/setup") ? "setup" : null
  );
  const [filteredMenuItems, setFilteredMenuItems] = useState(menuItems);
  const transitionDuration = 300;
  const transitionEasing = "cubic-bezier(0.4, 0, 0.2, 1)";

  // Function to get current page title
  const getCurrentPageTitle = () => {
    // First check if we're in setup submenu
    if (activeSubSidebar === "setup") {
      const setupItem = setupSubMenuItems.find(item => 
        router.pathname === item.path || router.pathname.startsWith(item.path + "/")
      );
      if (setupItem) return setupItem.label;
      return "Setup";
    }

    // Check main menu items
    for (const item of filteredMenuItems) {
      // Exact match
      if (router.pathname === item.path) return item.label;
      
      // Parent path match (for nested routes)
      if (item.path && router.pathname.startsWith(item.path + "/")) {
        return item.label;
      }

      // Check children
      if (item.children) {
        const childItem = item.children.find(child => 
          router.pathname === child.path || router.pathname.startsWith(child.path + "/")
        );
        if (childItem) return childItem.label;
      }
    }

    return "Dashboard";
  };

  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();

    if (token && !user && !loading && storedUser?.id) {
      dispatch(fetchUserThunk({ token, userId: storedUser.id }));
    }

    if (!token || (!user && !loading)) {
      router.push("/login");
    }

    // Set selected item based on current path
    const currentPath = router.pathname;
    setSelectedItem(currentPath);

    // Open parent menu if child is active
    const parentItem = menuItems.find(item => 
      item.children && item.children.some(child => 
        currentPath === child.path || currentPath.startsWith(child.path + "/")
      )
    );
    if (parentItem) {
      setOpenMenus(prev => [...prev, parentItem.label]);
    }

    // Filter menu items based on permissions
    if (storedUser?.role?.permissions) {
      const permissions = storedUser.role.permissions;

      const filteredItems = menuItems
        .map((item) => {
          if (item.label === "Dashboard") return item;

          const permKey = permissionMapping[item.label] || item.label.toLowerCase().replace(/\s+/g, "_");
          const hasPermission = permissions[permKey]?.view_global || permissions[permKey]?.view_own;

          if (item.label === "Reports" || item.label === "Setup") {
            return hasPermission ? item : null;
          }

          if (item.children) {
            const filteredChildren = item.children.filter((child) => {
              const childPermKey = permissionMapping[child.label] || child.label.toLowerCase().replace(/\s+/g, "_");
              return permissions[childPermKey]?.view_global || permissions[childPermKey]?.view_own;
            });

            if (hasPermission || filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
            }
            return null;
          }

          return hasPermission ? item : null;
        })
        .filter(Boolean);

      setFilteredMenuItems(filteredItems);
    }

    const interval = setInterval(() => setDateTime(new Date()), 1000);
    setDateTime(new Date());
    return () => clearInterval(interval);
  }, [router, user, loading, dispatch]);

  const handleNavigation = async (path: string) => {
    if (path === selectedItem) return;

    if (path === "/login") {
      dispatch(clearAuth());
      authService.clearAuth();
      router.push("/login");
      return;
    }

    setDrawerOpen(false);
    await new Promise(resolve => setTimeout(resolve, transitionDuration));
    setPageLoading(true);
    await router.push(path);
    setPageLoading(false);
  };

  const toggleSubmenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleDrawer = async () => {
    setDrawerOpen((prev) => !prev);
    if (!drawerOpen) {
      await new Promise((resolve) => setTimeout(resolve, transitionDuration));
    }
  };

  const handleMouseEnter = () => {
    if (!drawerOpen) setDrawerOpen(true);
  };

  const handleMouseLeave = () => {
    if (drawerOpen) setDrawerOpen(false);
  };

  const setupSubMenuItems = [
    {
      label: "Add Role",
      path: "/admin/setup/role",
      icon: <MdPeople size={18} />,
    },
    {
      label: "Staff",
      path: "/admin/setup/staff",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Products",
      path: "/admin/setup/products",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Paper Material",
      path: "/admin/setup/paper-material",
      icon: <MdGroup size={18} />,
    },
    // {
    //   label: "Department Company",
    //   path: "/admin/setup/department-company",
    //   icon: <MdGroup size={18} />,
    // },
    {
      label: "Company Name",
      path: "/admin/setup/company-name",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Vendor Name",
      path: "/admin/setup/vendor-name",
      icon: <MdGroup size={18} />,
    },
  ];

  return (
    <Box display="flex" fontFamily="Inter, sans-serif" minHeight="100vh" bgcolor="#FBFBFB" p={1}>
      <Box
        sx={{
          width: drawerOpen ? 260 : 60,
          minWidth: drawerOpen ? 260 : 60,
          maxWidth: drawerOpen ? 260 : 60,
          bgcolor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          p: 1,
          mr: 1.5,
          boxShadow: "4px 0 6px -1px rgba(0, 0, 0, 0.1)",
          borderRadius: 1,
          flexDirection: "column",
          transition: `width ${transitionDuration}ms ${transitionEasing}, min-width ${transitionDuration}ms ${transitionEasing}, max-width ${transitionDuration}ms ${transitionEasing}`,
          overflowX: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 1200,
          flexShrink: 0,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Sidebar content */}
        <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
          {drawerOpen && user && activeSubSidebar !== "setup" && (
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.firstName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontSize={14} fontWeight={600}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
          )}
          <Tooltip title={drawerOpen ? "Collapse menu" : "Expand menu"}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                toggleDrawer();
              }}
              size="small"
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                zIndex: 1,
                backgroundColor: "rgba(255,255,255,0.8)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
              }}
            >
              <MdMenu />
            </IconButton>
          </Tooltip>
        </Box>

        <List dense>
          <Slide direction="right" in={activeSubSidebar === "setup"} mountOnEnter unmountOnExit>
            <Box>
              {activeSubSidebar === "setup" && (
                <>
                  <Tooltip title={!drawerOpen ? "Back" : ""} placement="right">
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={async () => {
                          setActiveSubSidebar(null);
                          setDrawerOpen(false);
                          await new Promise((resolve) => setTimeout(resolve, transitionDuration));
                          await handleNavigation("/admin/setup");
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 0.75,
                          px: drawerOpen ? 1 : 1.5,
                          justifyContent: drawerOpen ? "flex-start" : "center",
                          minHeight: 48,
                          mb: 1,
                          "&:hover": { bgcolor: theme.palette.primary.light },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: 0, mr: drawerOpen ? 2 : "auto", justifyContent: "center" }}
                        >
                          <IoChevronBack size={18} />
                        </ListItemIcon>
                        {drawerOpen && (
                          <ListItemText primary="Back" primaryTypographyProps={{ fontSize: 14 }} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                  {setupSubMenuItems.map((item) => (
                    <Tooltip title={!drawerOpen ? item.label : ""} placement="right" key={item.label}>
                      <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          selected={router.pathname === item.path || router.pathname.startsWith(item.path + "/")}
                          onClick={async () => {
                            setActiveSubSidebar("setup");
                            await handleNavigation(item.path);
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 0.75,
                            px: drawerOpen ? 1 : 1.5,
                            justifyContent: drawerOpen ? "flex-start" : "center",
                            minHeight: 48,
                            "&.Mui-selected": {
                              bgcolor: theme.palette.primary.light,
                              color: "#344054",
                              border: "2px solid #7F56D9",
                            },
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              border: "2px solid #7F56D9",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{ minWidth: 0, mr: drawerOpen ? 2 : "auto", justifyContent: "center" }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          {drawerOpen && (
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                          )}
                        </ListItemButton>
                      </ListItem>
                    </Tooltip>
                  ))}
                </>
              )}
            </Box>
          </Slide>

          <Slide direction="left" in={!activeSubSidebar} mountOnEnter unmountOnExit>
            <Box>
              {filteredMenuItems.map((item) => (
                <React.Fragment key={item.label}>
                  <Tooltip title={!drawerOpen ? item.label : ""} placement="right">
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        selected={router.pathname === item.path || (item.path && router.pathname.startsWith(item.path + "/"))}
                        onClick={async () => {
                          if (item.label === "Setup") {
                            setActiveSubSidebar("setup");
                            setDrawerOpen(false);
                            await new Promise((resolve) => setTimeout(resolve, transitionDuration));
                          } else if (item.children) {
                            toggleSubmenu(item.label);
                            setDrawerOpen(false);
                            await new Promise((resolve) => setTimeout(resolve, transitionDuration));
                          } else {
                            await handleNavigation(item.path);
                          }
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 0.75,
                          px: drawerOpen ? 1 : 1.5,
                          justifyContent: drawerOpen ? "flex-start" : "center",
                          minHeight: 48,
                          "&.Mui-selected": {
                            bgcolor: theme.palette.primary.light,
                            color: "#344054",
                            border: "2px solid #7F56D9",
                          },
                          "&:hover": {
                            bgcolor: theme.palette.primary.light,
                            border: "2px solid #7F56D9",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: drawerOpen ? 2 : "auto",
                            justifyContent: "center",
                            color: "#6b7280",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        {drawerOpen && (
                          <>
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                            {item.children &&
                              (openMenus.includes(item.label) ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />)}
                          </>
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                  {item.children && drawerOpen && (
                    <Collapse in={openMenus.includes(item.label)} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child) => (
                          <ListItem key={child.label} disablePadding>
                            <Tooltip title={!drawerOpen ? child.label : ""} placement="right">
                              <ListItemButton
                                selected={router.pathname === child.path || router.pathname.startsWith(child.path + "/")}
                                onClick={() => handleNavigation(child.path)}
                                sx={{
                                  borderRadius: 2,
                                  py: 0.75,
                                  px: 1,
                                  pl: 4,
                                  "&.Mui-selected": {
                                    bgcolor: theme.palette.primary.light,
                                    color: "#344054",
                                    border: "2px solid #7F56D9",
                                  },
                                  "&:hover": {
                                    bgcolor: theme.palette.primary.light,
                                    border: "2px solid #7F56D9",
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>{child.icon}</ListItemIcon>
                                {drawerOpen && (
                                  <ListItemText
                                    primary={child.label}
                                    primaryTypographyProps={{ fontSize: 13 }}
                                  />
                                )}
                              </ListItemButton>
                            </Tooltip>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
              <Tooltip title={!drawerOpen ? "Logout" : ""} placement="right">
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation("/login")}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      px: drawerOpen ? 1 : 1.5,
                      justifyContent: drawerOpen ? "flex-start" : "center",
                      minHeight: 48,
                      color: "#ef4444",
                      "&:hover": { bgcolor: "#fee2e2" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: drawerOpen ? 2 : "auto",
                        justifyContent: "center",
                        color: "#ef4444",
                      }}
                    >
                      <MdLogout size={18} />
                    </ListItemIcon>
                    {drawerOpen && (
                      <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            </Box>
          </Slide>
        </List>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fff",
          borderRadius: 2,
          overflowX: "auto",
          ml: drawerOpen ? "260px" : "60px",
          transition: `margin-left ${transitionDuration}ms ${transitionEasing}`,
          height: "100vh",
          overflowY: "hidden",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2}
          py={1.5}
          bgcolor="#fff"
          boxShadow="4px 0 6px -1px rgba(0, 0, 0, 0.1)"
        >
          <Typography variant="h6" fontSize={16} fontWeight={600}>
            {getCurrentPageTitle()}
          </Typography>
          {dateTime && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Box display="flex" alignItems="center" gap={2} sx={{ fontFamily: "monospace", px: 2, py: 0.5 }}>
                <Typography fontSize={14} fontWeight={600} color="text.secondary">
                  📅 {dateTime.toLocaleDateString()}
                </Typography>
                <Typography fontSize={14} fontWeight={600} color="text.secondary">
                  ⏰ {dateTime.toLocaleTimeString()}
                </Typography>
              </Box>
            </motion.div>
          )}
        </Box>

        {/* Page content */}
        <Box p={2} sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {pageLoading || loading ? <Loader /> : children}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;