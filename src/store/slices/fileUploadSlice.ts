import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { fileUploadService } from "@/services/fileUpload.service"

interface UploadedFile {
  filename: string
  originalName: string
  size: number
  mimetype: string
  folder: string
  url: string
  path: string
}

interface FileUploadState {
  uploadedFiles: UploadedFile[]
  uploading: boolean
  uploadProgress: number
  error: string | null
  successMessage: string | null
}

const initialState: FileUploadState = {
  uploadedFiles: [],
  uploading: false,
  uploadProgress: 0,
  error: null,
  successMessage: null,
}

// Upload single file
export const uploadSingleFileThunk = createAsyncThunk(
  "fileUpload/uploadSingle",
  async ({ file, folder }: { file: File; folder?: string }, { rejectWithValue }) => {
    try {
      const response = await fileUploadService.uploadSingleFile(file, folder)
      console.log("Upload Single File Response:", response)

      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || "Failed to upload file")
      }
    } catch (error: any) {
      console.error("Upload Single File Error:", error)
      return rejectWithValue(error.message || "Failed to upload file")
    }
  },
)

// Upload multiple files
export const uploadMultipleFilesThunk = createAsyncThunk(
  "fileUpload/uploadMultiple",
  async ({ files, folder }: { files: File[]; folder?: string }, { rejectWithValue }) => {
    try {
      const response = await fileUploadService.uploadMultipleFiles(files, folder)
      console.log("Upload Multiple Files Response:", response)

      if (response.success) {
        return response.data
      } else {
        return rejectWithValue(response.message || "Failed to upload files")
      }
    } catch (error: any) {
      console.error("Upload Multiple Files Error:", error)
      return rejectWithValue(error.message || "Failed to upload files")
    }
  },
)

// Delete file
export const deleteFileThunk = createAsyncThunk(
  "fileUpload/deleteFile",
  async ({ folder, filename }: { folder: string; filename: string }, { rejectWithValue }) => {
    try {
      const response = await fileUploadService.deleteFile(folder, filename)
      console.log("Delete File Response:", response)

      if (response.success) {
        return { folder, filename }
      } else {
        return rejectWithValue(response.message || "Failed to delete file")
      }
    } catch (error: any) {
      console.error("Delete File Error:", error)
      return rejectWithValue(error.message || "Failed to delete file")
    }
  },
)

const fileUploadSlice = createSlice({
  name: "fileUpload",
  initialState,
  reducers: {
    clearFileUploadError(state) {
      state.error = null
    },
    clearFileUploadSuccessMessage(state) {
      state.successMessage = null
    },
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadProgress = action.payload
    },
    clearUploadedFiles(state) {
      state.uploadedFiles = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload single file
      .addCase(uploadSingleFileThunk.pending, (state) => {
        state.uploading = true
        state.error = null
        state.uploadProgress = 0
      })
      .addCase(uploadSingleFileThunk.fulfilled, (state, action: PayloadAction<UploadedFile>) => {
        state.uploading = false
        state.uploadedFiles = [action.payload, ...state.uploadedFiles]
        state.successMessage = "File uploaded successfully"
        state.uploadProgress = 100
        state.error = null
      })
      .addCase(uploadSingleFileThunk.rejected, (state, action) => {
        state.uploading = false
        state.error = action.payload as string
        state.uploadProgress = 0
      })

      // Upload multiple files
      .addCase(uploadMultipleFilesThunk.pending, (state) => {
        state.uploading = true
        state.error = null
        state.uploadProgress = 0
      })
      .addCase(uploadMultipleFilesThunk.fulfilled, (state, action: PayloadAction<UploadedFile[]>) => {
        state.uploading = false
        state.uploadedFiles = [...action.payload, ...state.uploadedFiles]
        state.successMessage = `${action.payload.length} files uploaded successfully`
        state.uploadProgress = 100
        state.error = null
      })
      .addCase(uploadMultipleFilesThunk.rejected, (state, action) => {
        state.uploading = false
        state.error = action.payload as string
        state.uploadProgress = 0
      })

      // Delete file
      .addCase(deleteFileThunk.pending, (state) => {
        state.error = null
      })
      .addCase(deleteFileThunk.fulfilled, (state, action: PayloadAction<{ folder: string; filename: string }>) => {
        state.uploadedFiles = state.uploadedFiles.filter((file) => file.filename !== action.payload.filename)
        state.successMessage = "File deleted successfully"
        state.error = null
      })
      .addCase(deleteFileThunk.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { clearFileUploadError, clearFileUploadSuccessMessage, setUploadProgress, clearUploadedFiles } =
  fileUploadSlice.actions

export default fileUploadSlice.reducer
