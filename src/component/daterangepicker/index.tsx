import React from 'react';
import { Box, Stack, SxProps, Theme } from '@mui/material';
import { BiRightArrowAlt } from 'react-icons/bi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ThemeInput from '@/component/common_component/themeinput';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  sx?: SxProps<Theme>;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  sx = {},
}) => {
  // DD/MM/YYYY format में date display करने के लिए
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // DD/MM/YYYY string को Date object में convert करने के लिए
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript में month 0-based है
    const year = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
  };

  // Custom input component for react-datepicker
  const CustomInput = React.forwardRef<any, any>(({ value, onClick, onChange, placeholder }, ref) => (
    <ThemeInput
      ref={ref}
      type="text"
      value={value}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      sx={{
        height: '30px',
        width: '100%',
      }}
    />
  ));

  CustomInput.displayName = 'CustomInput';

  return (
    <Stack 
      direction="row" 
      alignItems="center" 
      gap={1} 
      sx={{
        alignItems: 'center',
        mb: 2,
        ...sx,
      }}
    >
      <Box width={160}>
        <DatePicker
          selected={startDate}
          onChange={(date: Date | null) => onStartDateChange(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/YYYY"
          customInput={<CustomInput />}
          // isClearable
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'center',
          height: '30px', 
          lineHeight: 0,   
        }}
      >
        <BiRightArrowAlt size={22} color="#98A2B3" />
      </Box>
      <Box width={160}>
        <DatePicker
          selected={endDate}
          onChange={(date: Date | null) => onEndDateChange(date)}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/YYYY"
          customInput={<CustomInput />}
          // isClearable
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          minDate={startDate || undefined}
        />
      </Box>
    </Stack>
  );
};

export default DateRangePicker;