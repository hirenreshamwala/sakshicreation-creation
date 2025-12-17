import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import moment from "moment";
import { ORDER_STATUSES } from "@/constants";

function QpOrderStep1({ formData, handleFormChange, isCompleted, handleProcessChange }: any) {
    return (
        <>
            <Stack direction="row" spacing={2} sx={{
                overflow: "visible",   // ⭐ THIS FIXES CUTTING
            }}>
                <TextField
                    select
                    label="Unit No"
                    value={formData.unitNo || ""}
                    onChange={(e) => {
                        handleFormChange("unitNo", e.target.value);
                        if (!formData.startDate) {
                            handleFormChange("startDate", moment().format("YYYY-MM-DD"));
                        }
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 80 }}
                    disabled={isCompleted}
                >
                    <MenuItem value="Unit1">Unit1</MenuItem>
                    <MenuItem value="Unit2">Unit2</MenuItem>
                </TextField>
                {formData.unitNo === "Unit2" && (
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Unit Type</InputLabel>
                        <Select
                            value={formData.unitType}
                            label="Unit Type"
                            onChange={(e) => handleFormChange("unitType", e.target.value)}
                            disabled={isCompleted}
                        >
                            <MenuItem value="e_foot">E Foot</MenuItem>
                            <MenuItem value="narrow_foot">Narrow Foot</MenuItem>
                        </Select>
                    </FormControl>
                )}
                <TextField
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange("startDate", e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 100 }}
                    InputLabelProps={{ shrink: true }}
                    disabled={isCompleted}
                />
                {/* <TextField
                    label="Delivery Date"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => handleFormChange("deliveryDate", e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 100 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                        min: moment().format("YYYY-MM-DD"), // Restrict to today or future dates
                    }}
                    disabled={isCompleted}
                /> */}
                <TextField
                    label="Actual No. of Pieces"
                    value={formData.actualNoOfPieces}
                    onChange={(e) => handleFormChange("actualNoOfPieces", e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 100 }}
                    disabled={isCompleted}
                />
                <TextField
                    select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 100 }}
                    disabled={isCompleted}
                >
                    {ORDER_STATUSES.map((item) => (
                        <MenuItem key={item} value={item}>
                            {item}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>
            <Stack direction="row" spacing={2} mb={2} sx={{
                overflow: "visible",   // ⭐ THIS FIXES CUTTING
            }}>
                {/* NEW FIELDS: No required validation, string type, null if empty */}
                <TextField
                    label="No. of Sheet Cut"
                    value={formData.noOfSheetCut || ""}
                    onChange={(e) => handleFormChange("noOfSheetCut", e.target.value || null)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 120 }}
                    disabled={isCompleted}
                />
                <TextField
                    label="Cutting Length"
                    value={formData.cuttingLength || ""}
                    onChange={(e) => handleFormChange("cuttingLength", e.target.value || null)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 120 }}
                    disabled={isCompleted}
                />
                <TextField
                    label="No. of Linear"
                    value={formData.noOfLinear || ""}
                    onChange={(e) => handleFormChange("noOfLinear", e.target.value || null)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 120 }}
                    disabled={isCompleted}
                />
                <TextField
                    label="Linear"
                    value={formData.linear || ""}
                    onChange={(e) => handleFormChange("linear", e.target.value || null)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 100 }}
                    disabled={isCompleted}
                />
            </Stack>
            <Stack direction="row" spacing={2} mb={2} sx={{
                overflow: "visible",   // ⭐ THIS FIXES CUTTING
            }}>
                {/* Process Selection - Multiple Checkboxes */}
                <FormControl component="fieldset">
                    <FormGroup row>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.isPunching}
                                    onChange={(e) => {
                                        handleProcessChange("isPunching", e.target.checked)
                                        if (e.target.checked === false) {
                                            handleProcessChange("isPinning", false)
                                            handleProcessChange("isPasting", false)
                                        }

                                    }}
                                    name="punching"
                                />
                            }
                            label="Punching"
                            disabled={isCompleted}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.isPinning}
                                    onChange={(e) => {
                                        handleProcessChange("isPinning", e.target.checked)
                                        handleProcessChange("isPasting", !e.target.checked)
                                    }}
                                    name="pinning"
                                />
                            }
                            label="Pinning"
                            disabled={isCompleted || formData.isPunching === false}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.isPasting}
                                    onChange={(e) => {
                                        handleProcessChange("isPasting", e.target.checked)
                                        handleProcessChange("isPinning", !e.target.checked)
                                    }}
                                    name="pasting"
                                />
                            }
                            label="M. Pasting"
                            disabled={isCompleted || formData.isPunching === false}
                        />
                    </FormGroup>
                </FormControl>


                <FormControl sx={{ width: 200 }}>
                    <InputLabel>Lamination</InputLabel>
                    <Select
                        value={formData.lamination ? "yes" : "no"}
                        label="Lamination"
                        onChange={(e) => handleFormChange("lamination", e.target.value === "yes")}
                        disabled={formData.varnish}
                    >
                        <MenuItem value="no">No</MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                    </Select>
                </FormControl>

                {formData.lamination && (
                    <FormControl sx={{ width: 200 }}>
                        <InputLabel>Lamination Type</InputLabel>
                        <Select
                            value={formData.laminationType}
                            label="Lamination Type"
                            onChange={(e) => {
                                handleFormChange("laminationType", e.target.value);
                                // Default UV Type to "uv_mate" when switching to "mate" and UV is enabled
                                if (e.target.value === "mate" && formData.uv) {
                                    handleFormChange("uvType", "uv_mate");
                                }
                            }}
                        >
                            <MenuItem value="glossy">Glossy</MenuItem>
                            <MenuItem value="mate">Mate</MenuItem>
                        </Select>
                    </FormControl>
                )}

                {formData.laminationType !== "glossy" && (
                    <>
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>UV</InputLabel>
                            <Select
                                value={formData.uv ? "yes" : "no"}
                                label="UV"
                                onChange={(e) => {
                                    handleFormChange("uv", e.target.value === "yes");
                                    // Default UV Type to "uv_mate" when UV is enabled and laminationType is "mate"
                                    if (e.target.value === "yes" && formData.laminationType === "mate") {
                                        handleFormChange("uvType", "uv_mate");
                                    }
                                }}
                                disabled={formData.varnish}
                            >
                                <MenuItem value="no">No</MenuItem>
                                <MenuItem value="yes">Yes</MenuItem>
                            </Select>
                        </FormControl>

                        {formData.uv && formData.laminationType === "mate" && (
                            <FormControl sx={{ width: 220 }}>
                                <InputLabel>UV Type</InputLabel>
                                <Select
                                    value={formData.uvType || "uv_mate"} // Default to "uv_mate" if not set
                                    label="UV Type"
                                    onChange={(e) => handleFormChange("uvType", e.target.value)}
                                >
                                    {/* <MenuItem value="uv">UV</MenuItem> */}
                                    <MenuItem value="uv_mate">UV + Mate Lamination</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                    </>
                )}
                <FormControl sx={{ width: 200 }}>
                    <InputLabel>Varnish</InputLabel>
                    <Select
                        value={formData.varnish ? "yes" : "no"}
                        label="Varnish"
                        onChange={(e) => handleFormChange("varnish", e.target.value === "yes")}
                    >
                        <MenuItem value="no">No</MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
            <Stack direction="row" spacing={2} mb={2} sx={{
                overflow: "visible",   // ⭐ THIS FIXES CUTTING
            }}>
                <TextField
                    label="Dye Number"
                    value={formData.dyeNumber}
                    onChange={(e) => handleFormChange("dyeNumber", e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 100 }}
                    // InputLabelProps={{ shrink: true }}
                    disabled={isCompleted}
                    required={formData.isPunching}
                    error={formData.isPunching && !formData.dyeNumber}
                    helperText={formData.isPunching && !formData.dyeNumber ? "Required for punching" : ""}
                />
                <TextField
                    label="Sheet Size"
                    value={formData.dyeSize}
                    onChange={(e) => handleFormChange("dyeSize", e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 100 }}
                    disabled={isCompleted}
                    required={formData.isPunching}
                    error={formData.isPunching && !formData.dyeSize}
                    helperText={formData.isPunching && !formData.dyeSize ? "Required for punching" : ""}
                />
                <TextField
                    label="Sheet Quantity"
                    value={formData.dyeQuantity || ""}
                    onChange={(e) => handleFormChange("dyeQuantity", e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 120 }}
                    disabled={isCompleted}
                    required={formData.isPunching}
                    error={formData.isPunching && !formData.dyeQuantity}
                    helperText={formData.isPunching && !formData.dyeQuantity ? "Required for punching" : ""}
                    type="number"
                    InputProps={{ inputProps: { min: 1 } }}
                />
            </Stack>
        </>
    )
}

export default QpOrderStep1