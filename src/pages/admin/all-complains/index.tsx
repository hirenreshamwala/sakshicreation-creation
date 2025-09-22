import TabComponent from '@/component/Dialog/TabComponent';
import { companyOptions, StaticCompanyOptions } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import React, { useEffect, useState } from 'react';
import ComplainPage from './ComplainPage';
import { getAllCompaniesThunk } from '@/store/slices/compnaySlice';

const Index = () => {
    const dispatch = useAppDispatch()
    const { user } = useAppSelector((state) => state.auth);
    const { companies } = useAppSelector((state) => state.company);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (!companies.length) dispatch(getAllCompaniesThunk(true))
    }, [])

    const roleName = user?.role?.roleName || '';
    const company = user?.role?.company?.companyName || '';
    const companyID = user?.role?.company || '';

    const isAdmin = roleName.toLowerCase() === 'admin';
    const isSakshi = company === companyOptions[0]; // index 0 → Sakshi Creation
    const isQuality = company === companyOptions[1]; // index 1 → Quality

    return (
        <>
            {isAdmin && <TabComponent activeTab={activeTab} setActiveTab={setActiveTab} />}

            {(activeTab === 0 || activeTab === 1) && (
                <>
                    {isAdmin ? (
                        <>
                            {/* Admin always sees Sakshi */}
                            {activeTab === 0 && <ComplainPage company={companies.find((item) => item.companyName === StaticCompanyOptions[0])} />}

                            {/* Admin sees Quality only when "Quality Packing" tab is active */}
                            {activeTab === 1 && <ComplainPage company={companies.find((item) => item.companyName === StaticCompanyOptions[1])} />}
                        </>
                    ) : (
                        <>
                            {/* Staff sees only their assigned company */}
                            {(isSakshi || isQuality) && <ComplainPage company={companyID} />}
                        </>
                    )}
                </>
            )}
        </>
    );
};

export default Index;
