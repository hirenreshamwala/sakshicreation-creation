import React from 'react'

function PrinterTaskExpandable({ row }: any) {
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

    return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {/* Printer Files List */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Printer Files</h3>
                {row.printerFiles?.length > 0 ? (
                    <div className="space-y-2">
                        {row.printerFiles.map((fileUrl: any, index: any) => (
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
                    <p className="text-gray-500 text-sm">No printer files available</p>
                )}
            </div>

            {/* Order Information */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Order Information:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Order No: QP-{row.orderNo}</div>
                    <div>Company: {row.companyName?.companyName}</div>
                    <div>Party: {row.party?.partyName}</div>
                    <div>Status: {row.status}</div>
                    <div className="col-span-2">
                        Total Printer Files: {row.printerFiles?.length || 0}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PrinterTaskExpandable