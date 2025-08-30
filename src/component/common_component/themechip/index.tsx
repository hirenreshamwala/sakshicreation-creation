
import React from 'react';
import Chip from '@mui/material/Chip';
import { Chiprops } from '@/typesdeclare';

const ThemeChip: React.FC<Chiprops> = ({
  label,
  color = 'default',
  variant = 'filled',
  icon,
  onClick,
  onDelete,
  sx,
}) => {
  return (
    <Chip
      label={label}
      color={color}
      variant={variant}
      icon={icon ?? undefined}
      onClick={onClick}
      onDelete={onDelete}
      sx={sx}
    />
  );
};

export default ThemeChip;
