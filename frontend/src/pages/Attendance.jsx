import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Chip,
  IconButton,
  MenuItem,
  Card,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import { getMainContentSx, getPageShellSx, getTopbarSx } from "../theme";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

const STATUS_COLORS = {
  present: { bg: "#f0fdf4", color: "#16a34a", label: "Present" },
  absent: { bg: "#fee2e2", color: "#dc2626", label: "Absent" },
  half_day: { bg: "#fef9c3", color: "#ca8a04", label: "Half Day" },
  leave: { bg: "#f3e8ff", color: "#7c3aed", label: "On Leave" },
};

const StatBox = ({ label, value, icon, color }) => {
  return (
    <Card
      sx={{
        p: 2,
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        borderRadius: "16px",
        border: `1.5px solid ${color}30`,
        textAlign: "center",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1, color }}>
        {icon}
      </Box>
      <Typography
        sx={{ fontSize: 12, color: "#64748b", fontWeight: 600, mb: 0.5 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
        {value}
      </Typography>
    </Card>
  );
};

export default function Attendance() {
  const navigate = useNavigate();
  const theme = useTheme();
  const user = getStoredUser();

  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [stats, setStats] = useState({
    total_days: 0,
    present_days: 0,
    absent_days: 0,
    half_days: 0,
    leave_days: 0,
    attendance_rate: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("ALL");
  const [error, setError] = useState("");

  const [markOpen, setMarkOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    employee_id: "",
    date: "",
    check_in: "",
    check_out: "",
    status: "present",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    check_in: "",
    check_out: "",
    status: "present",
    notes: "",
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance`, {
        headers: getAuthHeaders(),
      });
      const records = Array.isArray(response.data)
        ? response.data
        : response.data?.records || [];
      setAttendance(records);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to load attendance records.",
      );
      setAttendance([]);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const statsEmployeeId =
        user?.role === "manager" && employeeFilter !== "ALL"
          ? `&employee_id=${employeeFilter}`
          : "";
      const response = await axios.get(
        `${API_BASE_URL}/attendance/stats?month=${currentMonth}&year=${currentYear}${statsEmployeeId}`,
        { headers: getAuthHeaders() },
      );
      setStats(response.data);
    } catch {
      setStats({
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        half_days: 0,
        leave_days: 0,
        attendance_rate: 0,
      });
    }
  }, [currentMonth, currentYear, employeeFilter, user?.role]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employees`, {
        headers: getAuthHeaders(),
      });
      setEmployees(response.data);
      if (user?.role === "manager" && employeeFilter === "ALL" && response.data.length > 0) {
        setEmployeeFilter(String(response.data[0].id));
      }
    } catch {
      setEmployees([]);
    }
  }, [employeeFilter, user?.role]);

  const fetchCurrentEmployee = useCallback(async () => {
    if (user?.role !== "employee") return;
    try {
      const response = await axios.get(`${API_BASE_URL}/employees/me`, {
        headers: getAuthHeaders(),
      });
      setCurrentEmployee(response.data.employee);
      setMarkForm((prev) => ({
        ...prev,
        employee_id: response.data.employee?.id || "",
      }));
    } catch (err) {
      setCurrentEmployee(null);
      setError(
        err.response?.data?.error || "Employee profile could not be loaded.",
      );
    }
  }, [user?.role]);

  useEffect(() => {
    const loadData = async () => {
      await fetchAttendance();
      if (user?.role === "admin" || user?.role === "manager") {
        await fetchEmployees();
      } else {
        await fetchCurrentEmployee();
      }
      await fetchStats();
    };
    loadData();
  }, [user?.role, fetchEmployees, fetchStats, fetchCurrentEmployee]);

  const handleMarkAttendance = async () => {
    if (!markForm.employee_id || !markForm.date) {
      alert("Employee and date are required");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/attendance`, markForm, {
        headers: getAuthHeaders(),
      });
      setMarkOpen(false);
      setMarkForm({
        employee_id: currentEmployee?.id || "",
        date: "",
        check_in: "",
        check_out: "",
        status: "present",
      });
      fetchAttendance();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to mark attendance");
    }
  };

  const handleUpdateAttendance = async () => {
    if (!editForm.id) return;

    try {
      await axios.put(`${API_BASE_URL}/attendance/${editForm.id}`, editForm, {
        headers: getAuthHeaders(),
      });
      setEditOpen(false);
      setEditForm({
        id: null,
        check_in: "",
        check_out: "",
        status: "present",
        notes: "",
      });
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update attendance");
    }
  };

  const openEdit = (record) => {
    setEditForm({
      id: record.id,
      check_in: record.check_in || "",
      check_out: record.check_out || "",
      status: record.status || "present",
      notes: record.notes || "",
    });
    setEditOpen(true);
  };

  const filtered = attendance.filter((rec) => {
    const matchesSearch = (rec.employee_name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || rec.status === statusFilter.toLowerCase();
    const matchesEmployee =
      employeeFilter === "ALL" || rec.employee_id === parseInt(employeeFilter);
    const matchesDate = !dateFilter || rec.date === dateFilter;
    return matchesSearch && matchesStatus && matchesEmployee && matchesDate;
  });

  return (
    <Box sx={getPageShellSx(theme)}>
      <Sidebar />

      <Box sx={getMainContentSx()}>
        <Box sx={getTopbarSx(theme)}>
          <Box>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
              }}
            >
              Attendance
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              Track team presence and attendance records
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              onClick={() => setMarkOpen(true)}
              startIcon={<AddRoundedIcon />}
              variant="contained"
              sx={{
                background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
              }}
            >
              Mark Attendance
            </Button>
            <IconButton
              onClick={() => navigate("/notifications")}
              sx={{
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                "&:hover": { borderColor: "#2563eb" },
              }}
            >
              <NotificationsNoneRoundedIcon
                sx={{ color: "#475569", fontSize: 20 }}
              />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          {error && (
            <Box
              sx={{
                mb: 3,
                background: "#fff1f2",
                border: "1px solid #fecaca",
                borderRadius: "16px",
                px: 2,
                py: 1.5,
              }}
            >
              <Typography
                sx={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
              >
                {error}
              </Typography>
            </Box>
          )}

          {/* Statistics Grid */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatBox
                label="Total Days"
                value={stats.total_days}
                icon={<CalendarTodayRoundedIcon />}
                color="#2563eb"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatBox
                label="Present"
                value={stats.present_days}
                icon={<CheckCircleRoundedIcon />}
                color="#059669"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatBox
                label="Absent"
                value={stats.absent_days}
                icon={<CancelRoundedIcon />}
                color="#dc2626"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatBox
                label="Half Day"
                value={stats.half_days}
                icon={<CalendarTodayRoundedIcon />}
                color="#ca8a04"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatBox
                label={user?.role === "manager" ? "Employee %" : "Attendance %"}
                value={`${stats.attendance_rate}%`}
                icon={<CheckCircleRoundedIcon />}
                color="#7c3aed"
              />
            </Grid>
          </Grid>

          {/* Filters */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search by employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <SearchRoundedIcon sx={{ mr: 1, color: "#94a3b8" }} />
                ),
              }}
              sx={{
                flex: 1,
                minWidth: 250,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "#fff",
                },
              }}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{
                width: 150,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "#fff",
                },
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PRESENT">Present</MenuItem>
              <MenuItem value="ABSENT">Absent</MenuItem>
              <MenuItem value="HALF_DAY">Half Day</MenuItem>
              <MenuItem value="LEAVE">Leave</MenuItem>
            </TextField>
            <TextField
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              size="small"
              sx={{
                width: 180,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "#fff",
                },
              }}
            />
            {(user?.role === "admin" || user?.role === "manager") && (
              <TextField
                select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                size="small"
                sx={{
                  width: 180,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    background: "#fff",
                  },
                }}
              >
                <MenuItem value="ALL">All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {user?.role === "employee" && currentEmployee && (
              <Box
                sx={{
                  background: "#fff",
                  border: "1px solid #dbeafe",
                  borderRadius: "12px",
                  px: 2,
                  py: 1.1,
                  minWidth: 220,
                }}
              >
                <Typography
                  sx={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}
                >
                  RECORDING FOR
                </Typography>
                <Typography
                  sx={{ fontSize: 13.5, color: "#0f172a", fontWeight: 700 }}
                >
                  {currentEmployee.name}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Attendance Table */}
          <Box
            sx={{
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 2px 16px rgba(37,99,235,0.07)",
              border: "1.5px solid rgba(37,99,235,0.07)",
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f8faff" }}>
                  {[
                    "Employee",
                    "Date",
                    "Check In",
                    "Check Out",
                    "Status",
                    "Notes",
                    "Actions",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        color: "#64748b",
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        py: 2,
                        borderBottom: "1.5px solid #f1f5f9",
                      }}
                    >
                      {h.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((rec) => {
                    const statusInfo =
                      STATUS_COLORS[rec.status] || STATUS_COLORS.present;
                    return (
                      <TableRow
                        key={rec.id}
                        sx={{
                          "&:hover": { background: "#f8faff" },
                          transition: "background 0.15s",
                        }}
                      >
                        <TableCell
                          sx={{ py: 1.8, borderBottom: "1px solid #f1f5f9" }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                background:
                                  "linear-gradient(135deg,#2563eb,#38bdf8)",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {rec.employee_name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#1e293b",
                              }}
                            >
                              {rec.employee_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#64748b",
                            fontSize: 13,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {rec.date}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#64748b",
                            fontSize: 13,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {rec.check_in || "—"}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#64748b",
                            fontSize: 13,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {rec.check_out || "—"}
                        </TableCell>
                        <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              fontWeight: 600,
                              fontSize: 11.5,
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#64748b",
                            fontSize: 13,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {rec.notes || "—"}
                        </TableCell>
                        <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                          {(user?.role === "admin" ||
                            user?.role === "manager") && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                onClick={() => openEdit(rec)}
                                size="small"
                                sx={{
                                  color: "#2563eb",
                                  background: "#eff6ff",
                                  borderRadius: "8px",
                                  "&:hover": { background: "#dbeafe" },
                                }}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}
                    >
                      No attendance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      {/* Mark Attendance Dialog */}
      <Dialog
        open={markOpen}
        onClose={() => setMarkOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 450, p: 1 } }}
      >
        <DialogTitle
          sx={{ fontWeight: 800, fontSize: 18, color: "#0f172a", pb: 1 }}
        >
          Mark Attendance
        </DialogTitle>
        <DialogContent
          sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          {user?.role === "employee" && currentEmployee && (
            <TextField
              fullWidth
              label="Employee"
              value={currentEmployee.name}
              InputProps={{ readOnly: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          )}
          {(user?.role === "admin" || user?.role === "manager") && (
            <TextField
              fullWidth
              select
              label="Employee"
              value={markForm.employee_id}
              onChange={(e) =>
                setMarkForm({ ...markForm, employee_id: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            type="date"
            label="Date"
            value={markForm.date}
            onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            fullWidth
            type="time"
            label="Check In"
            value={markForm.check_in}
            onChange={(e) =>
              setMarkForm({ ...markForm, check_in: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            fullWidth
            type="time"
            label="Check Out"
            value={markForm.check_out}
            onChange={(e) =>
              setMarkForm({ ...markForm, check_out: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={markForm.status}
            onChange={(e) =>
              setMarkForm({ ...markForm, status: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          >
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="half_day">Half Day</MenuItem>
            <MenuItem value="leave">Leave</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setMarkOpen(false)}
            sx={{ color: "#64748b", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkAttendance}
            variant="contained"
            sx={{
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Mark
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Attendance Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 450, p: 1 } }}
      >
        <DialogTitle
          sx={{ fontWeight: 800, fontSize: 18, color: "#0f172a", pb: 1 }}
        >
          Edit Attendance
        </DialogTitle>
        <DialogContent
          sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField
            fullWidth
            type="time"
            label="Check In"
            value={editForm.check_in}
            onChange={(e) =>
              setEditForm({ ...editForm, check_in: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            fullWidth
            type="time"
            label="Check Out"
            value={editForm.check_out}
            onChange={(e) =>
              setEditForm({ ...editForm, check_out: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={editForm.status}
            onChange={(e) =>
              setEditForm({ ...editForm, status: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          >
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="half_day">Half Day</MenuItem>
            <MenuItem value="leave">Leave</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={editForm.notes}
            onChange={(e) =>
              setEditForm({ ...editForm, notes: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setEditOpen(false)}
            sx={{ color: "#64748b", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateAttendance}
            variant="contained"
            sx={{
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
