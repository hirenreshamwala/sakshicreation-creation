import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch } from "@/store";
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice";
import {
    Box,
    MenuItem,
    Stack,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    Typography,
    Divider,
} from "@mui/material";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from "@mui/lab";

type Remark = {
    type: string;
    text: string;
    date: string;
    previousValue?: string;
};

interface ExpandedRowFormProps {
    row: any;
    setEditData: React.Dispatch<React.SetStateAction<any | null>>;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ExpandedRowForm = ({ row, setEditData, setOpen }: ExpandedRowFormProps) => {
    const dispatch = useAppDispatch();
    const [isInitialUnitSet, setIsInitialUnitSet] = useState(false);

    // remark modal (add reason)
    const [remarkModalOpen, setRemarkModalOpen] = useState(false);
    const [remarkType, setRemarkType] = useState<"startDate" | "onHold" | "canceled" | null>(null);
    const [tempStartDate, setTempStartDate] = useState("");
    const [remarkText, setRemarkText] = useState("");

    // NEW: view remarks modal state
    const [viewRemarksOpen, setViewRemarksOpen] = useState(false);

    const [formData, setFormData] = useState({
        _id: row._id,
        unitNo: row.unitNo || "",
        startDate: row.startDate || "",
        deliveryDate: row.deliveryDate || "",
        dyeNumber: row.dyeNumber || "",
        dyeSize: row.dyeSize || "",
        glue: row.glue || "",
        wire: row.wire || "",
        dyeRemark: row.dyeRemark || "",
        godownRemark: row.godownRemark || "",
        factoryRemark: row.factoryRemark || "",
        status: row.status || "Pending",
        remarks: (row.remarks as Remark[]) || [],
    });

    const [initialFormData, setInitialFormData] = useState(formData);

    useEffect(() => {
        const newFormData = {
            _id: row._id,
            unitNo: row.unitNo || "",
            startDate: row.startDate || "",
            deliveryDate: row.deliveryDate || "",
            dyeNumber: row.dyeNumber || "",
            dyeSize: row.dyeSize || "",
            glue: row.glue || "",
            wire: row.wire || "",
            dyeRemark: row.dyeRemark || "",
            godownRemark: row.godownRemark || "",
            factoryRemark: row.factoryRemark || "",
            status: row.status || "Pending",
            remarks: (row.remarks as Remark[]) || [],
        };
        setFormData(newFormData);
        setInitialFormData(newFormData);
        setIsInitialUnitSet(!!row.unitNo);

        // reset states
        setRemarkModalOpen(false);
        setRemarkType(null);
        setRemarkText("");
        setTempStartDate("");
        setViewRemarksOpen(false);
    }, [row]);

    const handleFormChange = (field: string, value: string) => {
        // Changing start date after it's already set -> ask reason
        if (field === "startDate") {
            if (formData.startDate) {
                setTempStartDate(value);
                setRemarkType("startDate");
                setRemarkModalOpen(true);
                return;
            } else {
                // direct set (was empty)
                setFormData((prev) => ({ ...prev, startDate: value }));
                return;
            }
        }

        // status changes that require remark or special handling
        if (field === "status") {
            if (value === "Completed") {
                const currentDate = new Date().toISOString().split("T")[0];
                setFormData((prev) => ({ ...prev, status: value, deliveryDate: currentDate }));
                return;
            }
            if (value === "On Hold") {
                setRemarkType("onHold");
                setRemarkModalOpen(true);
                return;
            }
            if (value === "Canceled") {
                setRemarkType("canceled");
                setRemarkModalOpen(true);
                return;
            }
        }

        // unitNo initial selection -> set startDate if not set before
        if (field === "unitNo" && value && !isInitialUnitSet && !formData.startDate) {
            const currentDate = new Date().toISOString().split("T")[0];
            setFormData((prev) => ({ ...prev, unitNo: value, startDate: currentDate }));
            setIsInitialUnitSet(true);
            return;
        }

        // generic field update
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRemarkSubmit = () => {
        const now = new Date().toISOString();
        if (!remarkText.trim()) return;

        if (remarkType === "startDate") {
            setFormData((prev) => ({
                ...prev,
                startDate: tempStartDate,
                status: "On Hold", // force on hold for start date changes
                remarks: [
                    ...prev.remarks,
                    {
                        type: "StartDate Change",
                        text: remarkText.trim(),
                        date: now,
                        previousValue: prev.startDate || "",
                    },
                ],
            }));
        } else if (remarkType === "onHold") {
            setFormData((prev) => ({
                ...prev,
                status: "On Hold",
                remarks: [
                    ...prev.remarks,
                    {
                        type: "On Hold",
                        text: remarkText.trim(),
                        date: now,
                        previousValue: prev.status || "",
                    },
                ],
            }));
        } else if (remarkType === "canceled") {
            setFormData((prev) => ({
                ...prev,
                status: "Canceled",
                remarks: [
                    ...prev.remarks,
                    {
                        type: "Canceled",
                        text: remarkText.trim(),
                        date: now,
                        previousValue: prev.status || "",
                    },
                ],
            }));
        }

        // reset modal state
        setRemarkText("");
        setTempStartDate("");
        setRemarkType(null);
        setRemarkModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData._id) {
            toast.error("Cannot submit: Invalid order ID");
            return;
        }
        try {
            const updateData = {
                unitNo: formData.unitNo,
                startDate: formData.startDate,
                deliveryDate: formData.deliveryDate,
                dyeNumber: formData.dyeNumber,
                dyeSize: formData.dyeSize,
                glue: formData.glue,
                wire: formData.wire,
                dyeRemark: formData.dyeRemark,
                godownRemark: formData.godownRemark,
                factoryRemark: formData.factoryRemark,
                status: formData.status,
                // send remarks array to backend
                remarks: formData.remarks,
            };
            await dispatch(updateQPOrderThunk({ id: formData._id, data: updateData })).unwrap();
            setInitialFormData({ ...formData });
            toast.success("Order updated successfully");
        } catch (err: any) {
            console.error("ExpandedRowForm: Update failed:", err);
            toast.error(err?.message || "Failed to update order");
        }
    };

    const handleCancel = () => {
        setFormData(initialFormData);
        setIsInitialUnitSet(!!initialFormData.unitNo);
    };

    return (
        <Box sx={{ p: 2, backgroundColor: "#f9fafb" }}>
            <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                        <TextField
                            select
                            label="Unit No"
                            value={formData.unitNo || ""}
                            onChange={(e) => {
                                handleFormChange("unitNo", e.target.value);
                                // set start date when selecting unit if not set
                                if (!formData.startDate) {
                                    handleFormChange("startDate", moment().format("YYYY-MM-DD"));
                                }
                                if (formData.status === 'Pending') {
                                    handleFormChange("status", "In Progress");
                                }
                            }}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 120 }}
                        >
                            <MenuItem value="Unit1">Unit1</MenuItem>
                            <MenuItem value="Unit2">Unit2</MenuItem>
                        </TextField>

                        <TextField
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleFormChange("startDate", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 150 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Delivery Date"
                            type="date"
                            value={formData.deliveryDate}
                            onChange={(e) => handleFormChange("deliveryDate", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 150 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Dye Number"
                            value={formData.dyeNumber}
                            onChange={(e) => handleFormChange("dyeNumber", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 150 }}
                        />
                        <TextField
                            label="Dye Sheet Size"
                            value={formData.dyeSize}
                            onChange={(e) => handleFormChange("dyeSize", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 150 }}
                        />
                        <TextField
                            label="Glue KG"
                            value={formData.glue}
                            onChange={(e) => handleFormChange("glue", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 150 }}
                        />
                        <TextField
                            label="Wire KG"
                            value={formData.wire}
                            onChange={(e) => handleFormChange("wire", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 150 }}
                        />
                        <TextField
                            select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => handleFormChange("status", e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 150 }}
                        >
                            {[
                                "Paper cutting",
                                "Corogation",
                                "Pasting",
                                "Rotery",
                                "Sloting/rs4",
                                "Printing",
                                "Manual pasting",
                                "Pinning",
                                "Kanthan",
                                "Puching",
                                "Pending",
                                "Order",
                                "In Progress",
                                "On Hold",
                                "Canceled",
                                "Completed",
                            ].map((item) => (
                                <MenuItem key={item} value={item}>
                                    {item}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                        <TextField
                            label="Dye Remark"
                            value={formData.dyeRemark}
                            onChange={(e) => handleFormChange("dyeRemark", e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            sx={{ flex: 1, minWidth: 220 }}
                        />
                        <TextField
                            label="Godown Remark"
                            value={formData.godownRemark}
                            onChange={(e) => handleFormChange("godownRemark", e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            sx={{ flex: 1, minWidth: 220 }}
                        />
                        <TextField
                            label="Factory Remark"
                            value={formData.factoryRemark}
                            onChange={(e) => handleFormChange("factoryRemark", e.target.value)}
                            variant="outlined"
                            size="small"
                            multiline
                            rows={2}
                            sx={{ flex: 1, minWidth: 220 }}
                        />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <ThemeButton type="submit">Submit</ThemeButton>
                        <ThemeButton type="button" onClick={handleCancel} variant="outlined">
                            Cancel
                        </ThemeButton>
                        <ThemeButton
                            type="button"
                            onClick={() => {
                                setEditData(row);
                                setOpen(true);
                            }}
                        >
                            Edit
                        </ThemeButton>
                        <ThemeButton
                            type="button"
                            variant="outlined"
                            onClick={() => setViewRemarksOpen(true)}
                        >
                            View Remarks
                        </ThemeButton>
                    </Stack>
                </Stack>
            </form>

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

            <Dialog open={viewRemarksOpen} onClose={() => setViewRemarksOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Remarks Timeline</DialogTitle>
                <DialogContent>
                    {formData.remarks.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No remarks available
                        </Typography>
                    ) : (
                        <Timeline sx={{ ml: -62 }} position="right">
                            {formData.remarks.map((remark, index) => (
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
                                       {index !== formData.remarks.length -1 && <Divider sx={{ mt: 1, mb: 1 }} />}
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
        </Box>
    );
};
