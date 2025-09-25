"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Typography } from "@mui/material"
import { companyOptions } from "@/constants"

interface AddOrderDialogProps {
  setActiveTab: (tab: number) => void
  activeTab: number
  tabList?: string[]
  align?: "left" | "center" | "right"   // 👈 new prop
}

const TabComponent: React.FC<AddOrderDialogProps> = ({
  setActiveTab,
  activeTab,
  tabList = companyOptions,
  align = "center"   // 👈 default is center
}) => {
  const [tab, setTab] = useState(activeTab)

  const handleTabClick = (index: number) => {
    setTab(index)
    setActiveTab(index)
  }

  // map align prop to flex position
  const justifyContentMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end"
  }
  useEffect(() => {
  setTab(activeTab)
}, [activeTab])

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: justifyContentMap[align],
        alignItems: "center",
        width: "100%" // 👈 takes full width so left/right align works
      }}
    >
      <Box
        sx={{
          border: "2px solid #7f56d9",
          display: "inline-flex",
          overflow: "hidden",
          p: 0.4,
          borderRadius: 2,
          backgroundColor: "white",
          gap: 1
        }}
      >
        {tabList.map((item, index) => (
          <Box
            key={index}
            onClick={() => handleTabClick(index)}
            sx={{
              padding: "4px 10px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderRadius: 1.5,
              backgroundColor: tab === index ? "#7f56d9" : "white",
              color: tab === index ? "white" : "#7f56d9",
              "&:hover": {
                backgroundColor: tab === index ? "#7f56d9" : "#f9f5ff",
                color: tab === index ? "white" : "#7f56d9"
              }
            }}
          >
            <Typography sx={{ fontWeight: 550, fontSize: "15px" }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default TabComponent
