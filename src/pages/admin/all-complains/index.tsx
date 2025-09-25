import TabComponent from '@/component/Dialog/TabComponent';
import { StaticCompanyOptions } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import React, { useEffect, useState } from 'react';
import ComplainPage from './ComplainPage';
import { getAllCompaniesThunk } from '@/store/slices/compnaySlice';
import { getCompanyWisePermission } from '@/utills/utills';

const Index = () => {
    const dispatch = useAppDispatch()
    const { user } = useAppSelector((state) => state.auth);
    const { companies } = useAppSelector((state) => state.company);
    const [activeTab, setActiveTab] = useState(0);

    // Determine user permissions
    const hasSakshiPermission = getCompanyWisePermission(1)
    const hasQpPermission = getCompanyWisePermission(2)
    const hasBothPermissions = getCompanyWisePermission(0)

    useEffect(() => {
        if (!companies.length) dispatch(getAllCompaniesThunk(true))
    }, [])

    // Show tabs only if user has both permissions
    const shouldShowTabs = hasBothPermissions;

    // Determine what content to show based on permissions and active tab
    const shouldShowSakshi = 
        (hasBothPermissions && activeTab === 0) || 
        (hasSakshiPermission && !hasQpPermission); // Show sakshi if user only has sakshi permission

    const shouldShowQp = 
        (hasBothPermissions && activeTab === 1) || 
        (hasQpPermission && !hasSakshiPermission); // Show qp if user only has qp permission

    // If user has no permissions
    if (!hasSakshiPermission && !hasQpPermission) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px',
                padding: '20px'
            }}>
                <p style={{ color: '#ef4444', fontSize: '18px', textAlign: 'center' }}>
                    You don't have permission to view this page.
                </p>
            </div>
        );
    }

    return (
        <>
            {shouldShowTabs && <TabComponent activeTab={activeTab} setActiveTab={setActiveTab} />}
            
            {shouldShowSakshi && (
                <ComplainPage company={companies.find((item) => item.companyName === StaticCompanyOptions[0])} />
            )}
            
            {shouldShowQp && (
                <ComplainPage company={companies.find((item) => item.companyName === StaticCompanyOptions[1])} />
            )}
        </>
    );
};

export default Index;