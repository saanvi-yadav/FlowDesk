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
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/auth";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CursorSparkle from "../components/CursorSparkle";

/* password strength helper */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 3) return { score, label: "Fair", color: "#f59e0b" };
  return { score, label: "Strong", color: "#22c55e" };
}

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const strength = getStrength(password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (password.length < 6) {
      setMessage({
        text: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/register`, {
        name,
        email,
        password,
      });
      setMessage({
        text: "Account created! Redirecting to login...",
        type: "success",
      });
      setTimeout(() => navigate("/"), 1800);
    } catch (error) {
      setMessage({
        text:
          error.response?.data?.error ||
          "Registration failed. Email may already be in use.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      fontSize: 14,
      background: "rgba(248,250,252,0.8)",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#93c5fd" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
    },
    "& .MuiOutlinedInput-input": { py: 1.5 },
  };

  return (
    <>
      <CursorSparkle />

      {/* Animated background */}
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
          @keyframes float1 { from{transform:translateY(0) translateX(0)} to{transform:translateY(40px) translateX(30px)} }
          @keyframes float2 { from{transform:translateY(0) translateX(0)} to{transform:translateY(-40px) translateX(-20px)} }
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
            Join your team
            <br />
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              on FlowDesk.
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
            Create your account and start collaborating with your team in
            minutes.
          </Typography>

          {[
            { icon: "🔒", text: "Secure password hashing" },
            { icon: "👤", text: "Role-based access control" },
            { icon: "⚡", text: "Instant team onboarding" },
          ].map((f) => (
            <Box
              key={f.text}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
            >
              <Typography
                sx={{ fontSize: 14, color: "#475569", fontWeight: 500 }}
              >
                {f.icon} {f.text}
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
              maxWidth: 440,
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              borderRadius: "28px",
              boxShadow:
                "0 24px 60px rgba(37,99,235,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
              border: "1.5px solid rgba(255,255,255,0.9)",
              p: 5,
            }}
          >
            <Box sx={{ mb: 3.5 }}>
              <Typography
                sx={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                  mb: 0.5,
                }}
              >
                Create account ✨
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#94a3b8" }}>
                Fill in your details to get started
              </Typography>
            </Box>

            <form onSubmit={handleRegister}>
              {/* Full Name */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    mb: 0.8,
                  }}
                >
                  Full Name
                </Typography>
                <TextField
                  placeholder="e.g. Kavana Sharma"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon
                          sx={{ color: "#94a3b8", fontSize: 18 }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />
              </Box>

              {/* Email */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    mb: 0.8,
                  }}
                >
                  Email Address
                </Typography>
                <TextField
                  placeholder="example@gmail.com"
                  type="email"
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
                  sx={fieldSx}
                />
              </Box>

              {/* Password */}
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    mb: 0.8,
                  }}
                >
                  Password
                </Typography>
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
                  sx={fieldSx}
                />
                {/* Strength bar */}
                {password && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background:
                              i <= strength.score ? strength.color : "#e2e8f0",
                            transition: "background 0.3s",
                          }}
                        />
                      ))}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        color: strength.color,
                        fontWeight: 600,
                      }}
                    >
                      {strength.label} password
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Confirm Password */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    mb: 0.8,
                  }}
                >
                  Confirm Password
                </Typography>
                <TextField
                  placeholder="Re-enter your password"
                  type={showConfirm ? "text" : "password"}
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {confirmPassword && confirmPassword === password ? (
                          <CheckCircleRoundedIcon
                            sx={{ color: "#22c55e", fontSize: 18 }}
                          />
                        ) : (
                          <LockRoundedIcon
                            sx={{ color: "#94a3b8", fontSize: 18 }}
                          />
                        )}
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm(!showConfirm)}
                          size="small"
                          sx={{ color: "#94a3b8" }}
                        >
                          {showConfirm ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    ...fieldSx,
                    "& .MuiOutlinedInput-root": {
                      ...fieldSx["& .MuiOutlinedInput-root"],
                      "& fieldset": {
                        borderColor: confirmPassword
                          ? confirmPassword === password
                            ? "#22c55e"
                            : "#ef4444"
                          : "#e2e8f0",
                      },
                    },
                  }}
                />
                {confirmPassword && confirmPassword !== password && (
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      color: "#ef4444",
                      mt: 0.5,
                      fontWeight: 500,
                    }}
                  >
                    Passwords do not match
                  </Typography>
                )}
              </Box>

              {/* Status message */}
              {message.text && (
                <Box
                  sx={{
                    background:
                      message.type === "success" ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                    borderRadius: "10px",
                    px: 2,
                    py: 1.2,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: message.type === "success" ? "#15803d" : "#dc2626",
                      fontSize: 13,
                    }}
                  >
                    {message.text}
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: 15,
                  textTransform: "none",
                  background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                  boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
                  "&:hover": {
                    background: "linear-gradient(90deg,#1d4ed8,#0ea5e9)",
                    boxShadow: "0 8px 24px rgba(37,99,235,0.45)",
                  },
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <Divider sx={{ my: 3, color: "#94a3b8", fontSize: 12 }}>
                or
              </Divider>

              <Typography
                textAlign="center"
                sx={{ fontSize: 14, color: "#64748b" }}
              >
                Already have an account?{" "}
                <Link
                  to="/"
                  style={{
                    color: "#2563eb",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </form>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default Register;
