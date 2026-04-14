import { createContext } from "react";
import { alpha, createTheme } from "@mui/material/styles";

export const THEME_MODE_KEY = "flowdesk-theme-mode";

export const ColorModeContext = createContext({
  mode: "light",
  setMode: () => {},
  toggleMode: () => {},
});

export function getStoredThemeMode() {
  const storedMode = localStorage.getItem(THEME_MODE_KEY);
  return storedMode === "dark" ? "dark" : "light";
}

export function setStoredThemeMode(mode) {
  localStorage.setItem(THEME_MODE_KEY, mode === "dark" ? "dark" : "light");
}

export function buildAppTheme(mode) {
  const isDark = mode === "dark";
  const brand = "#2563eb";
  const accent = "#38bdf8";
  const backgroundDefault = isDark ? "#081120" : "#eef4ff";
  const backgroundPaper = isDark ? "#0f1b2d" : "#ffffff";
  const softPaper = isDark ? "#13243b" : "#f8fbff";
  const borderColor = isDark
    ? "rgba(148, 163, 184, 0.16)"
    : "rgba(37, 99, 235, 0.08)";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brand,
        light: accent,
      },
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      text: {
        primary: isDark ? "#e5eefc" : "#0f172a",
        secondary: isDark ? "#9fb0c8" : "#64748b",
      },
      divider: borderColor,
      success: { main: "#16a34a" },
      warning: { main: "#d97706" },
      error: { main: "#dc2626" },
      info: { main: "#0ea5e9" },
      custom: {
        brand,
        accent,
        softPaper,
        borderColor,
        topbar: isDark ? "rgba(8,17,32,0.88)" : "rgba(238,244,255,0.88)",
        sidebarStart: isDark ? "#020817" : "#0f172a",
        sidebarEnd: isDark ? "#0f2744" : "#1e3a8a",
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      h6: {
        fontWeight: 800,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: backgroundDefault,
            color: isDark ? "#e5eefc" : "#0f172a",
            transition: "background-color 180ms ease, color 180ms ease",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: `1px solid ${borderColor}`,
            backgroundColor: backgroundPaper,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${borderColor}`,
            backgroundColor: backgroundPaper,
            boxShadow: isDark
              ? "0 12px 30px rgba(2, 8, 23, 0.45)"
              : "0 8px 24px rgba(37, 99, 235, 0.08)",
            transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: "transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
            "&:hover": {
              transform: "translateY(-1px)",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: borderColor,
            transition: "background-color 140ms ease, color 140ms ease",
          },
          head: {
            color: isDark ? "#8ea4c5" : "#64748b",
            backgroundColor: isDark ? alpha("#13243b", 0.7) : "#f8faff",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: softPaper,
            transition: "box-shadow 140ms ease, border-color 140ms ease, background-color 140ms ease",
            "& fieldset": {
              borderColor,
            },
          },
          input: {
            paddingTop: 12,
            paddingBottom: 12,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
          },
        },
      },
    },
  });
}

export function getPageShellSx(theme) {
  return {
    display: "flex",
    minHeight: "100vh",
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
  };
}

export function getMainContentSx() {
  return {
    marginLeft: "240px",
    width: "100%",
  };
}

export function getTopbarSx(theme) {
  return {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: theme.palette.custom.topbar,
    backdropFilter: "blur(14px)",
    borderBottom: `1px solid ${theme.palette.divider}`,
    px: 4,
    py: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
}

export function getSurfaceSx(theme, extra = {}) {
  return {
    background: theme.palette.background.paper,
    borderRadius: "20px",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 12px 28px rgba(2, 8, 23, 0.34)"
        : "0 2px 16px rgba(37,99,235,0.07)",
    border: `1.5px solid ${theme.palette.divider}`,
    ...extra,
  };
}
