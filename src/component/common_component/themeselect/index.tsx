import React from 'react';
import {
  Autocomplete,
  TextField,
  SxProps,
  TextFieldProps,
  Typography,
  Box,
} from '@mui/material';

type OptionType = {
  label: string;
  value: string | number;
};

interface ThemeSelectProps {
  name?: string;
  label?: string;
  options: OptionType[];
  value?: OptionType | null ;
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
}) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      {label && (
        <Typography
          fontWeight={700}
          fontSize={14}
          color="#344054"
          mb={0.5}
        >
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>
      )}
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.label}
        value={value}
        onChange={onChange}
        isOptionEqualToValue={(option, val) => option.value === val?.value}
        disabled={disabled}
        size={size}
        readOnly={readOnly}
        popupIcon={undefined}
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
