// components/common_component/ThemeButton.tsx
import React from 'react';
import { Button, CircularProgress } from '@mui/material';

export interface ButtonProps {
  children: React.ReactNode;
  type:any;
  variant?: 'text' | 'outlined' | 'contained';
  type?:'date' | 'submit',
  size?: 'small' | 'medium' | 'large';
  sx?: object;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
}

const sizeStyles = {
  small: {
    fontSize: 13,
    padding: '6px 16px',
    borderRadius: '8px',
  },
  medium: {
    fontSize: 14,
    padding: '8px 20px',
    borderRadius: '10px',
  },
  large: {
    fontSize: 15,
    padding: '10px 24px',
    borderRadius: '12px',
  },
};

const ThemeButton: React.FC<ButtonProps> = ({
  children,
  type='button',
  variant = 'contained',
  size = 'small',
  sx = {},
  disabled = false,
  startIcon = null,
  endIcon = null,
  loading = false,
  fullWidth = false,
  onClick = () => {},
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        ...sizeStyles[size],
        ...sx,
      }}
      type={type}
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : null}
      endIcon={!loading ? endIcon : null}
      fullWidth={fullWidth}
      onClick={onClick}
    >
      {loading ? <CircularProgress color="inherit" size={20} /> : children}
    </Button>
  );
};

export default ThemeButton;
