import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Avatar, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";

function MetricCard({ icon, title, value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ width: 46, height: 46, borderRadius: "14px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, opacity: 0.8, letterSpacing: "0.3px" }}>
          {title.toUpperCase()}
        </Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [stats, setStats] = useState({ employees: 0, tasks: 0, projects: 0, completed: 0, attendance_records: 0, leave_requests: 0, payroll_records: 0 });
  const [insights, setInsights] = useState({
    headline: "",
    support: "",
    active_projects: [],
    due_soon: [],
    department_breakdown: [],
    workload_breakdown: [],
    task_count: 0,
  });

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      try {
        const [statsResponse, insightsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/dashboard-stats`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/dashboard-insights`, { headers: getAuthHeaders() }),
        ]);

        if (!ignore) {
          setStats(statsResponse.data);
          setInsights(insightsResponse.data);
        }
      } catch {
        if (!ignore) {
          setStats({ employees: 0, tasks: 0, projects: 0, completed: 0, attendance_records: 0, leave_requests: 0, payroll_records: 0 });
          setInsights({
            headline: "",
            support: "",
            active_projects: [],
            due_soon: [],
            department_breakdown: [],
            workload_breakdown: [],
            task_count: 0,
          });
        }
      }
    };

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const completionRate = stats.tasks > 0 ? Math.round((stats.completed / stats.tasks) * 100) : 0;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f0f4ff", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />

      <Box sx={{ marginLeft: "240px", width: "100%" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(240,244,255,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(37,99,235,0.08)", px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
              Dashboard
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              Welcome back, {user?.name || "there"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip label={user?.role || "employee"} sx={{ background: "#eff6ff", color: "#2563eb", fontWeight: 700, textTransform: "capitalize" }} />
            <Box onClick={() => navigate("/notifications")} sx={{ width: 40, height: 40, borderRadius: "12px", background: "#fff", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", "&:hover": { borderColor: "#2563eb" } }}>
              <NotificationsNoneRoundedIcon sx={{ color: "#475569", fontSize: 20 }} />
              <Box sx={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #f0f4ff" }} />
            </Box>
            <Avatar onClick={() => navigate("/profile")} sx={{ width: 40, height: 40, background: "linear-gradient(135deg,#2563eb,#38bdf8)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 3, mb: 3 }}>
            <Box sx={{ background: "linear-gradient(135deg,#0f172a 0%,#1d4ed8 55%,#38bdf8 100%)", borderRadius: "26px", p: 4, color: "#fff", boxShadow: "0 20px 40px rgba(37,99,235,0.22)" }}>
              <Chip label="Workspace Overview" sx={{ background: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 700, mb: 2 }} />
              <Typography sx={{ fontSize: 30, fontWeight: 900, lineHeight: 1.15, maxWidth: 560, mb: 1.5 }}>
                {insights.headline || "Keep projects, teams, and work delivery aligned from one place."}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.84)", maxWidth: 540, mb: 3 }}>
                {insights.support || "Your live workspace metrics are ready below."}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 2 }}>
                <MetricCard icon={<PeopleOutlineRoundedIcon sx={{ color: "#fff" }} />} title="Employees" value={stats.employees} />
                <MetricCard icon={<AssignmentTurnedInRoundedIcon sx={{ color: "#fff" }} />} title="Tasks" value={stats.tasks} />
                <MetricCard icon={<FolderOpenRoundedIcon sx={{ color: "#fff" }} />} title="Projects" value={stats.projects} />
                <MetricCard icon={<DoneAllRoundedIcon sx={{ color: "#fff" }} />} title="Completed" value={stats.completed} />
              </Box>
            </Box>

            <Box sx={{ background: "#fff", borderRadius: "24px", p: 3, border: "1.5px solid rgba(37,99,235,0.07)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#0f172a", mb: 0.5 }}>
                Completion Pulse
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "#64748b", mb: 2.5 }}>
                Based on your visible tasks in the current role scope.
              </Typography>
              <Box sx={{ width: 170, height: 170, borderRadius: "50%", margin: "0 auto 18px", background: `conic-gradient(#2563eb ${completionRate * 3.6}deg, #dbeafe 0deg)`, display: "grid", placeItems: "center" }}>
                <Box sx={{ width: 128, height: 128, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center" }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 34, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                      {completionRate}%
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.6 }}>
                      completed
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 13, color: "#475569", textAlign: "center" }}>
                {stats.completed} of {stats.tasks} tasks are marked done.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5, mb: 3 }}>
            <StatCard title="Employees" value={stats.employees} gradient="linear-gradient(135deg,#2563eb,#38bdf8)" />
            <StatCard title="Tasks" value={stats.tasks} gradient="linear-gradient(135deg,#059669,#34d399)" />
            <StatCard title="Projects" value={stats.projects} gradient="linear-gradient(135deg,#d97706,#f59e0b)" />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5, mb: 3 }}>
            <StatCard title="Attendance" value={stats.attendance_records} gradient="linear-gradient(135deg,#0ea5e9,#38bdf8)" />
            <StatCard title="Leaves" value={stats.leave_requests} gradient="linear-gradient(135deg,#7c3aed,#a78bfa)" />
            <StatCard title="Payroll" value={stats.payroll_records} gradient="linear-gradient(135deg,#059669,#10b981)" />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 3 }}>
            <Box sx={{ background: "#fff", borderRadius: "24px", p: 3, border: "1.5px solid rgba(37,99,235,0.07)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#0f172a", mb: 2 }}>
                Active Project Focus
              </Typography>
              <Box sx={{ display: "grid", gap: 2 }}>
                {insights.active_projects.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No active project data available yet.</Typography>
                ) : (
                  insights.active_projects.map((project) => (
                    <Box key={project.name} sx={{ background: "#f8fbff", borderRadius: "18px", p: 2.5, border: "1px solid #e2e8f0" }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", mb: 0.4 }}>{project.name}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: "#64748b" }}>{project.value} tasks currently linked</Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            <Box sx={{ background: "#fff", borderRadius: "24px", p: 3, border: "1.5px solid rgba(37,99,235,0.07)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#0f172a", mb: 2 }}>
                Due Soon
              </Typography>
              <Box sx={{ display: "grid", gap: 2 }}>
                {insights.due_soon.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No upcoming tasks in this view.</Typography>
                ) : (
                  insights.due_soon.map((task) => (
                    <Box key={task.id} sx={{ background: "#f8fbff", borderRadius: "18px", p: 2.5, border: "1px solid #e2e8f0" }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", mb: 0.4 }}>{task.title}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: "#64748b" }}>{task.project_name || "No project"} · {task.deadline || "No deadline"}</Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
