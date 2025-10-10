import React, { useEffect } from "react";
import { Box, TableCell } from "@mui/material";
import { useAppSelector } from "@/store";
import Request from "@/services/axios";
import BasicTable from "../common_component/Table/themetable";
import Loader from "../common_component/loader";

interface InactivePartiesDataProps {
    activeTab: number;
    companyName: string;
}

const columns = [
    { id: 'partyName', label: 'Party' },
    { id: 'address', label: 'Address' },
    { id: 'createdBy', label: 'Created By' },
    { id: 'lastroderDate', label: 'Last order Date' },
];

const InactivePartiesData: React.FC<InactivePartiesDataProps> = ({
    activeTab,
    companyName,
}) => {
    const { user } = useAppSelector((state) => state.auth);
    const [inactiveData, setInactiveData] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Inactive parties ke liye API endpoint
    const getInactiveEndpoint = () => {
        if (companyName === 'Sakshi') {
            return '/api/report/getscinactive-parties';
        } else if (companyName === 'QP') {
            return '/api/report/getqpinactive-parties';
        }
        return '';
    };

    // Inactive parties data fetch karein
    const fetchInactiveData = async () => {
        const endpoint = getInactiveEndpoint();
        if (!endpoint || !user?.id) return;

        setLoading(true);
        try {
            const BaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8383';
            const res = await Request.get(`${BaseURL}${endpoint}`);

            if (res.data.success) {
                setInactiveData(res.data.data || []);
            } else {
                setInactiveData([]);
            }
        } catch (err) {
            console.error("Error fetching inactive parties data:", err);
            setInactiveData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchInactiveData();
        }
    }, [activeTab, companyName]);

    // Last order date format karein - agar null hai to "NEW PARTY" dikhayein
    const formatLastOrderDate = (date: string | null) => {
        if (!date) {
            return "NEW PARTY";
        }

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const handleNewcClick = (partyName) => {
        const url = `/admin/all-orders?&party=${partyName}&c=${companyName}`;
        window.open(url, '_blank');
    };

    return (
        <Box sx={{ p: 2 }}>
            {!loading && inactiveData.length > 0 ? (
                <BasicTable
                    showDatePicker={false}
                    showFillter={false}
                    showSearch={false}
                    title='Inactive Parties'
                    tableHeader={columns}
                    rowData={inactiveData}
                    renderRow={(row) => {
                        console.log("DEBUG : row:", row);
                        return (<>
                            <TableCell onClick={() => handleNewcClick(row._id)} sx={{ cursor: 'pointer' }}>{row.partyName || 'N/A'}</TableCell>
                            <TableCell>{`${row.address.unitNo} - ${row.address.marketName} - ${row.address.area} - ${row.address.pincode}`}</TableCell>
                            <TableCell>{`${row.createdBy.firstName} ${row.createdBy.lastName}`}</TableCell>
                            <TableCell>{formatLastOrderDate(row.lastOrderDate)}</TableCell>
                        </>);
                    }}
                />
            ) : (
                !loading && <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>
                    {loading ? <Loader /> : `No inactive parties data for ${companyName}`}
                </Box>
            )}
        </Box>
    );
};

export default InactivePartiesData;