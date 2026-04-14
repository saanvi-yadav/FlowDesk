/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Box, Typography, Avatar, Button, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";

const typeStyles = {
  task: {
    icon: <AssignmentTurnedInRoundedIcon sx={{ fontSize: 17 }} />,
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
  },
  employee: {
    icon: <PersonAddRoundedIcon sx={{ fontSize: 17 }} />,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
  },
  warning: {
    icon: <WarningAmberRoundedIcon sx={{ fontSize: 17 }} />,
    iconColor: "#d97706",
    iconBg: "#fffbeb",
  },
  info: {
    icon: <InfoRoundedIcon sx={{ fontSize: 17 }} />,
    iconColor: "#0891b2",
    iconBg: "#ecfeff",
  },
  system: {
    icon: <InfoRoundedIcon sx={{ fontSize: 17 }} />,
    iconColor: "#475569",
    iconBg: "#f1f5f9",
  },
};

export default function Notifications() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: getAuthHeaders(),
      });
      setNotifications(response.data.notifications || []);
      setError("");
    } catch (err) {
      setNotifications([]);
      setError(err.response?.data?.error || "Failed to load notifications.");
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const displayed =
    activeTab === "all"
      ? notifications
      : notifications.filter((item) => !item.is_read);

  const markAllRead = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/read-all`,
        {},
        { headers: getAuthHeaders() },
      );
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update notifications.");
    }
  };

  const markRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/${id}/read`,
        {},
        { headers: getAuthHeaders() },
      );
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to mark notification as read.");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
        headers: getAuthHeaders(),
      });
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete notification.");
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f0f4ff", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar unreadCount={unreadCount} />

      <Box sx={{ marginLeft: "240px", width: "100%" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(240,244,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(37,99,235,0.08)", px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Notifications</Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "12px", background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <NotificationsNoneRoundedIcon sx={{ color: "#475569", fontSize: 20 }} />
              {unreadCount > 0 && <Box sx={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #f0f4ff" }} />}
            </Box>
            <Avatar onClick={() => navigate("/profile")} sx={{ width: 40, height: 40, background: "linear-gradient(135deg,#2563eb,#38bdf8)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          {error && (
            <Box sx={{ mb: 3, background: "#fff1f2", border: "1px solid #fecaca", borderRadius: "16px", px: 2, py: 1.5 }}>
              <Typography sx={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{error}</Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              {["all", "unread"].map((tab) => (
                <Box
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    px: 2.5,
                    py: 1,
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    background: activeTab === tab ? "#2563eb" : "#fff",
                    color: activeTab === tab ? "#fff" : "#64748b",
                    border: "1.5px solid",
                    borderColor: activeTab === tab ? "#2563eb" : "#e2e8f0",
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Box>
              ))}
            </Box>
            <Button
              onClick={markAllRead}
              startIcon={<DoneAllRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 700, color: "#2563eb" }}
            >
              Mark all read
            </Button>
          </Box>

          <Box sx={{ background: "#fff", borderRadius: "20px", boxShadow: "0 2px 16px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)", overflow: "hidden" }}>
            {displayed.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8, color: "#94a3b8" }}>
                <NotificationsNoneRoundedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                <Typography sx={{ fontSize: 14 }}>No notifications available</Typography>
              </Box>
            ) : (
              displayed.map((notification, index) => {
                const style = typeStyles[notification.notification_type] || typeStyles.info;
                return (
                  <Box
                    key={notification.id}
                    onClick={() => markRead(notification.id, notification.is_read)}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      px: 3,
                      py: 2.2,
                      borderBottom: index < displayed.length - 1 ? "1px solid #f1f5f9" : "none",
                      background: !notification.is_read ? "rgba(37,99,235,0.03)" : "#fff",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    {!notification.is_read && <Box sx={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 7, height: 7, borderRadius: "50%", background: "#2563eb" }} />}
                    <Box sx={{ width: 38, height: 38, borderRadius: "11px", background: style.iconBg, color: style.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ml: 1 }}>
                      {style.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: notification.is_read ? 600 : 700, color: "#0f172a" }}>
                          {notification.title}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "#94a3b8" }}>
                          {notification.created_at ? new Date(notification.created_at).toLocaleString() : ""}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.3 }}>{notification.body}</Typography>
                    </Box>
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        void deleteNotification(notification.id);
                      }}
                      size="small"
                      sx={{ color: "#cbd5e1", "&:hover": { color: "#ef4444" } }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
