"use client"

import React, { forwardRef, useEffect, useState, useCallback } from "react"
import {
  Autocomplete,
  TextField,
  SxProps,
  TextFieldProps,
  Typography,
  Box,
  ListItemText,
  CircularProgress,
} from "@mui/material"
import { createFilterOptions } from "@mui/material/Autocomplete"
import { Virtuoso } from "react-virtuoso"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import { getPartiesByCompanyThunk } from "@/store/slices/partySlice"
import ThemeSelect from "../common_component/themeselect"
import { getCompanyWisePermission } from "@/utills/utills"

// ─── Types ────────────────────────────────────────────────────────────────────

type OptionType = {
  key?: string | number
  label: string
  value: string | number
  [key: string]: any
}

interface Option {
  label: string
  value: string
  default?: boolean
}

interface CompanySelectProps {
  label?: string
  name: string
  value: any
  onChange: (event: any, newValue: any) => void
  error?: boolean
  helperText?: string
  required?: boolean
  hasParties?: boolean
  showPartyName?: boolean
  disableCompanySelect?: boolean
  partyName?: string
  onPartyChange?: (event: any, newValue: any) => void
  partyError?: boolean
  partyHelperText?: string
}

interface VirtualThemeSelectProps {
  name?: string
  label?: string
  options: OptionType[]
  value?: OptionType | null
  onChange?: (event: React.SyntheticEvent, newValue: OptionType | null) => void
  error?: boolean
  helperText?: string | boolean | undefined | any
  required?: boolean
  textFieldProps?: TextFieldProps
  disabled?: boolean
  sx?: SxProps
  size?: "small" | "medium"
  placeholder?: string
  readOnly?: boolean
  renderOptionCustom?: boolean
  loading?: boolean
}

// ─── Filter — same as ThemeSelect ────────────────────────────────────────────

const filter = createFilterOptions<OptionType>({
  stringify: (option) =>
    option.label.toLowerCase().replace(/\s+/g, " ").trim(),
})

// ─── VirtuosoListbox ──────────────────────────────────────────────────────────
// MUI Autocomplete ka ListboxComponent prop.
// MUI ke outer <ul> ka overflow hidden karo — sirf Virtuoso scroll kare.

const ITEM_HEIGHT = 48

const VirtuosoListbox = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement>
>(function VirtuosoListbox({ children, style, ...rest }, ref) {
  const items = Array.isArray(children) ? children : []

  // MUI grouped options nested arrays mein aate hain — flatten
  const flatItems: React.ReactNode[] = items.flatMap((child) =>
    Array.isArray(child) ? child : [child]
  )

  const visibleCount = Math.min(flatItems.length, 8)
  const height = visibleCount * ITEM_HEIGHT

  return (
    <div
      ref={ref}
      {...rest}
      // FIX: MUI ke outer wrapper ka overflow band karo — double scrollbar gone
      style={{ ...style, overflow: "hidden", padding: 0, margin: 0 }}
    >
      <Virtuoso
        style={{ height }}
        totalCount={flatItems.length}
        itemContent={(index) => (
          <div style={{ height: ITEM_HEIGHT, display: "flex", alignItems: "center" }}>
            {flatItems[index]}
          </div>
        )}
        overscan={200}
      />
    </div>
  )
})

// ─── VirtualThemeSelect ───────────────────────────────────────────────────────
// ThemeSelect ka exact clone — sirf ListboxComponent aur ListboxProps alag hain.

export const VirtualThemeSelect: React.FC<VirtualThemeSelectProps> = ({
  label = "",
  options,
  value,
  onChange,
  error = false,
  helperText = "",
  required = false,
  textFieldProps,
  disabled = false,
  sx = {},
  size = "small",
  placeholder = "",
  readOnly = false,
  renderOptionCustom = true,
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (!value) setInputValue("")
  }, [value])

  return (
    <Box sx={{ width: "100%", ...sx }}>
      {label && (
        <Typography fontWeight={700} fontSize={14} color="#344054" mb={0.5}>
          {label} {required && <span style={{ color: "red" }}>*</span>}
        </Typography>
      )}

      <Autocomplete
        options={options}
        getOptionLabel={(option) => option?.label || ""}
        value={value}
        inputValue={inputValue}
        onInputChange={(_, newInput) => setInputValue(newInput)}
        onChange={onChange}
        isOptionEqualToValue={(option, val) => option.value === val?.value}
        disabled={disabled}
        size={size}
        readOnly={readOnly}
        popupIcon={undefined}

        // ▶ Virtuoso listbox swap
        ListboxComponent={VirtuosoListbox}

        // ▶ FIX: MUI ka inline maxHeight + overflow override — double scrollbar gone
        ListboxProps={{
          style: { overflow: "hidden", maxHeight: "none" },
        }}

        filterOptions={(opts, state) => {
          const input = state.inputValue.toLowerCase().replace(/\s+/g, " ").trim()
          return filter(opts, { ...state, inputValue: input })
        }}

        // Styles — ThemeSelect ke saath identical
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            background: "#fff",
            fontWeight: 600,
            fontSize: 14,
            color: "#667085",
            boxSizing: "border-box",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D0D5DD",
          },
          "& .MuiAutocomplete-input": {
            fontWeight: 600,
            fontSize: 14,
            color: "#667085",
            padding: "10px 0",
          },
          "& .MuiSvgIcon-root": {
            color: "#667085",
          },
        }}

        // renderOption — ThemeSelect ke saath identical
        renderOption={(props, item) =>
          renderOptionCustom ? (
            <li {...props} key={item.key || item.value}>
              <ListItemText
                primary={item.label}
                style={{ fontSize: "30px", fontWeight: 500 }}
              />
            </li>
          ) : (
            <li {...props} key={item.key || item.value}>
              {item.label}
            </li>
          )
        }

        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              sx: {
                fontWeight: 600,
                fontSize: 14,
                color: "#667085",
                background: "#fff",
                borderRadius: "10px",
                minHeight: 48,
              },
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            {...textFieldProps}
          />
        )}

        clearOnBlur={false}
        noOptionsText="No options found"
      />
    </Box>
  )
}

// ─── CompanySelect ────────────────────────────────────────────────────────────

const CompanySelect: React.FC<CompanySelectProps> = ({
  label = "Company Name",
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  hasParties = false,
  showPartyName = false,
  disableCompanySelect = false,
  partyName = "",
  onPartyChange,
  partyError = false,
  partyHelperText = "",
}) => {
  const dispatch = useAppDispatch()
  const { companies, loading } = useAppSelector((state) => state.company)
  const { parties, loading: partyLoading } = useAppSelector((state) => state.party)

  const [companyOptions, setCompanyOptions] = useState<Option[]>([])
  const [partyOptions, setPartyOptions] = useState<Option[]>([])
  const [defaultSet, setDefaultSet] = useState(() => !!value || !!partyName)

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk()).unwrap()
  }, [hasParties])

  useEffect(() => {
    if (!companies?.length) { setCompanyOptions([]); return }

    const options: Option[] = companies.map((company: any) => ({
      label: company.companyName || company.name,
      value: company._id,
      default: company?.default,
    }))
    setCompanyOptions(options)

    const hasCompanyValue = !!(typeof value === "object" ? value?.value : value)
    const hasPartyValue = !!(typeof partyName === "object" ? (partyName as any)?.value : partyName)

    if (!hasCompanyValue && !hasPartyValue && !defaultSet) {
      const defaultCompany = options.find((o) => o.default)
      if (defaultCompany) {
        onChange(null, defaultCompany)
        setDefaultSet(true)
      }
    }
  }, [companies, hasParties, value, partyName, onChange, defaultSet])

  useEffect(() => {
    if (showPartyName && value) {
      const companyId = typeof value === "object" ? value.value : value
      if (companyId) {
        dispatch(getPartiesByCompanyThunk(companyId)).unwrap().catch(console.error)
      }
    } else if (!showPartyName) {
      setPartyOptions([])
    }
  }, [value, showPartyName])

  useEffect(() => {
    if (parties?.length) {
      const options: Option[] = parties.map((party: any) => ({
        label: `${party?.partyName?.trim() ?? ""} - ${party?.unitNo?.trim() ?? ""}, ${party?.marketName ?? ""}`,
        value: party._id,
      }))
      setPartyOptions(options)
    } else {
      setPartyOptions([])
    }
  }, [parties])

  const getSelectedCompanyValue = useCallback((): Option | null => {
    if (!value || !companyOptions.length) return null
    const id = typeof value === "object" ? value.value : value
    return companyOptions.find((o) => o.value === id) ?? null
  }, [value, companyOptions])

  const getSelectedPartyValue = useCallback((): Option | null => {
    if (!partyName || !partyOptions.length) return null
    const id = typeof partyName === "object" ? (partyName as any).value : partyName
    return partyOptions.find((o) => o.value === id) ?? null
  }, [partyName, partyOptions])

  const selectedCompanyValue = getSelectedCompanyValue()
  const selectedPartyValue = getSelectedPartyValue()

  const filteredCompanyOptions = companyOptions.filter((item) =>
    [getCompanyWisePermission(5), getCompanyWisePermission(6)].includes(item.value)
  )

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={56}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  return (
    <Box display="flex" gap={2} width="100%">
      {/* Company — chhoti list, ThemeSelect */}
      <Box flex={1}>
        <ThemeSelect
          label={label}
          options={filteredCompanyOptions}
          value={selectedCompanyValue}
          onChange={onChange}
          name={name}
          error={error}
          helperText={helperText}
          required={required}
          disabled={disableCompanySelect}
        />
      </Box>

      {/* Party — badi list, VirtualThemeSelect */}
      {showPartyName && (
        <Box flex={1}>
          <VirtualThemeSelect
            label="Party Name"
            options={partyOptions}
            value={selectedPartyValue}
            onChange={onPartyChange}
            error={partyError}
            helperText={partyHelperText}
            required={required}
            disabled={!value || partyOptions.length === 0}
            loading={partyLoading}
          />
        </Box>
      )}
    </Box>
  )
}

export default CompanySelect