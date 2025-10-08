import moment from "moment";
import {
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    Button,
    Typography,
    Divider,
} from "@mui/material";
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from "@mui/lab";

function ViewRemark({ viewRemarksOpen, setViewRemarksOpen, formData }: any) {
    return (
        <div>
            <Dialog open={viewRemarksOpen} onClose={() => setViewRemarksOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Remarks Timeline</DialogTitle>
                <DialogContent>
                    {formData.remarks.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No remarks available
                        </Typography>
                    ) : (
                        <Timeline sx={{ ml: -62 }} position="right">
                            {formData.remarks.map((remark: any, index: any) => (
                                <TimelineItem key={index}>
                                    <TimelineSeparator>
                                        <TimelineDot color="primary" />
                                        {index < formData.remarks.length - 1 && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {remark.type}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {moment(remark.date).format("DD MMM YYYY, hh:mm A")}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                                            {remark.text}
                                        </Typography>
                                        {remark.assignedPrinterId && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Printer ID: {remark.assignedPrinterId}
                                            </Typography>
                                        )}
                                        {remark.assignedBinderId && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Binder ID: {remark.assignedBinderId}
                                            </Typography>
                                        )}
                                        {index !== formData.remarks.length - 1 && <Divider sx={{ mt: 1, mb: 1 }} />}
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                        </Timeline>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewRemarksOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default ViewRemark
