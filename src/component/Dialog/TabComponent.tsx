"use client"

import type React from "react"
import { useState } from "react"
import { Box, Tabs, Tab } from "@mui/material"
import { companyOptions } from "@/constants"

interface AddOrderDialogProps {
    activeTab: () => void
    tabList?: any
}

const TabComponent: React.FC<AddOrderDialogProps> = ({ setActiveTab,activeTab, tabList = companyOptions }) => {
    const [tab, setTab] = useState(activeTab)
    const tabLabels = tabList

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                <Box
                    sx={{
                        position: "relative",
                        display: "inline-flex",
                        borderRadius: "12px",
                        border: "2px solid #7F56D9",
                        backgroundColor: "#fff",
                        p: "2px",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: 2,
                            left: tab === 0 ? 2 : "50%",
                            width: "50%",
                            height: "calc(100% - 4px)",
                            backgroundColor: "#7F56D9",
                            borderRadius: "10px",
                            zIndex: 0,
                            transition: "left 0.3s ease",
                        }}
                    />
                    <Tabs
                        value={tab}
                        onChange={(_, v) => {
                            setTab(v)
                            setActiveTab(v)
                        }}
                        TabIndicatorProps={{ style: { display: "none" } }}
                        sx={{
                            minHeight: 0,
                            zIndex: 1,
                            "& .MuiTabs-flexContainer": {
                                gap: 0,
                            },
                            "& .MuiTab-root": {
                                textTransform: "none",
                                minHeight: 0,
                                px: 1.8,
                                py: 0.8,
                                fontWeight: 700,
                                fontSize: 14,
                                borderRadius: "10px",
                                color: "#7F56D9",
                                transition: "color 0.3s ease",
                                zIndex: 1,
                            },
                            "& .MuiTab-root.Mui-selected": {
                                color: "#fff",
                                backgroundColor: "transparent",
                                zIndex: 2,
                            },
                        }}
                    >
                        {tabLabels.map((label) => (
                            <Tab key={label} label={label} disableRipple />
                        ))}
                    </Tabs>
                </Box>
            </Box>
        </>
    )
}

export default TabComponent