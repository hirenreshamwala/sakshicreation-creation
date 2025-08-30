"use client"

import type React from "react"
import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react"
import { Box, Button, Typography, Chip, Alert, CircularProgress, IconButton } from "@mui/material"
import { CloudUpload, Delete, AttachFile, Image as ImageIcon } from "@mui/icons-material"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  uploadSingleFileThunk,
  uploadMultipleFilesThunk,
  deleteFileThunk,
  clearFileUploadError,
  clearFileUploadSuccessMessage,
} from "@/store/slices/fileUploadSlice"
import { toast } from "react-toastify"

interface FileUploadProps {
  folder?: string // Folder name where files will be uploaded
  multiple?: boolean // Allow multiple file selection
  accept?: string // File types to accept (e.g., "image/*", ".pdf,.doc,.docx")
  maxFiles?: number // Maximum number of files (only for multiple)
  onUploadSuccess?: (files: any[]) => void // Callback when upload is successful
  onUploadError?: (error: string) => void // Callback when upload fails
  onFilesSelected?: (files: File[]) => void // Callback when files are selected (before upload)
  showPreview?: boolean // Show uploaded files preview
  disabled?: boolean // Disable the component
  label?: string // Custom label for the upload button
  helperText?: string // Helper text below the component
  variant?: "button" | "dropzone" // Upload variant
  showUploadButton?: boolean // Show upload button or not (default: true)
  autoUpload?: boolean // Auto upload when files are selected (default: false)
}

export interface FileUploadRef {
  uploadSelectedFiles: () => Promise<any[]> // Function to upload selected files
  getSelectedFiles: () => File[] // Function to get selected files
  clearSelectedFiles: () => void // Function to clear selected files
}

const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(
  (
    {
      folder = "general",
      multiple = false,
      accept = "*/*",
      maxFiles = 10,
      onUploadSuccess,
      onUploadError,
      onFilesSelected,
      showPreview = true,
      disabled = false,
      label,
      helperText,
      variant = "button",
      showUploadButton = true, // Default to true for backward compatibility
      autoUpload = false, // Default to false
    },
    ref,
  ) => {
    const dispatch = useAppDispatch()
    const { uploading, uploadProgress, error, successMessage, uploadedFiles } = useAppSelector(
      (state) => state.fileUpload,
    )

    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [dragOver, setDragOver] = useState(false)
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      uploadSelectedFiles: async () => {
        return await handleUpload()
      },
      getSelectedFiles: () => selectedFiles,
      clearSelectedFiles: () => {
        setSelectedFiles([])
        setPreviewUrls([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      },
    }))

    // Create preview URLs for images
    const createPreviewUrls = (files: File[]) => {
      const urls: string[] = []
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file)
          urls.push(url)
        } else {
          urls.push("") // Empty string for non-images
        }
      })
      setPreviewUrls(urls)
    }

    // Handle file selection
    const handleFileSelect = useCallback(
      async (files: FileList | null) => {
        if (!files) return

        const fileArray = Array.from(files)

        // Validate file size (5MB limit per file)
        // const invalidFiles = fileArray.filter((file) => file.size > 5 * 1024 * 1024)
        // if (invalidFiles.length > 0) {
        //   const errorMsg = `Files too large: ${invalidFiles.map((f) => f.name).join(", ")}. Maximum size is 5MB per file.`
        //   toast.error(errorMsg)
        //   if (onUploadError) onUploadError(errorMsg)
        //   return
        // }

        // Validate file count for multiple uploads
        if (multiple && fileArray.length > maxFiles) {
          const errorMsg = `Too many files selected. Maximum ${maxFiles} files allowed.`
          toast.error(errorMsg)
          if (onUploadError) onUploadError(errorMsg)
          return
        }

        setSelectedFiles(fileArray)
        createPreviewUrls(fileArray)

        // Call onFilesSelected callback
        if (onFilesSelected) {
          onFilesSelected(fileArray)
        }

        // Auto upload if enabled
        if (autoUpload) {
          await handleUploadFiles(fileArray)
        }
      },
      [multiple, maxFiles, onUploadError, onFilesSelected, autoUpload],
    )

    // Handle file input change
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(event.target.files)
    }

    // Handle drag and drop
    const handleDrop = useCallback(
      (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setDragOver(false)
        handleFileSelect(event.dataTransfer.files)
      },
      [handleFileSelect],
    )

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragOver(true)
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragOver(false)
    }

    // Upload files function
    const handleUploadFiles = async (filesToUpload: File[] = selectedFiles): Promise<any[]> => {
      if (filesToUpload.length === 0) {
        toast.error("Please select files to upload")
        return []
      }

      try {
        let result: any[] = []
        if (multiple && filesToUpload.length > 1) {
          const uploadResult = await dispatch(uploadMultipleFilesThunk({ files: filesToUpload, folder })).unwrap()
          result = Array.isArray(uploadResult) ? uploadResult : [uploadResult]
        } else {
          const uploadResult = await dispatch(uploadSingleFileThunk({ file: filesToUpload[0], folder })).unwrap()
          result = [uploadResult]
        }

        // Clear selected files after successful upload
        setSelectedFiles([])
        setPreviewUrls([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess(result)
        }

        toast.success(
          multiple && filesToUpload.length > 1 ? "Files uploaded successfully" : "File uploaded successfully",
        )

        return result
      } catch (error: any) {
        console.error("Upload error:", error)
        if (onUploadError) onUploadError(error)
        toast.error(error || "Upload failed")
        return []
      }
    }

    // Upload files (for button click)
    const handleUpload = async (): Promise<any[]> => {
      return await handleUploadFiles()
    }

    // Remove selected file
    const removeSelectedFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index)
      const newPreviewUrls = previewUrls.filter((_, i) => i !== index)

      // Revoke the URL to prevent memory leaks
      if (previewUrls[index]) {
        URL.revokeObjectURL(previewUrls[index])
      }

      setSelectedFiles(newFiles)
      setPreviewUrls(newPreviewUrls)
      if (onFilesSelected) {
        onFilesSelected(newFiles)
      }
    }

    // Delete uploaded file
    const handleDeleteUploadedFile = async (file: any) => {
      try {
        await dispatch(deleteFileThunk({ folder: file.folder, filename: file.filename })).unwrap()
        toast.success("File deleted successfully")
      } catch (error: any) {
        console.error("Delete error:", error)
        toast.error(error || "Delete failed")
      }
    }

    // Get file icon
    const getFileIcon = (file: File, index: number) => {
      if (file.type.startsWith("image/")) {
        return <ImageIcon />
      }
      return <AttachFile />
    }

    // Format file size
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const buttonLabel = label || (multiple ? "Select Files" : "Select File")

    return (
      <Box>
        {/* Upload Area */}
        {variant === "dropzone" ? (
          <Box
            sx={{
              border: dragOver ? "2px dashed #1976d2" : "2px dashed #D0D5DD",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              backgroundColor: dragOver ? "#f5f5f5" : "#fff",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              transition: "all 0.2s ease",
              "&:hover": !disabled
                ? {
                    borderColor: "#1976d2",
                    backgroundColor: "#f9f9f9",
                  }
                : {},
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <CloudUpload sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#667085", mb: 0.5 }}>
              {dragOver ? "Drop files here" : "Click to select files or drag and drop"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {/* Maximum file size: 5MB per file */}
              {multiple && `  Maximum ${maxFiles} files`}
            </Typography>
          </Box>
        ) : (
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUpload />}
            disabled={disabled || uploading}
            sx={{ mb: 2 }}
            onClick={() => fileInputRef.current?.click()}
          >
            {buttonLabel}
          </Button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />

        {/* Helper text */}
        {helperText && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {helperText}
          </Typography>
        )}

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Files ({selectedFiles.length}):
            </Typography>

            {/* Image Previews */}
            {previewUrls.some((url) => url !== "") && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                {selectedFiles.map((file, index) => {
                  if (file.type.startsWith("image/") && previewUrls[index]) {
                    return (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: 120,
                          height: 120,
                          border: "1px solid #ddd",
                          borderRadius: 1,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={previewUrls[index] || "/placeholder.svg"}
                          alt={file.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          onClick={() => removeSelectedFile(index)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                            },
                          }}
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            color: "white",
                            p: 0.5,
                            fontSize: "10px",
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.name}
                        </Typography>
                      </Box>
                    )
                  }
                  return null
                })}
              </Box>
            )}

            {/* File Chips for non-images and all files */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {selectedFiles.map((file, index) => (
                <Chip
                  key={index}
                  icon={getFileIcon(file, index)}
                  label={`${file.name} (${formatFileSize(file.size)})`}
                  onDelete={() => removeSelectedFile(index)}
                  variant="outlined"
                  sx={{ maxWidth: "300px" }}
                />
              ))}
            </Box>

            {/* Upload button - only show if showUploadButton is true and autoUpload is false */}
            {showUploadButton && !autoUpload && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" onClick={handleUpload} disabled={uploading} sx={{ mr: 1 }}>
                  {uploading ? "Uploading..." : multiple ? "Upload Files" : "Upload File"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Revoke all preview URLs
                    previewUrls.forEach((url) => {
                      if (url) URL.revokeObjectURL(url)
                    })
                    setSelectedFiles([])
                    setPreviewUrls([])
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                    if (onFilesSelected) {
                      onFilesSelected([])
                    }
                  }}
                  disabled={uploading}
                >
                  Clear
                </Button>
              </Box>
            )}

            {/* Show message when upload button is hidden */}
            {!showUploadButton && !autoUpload && (
              <Typography variant="caption" color="text.secondary">
                Files will be uploaded when you submit the form
              </Typography>
            )}
          </Box>
        )}

        {/* Upload progress */}
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Uploading... {uploadProgress}%
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Please wait...</Typography>
            </Box>
          </Box>
        )}

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => dispatch(clearFileUploadError())}>
            {error}
          </Alert>
        )}

        {/* Success message */}
        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => dispatch(clearFileUploadSuccessMessage())}>
            {successMessage}
          </Alert>
        )}

        {/* Uploaded files preview */}
        {/* {showPreview && uploadedFiles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Uploaded Files:
            </Typography>
            <Box>
              {uploadedFiles.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#f9f9f9",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {file.mimetype?.startsWith("image/") ? <ImageIcon /> : <AttachFile />}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {file.originalName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)} • {file.folder}/{file.filename}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => handleDeleteUploadedFile(file)} color="error" size="small">
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )} */}
      </Box>
    )
  },
)

FileUpload.displayName = "FileUpload"

export default FileUpload
