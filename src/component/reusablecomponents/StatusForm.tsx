"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { CircularProgress, Box, Chip } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllStatusesThunk } from "@/store/slices/statusSlice"
import ThemeSelect from "../common_component/themeselect"

interface StatusSelectProps {
  labelName?: string
  placeholder?: string
  name: string
  value: string // Only ID as string
  onChange: (event: any, newValue: string) => void // Only return ID
  error?: boolean
  helperText?: string
  required?: boolean
  statusType: "order" | "task" // Which model's status
  showOrderNumber?: boolean // Show order number with status name
  showDescription?: boolean // Show description with status name
  showColor?: boolean // Show color indicator
  showDefault?: boolean // When false, hides default status names completely
  onlyActive?: boolean // Only show active statuses
  disabled?: boolean
  fullWidth?: boolean
  sx?: any // Add sx prop for styling
}

const StatusSelect: React.FC<StatusSelectProps> = ({
  labelName = "Status",
  placeholder = "Select Status",
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  statusType,
  showOrderNumber = true,
  showDescription = false,
  showColor = true,
  showDefault = true, 
  onlyActive = true,
  disabled = false,
  fullWidth = true,
  sx,
}) => {
  const dispatch = useAppDispatch()
  const { orderStatuses, taskStatuses, loading, error: statusError } = useAppSelector((state) => state.status)

  const [options, setOptions] = useState<{ label: string; value: string; extra?: any }[]>([])

  // Get statuses based on type
  const getStatusesByType = () => {
    switch (statusType) {
      case "order":
        return orderStatuses
      case "task":
        return taskStatuses
      default:
        return []
    }
  }

  // Fetch statuses on component mount or when statusType changes
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        console.log(`Fetching ${statusType} statuses...`)
        await dispatch(
          getAllStatusesThunk({
            type: statusType,
            params: {
              isActive: onlyActive,
              limit: 100,
            },
          }),
        ).unwrap()
      } catch (err) {
        console.error(`${statusType} status fetch error:`, err)
      }
    }

    fetchStatuses()
  }, [dispatch, statusType, onlyActive])

  // Process statuses into options when data changes
  useEffect(() => {
    const statuses = getStatusesByType()

    if (statuses && statuses.length > 0) {
      // Filter only active statuses if needed
      let filteredStatuses = statuses
      if (onlyActive) {
        filteredStatuses = filteredStatuses.filter((status) => status.isActive)
      }

      // Sort by order number
      filteredStatuses.sort((a, b) => a.orderNumber - b.orderNumber)

      // Create options with dynamic filtering based on showDefault
      const statusOptions = filteredStatuses
        .filter(status => showDefault || !status.isDefault) // Hide default statuses when showDefault is false
        .map((status) => {
          let labelParts = []

          // Add order number if enabled
          if (showOrderNumber) {
            labelParts.push(`${status.orderNumber}.`)
          }

          // Add status name
          labelParts.push(status.name)

          // Add description if enabled
          if (showDescription && status.description) {
            labelParts.push(`- ${status.description}`)
          }

          return {
            label: labelParts.join(' '),
            value: status._id,
            extra: {
              color: status.color,
              description: status.description,
              isDefault: status.isDefault,
              orderNumber: status.orderNumber,
              isActive: status.isActive,
              statusType: status.statusType,
              name: status.name,
            },
          }
        })

      setOptions(statusOptions)
    } else {
      setOptions([])
    }
  }, [orderStatuses, taskStatuses, statusType, showOrderNumber, showDescription, showDefault, onlyActive])

  // Find the selected option based on the current value (ID)
  const getSelectedValue = () => {
    if (!value || !options.length) return null
    const found = options.find((option) => option.value === value)
    return found || null
  }

  const selectedValue = getSelectedValue()

  // Handle change - only return ID
  const handleChange = (event: any, newValue: any) => {
    const statusId = newValue ? newValue.value : ""
    onChange(event, statusId)
  }

  // Custom option renderer with color indicator
  const renderOption = (props: any, option: any) => {
    return (
      <Box component="li" {...props} display="flex" alignItems="center" gap={1}>
        {showColor && option.extra?.color && (
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: option.extra.color,
              border: "1px solid #ddd",
            }}
          />
        )}
        <span>{option.label}</span>
        {showDefault && option.extra?.isDefault && (
          <Chip 
            label="Default" 
            size="small" 
            color="primary" 
            sx={{ ml: 1, height: 20, fontSize: "10px" }} 
          />
        )}
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={56} sx={sx}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  return (
    <Box sx={sx}>
      <ThemeSelect
        label={labelName}
        options={options}
        value={selectedValue}
        onChange={handleChange}
        name={name}
        error={error}
        helperText={helperText || statusError}
        required={required}
        disabled={disabled || loading}
        placeholder={placeholder}
        fullWidth={fullWidth}
        renderOption={showColor || showDefault ? renderOption : undefined}
      />
    </Box>
  )
}

export default StatusSelect