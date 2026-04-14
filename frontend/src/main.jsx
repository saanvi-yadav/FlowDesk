/* eslint-disable react-refresh/only-export-components */
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App.jsx";
import "./index.css";
import {
  buildAppTheme,
  ColorModeContext,
  getStoredThemeMode,
  setStoredThemeMode,
} from "./theme";

function Root() {
  const [mode, setMode] = useState(getStoredThemeMode);

  const colorMode = useMemo(
    () => ({
      mode,
      setMode: (nextMode) => {
        const normalizedMode = nextMode === "dark" ? "dark" : "light";
        setStoredThemeMode(normalizedMode);
        setMode(normalizedMode);
      },
      toggleMode: () => {
        const nextMode = mode === "dark" ? "light" : "dark";
        setStoredThemeMode(nextMode);
        setMode(nextMode);
      },
    }),
    [mode],
  );

  const theme = useMemo(() => buildAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
