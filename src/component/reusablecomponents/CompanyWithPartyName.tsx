"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { CircularProgress, Box } from "@mui/material"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import { getPartiesByCompanyThunk } from "@/store/slices/partySlice"
import ThemeSelect from "../common_component/themeselect"

interface CompanySelectProps {
  label?: string
  name: string
  value: any
  onChange: (event: any, newValue: any) => void
  error?: boolean
  helperText?: string
  required?: boolean
  hasParties?: boolean // true = only companies with parties, false = all companies
  showPartyName?: boolean
  partyName?: string
  onPartyChange?: (event: any, newValue: any) => void
  partyError?: boolean
  partyHelperText?: string
}

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
  partyName = "",
  onPartyChange,
  partyError = false,
  partyHelperText = "",
}) => {
  const dispatch = useAppDispatch()
  const { companies, loading, error: companyError } = useAppSelector((state) => state.company)
  const { parties, loading: partyLoading } = useAppSelector((state) => state.party)
  const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([])
  const [partyOptions, setPartyOptions] = useState<{ label: string; value: string }[]>([])
  const [defaultSet, setDefaultSet] = useState(() => !!value || !!partyName)

  // console.log(parties,'parties')


  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        await dispatch(getAllCompaniesThunk(hasParties)).unwrap()
      } catch (err) {
        console.error("Company fetch error:", err)
      }
    }

    fetchCompanies()
  }, [dispatch, hasParties])

  // Set company options and default to "Sakshi Creation" when companies data changes
  // Inside useEffect where you're setting default company
useEffect(() => {
  if (companies && companies.length > 0) {
    let filteredCompanies = companies

    // If hasParties is true, filter companies that have parties
    if (hasParties) {
      filteredCompanies = companies.filter((company: any) => {
        return company.partyList && company.partyList.length > 0
      })
    }

    const options = filteredCompanies.map((company: any) => ({
      label: company.companyName || company.name,
      value: company._id,
      default: company?.default,
    }))
    setCompanyOptions(options)

    // ✅ Only try setting default if NO company value, NO partyName, and NO defaultSet
    const hasCompanyValue = !!(typeof value === "object" ? value?.value : value)
    const hasPartyValue = !!(typeof partyName === "object" ? partyName?.value : partyName)

    if (!hasCompanyValue && !hasPartyValue && !defaultSet) {
      const defaultCompany = options.find((option) => option.default)
      if (defaultCompany) {
        onChange(null, defaultCompany)
        setDefaultSet(true)
      }
    }
  } else {
    setCompanyOptions([])
  }
}, [companies, hasParties, value, partyName, onChange, defaultSet])



  // Fetch parties when company changes (only if showPartyName is true)
  useEffect(() => {
    if (showPartyName && value) {
      const fetchParties = async () => {
        try {
          const companyId = typeof value === "object" ? value.value : value
          if (companyId) {
            await dispatch(getPartiesByCompanyThunk(companyId)).unwrap()
          }
        } catch (err) {
          console.error("Party fetch error:", err)
        }
      }

      fetchParties()
    } else if (!showPartyName) {
      // Clear parties if showPartyName is false
      setPartyOptions([])
    }
  }, [dispatch, value, showPartyName])

  // Set party options when parties data changes
  useEffect(() => {
    if (parties && parties.length > 0) {
      const options = parties.map((party: any) => ({
        label: `${party?.partyName?.trim() || ""} - ${party?.unitNo?.trim() || ""}, ${party?.marketName|| ""}`,
        value: party._id,
      }));
      setPartyOptions(options)
    } else {
      setPartyOptions([])
    }
  }, [parties])

  // Find the selected company option based on the current value
  const getSelectedCompanyValue = () => {
    if (!value || !companyOptions.length) return null

    // If value is already an object with label and value
    if (typeof value === "object" && value.value) {
      const found = companyOptions.find((option) => option.value === value.value)
      return found || null
    }

    // If value is just a string (the ID)
    if (typeof value === "string") {
      const found = companyOptions.find((option) => option.value === value)
      return found || null
    }

    return null
  }

  // Find the selected party option based on the current party value
  const getSelectedPartyValue = () => {
    if (!partyName || !partyOptions.length) return null

    // If partyName is already an object with label and value
    if (typeof partyName === "object" && partyName.value) {
      const found = partyOptions.find((option) => option.value === partyName.value)
      return found || null
    }

    // If partyName is just a string (the ID)
    if (typeof partyName === "string") {
      const found = partyOptions.find((option) => option.value === partyName)
      return found || null
    }

    return null
  }

  const selectedCompanyValue = getSelectedCompanyValue()
  const selectedPartyValue = getSelectedPartyValue()


  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={56}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  return (
    <Box display="flex" gap={2} width="100%">
      {/* Company Select */}
      <Box flex={showPartyName ? 1 : 1}>
        <ThemeSelect
          label={label}
          options={companyOptions}
          value={selectedCompanyValue}
          onChange={onChange}
          name={name}
          error={error}
          helperText={helperText}
          required={required}
        />
      </Box>

      {/* Party Name Select - Only show if showPartyName is true */}
      {showPartyName && (
        <Box flex={1}>
          {partyLoading ? (
            <Box display="flex" alignItems="center" justifyContent="center" minHeight={56}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <ThemeSelect
              label="Party Name"
              options={partyOptions}
              value={selectedPartyValue}
              onChange={onPartyChange}
              name="partyName"
              error={partyError}
              helperText={partyHelperText}
              required={required}
              disabled={!value || partyOptions.length === 0}
              sx={{ minWidth: 300 }}
            />
          )}
        </Box>
      )}
    </Box>
  )
}

export default CompanySelect
