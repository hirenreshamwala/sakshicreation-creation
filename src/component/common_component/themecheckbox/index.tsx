import React from 'react';
import {
  Checkbox,
  FormControlLabel,
  CheckboxProps,
  SxProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface RoundedCheckboxProps extends CheckboxProps {
  label: string;
  sx?: SxProps;
}

const StyledCheckbox = styled(Checkbox)(() => ({
  padding: 4,
  transition: 'all 0.2s ease',
  '& .MuiSvgIcon-root': {
    border: '1.5px solid #98A2B3',
    borderRadius: 8,
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  '&.Mui-checked .MuiSvgIcon-root': {
    color: '#344054',
    borderColor: '#344054',
    backgroundColor: '#E4E7EC',
  },
  '&:hover .MuiSvgIcon-root': {
    borderColor: '#7F56D9', 
  },
}));

const ThemeCheckbox: React.FC<RoundedCheckboxProps> = ({ label, sx, ...props }) => (
  <FormControlLabel
    control={<StyledCheckbox {...props} />}
    label={label}
    sx={{
      textTransform: 'capitalize',
      color: '#475467',
      fontSize: 16,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      cursor: 'pointer',
      ...sx,
    }}
  />
);

export default ThemeCheckbox;
