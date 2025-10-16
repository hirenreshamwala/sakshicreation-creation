import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, TableCell, Typography, Button } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { FaChevronRight } from "react-icons/fa6"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"

import { useAppDispatch, useAppSelector } from "@/store"
import { getAllOrdersThunk, getOrdersByStaffIdThunk } from "@/store/slices/orderSlice"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch } from "react-icons/fi"
import { InputBase } from "@mui/material"
import { getCompanyWisePermission, getDisplayStatus, getUserData } from "@/utills/utills"
import QpOrdersPage from "@/component/allorderdailog/QpOrder"
import TabComponent from "@/component/Dialog/TabComponent"
import { companyOptions, StaticCompanyOptions } from "@/constants"
import Loader from "@/component/common_component/loader"
import { toast } from "react-toastify"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import AddSakhiOrderDialog from "@/component/allorderdailog"
import { generateInvoicePDF } from "@/utills/generateInvoicePDF"
import ComplainDialogue from "../all-complains/ComplainDialogue"

const columns = [
  { id: "orderNumber", label: "Order No." },
  { id: "company", label: "Company" },
  { id: "party", label: "Party" },
  { id: "date", label: "Date" },
  { id: "item", label: "Item Name" },
  { id: "size", label: "Size" },
  { id: "remarks", label: "Remarks" },
  { id: "orderedBy", label: "Ordered By" },
  { id: "orderStatus", label: "Order Status" },
  { id: "actions", label: "Actions" },
  { id: "complain", label: "Complain" },
]

type OrderRow = {
  _id: string
  orderNumber: string
  companyName: {
    companyName: string
  }
  party: {
    partyName: string
    ownerMobileNo?: string
    address?: {
      unitNo?: string;
      marketName?: { marketName: string; _id: string } | string;
      landMark?: string;
      area?: { area: string; _id: string } | string;
      pincode?: string;
      streetAddress?: string;
    };
    GSTNo?: string;
  };
  productItem: {
    itemName: string
  }
  size?: { size: string }
  createdAt: string
  remarks: string
  createdBy: {
    firstName: string
    lastName: string
  }
  status: string
  // Sub-status fields
  designerStatus?: string
  printerStatus?: string
  binderStatus?: string
  bookletBinderStatus?: string
  // Staff assignment fields
  designer?: { _id: string }
  printer?: { _id: string }
  binder?: { _id: string }
  bookletBinder?: { _id: string }
  quotation?: Array<{ unitPrice: number; gst: number }>
  qty?: number
  daysAfterConfirmation?: number
}

const AllOrdersPage = () => {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { orders, loading, error, totalCount, pagination } = useAppSelector((state) => state.orders)

  const { companies } = useAppSelector((state) => state.company)
  const { user } = useAppSelector((state) => state.auth)
  const { markets } = useAppSelector((state) => state.markets)
  const userData = getUserData()

  // Filter state
  const { companyName, c, staffId, startDate: st, endDate: ed, party } = router.query
  const [activeTab, setActiveTab] = useState(c === "Quality Packaging" ? 1 : 0);
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null)
  const [selectedFilterValues, setSelectedFilterValues] = useState<string[] | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [complainOpen, setComplainOpen] = useState(false);
  const [selectedOrderForComplain, setSelectedOrderForComplain] = useState<OrderRow | null>(null);


  const canViewGlobal = userData?.role?.permissions?.all_orders?.view_global
  const canViewOwn = userData?.role?.permissions?.all_orders?.view_own
  const canCreate = userData?.role?.permissions?.all_orders?.create

  // Determine user permissions
  const hasSakshiPermission = getCompanyWisePermission(1)
  const hasQpPermission = getCompanyWisePermission(2)
  const hasBothPermissions = getCompanyWisePermission(0)

  // Get unique values for the selected filter field
  const getUniqueValues = useMemo(() => {
    if (!selectedFilterField) return [];
    const columnId = columns.find((col) => col.label === selectedFilterField)?.id;
    if (!columnId) return [];

    const values = orders.map((order) => {
      let value: string | undefined;

      switch (columnId) {
        case "company":
          value = order.companyName?.companyName;
          break;
        case "party":
          value = order.party?.partyName;
          break;
        case "orderNumber":
          value = order.orderNumber;
          break;
        case "date":
          value = formatDate(order.createdAt);
          break;
        case "item":
          value = order.productItem?.itemName;
          break;
        case "size":
          value = order.size?.size;
          break;
        case "remarks":
          value = order.remarks;
          break;
        case "orderedBy":
          value = order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : undefined;
          break;
        case "orderStatus":
          value = getDisplayStatus(order).text;
          break;
      }
      return value || "N/A";
    });

    return Array.from(new Set(values)).filter((v) => v !== "N/A").sort();
  }, [selectedFilterField, orders]);

  useEffect(() => {
    if (c)
      setActiveTab(c === "Quality Packaging" || c === "QP" ? 1 : 0)

  }, [c])

  const handleComplainClick = (rowData: OrderRow) => {
    setSelectedOrderForComplain(rowData);
    setComplainOpen(true);
  };

  // Filter orders based on search query, date range, and selected filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesDateRange =
        (!startDate || new Date(order.createdAt) >= new Date(startDate).setHours(0, 0, 0, 0)) &&
        (!endDate || new Date(order.createdAt) <= new Date(endDate).setHours(23, 59, 59, 999));

      const matchesSearch = searchQuery
        ? order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.companyName?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.party?.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productItem?.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesFilters = Object.keys(filters).every((columnId) => {
        if (filters[columnId].length === 0) return true;
        let value: string | undefined;
        switch (columnId) {
          case "company":
            value = order.companyName?.companyName;
            break;
          case "party":
            value = order.party?.partyName;
            break;
          case "orderNumber":
            value = order.orderNumber;
            break;
          case "date":
            value = formatDate(order.createdAt);
            break;
          case "item":
            value = order.productItem?.itemName;
            break;
          case "size":
            value = order.size?.size;
            break;
          case "remarks":
            value = order.remarks;
            break;
          case "orderedBy":
            value = order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : undefined;
            break;
          case "orderStatus":
            value = getDisplayStatus(order).text;
            break;
        }
        return value && filters[columnId].includes(value);
      });

      return matchesDateRange && matchesSearch && matchesFilters;
    });
  }, [orders, startDate, endDate, searchQuery, filters]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (canViewGlobal) {
      dispatch(getAllOrdersThunk({ companyName, staffId, startDate: st, endDate: ed, party, c })); // Increase limit to fetch more orders
    } else if (canViewOwn && userData?.id) {
      dispatch(getOrdersByStaffIdThunk(userData.id));
    }
  }, [dispatch, router, canViewGlobal, canViewOwn, userData?.id]);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true))
  }, [])



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getRouteByStatus = (row: OrderRow): string => {
    const { status, designer, printer, binder, bookletBinder } = row;
    switch (status) {
      case "Received":
        return `/admin/all-orders/view?id=${row._id}`;
      case "Designer":
        return `/admin/all-orders/view/designer?id=${row._id}`;
      case "Printer":
        return `/admin/all-orders/view/printers?id=${row._id}`;
      case "Binder":
        return `/admin/all-orders/view/binder?id=${row._id}`;
      case "Booklet & Folder Binder":
        return `/admin/all-orders/view/booklet-folder?id=${row._id}`;
      case "Delivery":
        return `/admin/all-orders/view/dilevery?id=${row._id}`;
      case "Hold":
        if (bookletBinder) {
          return `/admin/all-orders/view/booklet-folder?id=${row._id}`;
        } else if (binder) {
          return `/admin/all-orders/view/binder?id=${row._id}`;
        } else if (printer) {
          return `/admin/all-orders/view/printers?id=${row._id}`;
        } else if (designer) {
          return `/admin/all-orders/view/designer?id=${row._id}`;
        } else {
          return `/admin/all-orders/view?id=${row._id}`;
        }
      default:
        return `/admin/all-orders/view?id=${row._id}`;
    }
  };

  const handleRowClick = (row: OrderRow) => {
    const route = getRouteByStatus(row)
    router.push(route)
  }

  const handleDownloadInvoice = (row: OrderRow) => {
    console.log("🚀 ~ handleDownloadInvoice ~ row:", row)
    try {
      if (!row?.party?.address) {
        toast.error("Address data is missing");
        return;
      }

      const latestQuotation = row?.quotation?.[row?.quotation?.length - 1];
      const quantity = Number(row?.qty) || 0;
      const unitPrice = Number(latestQuotation?.unitPrice) || 0;
      const subtotal = quantity * unitPrice;
      const gstValue = Number(latestQuotation?.gst) || 0;
      const applyGST = gstValue > 0;
      const gstPercentage = gstValue;
      const gstAmount = applyGST ? subtotal * (gstPercentage / 100) : 0;
      const totalAmount = subtotal + gstAmount;

      const formData = {
        quotation: true,
        orderNumber: row?.orderNumber || "N/A",
        companyName: row?.companyName?.companyName || "N/A",
        remarks: row?.remarks || "",
        ownerMobileNo: row?.party?.ownerMobileNo || "",
        partyName: row?.party?.partyName || "N/A",
        addressName: [
          row?.party?.address?.unitNo || "",
          typeof row?.party?.address?.marketName === "object"
            ? row?.party?.address?.marketName?.marketName
            : markets?.find((item) => item._id === row?.party?.address?.marketName)?.marketName || "",
          markets?.find((item) => item._id === row?.party?.address?.landMark)?.landmark || "",
          typeof row?.party?.address?.area === "object"
            ? row?.party?.address?.area?.area
            : markets?.find((item) => item._id === row?.party?.address?.area)?.area || "",
          typeof row?.party?.address?.area === "object"
            ? row?.party?.address?.pincode?.area
            : markets?.find((item) => item._id === row?.party?.address?.pincode)?.area || "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
        GSTNo: row?.party?.GSTNo || "N/A",
        servicePerformance: row?.productItem?.itemName || "N/A",
        quantity: quantity,
        unitPrice: unitPrice,
        total: subtotal,
        finalAmount: totalAmount,
        applyGST: applyGST,
        gstPercentage: gstPercentage,
        daysAfterConfirmation: row?.daysAfterConfirmation || 0,
      }

      generateInvoicePDF(formData)
      toast.success("Quotation downloaded successfully")
    } catch (error) {
      console.error("Error downloading Quotation:", error)
      toast.error("Failed to download Quotation")
    }
  }

  const handleProformaDownload = (row: OrderRow) => {
    try {
      if (!row?.party?.address) {
        toast.error("Address data is missing");
        return;
      }

      const latestQuotation = row?.quotation?.[row?.quotation?.length - 1];
      const quantity = Number(row?.qty) || 0;
      const unitPrice = Number(latestQuotation?.unitPrice) || 0;
      const subtotal = quantity * unitPrice;
      const gstValue = Number(latestQuotation?.gst) || 0;
      const applyGST = gstValue > 0;
      const gstPercentage = gstValue;
      const gstAmount = applyGST ? subtotal * (gstPercentage / 100) : 0;
      const totalAmount = subtotal + gstAmount;

      const formData = {
        orderNumber: row?.orderNumber || "N/A",
        companyName: row?.companyName?.companyName || "N/A",
        remarks: row?.remarks || "",
        ownerMobileNo: row?.party?.ownerMobileNo || "",
        partyName: row?.party?.partyName || "N/A",
        addressName: [
          row?.party?.address?.unitNo || "",
          typeof row?.party?.address?.marketName === "object"
            ? row?.party?.address?.marketName?.marketName
            : markets?.find((item) => item._id === row?.party?.address?.marketName)?.marketName || "",
          markets?.find((item) => item._id === row?.party?.address?.landMark)?.landmark || "",
          typeof row?.party?.address?.area === "object"
            ? row?.party?.address?.area?.area
            : markets?.find((item) => item._id === row?.party?.address?.area)?.area || "",
          typeof row?.party?.address?.area === "object"
            ? row?.party?.address?.pincode?.pincode
            : markets?.find((item) => item._id === row?.party?.address?.pincode)?.pincode || "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
        GSTNo: row?.party?.GSTNo || "N/A",
        servicePerformance: row?.productItem?.itemName || "N/A",
        quantity: quantity,
        unitPrice: unitPrice,
        total: subtotal,
        finalAmount: totalAmount,
        applyGST: applyGST,
        gstPercentage: gstPercentage,
        daysAfterConfirmation: row?.daysAfterConfirmation || 0,
      }

      generateInvoicePDF(formData)
      toast.success("Proforma downloaded successfully")
    } catch (error) {
      console.error("Error downloading Proforma:", error)
      toast.error("Failed to download Proforma")
    }
  }

  const StatusBadge = ({ row }: { row: OrderRow }) => {
    const { text, isHold } = getDisplayStatus(row);
    if (isHold) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
            {text}
          </Typography>
          <Box
            sx={{
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 600,
              borderRadius: "4px",
              px: 1,
              py: 0.25,
              textTransform: "uppercase",
            }}
          >
            HOLD
          </Box>
        </Box>
      );
    }

    return (
      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
        {text}
      </Typography>
    );
  };

  const getAvatarUrl = (row: OrderRow) => {
    if (row.companyName && (row.companyName as any).avatar) {
      return (row.companyName as any).avatar;
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, dispatch]);

  // Render content based on permissions
  const renderContent = () => {
    // If user has both permissions, show tab component
    if (hasBothPermissions) {
      return (
        <>
          <TabComponent activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 0 ? renderSakshiContent() : renderQpContent()}
        </>
      );
    }

    // If user has only sakshi permission
    if (hasSakshiPermission) {
      return renderSakshiContent();
    }

    // If user has only qp permission
    if (hasQpPermission) {
      return renderQpContent();
    }

    // If user has no permissions
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Typography variant="h6" color="error">
          You don't have permission to view this page.
        </Typography>
      </Box>
    );
  };

  const renderSakshiContent = () => (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => setStartDate(date)}
            onEndDateChange={(date) => setEndDate(date)}
          />
          <ThemeButton
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            Clear Date Range
          </ThemeButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              px: 1.5,
              width: 200,
              height: 35,
            }}
          >
            <IconButton size="small" sx={{ color: "#98A2B3" }}>
              <FiSearch size={18} />
            </IconButton>
            <InputBase
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ ml: 1, fontSize: 14 }}
            />
          </Box>
          <FilterDropdown
            filterOptions={columns
              .filter((col) => col.id !== "action")
              .map((col) => col.label)}
            uniqueValues={selectedFilterField ?
              getUniqueValues :
              []}
            onFiltersChange={(newFilters) => {
              const idBasedFilters: { [key: string]: string[] } = {};

              Object.entries(newFilters).forEach(([label, values]) => {
                const columnId = columns.find((col) => col.label === label)?.id;
                if (columnId) {
                  idBasedFilters[columnId] = values;
                }
              });

              setFilters(idBasedFilters);
            }}
            filters={Object.keys(filters).reduce((acc, columnId) => {
              const columnLabel = columns.find((col) => col.id === columnId)?.label;
              if (columnLabel) {
                acc[columnLabel] = filters[columnId];
              }
              return acc;
            }, {} as { [key: string]: string[] })}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          <ThemeButton onClick={() => setOpen(true)}>+ Add New Order</ThemeButton>
        </Box>
      </Box>
      <Box px={2} py={2}>
        <BasicTable
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          rowData={filteredOrders}
          totalCount={totalCount}
          pagination={pagination}
          renderRow={(row: OrderRow) => (
            <>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.orderNumber || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={getAvatarUrl(row)}
                    sx={{ width: 32, height: 32 }}
                    alt={row.companyName?.companyName || "Company"}
                  />
                  <Typography
                    fontWeight={600}
                    fontSize="14px"
                    color="#111827"
                    sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                    onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                  >
                    {row.companyName?.companyName || "N/A"}
                  </Typography>
                </Box>
              </TableCell>

              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.party?.partyName || "N/A"}
                </Typography>
              </TableCell>



              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {formatDate(row.createdAt)}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.productItem?.itemName || "N/A"}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.size?.size || "N/A"}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography sx={{ fontSize: 14, color: "text.secondary" }} title={row.remarks} noWrap>
                  {row.remarks && row.remarks.length > 10
                    ? `${row.remarks.substring(0, 13)}...`
                    : row.remarks}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.createdBy?.firstName || "N/A"} {row.createdBy?.lastName || "N/A"}
                </Typography>
              </TableCell>

              <TableCell>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                  onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                >
                  <StatusBadge row={row} />
                  <FaChevronRight
                    style={{
                      fontSize: 14,
                      color: "#9CA3AF",
                      marginLeft: 8,
                    }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDownloadInvoice(row)}
                    disabled={!row.quotation || row.quotation.length === 0}
                    sx={{ fontSize: "12px", textTransform: "none" }}
                  >
                    Quotation
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleProformaDownload(row)}
                    sx={{ fontSize: "12px", textTransform: "none" }}
                  >
                    Proforma
                  </Button>
                </Box>
              </TableCell>
              <TableCell>
                <ThemeButton
                  onClick={() => handleComplainClick(row)}
                >
                  Complain
                </ThemeButton>
              </TableCell>
            </>
          )}
        />
      </Box>

      {open ? <AddSakhiOrderDialog
        company={companies.find((item) => item.companyName === StaticCompanyOptions[0])?._id}
        open={open}
        onClose={() => setOpen(false)}
      /> : null}
      {complainOpen && selectedOrderForComplain && (
        <ComplainDialogue
          company={{
            _id: selectedOrderForComplain.companyName._id,
            companyName: selectedOrderForComplain.companyName.companyName
          }}
          open={complainOpen}
          onClose={() => {
            setComplainOpen(false);
            setSelectedOrderForComplain(null);
          }}
          selectedOrderData={selectedOrderForComplain} // Pass the selected order data
          // refreshData={refreshData}
        />
      )}
    </>
  );

  const renderQpContent = () => <QpOrdersPage />;

  if (loading) return <Typography><Loader /></Typography>;

  return <>{renderContent()}</>;
}

export default AllOrdersPage;