export const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    fontSize: 15,
    background: "rgba(248,250,252,0.92)",
    transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
    "& fieldset": { borderColor: "#dbe4f2" },
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 10px 24px rgba(37,99,235,0.08)",
    },
    "&:hover fieldset": { borderColor: "#93c5fd" },
    "&.Mui-focused": {
      boxShadow: "0 0 0 4px rgba(56,189,248,0.12)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563eb",
      borderWidth: "2px",
    },
  },
  "& .MuiOutlinedInput-input": {
    py: 1.7,
  },
};

export const authBackgroundSx = {
  position: "fixed",
  inset: 0,
  zIndex: 0,
  background: "linear-gradient(135deg,#eff6ff 0%,#dbeafe 46%,#ede9fe 100%)",
  overflow: "hidden",
};

export const authCardSx = {
  width: "100%",
  maxWidth: 520,
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(24px)",
  borderRadius: "32px",
  boxShadow:
    "0 28px 80px rgba(15,23,42,0.12), 0 1px 0 rgba(255,255,255,0.85) inset",
  border: "1.5px solid rgba(255,255,255,0.95)",
  p: { xs: 4, md: 5.5 },
};
