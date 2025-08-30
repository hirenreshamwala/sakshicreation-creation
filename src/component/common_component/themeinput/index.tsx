import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  TextFieldProps,
  MenuItem,
  Chip,
  ChipProps,
  Typography,
  Box,
  Autocomplete
} from '@mui/material';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';
import { AiOutlineClose } from 'react-icons/ai';
import { IconChevronDown } from '@tabler/icons-react';

type ThemeInputProps = TextFieldProps & {
  labelName?: string;
  name?: string;
  type?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string | boolean | undefined | any;
  options?: Array<{ value: string | number; label: string }>;
  chipProps?: ChipProps;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  mobile?: boolean;
  countryCode?: string;
  onCountryCodeChange?: (val: string) => void;
  readOnly?: boolean; // Added readOnly prop
  autocomplete?: boolean;
  onOptionSelect?: (value: string) => void;

};

const ThemeInput: React.FC<ThemeInputProps> = ({
  labelName,
  name,
  type = 'text',
  required = false,
  error = false,
  helperText,
  options,
  chipProps,
  value,
  startIcon,
  endIcon,
  mobile = false,
  countryCode = '91',
  onCountryCodeChange,
  readOnly = false, // Default to false
  autocomplete = false,
  onOptionSelect,

  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localCountryCode, setLocalCountryCode] = useState(countryCode);
  const [inputValue, setInputValue] = useState('');

  const isPassword = type === 'password';

  const togglePasswordVisibility = () => {
    if (!readOnly) { // Only allow toggling if not readOnly
      setShowPassword(!showPassword);
    }
  };
if (autocomplete && options) {
    return (
      <Box width="100%">
        {labelName && (
          <Typography variant="subtitle2" fontWeight={600}>
            {labelName} {required && <span style={{ color: 'red' }}>*</span>}
          </Typography>
        )}
        
        <Autocomplete
          freeSolo
          options={options}
          value={value as string}
          onChange={(event, newValue) => {
            if (onOptionSelect && newValue) {
              onOptionSelect(newValue as string);
            }
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
            if (rest.onChange) {
              rest.onChange({
                target: {
                  name: name || '',
                  value: newInputValue
                }
              } as React.ChangeEvent<HTMLInputElement>);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              required={required}
              error={error}
              helperText={helperText}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  background: readOnly ? '#F9FAFB' : '#fff',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#667085',
                  '&.Mui-disabled': {
                    background: '#F9FAFB',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '12px 124px',
                  cursor: readOnly ? 'default' : 'text',
                },
                ...rest.sx,
              }}
            />
          )}
        />
      </Box>
    );
  }

  const renderSelectItems = () => {
    return options?.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ));
  };

  const renderValue = (selectedValue: unknown): React.ReactNode => {
    if (chipProps && typeof selectedValue === 'string') {
      return (
        <Chip
          label={selectedValue}
          color="error"
          variant="filled"
          icon={<AiOutlineClose style={{ fontSize: 18 }} />}
          sx={{
            background: '#FEF3F2',
            color: '#D92D20',
            fontWeight: 500,
            fontSize: 13,
            px: 1.5,
            height: 28,
          }}
          {...chipProps}
        />
      );
    }
    return selectedValue as React.ReactNode;
  };

  return (
    <Box width="100%">
      {labelName && (
        <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
          {labelName} {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>
      )}

      <TextField
        fullWidth
        name={name}
        variant="outlined"
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        required={required}
        error={error}
        helperText={helperText}
        select={!!options}
        value={value}
        disabled={readOnly} // MUI's disabled prop
        SelectProps={{
          renderValue: chipProps ? renderValue : undefined,
          IconComponent: readOnly ? () => null : undefined, // Hide dropdown icon when readOnly
        }}
        InputProps={{
          readOnly: readOnly, // MUI's readOnly prop
          ...rest.InputProps,
          startAdornment: mobile ? (
            <InputAdornment position="start" sx={{ gap: 0.5 }}>
              <input
                value={onCountryCodeChange ? countryCode : localCountryCode}
                onChange={(e) => {
                  if (!readOnly) {
                    setLocalCountryCode(e.target.value);
                    onCountryCodeChange?.(e.target.value);
                  }
                }}
                style={{
                  width: 36,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#667085',
                  textAlign: 'center',
                }}
                disabled={readOnly}
                maxLength={3}
              />
              {!readOnly && <IconChevronDown size={16} color="#667085" />}
            </InputAdornment>
          ) : (
            startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>
          ),
          endAdornment: (
            <>
              {isPassword && !readOnly && ( // Only show password toggle when not readOnly
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
                  </IconButton>
                </InputAdornment>
              )}
              {endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>}
            </>
          ),
        }}
        {...rest}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            background: readOnly ? '#F9FAFB' : '#fff', // Different background for readOnly
            fontWeight: 500,
            fontSize: 14,
            color: '#667085',
            '&.Mui-disabled': {
              background: '#F9FAFB', // Background when disabled
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 14px',
            cursor: readOnly ? 'default' : 'text', // Change cursor for readOnly
          },
          ...rest.sx,
        }}
      >
        {renderSelectItems()}
      </TextField>
    </Box>
  );
};

export default ThemeInput;