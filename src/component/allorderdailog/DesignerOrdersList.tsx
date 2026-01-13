import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getAllQPOrdersThunk } from "@/store/slices/qpOrderSlice";
import BasicTable from "@/component/common_component/Table/themetable";
import { Box, TableCell, Typography } from "@mui/material";
import Loader from "@/component/common_component/loader";
import { StatusCell } from "@/component/allorderdailog/StatusCell";
import DesignerTaskExpandable from "@/component/QpTask/DesignerTaskExpandable";

interface Order {
  _id: string;
  orderNo: number;
  companyName: { _id: string; companyName: string };
  party: { _id: string; partyName: string };
  status: string;
  designer: { _id: string; firstName: string; lastName: string };
  createdAt: string;
  varnish: boolean;
  lamination: boolean;
  laminationType: string;
  uv: boolean;
  uvType: string;
  orderdata?: {
    length?: number;
    width?: number;
    height?: number;
    ply?: string;
    deckal?: string;
  };
}

const DesignerOrdersList: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { orders, loading, error, totalCount, pagination } = useSelector(
    (state: RootState) => state.qpOrders
  );

  const [page, setPage] = useState(1);

  // Filter orders for designer
  const filteredOrders = orders.filter((order: Order) => 
    order.designer?._id === user?.id
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(getAllQPOrdersThunk());
    }
  }, [dispatch, user?.id, page]);

  // Define columns for designer view
  const columns = [
    { id: "orderNo", label: "Order Number" },
    { id: "companyName", label: "Company" },
    { id: "partyName", label: "Party" },
    { id: "size", label: "Sheet Size" },
    { id: "ply", label: "Ply" },
    { id: "uv", label: "UV" },
    { id: "status", label: "Status" },
  ];

  if (loading) return <Loader />

  return (
    <div>
      <BasicTable
        tableHeader={columns}
        rowData={filteredOrders}
        renderExpandedRow={(row: Order) => (
          <DesignerTaskExpandable row={row} />
        )}
        renderRow={(row: Order) => {
          return (
            <>
              <TableCell>
              <Box display="flex" alignItems="center" gap={1}>
                QP-{row.orderNo}
                
                {row.isUrgent && (
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
                    URGENT
                  </Box>
                )}
                
                {/* Designer Panel Status Badges - ONLY SHOW ONE AT A TIME */}
                <Box display="flex" flexDirection="column" gap={0.5} ml={1}>
                  {/* Priority 1: Rework requested (admin ne rework request કરેલ છે) */}
                  {row.reworkDesignFiles?.length > 0 && !row.approveDesign && !row.reworkDesignerFiles?.length && (
                    <Typography 
                      fontSize="10px" 
                      color="#dc2626" 
                      sx={{ 
                        backgroundColor: '#fee2e2', 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      Rework Design
                    </Typography>
                  )}
                  
                  {/* Priority 2: Rework files submitted (designer ne rework files submit કરેલ છે) */}
                  {/* {row.reworkDesignerFiles?.length > 0 && !row.approveDesign && (
                    <Typography 
                      fontSize="10px" 
                      color="#2563eb" 
                      sx={{ 
                        backgroundColor: '#dbeafe', 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      Rework Submitted
                    </Typography>
                  )}
                   */}
                  {/* Priority 3: Designer files uploaded but not approved */}
                  {/* {row.designerFiles?.length > 0 && !row.approveDesign && 
                  !row.reworkDesignFiles?.length && !row.reworkDesignerFiles?.length && (
                    <Typography 
                      fontSize="10px" 
                      color="#f59e0b" 
                      sx={{ 
                        backgroundColor: '#fef3c7', 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      Pending Approval
                    </Typography>
                  )} */}
                  
                  {/* Priority 4: Design approved */}
                  {row.approveDesign && (
                    <Typography 
                      fontSize="10px" 
                      color="#059669" 
                      sx={{ 
                        backgroundColor: '#d1fae5', 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      Approved
                    </Typography>
                  )}
                </Box>
              </Box>
            </TableCell>
              <TableCell>{row.companyName.companyName}</TableCell>
              <TableCell>{row.party?.partyName}</TableCell>
              <TableCell>
                {row.designerSize}
              </TableCell>
              <TableCell>{row.orderdata?.ply || 'N/A'}</TableCell>
              <TableCell>{row.uv ? row.uvType : "NO"}</TableCell>
              <TableCell><StatusCell row={row} /></TableCell>
            </>
          );
        }}
        showDatePicker={false}
        showSearch={false}
        showFillter={false}
        showExcelDownload={false}
        totalCount={totalCount}
        onPageChange={(newPage: number) => setPage(newPage)}
      />
    </div>
  );
};

export default DesignerOrdersList;