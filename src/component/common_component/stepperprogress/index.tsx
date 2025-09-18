// StepperProgress.tsx
import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
  StepIconProps,
} from '@mui/material';
import { Box } from '@mui/system';
import { FaCheck } from "react-icons/fa6";
import { useRouter } from 'next/router';

const steps = [
  { label: 'Order Received', path: '' },
  { label: 'Designer', path: 'designer' },
  { label: 'Printer', path: 'printers' },
  { label: 'Binder', path: 'binder' },
  { label: 'Booklet & Folder Binder', path: 'booklet-folder' },
  { label: 'Delivery', path: 'dilevery' },
];

const CustomConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: '#12B76A',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: '#12B76A',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#D0D5DD',
    borderRadius: 1,
  },
}));

const StepIcon = (props: StepIconProps) => {
  const { active, completed, className } = props;

  return (
    <Box
      className={className}
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: completed || active ? (active ? '#12B76A' : '#12B76A') : '#D0D5DD',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {completed && <FaCheck fontSize="small" />}
      {active && !completed && <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#fff' }} />}
    </Box>
  );
};

type StepperProgressProps = {
  activeStep: number;
  orderStatus: string;
  designerStatus?: string;
  printerStatus?: string;
};

const StepperProgress: React.FC<StepperProgressProps> = ({ 
  activeStep, 
  orderStatus,
  designerStatus,
  printerStatus 
}) => {
  const router = useRouter();
  const { id } = router.query;

  // Determine if a step is clickable based on workflow progression
const isStepClickable = (index: number) => {
  let result = false;

  switch (index) {
    case 0: // Order Received
      result = index === activeStep || index < activeStep;
      break;

    case 1: // Designer step
      result =
        orderStatus === 'Designer' ||
        orderStatus === 'Order Received' ||
        orderStatus === 'Printer' ||
        orderStatus === 'Binder' ||
        orderStatus === 'Booklet & Folder Binder' ||
        orderStatus === 'Delivery';
      break;

    case 2: // Printer step
      result =
        orderStatus === 'Printer' ||
        (designerStatus === 'Approved' && orderStatus !== 'Hold') ||
        orderStatus === 'Binder' ||
        orderStatus === 'Booklet & Folder Binder' ||
        orderStatus === 'Delivery';
      break;

    case 3: // Binder step
      result =
        orderStatus === 'Binder' ||
        (printerStatus === 'Done' && orderStatus !== 'Hold') ||
        orderStatus === 'Booklet & Folder Binder' ||
        orderStatus === 'Delivery';
      break;

    case 4: // Booklet & Folder Binder step
      result =
        orderStatus === 'Booklet & Folder Binder' ||
        (orderStatus === 'Binder' && orderStatus !== 'Hold') ||
        orderStatus === 'Delivery';
      break;

    case 5: // Delivery step
      result =
        orderStatus === 'Delivery' ||
        (orderStatus === 'Booklet & Folder Binder' && orderStatus !== 'Hold');
      break;

    default:
      result = index < activeStep;
  }

  // Always allow current and completed steps
  if (index === activeStep || index < activeStep) {
    result = true;
  }

  // console.log("Step:", steps[index].label, "| orderStatus:", orderStatus, "| designerStatus:", designerStatus, "| printerStatus:", printerStatus, "| clickable:", result);

  return result;
};


  const handleStepClick = (index: number) => {
  if (isStepClickable(index)) {
    const path = steps[index].path;
    router.push({
      pathname: `/admin/all-orders/view/${path}`,
      query: { 
        id,
        orderStatus,
        designerStatus,
        printerStatus
      }
    });
  }
};


  return (
    <Stepper
      alternativeLabel
      activeStep={activeStep}
      connector={<CustomConnector />}
      sx={{ backgroundColor: 'transparent', py: 4 }}
    >
      {steps.map((step, index) => (
        <Step key={step.label} completed={index < activeStep}>
          <StepLabel 
            StepIconComponent={StepIcon}
            onClick={() => handleStepClick(index)}
            sx={{
              cursor: isStepClickable(index) ? 'pointer' : 'default',
              '&:hover': {
                opacity: isStepClickable(index) ? 0.8 : 1,
              },
            }}
          >
            <Box sx={{ 
              fontSize: 13, 
              color: index <= activeStep ? '#101828' : '#475467', 
              fontWeight: index <= activeStep ? 600 : 500 
            }}>
              {step.label}
            </Box>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default StepperProgress;
 