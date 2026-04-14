import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Avatar, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";

const STATUS_COLORS = ["#94a3b8", "#2563eb", "#059669", "#ef4444"];
const PRIORITY_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#6366f1"];
const PROJECT_COLORS = ["#2563eb", "#38bdf8", "#7c3aed", "#059669", "#d97706"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "12px", p: 1.5, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0f172a", mb: 0.5 }}>{label}</Typography>
        {payload.map((point) => (
          <Typography key={point.name} sx={{ fontSize: 12, color: point.color, fontWeight: 500 }}>
            {point.name}: {point.value}
          </Typography>
        ))}
      </Box>
    );
  }

  return null;
};

function ChartCard({ icon, title, subtitle, children }) {
  return (
    <Box sx={{ background: "#fff", borderRadius: "20px", p: 3, boxShadow: "0 2px 16px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: "11px", background: "linear-gradient(135deg,#2563eb,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: 11.5, color: "#94a3b8" }}>{subtitle}</Typography>}
        </Box>
      </Box>
      {children}
    </Box>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [report, setReport] = useState({
    summary: { tasks: 0, completed: 0, in_progress: 0, completion_rate: 0, employees: 0, departments: 0, projects: 0, attendance_records: 0, leave_requests: 0, payroll_records: 0 },
    status_breakdown: [],
    priority_breakdown: [],
    project_breakdown: [],
    department_breakdown: [],
    workload_breakdown: [],
    attendance_breakdown: [],
    leave_breakdown: [],
    payroll_breakdown: [],
    due_soon: [],
  });

  useEffect(() => {
    let ignore = false;

    const loadReports = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/reports/overview`, { headers: getAuthHeaders() });
        if (!ignore) {
          setReport(response.data);
        }
      } catch {
        if (!ignore) {
          setReport({
            summary: { tasks: 0, completed: 0, in_progress: 0, completion_rate: 0, employees: 0, departments: 0, projects: 0, attendance_records: 0, leave_requests: 0, payroll_records: 0 },
            status_breakdown: [],
            priority_breakdown: [],
            project_breakdown: [],
            department_breakdown: [],
            workload_breakdown: [],
            attendance_breakdown: [],
            leave_breakdown: [],
            payroll_breakdown: [],
            due_soon: [],
          });
        }
      }
    };

    void loadReports();

    return () => {
      ignore = true;
    };
  }, []);

  const summaryCards = [
    { label: "Total Tasks", value: report.summary.tasks, color: "#2563eb" },
    { label: "Completed", value: report.summary.completed, color: "#059669" },
    { label: "In Progress", value: report.summary.in_progress, color: "#7c3aed" },
    { label: "Completion Rate", value: `${report.summary.completion_rate}%`, color: "#d97706" },
    { label: "Attendance", value: report.summary.attendance_records, color: "#0891b2" },
    { label: "Leaves", value: report.summary.leave_requests, color: "#a855f7" },
    { label: "Payroll", value: report.summary.payroll_records, color: "#16a34a" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f0f4ff", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />

      <Box sx={{ marginLeft: "240px", width: "100%" }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(240,244,255,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(37,99,235,0.08)", px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Reports & Analytics</Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>Live project, department, and workload reporting for {user?.role || "your"} view</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip label={`${report.summary.projects} projects`} size="small" sx={{ background: "#eff6ff", color: "#2563eb", fontWeight: 600, fontSize: 12 }} />
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
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2.5, mb: 3 }}>
            {summaryCards.map((card) => (
              <Box key={card.label} sx={{ background: "#fff", borderRadius: "18px", p: 2.5, boxShadow: "0 2px 14px rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.07)" }}>
                <Typography sx={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.3px", mb: 0.8 }}>{card.label.toUpperCase()}</Typography>
                <Typography sx={{ fontSize: 30, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{card.value}</Typography>
                <Typography sx={{ fontSize: 12, color: card.color, fontWeight: 600, mt: 1 }}>
                  Live workspace signal
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 3, mb: 3 }}>
            <ChartCard icon={<BarChartRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Project Task Load" subtitle="How tasks are distributed across active projects">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={report.project_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Tasks" radius={[8, 8, 0, 0]}>
                    {report.project_breakdown.map((entry, index) => <Cell key={entry.name} fill={PROJECT_COLORS[index % PROJECT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={<PieChartRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Priority Split" subtitle="Current task urgency breakdown">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={report.priority_breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value">
                    {report.priority_breakdown.map((entry, index) => <Cell key={entry.name} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} tasks`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 3, mb: 3 }}>
            <ChartCard icon={<TimelineRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Workload by Assignee" subtitle="Who currently owns the most tasks">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={report.workload_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Tasks" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={<PieChartRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Status Mix" subtitle="Current task flow across the board">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={report.status_breakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value">
                    {report.status_breakdown.map((entry, index) => <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} tasks`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <ChartCard icon={<BarChartRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Department Distribution" subtitle="Tasks grouped by department">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={report.department_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Tasks" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={<AssignmentLateRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />} title="Due Soon" subtitle="Tasks nearest to their deadlines">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {report.due_soon.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No upcoming tasks in this scope.</Typography>
                ) : (
                  report.due_soon.map((task) => (
                    <Box key={task.id} sx={{ background: "#f8fbff", borderRadius: "16px", p: 2, border: "1px solid #e2e8f0" }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", mb: 0.4 }}>{task.title}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b", mb: 0.6 }}>
                        {task.project_name || "No project"} · {task.employee_name || "Unassigned"}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: "#94a3b8" }}>
                        {task.deadline ? `Deadline: ${task.deadline}` : "No deadline"} · {task.status?.replace("_", " ")}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </ChartCard>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
