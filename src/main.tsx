import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import i18n from "i18next";
import ReactDOM from "react-dom/client";
import { initReactI18next } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.tsx";
import { StyledSnackbarProvider } from "./components/StyledSnackbarProvider.tsx";
import "./index.css";
import ThemeConfig from "./theme/index.ts";
import { resources } from "./lang/resources.ts";

const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl("devnet") },
});

const queryClient = new QueryClient();

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    // the translations
    // (tip move them in a JSON file and import them,
    // or even better, manage them via a UI: https://react.i18next.com/guides/multiple-translation-files#manage-your-translations-with-a-management-gui)
    resources: resources,
    lng: "en", // if you're using a language detector, do not define the lng option
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider theme={createTheme(ThemeConfig)}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} network="devnet">
          <StyledSnackbarProvider maxSnack={4} autoHideDuration={3000} />
          <Routes>
            <Route path="/" element={<App />}></Route>
          </Routes>
          <Analytics />
        </SuiClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </BrowserRouter>
);
