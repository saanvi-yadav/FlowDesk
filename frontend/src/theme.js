import { createTheme } from "@mui/material/styles";

const brand = "#2563eb";
const accent = "#38bdf8";
const backgroundDefault = "#eef4ff";
const backgroundPaper = "#ffffff";
const softPaper = "#f8fbff";
const borderColor = "rgba(37, 99, 235, 0.08)";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand,
      light: accent,
    },
    background: {
      default: backgroundDefault,
      paper: backgroundPaper,
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
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
      topbar: "rgba(238,244,255,0.88)",
      sidebarStart: "#0f172a",
      sidebarEnd: "#1e3a8a",
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
          color: "#0f172a",
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
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)",
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
          color: "#64748b",
          backgroundColor: "#f8faff",
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
    boxShadow: "0 2px 16px rgba(37,99,235,0.07)",
    border: `1.5px solid ${theme.palette.divider}`,
    ...extra,
  };
}
