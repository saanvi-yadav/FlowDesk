export const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    fontSize: 14,
    background: "rgba(248,250,252,0.96)",
    transition: "box-shadow 160ms ease, border-color 160ms ease",
    "& fieldset": { borderColor: "#dbe4f2" },
    "&:hover fieldset": { borderColor: "#93c5fd" },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(56,189,248,0.12)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563eb",
      borderWidth: "2px",
    },
  },
  "& .MuiOutlinedInput-input": {
    py: 1.45,
  },
};

export const authBackgroundSx = {
  position: "fixed",
  inset: 0,
  zIndex: 0,
  background: "linear-gradient(180deg,#f8fbff 0%,#eaf2ff 52%,#f4f8ff 100%)",
  overflow: "hidden",
};

export const authCardSx = {
  width: "100%",
  maxWidth: 440,
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(18px)",
  borderRadius: "24px",
  boxShadow: "0 18px 40px rgba(15,23,42,0.10)",
  border: "1px solid rgba(219,228,242,0.9)",
  p: { xs: 3, sm: 3.5, md: 4 },
};
