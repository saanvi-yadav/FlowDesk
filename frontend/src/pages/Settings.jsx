import { useState } from "react";
import axios from "axios";
import {
  Box, Typography, Avatar, Button, TextField,
  Switch, IconButton, InputAdornment, Divider, Snackbar, Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser, setStoredUser } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import Visibility    from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonRoundedIcon   from "@mui/icons-material/PersonRounded";
import LockRoundedIcon     from "@mui/icons-material/LockRounded";
import PaletteRoundedIcon  from "@mui/icons-material/PaletteRounded";
import CheckRoundedIcon    from "@mui/icons-material/CheckRounded";
import EditRoundedIcon     from "@mui/icons-material/EditRounded";

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px", fontSize: 14, background: "#f8fafc",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#93c5fd" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
  },
  "& .MuiOutlinedInput-input": { py: 1.4 },
};

const DISABLED_SX = {
  ...FIELD_SX,
  "& .MuiOutlinedInput-root": { ...FIELD_SX["& .MuiOutlinedInput-root"], background: "#f1f5f9" },
};

const ACCENT_COLORS = ["#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706", "#0891b2"];

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <Box sx={{ background: "#fff", borderRadius: "20px", p: 3.5, boxShadow: "0 2px 16px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)", mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: "11px", background: "linear-gradient(135deg,#2563eb,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{title}</Typography>
          <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{subtitle}</Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 2.5, borderColor: "#f1f5f9" }} />
      {children}
    </Box>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Profile state
  const [name,  setName]  = useState(user?.name  || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading,  setPwdLoading]  = useState(false);

  // Appearance
  const [darkMode,     setDarkMode]     = useState(false);
  const [accentColor,  setAccentColor]  = useState("#2563eb");

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const showSnack = (message, severity = "success") => setSnack({ open: true, message, severity });

  /* ── Profile Save ── */
  const handleProfileSave = async () => {
    if (!name.trim()) { showSnack("Name cannot be empty.", "error"); return; }
    setProfileLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/${user.id}`,
        { name, email },
        { headers: getAuthHeaders() },
      );
      setStoredUser(response.data.user);
      showSnack("Profile updated successfully!");
    } catch (error) {
      showSnack(error.response?.data?.error || "Failed to update profile.", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  /* ── Password Change ── */
  const handlePasswordChange = async () => {
    if (!currentPwd) { showSnack("Enter your current password.", "error"); return; }
    if (newPwd.length < 6) { showSnack("New password must be at least 6 characters.", "error"); return; }
    if (newPwd !== confirmPwd) { showSnack("Passwords do not match.", "error"); return; }
    setPwdLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/users/${user.id}/password`,
        {
          current_password: currentPwd,
          new_password: newPwd,
        },
        { headers: getAuthHeaders() },
      );
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      showSnack("Password changed successfully!");
    } catch (error) {
      showSnack(error.response?.data?.error || "Current password is incorrect.", "error");
    } finally {
      setPwdLoading(false);
    }
  };

  const pwdFields = [
    { label: "Current Password", val: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
    { label: "New Password",     val: newPwd,      set: setNewPwd,     show: showNew,     toggle: () => setShowNew(!showNew) },
    { label: "Confirm New Password", val: confirmPwd, set: setConfirmPwd, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f0f4ff", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />

      <Box sx={{ marginLeft: "240px", width: "100%" }}>

        {/* Topbar */}
        <Box sx={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(240,244,255,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(37,99,235,0.08)", px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Settings</Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>Manage your account preferences</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box onClick={() => navigate("/notifications")} sx={{ width: 40, height: 40, borderRadius: "12px", background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", "&:hover": { borderColor: "#2563eb" } }}>
              <NotificationsNoneRoundedIcon sx={{ color: "#475569", fontSize: 20 }} />
              <Box sx={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #f0f4ff" }} />
            </Box>
            <Avatar onClick={() => navigate("/profile")} sx={{ width: 40, height: 40, background: "linear-gradient(135deg,#2563eb,#38bdf8)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: 4, maxWidth: 760 }}>

          {/* ── Profile Info ── */}
          <SectionCard icon={<PersonRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Profile Information" subtitle="Update your name and email address">
            {/* Avatar row */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Avatar sx={{ width: 68, height: 68, background: "linear-gradient(135deg,#2563eb,#38bdf8)", fontSize: 26, fontWeight: 800 }}>
                  {name?.[0]?.toUpperCase() || "U"}
                </Avatar>
                <Box sx={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #f0f4ff", cursor: "pointer" }}>
                  <EditRoundedIcon sx={{ fontSize: 11, color: "#fff" }} />
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{name || "Your Name"}</Typography>
                <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>{user?.role || "Employee"} · FlowDesk</Typography>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.8 }}>Full Name</Typography>
                <TextField fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" sx={FIELD_SX} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.8 }}>Email Address</Typography>
                <TextField fullWidth value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" sx={FIELD_SX} />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.8 }}>Role</Typography>
                <TextField fullWidth value={user?.role || ""} disabled sx={DISABLED_SX} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.8 }}>Account ID</Typography>
                <TextField fullWidth value={`#${user?.id || "—"}`} disabled sx={DISABLED_SX} />
              </Box>
            </Box>

            <Button
              onClick={handleProfileSave}
              disabled={profileLoading}
              variant="contained"
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 14, px: 3.5, py: 1.2, background: "linear-gradient(90deg,#2563eb,#38bdf8)", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </Button>
          </SectionCard>

          {/* ── Change Password ── */}
          <SectionCard icon={<LockRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Change Password" subtitle="Make sure your account stays secure">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2.5 }}>
              {pwdFields.map((f) => (
                <Box key={f.label}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.8 }}>{f.label}</Typography>
                  <TextField
                    fullWidth type={f.show ? "text" : "password"}
                    value={f.val} onChange={(e) => f.set(e.target.value)}
                    placeholder="••••••••"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={f.toggle} size="small" sx={{ color: "#94a3b8" }}>
                            {f.show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={FIELD_SX}
                  />
                </Box>
              ))}
            </Box>

            <Button
              onClick={handlePasswordChange}
              disabled={pwdLoading}
              variant="contained"
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: 14, px: 3.5, py: 1.2, background: "linear-gradient(90deg,#2563eb,#38bdf8)", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
            >
              {pwdLoading ? "Updating..." : "Update Password"}
            </Button>
          </SectionCard>

          {/* ── Appearance ── */}
          <SectionCard icon={<PaletteRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Appearance" subtitle="Customise how FlowDesk looks for you">
            {/* Dark mode */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, mb: 1 }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Dark Mode</Typography>
                <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Switch to a darker interface</Typography>
              </Box>
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#2563eb" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#2563eb" } }}
              />
            </Box>
            <Divider sx={{ borderColor: "#f1f5f9", mb: 2 }} />
            {/* Accent colour */}
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1e293b", mb: 0.5 }}>Accent Colour</Typography>
            <Typography sx={{ fontSize: 12, color: "#94a3b8", mb: 1.5 }}>Choose your preferred highlight colour</Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {ACCENT_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setAccentColor(c)}
                  sx={{ width: 32, height: 32, borderRadius: "10px", background: c, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: accentColor === c ? `3px solid ${c}` : "none", outlineOffset: "2px", transition: "all 0.2s", transform: accentColor === c ? "scale(1.15)" : "scale(1)" }}
                >
                  {accentColor === c && <CheckRoundedIcon sx={{ fontSize: 14, color: "#fff" }} />}
                </Box>
              ))}
            </Box>
          </SectionCard>
        </Box>
      </Box>

      {/* ── Snackbar toast ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ borderRadius: "12px", fontWeight: 600 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
