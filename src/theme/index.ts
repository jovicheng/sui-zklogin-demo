import { ThemeOptions } from '@mui/material';
import { gray } from './colors/index';

const fontFamily = `"Montserrat", sans-serif`;
const ThemeConfig = {
  palette: {
    mode: 'light',
    primary: {
      main: gray[900],
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    allVariants: {
      fontFamily: fontFamily,
      color: 'rgb(2, 6, 23)',
    },
    button: {
      textTransform: 'none',
      whiteSpace: 'nowrap',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        sizeMedium: {
          height: '2.5rem',
        },
        root: {
          fontSize: '0.875rem',
          letterSpacing: '0rem',
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        fontSizeSmall: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontFamily },
      },
    },
  },
} as ThemeOptions;

export default ThemeConfig;
