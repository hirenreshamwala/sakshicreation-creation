import React, { useState, useEffect } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemText,
  InputBase,
  Box,
  IconButton,
  Checkbox,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import { MdArrowBack } from "react-icons/md";

interface FilterDropdownProps {
  filterOptions: string[];
  uniqueValues: string[];
  onFiltersChange: (filters: { [key: string]: string[] }) => void;
  filters: { [key: string]: string[] };
  selectedField: string | null;
  onFieldSelect: (field: string | null) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filterOptions = [],
  uniqueValues,
  onFiltersChange,
  filters,
  selectedField,
  onFieldSelect,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>([]);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (open && selectedField && filters[selectedField]) {
      setTempSelectedValues(filters[selectedField]);
    } else if (open) {
      setTempSelectedValues([]);
    }
  }, [open, selectedField, filters]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery("");
  };

  const handleFieldSelect = (field: string) => {
    onFieldSelect(field);
    setSearchQuery("");
  };

  const handleValueToggle = (value: string) => {
    setTempSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleApplyFilter = () => {
    if (selectedField) {
      const newFilters = {
        ...filters,
        [selectedField]: tempSelectedValues.length > 0 ? tempSelectedValues : [],
      };
      if (newFilters[selectedField].length === 0) {
        delete newFilters[selectedField];
      }
      onFiltersChange(newFilters);
    }
    handleClose();
  };

  const handleClearFilter = () => {
    onFiltersChange({});
    onFieldSelect(null);
    setTempSelectedValues([]);
    handleClose();
  };

  const handleRemoveFilter = (field: string, value?: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[field] = newFilters[field].filter((v) => v !== value);
      if (newFilters[field].length === 0) {
        delete newFilters[field];
      }
    } else {
      delete newFilters[field];
    }
    onFiltersChange(newFilters);
  };

  const handleBack = () => {
    onFieldSelect(null);
    setSearchQuery("");
    setTempSelectedValues([]);
  };

  const filteredUniqueValues = uniqueValues.filter((value) =>
    value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* Filter chips and Clear All button */}
      {Object.keys(filters).length > 0 && (
        <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
        {/* {Object.entries(filters).flatMap(([field, values]) =>
          values.map((value) => (
            <Chip
              key={`${field}-${value}`}
              label={`${field}: ${value}`}
              onDelete={() => handleRemoveFilter(field, value)}
              deleteIcon={<FiX size={14} />}
              size="small"
              sx={{
                backgroundColor: "#F9F5FF",
                color: "#7F56D9",
                fontWeight: 500,
                "& .MuiChip-deleteIcon": {
                  color: "#7F56D9",
                  "&:hover": {
                    color: "#7F56D9",
                  },
                },
              }}
            />
          ))
        )} */}
        <Button
          variant="text"
          onClick={handleClearFilter}
          sx={{
            color: "#D32F2F",
            fontWeight: 600,
            fontSize: 14,
            textTransform: "none",
            minWidth: 'auto',
            px: 1,
            py: 0.5,
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          Clear All
        </Button>
      </Stack>
    )}

      {/* Filter button */}
      <Button
        variant="outlined"
        onClick={handleClick}
        startIcon={<FiFilter />}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          color: "#344054",
          px: 2,
          borderColor: "#D0D5DD",
          fontWeight: 700,
          minWidth: 110,
          ml: Object.keys(filters).length > 0 ? 1 : 0,
        }}
      >
        Filters
      </Button>

      {/* Filter dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            px: 1,
            py: 0.5,
            minWidth: 220,
            maxHeight: 400,
            overflowY: "auto",
          },
        }}
      >
        {!selectedField ? (
          <>
            {filterOptions.length > 0 ? (
              filterOptions.map((label) => (
                <MenuItem
                  key={label}
                  sx={{ px: 2 }}
                  onClick={() => handleFieldSelect(label)}
                >
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#344054",
                    }}
                  />
                </MenuItem>
              ))
            ) : (
              <MenuItem sx={{ px: 2 }} disabled>
                <ListItemText
                  primary="No filters available"
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#98A2B3",
                  }}
                />
              </MenuItem>
            )}
          </>
        ) : (
          <>
            {/* Search Input */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #D0D5DD",
                px: 2,
                py: 1,
                position: "sticky",
                top: 0,
                background: "#fff",
                zIndex: 1,
              }}
            >
              <IconButton size="small" sx={{ color: "#98A2B3" }}>
                <FiSearch size={18} />
              </IconButton>
              <InputBase
                placeholder="Search values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ ml: 1, fontSize: 14, flex: 1 }}
                autoFocus
              />
            </Box>

            <MenuItem sx={{ px: 2 }} onClick={handleBack}>
              <ListItemText
                primary="Back to Fields"
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#344054",
                }}
              />
              <MdArrowBack size={18} style={{ marginLeft: 8 }} />
            </MenuItem>

            <Divider />

            {filteredUniqueValues.length > 0 ? (
              filteredUniqueValues.map((value) => (
                <MenuItem
                  key={value}
                  sx={{ px: 2 }}
                  onClick={() => handleValueToggle(value)}
                >
                  <Checkbox
                    checked={tempSelectedValues.includes(value)}
                    size="small"
                    sx={{ p: 0, mr: 1 }}
                  />
                  <ListItemText
                    primary={value}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#344054",
                    }}
                  />
                </MenuItem>
              ))
            ) : (
              <MenuItem sx={{ px: 2 }} disabled>
                <ListItemText
                  primary="No matching values"
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#98A2B3",
                  }}
                />
              </MenuItem>
            )}

            <Divider />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 2,
                py: 1,
              }}
            >
              <Button
                variant="text"
                onClick={handleClearFilter}
                sx={{
                  color: "#D32F2F",
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: "none",
                }}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilter}
                sx={{
                  backgroundColor: "#7F56D9",
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#7F56D9",
                  },
                }}
              >
                Apply
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default FilterDropdown;