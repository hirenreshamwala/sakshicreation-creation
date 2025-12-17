import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getAllQPOrdersThunk } from "@/store/slices/qpOrderSlice";
import BasicTable from "@/component/common_component/Table/themetable";
import { Box, TableCell } from "@mui/material";
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
  console.log("DEBUG : DesignerOrdersList : filteredOrders:", filteredOrders);


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
              <TableCell>QP-{row.orderNo}{row.isUrgent && (
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
                                    )}</TableCell>
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