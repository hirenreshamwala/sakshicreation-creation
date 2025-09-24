import TabComponent from '@/component/Dialog/TabComponent';
import { StaticCompanyOptions } from '@/constants';
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

    return (
        <>
            {user?.qp && user?.sakshi && <TabComponent activeTab={activeTab} setActiveTab={setActiveTab} />}

            {(activeTab === 0 || activeTab === 1) && (
                <>
                    {/* Admin always sees Sakshi */}
                    {activeTab === 0 && user?.sakshi && <ComplainPage company={companies.find((item) => item.companyName === StaticCompanyOptions[0])} />}

                    {/* Admin sees Quality only when "Quality Packing" tab is active */}
                    {activeTab === 1 && user?.qp && <ComplainPage company={companies.find((item) => item.companyName === StaticCompanyOptions[1])} />}
                </>
            )}
        </>
    );
};

export default Index;
