import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AuthShell from "../components/auth/AuthShell";
import { registerRequest } from "../services/authService";
import { authFieldSx } from "../styles/authStyles";

function getStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 3) return { score, label: "Fair", color: "#f59e0b" };
  return { score, label: "Strong", color: "#22c55e" };
}

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage({ text: "", type: "" });

    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await registerRequest({ name, email, password });
      setMessage({ text: "Account created. Redirecting to sign in...", type: "success" });
      setTimeout(() => navigate("/"), 1500);
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

  return (
    <AuthShell
      eyebrow="ACCOUNT SETUP"
      title="Create your account and step into a cleaner company workspace."
      subtitle="Register once and start collaborating in the same system your department uses for projects, tasks, attendance, leave, and payroll visibility."
      features={[
        "Secure authentication with stronger backend password handling",
        "Role-aware dashboards for admin, manager, and employee workflows",
        "Faster onboarding into department-led project and task ownership",
      ]}
      cardTitle="Create your account"
      cardSubtitle="Enter your details to join the workspace."
    >
      <form onSubmit={handleRegister}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#334155", mb: 0.75 }}>
            Full Name
          </Typography>
          <TextField
            placeholder="e.g. Kavana Sharma"
            fullWidth
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonRoundedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={authFieldSx}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#334155", mb: 0.75 }}>
            Email Address
          </Typography>
          <TextField
            placeholder="example@gmail.com"
            type="email"
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

        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#334155", mb: 0.75 }}>
            Password
          </Typography>
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
                  <IconButton onClick={() => setShowPassword((current) => !current)} size="small" sx={{ color: "#94a3b8" }}>
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={authFieldSx}
          />
          {password && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      background: item <= strength.score ? strength.color : "#dbe4f2",
                    }}
                  />
                ))}
              </Box>
              <Typography sx={{ fontSize: 12, color: strength.color, fontWeight: 700 }}>
                {strength.label} password
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#334155", mb: 0.75 }}>
            Confirm Password
          </Typography>
          <TextField
            placeholder="Re-enter your password"
            type={showConfirm ? "text" : "password"}
            fullWidth
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {confirmPassword && confirmPassword === password ? (
                    <CheckCircleRoundedIcon sx={{ color: "#22c55e", fontSize: 18 }} />
                  ) : (
                    <LockRoundedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                  )}
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((current) => !current)} size="small" sx={{ color: "#94a3b8" }}>
                    {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              ...authFieldSx,
              "& .MuiOutlinedInput-root": {
                ...authFieldSx["& .MuiOutlinedInput-root"],
                "& fieldset": {
                  borderColor: confirmPassword
                    ? confirmPassword === password
                      ? "#22c55e"
                      : "#ef4444"
                    : "#dbe4f2",
                },
              },
            }}
          />
          {confirmPassword && confirmPassword !== password && (
            <Typography sx={{ fontSize: 12, color: "#ef4444", mt: 0.6, fontWeight: 600 }}>
              Passwords do not match
            </Typography>
          )}
        </Box>

        {message.text && (
          <Box
            sx={{
              background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: "12px",
              px: 1.75,
              py: 1,
              mb: 2,
            }}
          >
            <Typography sx={{ color: message.type === "success" ? "#15803d" : "#dc2626", fontSize: 13 }}>
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
            mt: 1.25,
            py: 1.4,
            borderRadius: "14px",
            fontWeight: 800,
            fontSize: 15,
            textTransform: "none",
            background: "linear-gradient(90deg,#2563eb,#38bdf8)",
            boxShadow: "0 12px 24px rgba(37,99,235,0.22)",
          }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <Divider sx={{ my: 3, color: "#94a3b8", fontSize: 12.5 }}>
          or
        </Divider>

        <Typography textAlign="center" sx={{ fontSize: 14, color: "#64748b" }}>
          Already have an account?{" "}
          <Link
            to="/"
            style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
          >
            Sign in
          </Link>
        </Typography>
      </form>
    </AuthShell>
  );
}

export default Register;
