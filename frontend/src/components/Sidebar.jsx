import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Box, Typography, Avatar } from "@mui/material";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import { API_BASE_URL, clearStoredUser, getAuthHeaders } from "../utils/auth";

const NAV_SECTIONS = [
  {
    heading: "MAIN MENU",
    links: [
      {
        label: "Dashboard",
        icon: <GridViewRoundedIcon fontSize="small" />,
        path: "/dashboard",
      },
      {
        label: "Employees",
        icon: <PeopleOutlineRoundedIcon fontSize="small" />,
        path: "/employees",
      },
      {
        label: "Departments",
        icon: <ApartmentRoundedIcon fontSize="small" />,
        path: "/departments",
      },
      {
        label: "Projects",
        icon: <FolderOpenRoundedIcon fontSize="small" />,
        path: "/projects",
      },
      {
        label: "Tasks",
        icon: <TaskAltRoundedIcon fontSize="small" />,
        path: "/tasks",
      },
      {
        label: "Reports",
        icon: <BarChartRoundedIcon fontSize="small" />,
        path: "/reports",
      },
    ],
  },
  {
    heading: "HR MANAGEMENT",
    links: [
      {
        label: "Attendance",
        icon: <AccessTimeRoundedIcon fontSize="small" />,
        path: "/attendance",
      },
      {
        label: "Leave Requests",
        icon: <EventNoteRoundedIcon fontSize="small" />,
        path: "/leave-requests",
      },
      {
        label: "Payroll",
        icon: <PaymentsRoundedIcon fontSize="small" />,
        path: "/payroll",
      },
    ],
  },
  {
    heading: "ACCOUNT",
    links: [
      {
        label: "Profile",
        icon: <PersonRoundedIcon fontSize="small" />,
        path: "/profile",
      },
      {
        label: "Notifications",
        icon: <NotificationsNoneRoundedIcon fontSize="small" />,
        path: "/notifications",
        badge: true,
      },
      {
        label: "Settings",
        icon: <SettingsRoundedIcon fontSize="small" />,
        path: "/settings",
      },
    ],
  },
];

export default function Sidebar({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`, {}, { headers: getAuthHeaders() });
    } catch {
      // Local logout should still clear stale or expired credentials.
    }
    clearStoredUser();
    navigate("/");
  };

  const linkSx = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    px: 2,
    py: 1.4,
    borderRadius: "12px",
    mb: 0.5,
    cursor: "pointer",
    background:
      active === path
        ? "linear-gradient(90deg,rgba(37,99,235,0.45),rgba(56,189,248,0.2))"
        : "transparent",
    borderLeft: active === path ? "3px solid #38bdf8" : "3px solid transparent",
    transition: "all 0.2s",
    "&:hover": {
      background: active === path ? undefined : "rgba(255,255,255,0.08)",
    },
  });

  return (
    <Box
      sx={{
        width: 240,
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0f172a 0%,#1e3a8a 100%)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: "4px 0 24px rgba(37,99,235,0.18)",
      }}
    >
      {/* ── Logo ── */}
      <Box sx={{ px: 3, pt: 4, pb: 2 }}>
        <Box
          onClick={() => navigate("/dashboard")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "linear-gradient(135deg,#2563eb,#38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
            }}
          >
            <TrendingUpRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.3px",
            }}
          >
            FlowDesk
          </Typography>
        </Box>
      </Box>

      {/* ── User card ── */}
      <Box
        onClick={() => navigate("/profile")}
        sx={{
          mx: 2,
          my: 1.5,
          p: 2,
          borderRadius: "14px",
          background: "rgba(255,255,255,0.08)",
          cursor: "pointer",
          "&:hover": { background: "rgba(255,255,255,0.13)" },
          transition: "background 0.2s",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              background: "linear-gradient(135deg,#2563eb,#38bdf8)",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "User"}
            </Typography>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 11,
                textTransform: "capitalize",
              }}
            >
              {user?.role || "Employee"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Nav sections ── */}
      <Box sx={{ px: 2, flex: 1, overflowY: "auto" }}>
        {NAV_SECTIONS.map((section) => (
          <Box key={section.heading} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                color: "#475569",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1px",
                mb: 1,
                ml: 1,
              }}
            >
              {section.heading}
            </Typography>
            {section.links
              .filter((link) => {
                if (user?.role === "employee" && ["/employees", "/departments", "/reports", "/payroll"].includes(link.path)) {
                  return false;
                }
                if (user?.role === "manager" && link.path === "/departments") {
                  return false;
                }
                if (link.path === "/payroll" && user?.role === "manager") {
                  return false;
                }
                return true;
              })
              .map((link) => (
              <Box
                key={link.path}
                onClick={() => navigate(link.path)}
                sx={linkSx(link.path)}
              >
                <Box
                  sx={{
                    color: active === link.path ? "#38bdf8" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {link.icon}
                </Box>
                <Typography
                  sx={{
                    color: active === link.path ? "#fff" : "#94a3b8",
                    fontSize: 13.5,
                    fontWeight: active === link.path ? 600 : 400,
                    flex: 1,
                  }}
                >
                  {link.label}
                </Typography>
                {/* Notification badge */}
                {link.badge && unreadCount > 0 && (
                  <Box
                    sx={{
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "8px",
                      px: 0.8,
                      py: 0.1,
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {unreadCount}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* ── Logout ── */}
      <Box sx={{ px: 2, pb: 4 }}>
        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.07)", pt: 2 }}>
          <Box
            onClick={handleLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.4,
              borderRadius: "12px",
              cursor: "pointer",
              "&:hover": { background: "rgba(239,68,68,0.12)" },
              transition: "all 0.2s",
            }}
          >
            <LogoutRoundedIcon sx={{ color: "#f87171", fontSize: 18 }} />
            <Typography sx={{ color: "#f87171", fontSize: 13.5 }}>
              Sign Out
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
