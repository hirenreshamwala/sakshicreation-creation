
import {
    Box,
    Typography,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from "@mui/material";
import { Close, Visibility, Download } from "@mui/icons-material";

function DesignerFilesDialog({ viewFilesDialogOpen, setViewFilesDialogOpen, data, getFileName, handleDownloadFile, handleViewFile }:any) {
      const isFileUrl = (file: any) => typeof file === 'string';
    return (
        <div>
            <Dialog
                open={viewFilesDialogOpen}
                onClose={() => setViewFilesDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        height: '80vh'
                    }
                }}
            >
                <DialogTitle>
                    View Files
                    <IconButton
                        aria-label="close"
                        onClick={() => setViewFilesDialogOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Design Files */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Design Files
                            </Typography>
                            {data?.designFiles?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {data.designFiles.map((fileUrl: any, index: number) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'grey.300',
                                                borderRadius: 1,
                                                bgcolor: 'white',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body2">
                                                    {getFileName(fileUrl)}
                                                </Typography>
                                                <Chip
                                                    label={isFileUrl(fileUrl) ? 'Uploaded' : 'Local'}
                                                    size="small"
                                                    variant="outlined"
                                                    color={isFileUrl(fileUrl) ? 'primary' : 'secondary'}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => handleViewFile(fileUrl)}
                                                    variant="outlined"
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadFile(fileUrl, getFileName(fileUrl))}
                                                    variant="outlined"
                                                    color="success"
                                                >
                                                    Download
                                                </Button>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No design files available
                                </Typography>
                            )}
                        </Box>

                        {/* Designer Files */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Designer Files
                            </Typography>
                            {data?.designerFiles?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {data.designerFiles.map((fileUrl: any, index: number) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'grey.300',
                                                borderRadius: 1,
                                                bgcolor: 'white',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body2">
                                                    {getFileName(fileUrl)}
                                                </Typography>
                                                <Chip
                                                    label={isFileUrl(fileUrl) ? 'Uploaded' : 'Local'}
                                                    size="small"
                                                    variant="outlined"
                                                    color={isFileUrl(fileUrl) ? 'primary' : 'secondary'}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => handleViewFile(fileUrl)}
                                                    variant="outlined"
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadFile(fileUrl, getFileName(fileUrl))}
                                                    variant="outlined"
                                                    color="success"
                                                >
                                                    Download
                                                </Button>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No designer files available
                                </Typography>
                            )}
                        </Box>

                        {/* Rework Design Files */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Rework Design Files
                            </Typography>
                            {data?.reworkDesignFiles?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {data.reworkDesignFiles.map((fileUrl: any, index: number) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'grey.300',
                                                borderRadius: 1,
                                                bgcolor: 'white',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body2">
                                                    {getFileName(fileUrl)}
                                                </Typography>
                                                <Chip
                                                    label={isFileUrl(fileUrl) ? 'Uploaded' : 'Local'}
                                                    size="small"
                                                    variant="outlined"
                                                    color={isFileUrl(fileUrl) ? 'primary' : 'secondary'}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => handleViewFile(fileUrl)}
                                                    variant="outlined"
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadFile(fileUrl, getFileName(fileUrl))}
                                                    variant="outlined"
                                                    color="success"
                                                >
                                                    Download
                                                </Button>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No rework design files available
                                </Typography>
                            )}
                        </Box>

                        {/* Rework Designer Files */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Rework Designer Files
                            </Typography>
                            {data?.reworkDesignerFiles?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {data.reworkDesignerFiles.map((fileUrl: any, index: number) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'grey.300',
                                                borderRadius: 1,
                                                bgcolor: 'white',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body2">
                                                    {getFileName(fileUrl)}
                                                </Typography>
                                                <Chip
                                                    label={isFileUrl(fileUrl) ? 'Uploaded' : 'Local'}
                                                    size="small"
                                                    variant="outlined"
                                                    color={isFileUrl(fileUrl) ? 'primary' : 'secondary'}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => handleViewFile(fileUrl)}
                                                    variant="outlined"
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadFile(fileUrl, getFileName(fileUrl))}
                                                    variant="outlined"
                                                    color="success"
                                                >
                                                    Download
                                                </Button>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No rework designer files available
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DesignerFilesDialog
