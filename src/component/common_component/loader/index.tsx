// components/common_component/Loader.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

const Loader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      width="100%"
    >
      <CircularProgress size={48} thickness={4} sx={{ color: 'primary' }} />
      <Typography mt={2} fontWeight={500} color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default Loader;
