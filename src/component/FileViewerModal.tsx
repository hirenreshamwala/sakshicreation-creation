"use client"

import type React from "react"
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Typography } from "@mui/material"
import { Close } from "@mui/icons-material"

interface FileViewerModalProps {
    open: boolean
    onClose: () => void
    fileUrl: string | null
    fileName: string | null
    fileType: "image" | "pdf" | "other" | null
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ open, onClose, fileUrl, fileName, fileType }) => {
    if (!open || !fileUrl) {
        return null
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" component="div">
                    {fileName || "File Preview"}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, height: "80vh" }}>
                {fileType === "image" && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                            overflow: "auto",
                        }}
                    >
                        <img
                            src={fileUrl || "/placeholder.svg"}
                            alt={fileName || "File preview"}
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                        />
                    </Box>
                )}
                {fileType === "pdf" && (
                    <iframe
                        src={fileUrl}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        title={fileName || "PDF Viewer"}
                    />
                )}
                {fileType === "other" && (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                            gap: 2,
                        }}
                    >
                        <Typography variant="h6">Preview not available for this file type.</Typography>
                        <Typography variant="body1">
                            You can{" "}
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#7F56D9", textDecoration: "underline" }}
                            >
                                download the file
                            </a>{" "}
                            to view it.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default FileViewerModal
