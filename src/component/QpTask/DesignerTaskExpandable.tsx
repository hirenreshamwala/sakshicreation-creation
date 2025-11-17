import { useAppDispatch, useAppSelector } from '@/store';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { fileUploadService } from '@/services/fileUpload.service';
import { updateQPOrderThunk } from '@/store/slices/qpOrderSlice';

// File upload service interface
interface UploadedFile {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    folder: string;
    url: string;
    path: string;
    storedPath: string;
}


function DesignerTaskExpandable({ row }: any) {
    const { user } = useAppSelector((state) => state.auth);
    const [designerFiles, setDesignerFiles] = useState<any[]>(row.designerFiles || []);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch()

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setNewFiles(prev => [...prev, ...filesArray]);
        }
    };

    // Remove new file from upload list
    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Remove existing designer file
    const removeExistingFile = (index: number) => {
        setDesignerFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Download file
    const downloadFile = (fileUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // View file in new tab
    const viewFile = (fileUrl: string) => {
        window.open(fileUrl, '_blank');
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newFiles.length === 0) {
            toast.error("Please select at least one file to upload");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Upload new designer files only on submit
            toast.info("Uploading designer files...");
            const uploadRes: any = await fileUploadService.uploadMultipleFiles(newFiles, "designer");

            if (!uploadRes.success) {
                toast.error(uploadRes.message || "Failed to upload designer files");
                setIsSubmitting(false);
                return;
            }
            const uploadedFileUrls = uploadRes.data.map((file: UploadedFile) => file.path);

            if (row.reworkDesignFiles.length) {
                const updatedDesignerFiles = [...uploadedFileUrls, ...(row.reworkDesignerFiles || [])];

                const updateData = {
                    reworkDesignerFiles: updatedDesignerFiles,
                };

                await dispatch(updateQPOrderThunk({
                    id: row._id,
                    data: updateData
                })).unwrap();
            }
            else {
                const updatedDesignerFiles = [...uploadedFileUrls, ...(row.designerFiles || [])];
                setDesignerFiles(updatedDesignerFiles);

                const updateData = {
                    designerFiles: updatedDesignerFiles,
                };

                await dispatch(updateQPOrderThunk({
                    id: row._id,
                    data: updateData
                })).unwrap();

            }

            setNewFiles([]);
            toast.success(`Successfully uploaded ${uploadRes.data.length} files and updated the order!`);

        } catch (err: any) {
            console.error("File upload and order update failed:", err);
            toast.error(err?.message || "Failed to upload files and update order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {/* Current Designer Files List */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Design Files</h3>
                {row.designFiles.length > 0 ? (
                    <div className="space-y-2">
                        {row.designFiles.map((fileUrl: any, index: any) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600">
                                        {fileUrl.split('/').pop()}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        ({typeof fileUrl === 'string' ? 'Uploaded' : 'Local'})
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => viewFile(process.env.NEXT_PUBLIC_API_URL + fileUrl)}
                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => downloadFile(fileUrl, fileUrl.split('/').pop() || 'file')}
                                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No designer files available</p>
                )}
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Designer Files</h3>
                {designerFiles.length > 0 ? (
                    <div className="space-y-2">
                        {designerFiles.map((fileUrl: any, index: any) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600">
                                        {fileUrl.split('/').pop()}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        ({typeof fileUrl === 'string' ? 'Uploaded' : 'Local'})
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => viewFile(process.env.NEXT_PUBLIC_API_URL + fileUrl)}
                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => downloadFile(fileUrl, fileUrl.split('/').pop() || 'file')}
                                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No designer files available</p>
                )}
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Rework Design Files</h3>
                {
                    row.reworkDesignFiles.length > 0 ? (
                        <div className="space-y-2">
                            {row.reworkDesignFiles.map((fileUrl: any, index: any) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-600">
                                            {fileUrl.split('/').pop()}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            ({typeof fileUrl === 'string' ? 'Uploaded' : 'Local'})
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => viewFile(process.env.NEXT_PUBLIC_API_URL + fileUrl)}
                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => downloadFile(fileUrl, fileUrl.split('/').pop() || 'file')}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No designer files available</p>
                    )}
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Rework Designer Files</h3>
                {
                    row.reworkDesignerFiles.length > 0 ? (
                        <div className="space-y-2">
                            {row.reworkDesignerFiles.map((fileUrl: any, index: any) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-600">
                                            {fileUrl.split('/').pop()}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            ({typeof fileUrl === 'string' ? 'Uploaded' : 'Local'})
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => viewFile(process.env.NEXT_PUBLIC_API_URL + fileUrl)}
                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => downloadFile(fileUrl, fileUrl.split('/').pop() || 'file')}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No designer files available</p>
                    )}
            </div>


            {/* File Upload Section */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Upload New Designer Files</h3>
                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                    accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.cdr,.doc,.docx"
                    disabled={isSubmitting}
                />

                {/* New Files Preview */}
                {newFiles.length > 0 && (
                    <div className="mt-3">
                        <h4 className="font-medium mb-2">Files ready for upload:</h4>
                        <div className="space-y-2">
                            {newFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm">{file.name}</span>
                                        <span className="text-xs text-gray-500">
                                            ({(file.size / 1024).toFixed(2)} KB)
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeNewFile(index)}
                                        disabled={isSubmitting}
                                        className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
                {newFiles.length > 0 && (
                    <button
                        onClick={() => setNewFiles([])}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Clear Selection
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || newFiles.length === 0}
                    className={`px-6 py-2 rounded font-medium ${isSubmitting || newFiles.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isSubmitting ? 'Uploading...' : 'Upload Files'}
                </button>
            </div>

            {/* Order Information */}
            
        </div>
    );
}

export default DesignerTaskExpandable;