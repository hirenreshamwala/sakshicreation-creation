import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { AiOutlineClose } from 'react-icons/ai';

interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  children: React.ReactNode;
  title?: React.ReactNode | string;
  submitText?: string;
  cancelText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  fullScreen?: boolean;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  children,
  title,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
}) => {

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      scroll="paper"
      PaperProps={{
        sx: {
          width: '100%',
          borderRadius: 3,
        },
      }}
    >
      {/* Dialog Title with Close Button */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        {title && (
          <Box display="flex" alignItems="center" gap={1}>
            {typeof title === 'string' ? (
              <Typography variant="h6" fontWeight={600}>
                {title}
              </Typography>
            ) : (
              title
            )}
          </Box>
        )}
        <IconButton onClick={onClose}>
          <AiOutlineClose />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent dividers>{children}</DialogContent>

      {/* Dialog Actions
      {(onSubmit || cancelText) && (
        <DialogActions sx={{ pt: 2 }}>
          {cancelText && (
            <Button variant="outlined" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          {onSubmit && (
            <Button variant="contained" onClick={onSubmit}>
              {submitText}
            </Button>
          )}
        </DialogActions>
      )} */}
    </Dialog>
  );
};

export default CustomDialog;
