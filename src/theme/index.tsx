import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7F56D9', 
      light: '#EFEFFF',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F9FAFB',
      light: '#F2F4F7',    
    },
    success: {
      main: '#28a745', 
      light: '#ECFDF3',
      contrastText: '#ffffff',
    },
    error: {
      main: '#F04438',
      light: '#FEF3F2',
      contrastText: '#ffffff',
    },
    info: {
      main: '#5D5FEF', 
      light: '#E4EBFF',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F5F5',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 6, 
  },

  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 14,
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.5rem', fontWeight: 500 },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: (themeParam) => ({
          borderRadius: (themeParam.borderRadius as number) * 2,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        }),
      },
    },
  },
});

export default theme;
