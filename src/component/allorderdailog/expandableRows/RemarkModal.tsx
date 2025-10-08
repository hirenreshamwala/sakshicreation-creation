import React from 'react'
import {
    TextField,
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    Button,
} from "@mui/material";

function RemarkModal({ remarkModalOpen, setRemarkModalOpen, remarkType, setRemarkType, remarkText, setRemarkText, handleRemarkSubmit, setTempStartDate }: any) {
    return (
        <div>
            <Dialog open={remarkModalOpen} onClose={() => setRemarkModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {remarkType === "startDate" && "Change Start Date"}
                    {remarkType === "onHold" && "Reason for On Hold"}
                    {remarkType === "canceled" && "Reason for Cancel"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Remark"
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        sx={{ mt: 1 }}
                        placeholder="Give a short reason (required)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setRemarkModalOpen(false);
                            setRemarkType(null);
                            setRemarkText("");
                            setTempStartDate("");
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleRemarkSubmit} disabled={!remarkText.trim()}>
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default RemarkModal
