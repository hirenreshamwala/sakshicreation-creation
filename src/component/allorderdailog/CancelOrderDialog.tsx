
import { Typography, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material"
import ThemeButton from "@/component/common_component/themebutton"
import ThemeInput from "@/component/common_component/themeinput"


function CancelOrderDialog({ cancelDialogOpen, setCancelDialogOpen, selectedOrderForCancel, setSelectedOrderForCancel, setCancelRemarks, cancelRemarks, handleCancelConfirm }: any) {
    return (
        <>  <Dialog
            open={cancelDialogOpen}
            onClose={() => {
                setCancelDialogOpen(false);
                setSelectedOrderForCancel(null);
                setCancelRemarks("");
            }}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Are you sure you want to cancel this order?
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Order No: {selectedOrderForCancel?.orderNumber}
                </Typography>
                <ThemeInput
                    labelName="Cancel Reason / Remarks"
                    multiline
                    rows={3}
                    fullWidth
                    value={cancelRemarks}
                    onChange={(e) => setCancelRemarks(e.target.value)}
                    placeholder="Please provide reason for cancellation..."
                />
            </DialogContent>
            <DialogActions>
                <ThemeButton
                    variant="outlined"
                    onClick={() => {
                        setCancelDialogOpen(false);
                        setSelectedOrderForCancel(null);
                        setCancelRemarks("");
                    }}
                >
                    Cancel
                </ThemeButton>
                <ThemeButton
                    variant="contained"
                    onClick={handleCancelConfirm}
                >
                    Confirm Cancel
                </ThemeButton>
            </DialogActions>
        </Dialog></>
    )
}

export default CancelOrderDialog