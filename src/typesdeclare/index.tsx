import { SxProps } from "@mui/material";

export interface buttonProps {
    children?: React.ReactNode;
    variant?: 'text' | 'outlined' | 'contained';
    size?: 'small' | 'medium' | 'large';    
    sx?: SxProps;
    disabled?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    loading?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}


export interface Chiprops {
    label?: string;
    color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    variant?: 'filled' | 'outlined' ;
    icon?: React.ReactElement | null; 
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onDelete?: (event: React.MouseEvent<HTMLDivElement>) => void;
    sx?: SxProps;
}