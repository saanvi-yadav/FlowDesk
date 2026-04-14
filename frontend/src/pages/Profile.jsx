import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Avatar, Chip, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [profile, setProfile] = useState({
    user: storedUser,
    employee: null,
    stats: {
      tasks_done: 0,
      tasks_in_progress: 0,
      performance: 0,
      attendance_records: 0,
      leave_requests: 0,
      payroll_records: 0,
    },
    recent_activity: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/profile/overview`, {
          headers: getAuthHeaders(),
        });
        setProfile(response.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load profile overview.");
      }
    };

    void loadProfile();
  }, []);

  const user = profile.user || storedUser;

  const infoRows = [
    { icon: <EmailRoundedIcon sx={{ fontSize: 16, color: "#2563eb" }} />, label: "Email", value: user?.email || "-" },
    { icon: <BadgeRoundedIcon sx={{ fontSize: 16, color: "#7c3aed" }} />, label: "Name", value: user?.name || "-" },
    { icon: <WorkRoundedIcon sx={{ fontSize: 16, color: "#059669" }} />, label: "Role", value: user?.role || "employee" },
    { icon: <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: "#d97706" }} />, label: "Joined", value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "-" },
  ];

  const statCards = [
    { label: "Tasks Done", value: profile.stats.tasks_done, color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "In Progress", value: profile.stats.tasks_in_progress, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    { label: "Performance", value: `${profile.stats.performance}%`, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f0f4ff", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />

      <Box sx={{ marginLeft: "240px", width: "100%" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(240,244,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(37,99,235,0.08)", px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>My Profile</Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>Real account, work, and activity data from your current role scope</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box onClick={() => navigate("/notifications")} sx={{ width: 40, height: 40, borderRadius: "12px", background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", "&:hover": { borderColor: "#2563eb" } }}>
              <NotificationsNoneRoundedIcon sx={{ color: "#475569", fontSize: 20 }} />
            </Box>
            <Avatar sx={{ width: 40, height: 40, background: "linear-gradient(135deg,#2563eb,#38bdf8)", fontSize: 15, fontWeight: 700 }}>
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

          <Box sx={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 3, alignItems: "start" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)" }}>
                <Box sx={{ height: 90, background: "linear-gradient(135deg,#1e3a8a,#2563eb,#38bdf8)" }} />
                <Box sx={{ px: 3, pb: 3 }}>
                  <Avatar sx={{ width: 72, height: 72, background: "linear-gradient(135deg,#2563eb,#38bdf8)", fontSize: 28, fontWeight: 800, border: "4px solid #fff", mt: -4.5, mb: 1.5 }}>
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <Typography sx={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>{user?.name || "User"}</Typography>
                  <Typography sx={{ fontSize: 13, color: "#64748b", mb: 1.5 }}>{user?.email || "-"}</Typography>
                  <Chip label={user?.role || "employee"} size="small" sx={{ background: "linear-gradient(90deg,#eff6ff,#dbeafe)", color: "#2563eb", fontWeight: 700, fontSize: 12, textTransform: "capitalize" }} />
                </Box>
              </Box>

              <Box sx={{ background: "#fff", borderRadius: "20px", p: 3, boxShadow: "0 2px 16px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)" }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a", mb: 2 }}>Account Details</Typography>
                {infoRows.map((row, index) => (
                  <Box key={row.label}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "9px", background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center" }}>{row.icon}</Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{row.label.toUpperCase()}</Typography>
                        <Typography sx={{ fontSize: 13.5, color: "#1e293b", fontWeight: 600, textTransform: row.label === "Role" ? "capitalize" : "none" }}>
                          {row.value}
                        </Typography>
                      </Box>
                    </Box>
                    {index < infoRows.length - 1 && <Divider sx={{ borderColor: "#f1f5f9" }} />}
                  </Box>
                ))}
                {profile.employee && (
                  <>
                    <Divider sx={{ borderColor: "#f1f5f9", my: 1.5 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a", mb: 1.5 }}>Employee Profile</Typography>
                    <Typography sx={{ fontSize: 13, color: "#475569" }}>
                      Department: {profile.employee.department || "Not assigned"}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#475569", mt: 0.8 }}>
                      Employee record: #{profile.employee.id}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
                {statCards.map((card) => (
                  <Box key={card.label} sx={{ background: card.bg, border: `1.5px solid ${card.border}`, borderRadius: "16px", p: 2.5, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 28, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: "#64748b", fontWeight: 500, mt: 0.5 }}>{card.label}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
                {[
                  { label: "Attendance Records", value: profile.stats.attendance_records },
                  { label: "Leave Requests", value: profile.stats.leave_requests },
                  { label: "Payroll Records", value: profile.stats.payroll_records },
                ].map((item) => (
                  <Box key={item.label} sx={{ background: "#fff", borderRadius: "18px", p: 2.5, boxShadow: "0 2px 14px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)" }}>
                    <Typography sx={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, mb: 0.8 }}>{item.label.toUpperCase()}</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ background: "#fff", borderRadius: "20px", p: 3.5, boxShadow: "0 2px 16px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)" }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#0f172a", mb: 2 }}>Recent Activity</Typography>
                {profile.recent_activity.length > 0 ? (
                  profile.recent_activity.map((activity, index) => (
                    <Box key={activity.id} sx={{ py: 1.5, borderBottom: index < profile.recent_activity.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <Typography sx={{ fontSize: 13.5, color: "#0f172a", fontWeight: 700 }}>{activity.title}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.5 }}>{activity.body}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: "#94a3b8", mt: 0.6 }}>
                        {activity.created_at ? new Date(activity.created_at).toLocaleString() : ""}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No recent profile activity found yet.</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
