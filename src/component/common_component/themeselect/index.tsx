import React from 'react';
import {
  Autocomplete,
  TextField,
  SxProps,
  TextFieldProps,
  Typography,
  Box,
  ListItemText,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';

const filter = createFilterOptions<OptionType>({
  stringify: (option) =>
    option.label
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim(),
});


type OptionType = {
  key?: string | number;
  label: string;
  value: string | number;
  [key: string]: any; // allow extra fields like area, pincode, etc.
};

interface ThemeSelectProps {
  name?: string;
  label?: string;
  options: OptionType[];
  value?: OptionType | null;
  onChange?: (event: React.SyntheticEvent, newValue: OptionType | null) => void;
  error?: boolean;
  helperText?: string | boolean | undefined | any;
  required?: boolean;
  textFieldProps?: TextFieldProps;
  disabled?: boolean;
  sx?: SxProps;
  size?: 'small' | 'medium';
  placeholder?: string;
  readOnly?: boolean;
  renderOptionCustom?: boolean; // 👈 toggle for custom rendering
}

const ThemeSelect: React.FC<ThemeSelectProps> = ({
  label = '',
  options,
  value,
  onChange,
  error = false,
  helperText = '',
  required = false,
  textFieldProps,
  disabled = false,
  sx = {},
  size = 'small',
  placeholder = '',
  readOnly = false,
  renderOptionCustom = true, // 👈 enable custom rendering by default
}) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      {label && (
        <Typography fontWeight={700} fontSize={14} color="#344054" mb={0.5}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>
      )}

      <Autocomplete
        options={options}
        getOptionLabel={(option) => option?.label || ''}
        value={value}
        onChange={onChange}
        isOptionEqualToValue={(option, val) => option.value === val?.value}
        disabled={disabled}
        size={size}
        readOnly={readOnly}
        popupIcon={undefined}
        filterOptions={(opts, state) => {
          const input = state.inputValue
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

          return filter(
            opts,
            { ...state, inputValue: input }
          );
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            background: '#fff',
            fontWeight: 600,
            fontSize: 14,
            color: '#667085',
            boxSizing: 'border-box',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D0D5DD',
          },
          '& .MuiAutocomplete-input': {
            fontWeight: 600,
            fontSize: 14,
            color: '#667085',
            padding: '10px 0',
          },
          '& .MuiSvgIcon-root': {
            color: '#667085',
          },
        }}
        renderOption={(props, item) =>
          renderOptionCustom ? (
            <li {...props} key={item.key || item.value}>
              <ListItemText
                primary={item.label}
                style={{
                  fontSize: '30px',
                  fontWeight: 500
                }}
                sx={{
                }}
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
                color: '#667085',
                background: '#fff',
                borderRadius: '10px',
                minHeight: 48,
              },
            }}
            {...textFieldProps}
          />
        )}
      />
    </Box>
  );
};

export default ThemeSelect;
