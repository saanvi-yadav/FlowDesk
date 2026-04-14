import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AuthShell from "../components/auth/AuthShell";
import { loginRequest } from "../services/authService";
import { authFieldSx } from "../styles/authStyles";
import { setStoredAuth } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, name: "" });

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await loginRequest({ email, password });
      setStoredAuth(response.data.user, response.data.token);
      setToast({ open: true, name: response.data.user.name });
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="TEAM OPERATIONS PLATFORM"
      title="Welcome back. Keep projects, people, and progress moving."
      subtitle="Sign in to your workspace to review department activity, task flow, payroll visibility, and daily operations with cleaner role-based control."
      features={[
        "Employee, attendance, leave, and payroll visibility in one workspace",
        "Clear manager-led project and task ownership across departments",
        "Fast navigation with polished dashboards, boards, and reporting",
      ]}
      cardTitle="Sign in to FlowDesk"
      cardSubtitle="Use your email or username to enter your workspace."
    >
      <form onSubmit={handleLogin}>
        <Box sx={{ mb: 2.25 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#334155", mb: 0.9 }}>
            Email or Username
          </Typography>
          <TextField
            placeholder="example@gmail.com or kavana"
            fullWidth
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailRoundedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={authFieldSx}
          />
        </Box>

        <Box sx={{ mb: 1.2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.9 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
              Password
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#2563eb", fontWeight: 600 }}>
              Forgot password?
            </Typography>
          </Box>
          <TextField
            placeholder="Minimum 6 characters"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockRoundedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((current) => !current)}
                    edge="end"
                    size="small"
                    sx={{ color: "#94a3b8" }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={authFieldSx}
          />
        </Box>

        {message && (
          <Box
            sx={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              px: 2,
              py: 1.2,
              mb: 2.25,
            }}
          >
            <Typography sx={{ color: "#dc2626", fontSize: 13.5 }}>{message}</Typography>
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            mt: 2,
            py: 1.7,
            borderRadius: "16px",
            fontWeight: 800,
            fontSize: 17,
            textTransform: "none",
            background: "linear-gradient(90deg,#2563eb,#38bdf8)",
            boxShadow: "0 14px 28px rgba(37,99,235,0.28)",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <Divider sx={{ my: 3.5, color: "#94a3b8", fontSize: 12.5 }}>
          or
        </Divider>

        <Typography textAlign="center" sx={{ fontSize: 15, color: "#64748b" }}>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
          >
            Create one
          </Link>
        </Typography>
      </form>

      <Snackbar
        open={toast.open}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={1500}
      >
        <Alert severity="success" sx={{ borderRadius: "14px", fontWeight: 600, fontSize: 14 }}>
          Welcome back, {toast.name}!
        </Alert>
      </Snackbar>
    </AuthShell>
  );
}

export default Login;
