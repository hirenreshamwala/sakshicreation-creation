import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import Swal from 'sweetalert2';
import { useAppDispatch } from '@/store';
import { sendBoxFromGodownOrFactoryThunk, updateQPOrderThunk } from '@/store/slices/qpOrderSlice';
import { inventoryService } from '@/services/inventory.service';

// ✅ MUI Icons
import WarehouseIcon from '@mui/icons-material/Warehouse';
import FactoryIcon from '@mui/icons-material/Factory';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function StackSelection({ formData, row, isCompleted }: any) {
  const dispatch = useAppDispatch();
  const [godownInventory, setGodownInventory] = useState([]);
  const [factoryInventory, setFactoryInventory] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<'godown' | 'factory' | 'new' | null>(null);

  // --- Fetch inventory summary ---
  const getInventorySummary = async () => {
    try {
      const data = { ...row?.orderdata };
      delete data._id;
      delete data.party;

      const res: any = await inventoryService.getInventoryBoxSummery(data);
      if (res?.success) {
        const godownOptions = res?.data?.godown?.inArray?.filter(
          (item: any) => item?.usedBox !== undefined && item?.quantity > item?.usedBox
        );
        const factoryOptions = res?.data?.factory?.inArray?.filter(
          (item: any) => item?.usedBox !== undefined && item?.quantity > item?.usedBox
        );
        setGodownInventory(godownOptions);
        setFactoryInventory(factoryOptions);
      }
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
    }
  };

  useEffect(() => {
    getInventorySummary();
  }, []);

  // 🧩 Handle source selection with validation + SweetAlert confirmation
  const handleSourceSelect = async (source: 'godown' | 'factory' | 'new') => {
    // Require inventory selection before confirm (if applicable)
    if ((source === 'godown' || source === 'factory') && !selectedBoxId) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Select Inventory',
        text: `You must select a ${source === 'godown' ? 'Godown' : 'Factory'} batch before proceeding.`,
        confirmButtonColor: '#1976d2',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Source Selection',
      html: `Are you sure you want to select <strong>${source.toUpperCase()}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#9e9e9e',
    });

    if (result.isConfirmed) {
      setSelectedSource(source);

      let newStep = 1;
      if (source === 'godown') newStep = 2;
      else if (source === 'factory') newStep = 3;
      else newStep = 4;

      // ✅ Include selectedBoxId in API data if applicable
      const payload: any = { step: newStep };
      if (selectedBoxId) {
        payload.inventory = selectedBoxId;
        payload.qty = row.noOfPieces
      }

      await dispatch(sendBoxFromGodownOrFactoryThunk({ id: formData._id, data: payload })).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Source Confirmed',
        text: `${source.toUpperCase()} has been selected successfully!`,
        confirmButtonColor: '#1976d2',
      });
    }
  };

  const renderSourceCard = (source: 'godown' | 'factory' | 'new') => {
    const isSelected = selectedSource === source;
    const isDisabled =
      isCompleted ||
      (source === 'godown' && !godownInventory?.length) ||
      (source === 'factory' && !factoryInventory?.length);

    const list = source === 'godown' ? godownInventory : factoryInventory;

    const getIcon = () => {
      switch (source) {
        case 'godown':
          return <WarehouseIcon sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />;
        case 'factory':
          return <FactoryIcon sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />;
        default:
          return <AddBoxIcon sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />;
      }
    };

    const getTitle = () =>
      source === 'godown'
        ? 'Godown'
        : source === 'factory'
          ? 'Factory'
          : 'Create New';

    const getDescription = () =>
      source === 'godown'
        ? 'Send boxes from godown storage'
        : source === 'factory'
          ? 'Send boxes from factory inventory'
          : 'Create new boxes in factory';

    return (
      <Grid item xs={12} md={4} key={source}>
        <Card
          variant={isSelected ? 'elevation' : 'outlined'}
          elevation={isSelected ? 4 : 0}
          sx={{
            cursor: isDisabled ? 'default' : 'pointer',
            borderColor: isSelected ? 'primary.main' : 'grey.300',
            transition: 'all 0.2s',
            '&:hover': { boxShadow: isDisabled ? 0 : 4 },
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            {getIcon()}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              {getTitle()}
            </Typography>

            {source !== 'new' && list?.length > 0 && (
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>
                  {source === 'godown' ? 'Select Available Batch' : 'Select Factory Batch'}
                </InputLabel>
                <Select
                  label={source === 'godown' ? 'Select Available Batch' : 'Select Factory Batch'}
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                >
                  {list.map((box: any) => (
                    <MenuItem
                      key={box._id}
                      value={box._id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        py: 1.2,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        <Inventory2Icon sx={{ mr: 0.5, fontSize: 18 }} />
                        {box?.boxName || 'Box'} —{' '}
                        <strong>{box.quantity - (box.usedBox || 0)} pcs</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📏 {box?.boxLength}×{box?.boxWidth}×{box?.boxHeight} {box?.uom} • GSMs:{' '}
                        {box?.paper1GSM}-{box?.paper2GSM}-{box?.paper3GSM}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Deckal: {box?.deckal} | <strong>{box?.ply} Ply</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {box.lamination && 'Lamination, '}
                        {box.isKantan && 'Kantan, '}
                        {box.uv && 'UV, '}
                        {box.varnish && 'Varnish, '}
                        MFG Date: {new Date(box.date).toLocaleDateString()}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {source === 'new' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Create new boxes in factory
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Use when boxes are not available in stock
                </Typography>
              </Box>
            )}

            <Button
              variant={isSelected ? 'contained' : 'outlined'}
              disabled={isDisabled}
              fullWidth
              size="large"
              onClick={() => !isDisabled && handleSourceSelect(source)}
            >
              {getDescription()}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Card sx={{ mt: 2, border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
          <Inventory2Icon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Select Box Source
        </Typography>

        <Grid container spacing={3}>
          {['godown', 'factory', 'new'].map((src) => renderSourceCard(src as any))}
        </Grid>

        {selectedSource && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 'bold', color: 'success.dark', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CheckCircleIcon color="success" />
              Selected: {selectedSource}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'success.dark' }}>
              Current Step: {formData.step} →{' '}
              {selectedSource === 'godown'
                ? 'Step 2 (Godown)'
                : selectedSource === 'factory'
                  ? 'Step 3 (Factory)'
                  : 'Step 4 (Create New)'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default StackSelection;