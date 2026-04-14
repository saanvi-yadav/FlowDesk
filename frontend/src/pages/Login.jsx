import { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CursorSparkle from "../components/CursorSparkle";
import { setStoredAuth, API_BASE_URL } from "../utils/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, name: "" });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });
      setStoredAuth(res.data.user, res.data.token);
      setToast({ open: true, name: res.data.user.name });
      setTimeout(() => navigate("/dashboard"), 1500);
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
    <>
      <CursorSparkle />

      {/* Animated background blobs */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background:
            "linear-gradient(135deg,#eaf3ff 0%,#dbeafe 50%,#ede9fe 100%)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 70%)",
            top: "-120px",
            left: "-100px",
            animation: "float1 10s ease-in-out infinite alternate",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(56,189,248,0.15) 0%,transparent 70%)",
            bottom: "-80px",
            right: "10%",
            animation: "float2 13s ease-in-out infinite alternate",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)",
            top: "40%",
            right: "-60px",
            animation: "float1 9s ease-in-out infinite alternate",
          }}
        />
        <style>{`
          @keyframes float1 { from { transform: translateY(0px) translateX(0px); } to { transform: translateY(40px) translateX(30px); } }
          @keyframes float2 { from { transform: translateY(0px) translateX(0px); } to { transform: translateY(-40px) translateX(-20px); } }
        `}</style>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── LEFT PANEL ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 4, md: 10 },
            py: 8,
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 8 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "13px",
                background: "linear-gradient(135deg,#2563eb,#38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
              }}
            >
              <TrendingUpRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 22,
                color: "#1e3a8a",
                letterSpacing: "-0.5px",
              }}
            >
              FlowDesk
            </Typography>
          </Box>

          {/* Headline */}
          <Typography
            sx={{
              fontSize: { xs: 32, md: 44 },
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              mb: 2,
            }}
          >
            Manage your team
            <br />
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              effortlessly.
            </Box>
          </Typography>

          <Typography
            sx={{
              color: "#64748b",
              fontSize: 15.5,
              lineHeight: 1.7,
              maxWidth: 380,
              mb: 5,
            }}
          >
            FlowDesk brings your employees, tasks and projects into one
            beautiful workspace.
          </Typography>

          {/* Feature pills */}
          {[
            "✦  Employee management & roles",
            "✦  Kanban task boards",
            "✦  Real-time project tracking",
          ].map((f) => (
            <Box
              key={f}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
            >
              <Typography
                sx={{ fontSize: 14, color: "#475569", fontWeight: 500 }}
              >
                {f}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ── RIGHT PANEL ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: 4,
            py: 8,
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 420,
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              borderRadius: "28px",
              boxShadow:
                "0 24px 60px rgba(37,99,235,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
              border: "1.5px solid rgba(255,255,255,0.9)",
              p: 5,
            }}
          >
            {/* Card header */}
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                  mb: 0.5,
                }}
              >
                Welcome back 👋
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#94a3b8" }}>
                Sign in to your FlowDesk account
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              {/* Email field */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    mb: 0.8,
                  }}
                >
                  Email or Username
                </Typography>
                <TextField
                  placeholder="example@gmail.com or kavana"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon
                          sx={{ color: "#94a3b8", fontSize: 18 }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      fontSize: 14,
                      background: "rgba(248,250,252,0.8)",
                      "& fieldset": { borderColor: "#e2e8f0" },
                      "&:hover fieldset": { borderColor: "#93c5fd" },
                      "&.Mui-focused fieldset": {
                        borderColor: "#2563eb",
                        borderWidth: "2px",
                      },
                    },
                    "& .MuiOutlinedInput-input": { py: 1.5 },
                  }}
                />
              </Box>

              {/* Password field */}
              <Box sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.8,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
                  >
                    Password
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      color: "#2563eb",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Forgot password?
                  </Typography>
                </Box>
                <TextField
                  placeholder="Minimum 6 characters"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon
                          sx={{ color: "#94a3b8", fontSize: 18 }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: "#94a3b8" }}
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      fontSize: 14,
                      background: "rgba(248,250,252,0.8)",
                      "& fieldset": { borderColor: "#e2e8f0" },
                      "&:hover fieldset": { borderColor: "#93c5fd" },
                      "&.Mui-focused fieldset": {
                        borderColor: "#2563eb",
                        borderWidth: "2px",
                      },
                    },
                    "& .MuiOutlinedInput-input": { py: 1.5 },
                  }}
                />
              </Box>

              {/* Error message */}
              {message && (
                <Box
                  sx={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    px: 2,
                    py: 1.2,
                    mb: 2,
                  }}
                >
                  <Typography sx={{ color: "#dc2626", fontSize: 13 }}>
                    {message}
                  </Typography>
                </Box>
              )}

              {/* Submit */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: 15,
                  textTransform: "none",
                  background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                  boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
                  letterSpacing: "0.2px",
                  "&:hover": {
                    background: "linear-gradient(90deg,#1d4ed8,#0ea5e9)",
                    boxShadow: "0 8px 24px rgba(37,99,235,0.45)",
                  },
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <Divider sx={{ my: 3, color: "#94a3b8", fontSize: 12 }}>
                or
              </Divider>

              <Typography
                textAlign="center"
                sx={{ fontSize: 14, color: "#64748b" }}
              >
                Don't have an account?{" "}
                <Link
                  to="/register"
                  style={{
                    color: "#2563eb",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Create one
                </Link>
              </Typography>
            </form>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={toast.open}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={1500}
      >
        <Alert
          severity="success"
          sx={{
            borderRadius: "14px",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 8px 24px rgba(37,99,235,0.2)",
          }}
        >
          Welcome back, {toast.name}! 👋
        </Alert>
      </Snackbar>
    </>
  );
}

export default Login;
