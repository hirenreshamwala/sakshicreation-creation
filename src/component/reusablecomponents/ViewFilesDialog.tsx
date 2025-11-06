"use client";
import type React from "react";
import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { toast } from "react-toastify";

const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";

interface ViewFilesDialogProps {
  open: boolean;
  onClose: () => void;
  files: string[];
  title?: string;
  showDownload?: boolean;
  showView?: boolean;
}

const ViewFilesDialog: React.FC<ViewFilesDialogProps> = ({
  open,
  onClose,
  files = [],
  title = "Attached Files",
  showDownload = true,
  showView = false,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const getFileName = (filePath: string) => filePath.split("/").pop() || filePath;
  const getFileExtension = (fileName: string) =>
    fileName.split(".").pop()?.toLowerCase() || "";

  const handleDownloadFile = (filePath: string) => {
    try {
      setDownloading(filePath);
      const fileName = getFileName(filePath);
      let downloadUrl = "";

      if (filePath.startsWith("http")) {
        downloadUrl = filePath;
      } else if (filePath.startsWith("/uploads")) {
        downloadUrl = `${BaseURL}${filePath}`;
      } else if (filePath.startsWith("design/")) {
        downloadUrl = `${BaseURL}/uploads/${filePath}`;
      } else {
        downloadUrl = `${BaseURL}/api/filedownload/download/${encodeURIComponent(filePath)}`;
      }

      // ✅ Use browser-based download (no API call)
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`${fileName} download started`);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(`Failed to download file: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleViewFile = (filePath: string) => {
    try {
      let viewUrl = "";

      if (filePath.startsWith("http")) {
        viewUrl = filePath;
      } else if (filePath.startsWith("/uploads")) {
        viewUrl = `${BaseURL}${filePath}`;
      } else if (filePath.startsWith("design/")) {
        viewUrl = `${BaseURL}/uploads/${filePath}`;
      } else {
        viewUrl = `${BaseURL}/api/filedownload/download/${encodeURIComponent(filePath)}?view=true`;
      }

      window.open(viewUrl, "_blank");
    } catch (error) {
      console.error("Error viewing file:", error);
      toast.error("Failed to view file");
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = getFileExtension(fileName);
    switch (extension) {
      case "pdf":
        return <InsertDriveFileIcon color="error" sx={{ mr: 2 }} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <InsertDriveFileIcon color="primary" sx={{ mr: 2 }} />;
      case "doc":
      case "docx":
        return <InsertDriveFileIcon color="info" sx={{ mr: 2 }} />;
      case "xls":
      case "xlsx":
        return <InsertDriveFileIcon color="success" sx={{ mr: 2 }} />;
      default:
        return <InsertDriveFileIcon color="action" sx={{ mr: 2 }} />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {title} ({files.length})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {files && files.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: "auto" }}>
            {files.map((filePath, index) => {
              const fileName = getFileName(filePath);
              const isDownloading = downloading === filePath;

              return (
                <ListItem
                  key={index}
                  sx={{
                    borderBottom: index < files.length - 1 ? 1 : 0,
                    borderColor: "divider",
                    py: 2,
                  }}
                >
                  {getFileIcon(fileName)}

                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={500}>
                        {fileName}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Path: {filePath}
                      </Typography>
                    }
                  />

                  <Box display="flex" gap={1} alignItems="center">
                    {showView && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewFile(filePath)}
                        sx={{ minWidth: 80 }}
                      >
                        View
                      </Button>
                    )}

                    {showDownload && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={
                          isDownloading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <DownloadIcon />
                          )
                        }
                        onClick={() => handleDownloadFile(filePath)}
                        disabled={isDownloading}
                        sx={{ minWidth: 100 }}
                      >
                        {isDownloading ? "Downloading..." : "Download"}
                      </Button>
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <InsertDriveFileIcon
              sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
            />
            <Typography color="text.secondary" variant="body1">
              No files attached
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Files will appear here once uploaded
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewFilesDialog;
