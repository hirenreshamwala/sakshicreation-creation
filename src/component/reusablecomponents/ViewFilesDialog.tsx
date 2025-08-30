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
import axios from "axios";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";

const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";

interface ViewFilesDialogProps {
  open: boolean;
  onClose: () => void;
  files: string[];
  title?: string;
  showDownload?: boolean;
  showView?: boolean;
  downloadEndpoint?: string;
}

const ViewFilesDialog: React.FC<ViewFilesDialogProps> = ({
  open,
  onClose,
  files = [],
  title = "Attached Files",
  showDownload = true,
  showView = false,
  downloadEndpoint = `${BaseURL}`,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  const getFileSize = (filePath: string) => {
    return "Unknown size";
  };

const handleDownloadFile = async (filePath: string) => {
  try {
    setDownloading(filePath);
    const fileName = getFileName(filePath);
    
    // Construct the proper download URL
    let downloadUrl;
    
    if (filePath.startsWith('http')) {
      // Direct URL - use as is
      downloadUrl = filePath;
    } else if (filePath.startsWith('/uploads')) {
      // Relative path from uploads directory
      downloadUrl = `${BaseURL}/api/filedownload/download?filePath=${encodeURIComponent(filePath)}`;
    } else {
      // For files in specific folders like 'design'
      downloadUrl = `${BaseURL}/api/filedownload/download?filePath=${encodeURIComponent(filePath)}`;
    }

    const token = authService.getToken();
    const response = await axios.get(downloadUrl, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${fileName} downloaded successfully`);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(
        `Failed to download file: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setDownloading(null);
    }
  };

  // View file function (opens in new tab)
  const handleViewFile = (filePath: string) => {
    try {
      const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
      
      if (filePath.startsWith('http')) {
        window.open(filePath, '_blank');
      } else if (filePath.startsWith('/uploads')) {
        window.open(`${BaseURL}${filePath}`, '_blank');
      } else if (filePath.startsWith('design/')) {
        window.open(`${BaseURL}/uploads/${filePath}`, '_blank');
      } else {
        window.open(
          `${BaseURL}/api/filedownload/download/${encodeURIComponent(filePath)}?view=true`,
          '_blank'
        );
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error('Failed to view file');
    }
  };
  // Get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const extension = getFileExtension(fileName);
    // You can customize icons based on file type
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
              const fileSize = getFileSize(filePath);
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
                  {/* File Icon */}
                  {getFileIcon(fileName)}

                  {/* File Info */}
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={500}>
                        {fileName}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Path: {filePath}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size: {fileSize}
                        </Typography>
                      </Box>
                    }
                  />

                  {/* Action Buttons */}
                  <Box display="flex" gap={1} alignItems="center">
                    {/* View Button */}
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

                    {/* Download Button */}
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
