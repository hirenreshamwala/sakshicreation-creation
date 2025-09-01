import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

const CallHistoryDialog = ({ open, onClose, data = [] }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Call History</DialogTitle>

      <DialogContent dividers>
        {data.length > 0 ? (
          <List>
            {data.map((call, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`Call #${index + 1}`}
                  secondary={new Date(call).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No call history available.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CallHistoryDialog;
