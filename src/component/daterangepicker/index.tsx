import React from 'react';
import { Box, Stack, SxProps, Theme } from '@mui/material';
import { BiRightArrowAlt } from 'react-icons/bi';
import ThemeInput from '@/component/common_component/themeinput';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  sx?: SxProps<Theme>;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  sx = {},
}) => {
    const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseInputDate = (value: string): Date | null => {
    if (!value) return null;
    return new Date(value);
  };

  return (
    <Stack 
      direction="row" 
      alignItems="center" 
      gap={1} 
      sx={{
        alignItems: 'center',
        mb:2,
        ...sx,
      }}
    >
        <Box width={150}>
        <ThemeInput
          type="date"
          value={formatDateForInput(startDate)}
          onChange={(e) => onStartDateChange(parseInputDate(e.target.value))}
          sx={{
            height: '30px',
          }}
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
      <Box width={150}>
        <ThemeInput
          type="date"
          value={formatDateForInput(endDate)}
          onChange={(e) => onEndDateChange(parseInputDate(e.target.value))}
          sx={{
            height: '30px', 
          }}
        />
      </Box>
    </Stack>
  );
};

export default DateRangePicker;