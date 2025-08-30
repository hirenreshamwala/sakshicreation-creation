import React, { useState } from 'react';
import CustomDialog from '@/component/customdialog';
import { Box, Typography } from '@mui/material';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeButton from '@/component/common_component/themebutton';

interface InputReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (reason: string) => void;
}

const InputReasonDialog: React.FC<InputReasonDialogProps> = ({ open, onClose, onSave }) => {
  const [input, setInput] = useState('');

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Input Reason of visit"
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, background: '#fff', borderRadius: 2 }}>
        <Typography fontWeight={500} mb={1} fontSize={14}>
          Enter Reason
        </Typography>
        <ThemeInput
          placeholder="Typing..."
          value={input}
          onChange={e => setInput(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />
        <ThemeButton
          fullWidth
          sx={{
            background: '#28C76F',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            '&:hover': { background: '#079455' },
          }}
          onClick={() => {
            onSave(input);
            setInput('');
            onClose();
          }}
        >
          Save Reason
        </ThemeButton>
      </Box>
    </CustomDialog>
  );
};

export default InputReasonDialog; 