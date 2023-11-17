import { styled } from "@mui/material";
import { SnackbarProvider, SnackbarProviderProps } from "notistack";
import { primary, error, warning, success } from "../theme/colors";

export const StyledSnackbarProvider = styled(
  SnackbarProvider,
)<SnackbarProviderProps>(() => ({
  "&.SnackbarItem-variant": {
    borderRadius: "16px",
  },
  "&.SnackbarItem-variantInfo": {
    backgroundColor: primary[600],
  },
  "&.SnackbarItem-variantError": {
    backgroundColor: error[300],
  },
  "&.SnackbarItem-variantWarning": {
    backgroundColor: warning[300],
  },
  "&.SnackbarItem-variantSuccess": {
    backgroundColor: success[300],
  },
}));
