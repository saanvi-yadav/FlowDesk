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
  Tabs,
  Tab,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import HolidayVillageRoundedIcon from "@mui/icons-material/HolidayVillageRounded";

const STATUS_COLORS = {
  pending: { bg: "#fef9c3", color: "#ca8a04", label: "Pending" },
  approved: { bg: "#f0fdf4", color: "#16a34a", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
};

const LEAVE_TYPES = {
  vacation: { label: "Vacation", color: "#3b82f6" },
  sick: { label: "Sick", color: "#ef4444" },
  personal: { label: "Personal", color: "#f59e0b" },
  unpaid: { label: "Unpaid", color: "#8b5cf6" },
  emergency: { label: "Emergency", color: "#ec4899" },
};

const LeaveBalanceCard = ({ type, data }) => {
  return (
    <Card
      sx={{
        p: 2,
        background: `linear-gradient(135deg, ${LEAVE_TYPES[type].color}20, ${LEAVE_TYPES[type].color}10)`,
        borderRadius: "16px",
        border: `1.5px solid ${LEAVE_TYPES[type].color}30`,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{ fontSize: 12, color: "#64748b", fontWeight: 600, mb: 1 }}
      >
        {LEAVE_TYPES[type].label}
      </Typography>
      <Typography
        sx={{ fontSize: 20, fontWeight: 800, color: "#0f172a", mb: 1 }}
      >
        {data.remaining}
      </Typography>
      <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>
        {data.used} used of {data.allocated}
      </Typography>
    </Card>
  );
};

export default function LeaveRequests() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("ALL");
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState("");

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    employee_id: "",
    start_date: "",
    end_date: "",
    leave_type: "vacation",
    reason: "",
  });

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    id: null,
    action: "",
    review_notes: "",
  });

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leave-requests`, {
        headers: getAuthHeaders(),
      });
      setRequests(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load leave requests.");
      setRequests([]);
    }
  };

  const fetchPendingRequests = useCallback(async () => {
    if (user?.role !== "admin" && user?.role !== "manager") return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/leave-requests/pending`,
        { headers: getAuthHeaders() },
      );
      setPendingRequests(response.data);
    } catch {
      setPendingRequests([]);
    }
  }, [user?.role]);

  const fetchLeaveBalance = useCallback(async () => {
    if (user?.role !== "employee") return;
    try {
      const employeeResponse = await axios.get(`${API_BASE_URL}/employees/me`, {
        headers: getAuthHeaders(),
      });
      const employee = employeeResponse.data.employee;
      setCurrentEmployee(employee);
      if (employee) {
        const response = await axios.get(
          `${API_BASE_URL}/leave-balance/${employee.id}`,
          { headers: getAuthHeaders() },
        );
        setLeaveBalance(response.data);
        setRequestForm((prev) => ({ ...prev, employee_id: employee.id }));
      }
    } catch (err) {
      setCurrentEmployee(null);
      setError(err.response?.data?.error || "Failed to load leave balance.");
      setLeaveBalance({});
    }
  }, [user?.role]);

  const fetchEmployees = useCallback(async () => {
    if (user?.role !== "admin" && user?.role !== "manager") return;
    try {
      const response = await axios.get(`${API_BASE_URL}/employees`, {
        headers: getAuthHeaders(),
      });
      setEmployees(response.data);
    } catch {
      setEmployees([]);
    }
  }, [user?.role]);

  useEffect(() => {
    const loadData = async () => {
      await fetchLeaveRequests();
      await fetchPendingRequests();
      await fetchLeaveBalance();
      await fetchEmployees();
    };
    loadData();
  }, [user?.role, fetchPendingRequests, fetchLeaveBalance, fetchEmployees]);

  const handleSubmitLeaveRequest = async () => {
    if (!requestForm.start_date || !requestForm.end_date) {
      alert("Start and end dates are required");
      return;
    }

    const form = { ...requestForm };
    if (user?.role === "employee") {
      form.employee_id = currentEmployee?.id || "";
    }

    try {
      await axios.post(`${API_BASE_URL}/leave-requests`, form, {
        headers: getAuthHeaders(),
      });
      setRequestOpen(false);
      setRequestForm({
        employee_id: currentEmployee?.id || "",
        start_date: "",
        end_date: "",
        leave_type: "vacation",
        reason: "",
      });
      fetchLeaveRequests();
      fetchLeaveBalance();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit leave request");
    }
  };

  const handleReviewRequest = async () => {
    if (!reviewForm.id || !reviewForm.action) {
      alert("Select a review action");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/leave-requests/${reviewForm.id}`,
        reviewForm,
        { headers: getAuthHeaders() },
      );
      setReviewOpen(false);
      setReviewForm({ id: null, action: "", review_notes: "" });
      fetchLeaveRequests();
      fetchPendingRequests();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to review request");
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?"))
      return;

    try {
      await axios.put(
        `${API_BASE_URL}/leave-requests/${id}`,
        { action: "cancel" },
        { headers: getAuthHeaders() },
      );
      fetchLeaveRequests();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel request");
    }
  };

  const openReview = (req, action) => {
    setReviewForm({ id: req.id, action, review_notes: "" });
    setReviewOpen(true);
  };

  const filtered = requests.filter((req) => {
    const matchesSearch = (req.employee_name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || req.status === statusFilter.toLowerCase();
    const matchesType =
      leaveTypeFilter === "ALL" || req.leave_type === leaveTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "#f0f4ff",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <Sidebar />

      <Box sx={{ marginLeft: "240px", width: "100%" }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(240,244,255,0.88)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(37,99,235,0.08)",
            px: 4,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
              }}
            >
              Leave Requests
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              Manage leave and time off requests
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user?.role === "employee" && (
              <Button
                onClick={() => setRequestOpen(true)}
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
                Request Leave
              </Button>
            )}
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

          {/* Leave Balance for Employees */}
          {user?.role === "employee" &&
            Object.keys(leaveBalance).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                    mb: 2,
                  }}
                >
                  Your Leave Balance
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(leaveBalance).map(([type, data]) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={type}>
                      <LeaveBalanceCard type={type} data={data} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

          {/* Tabs for Manager */}
          {(user?.role === "admin" || user?.role === "manager") && (
            <Tabs
              value={tabValue}
              onChange={(e, val) => setTabValue(val)}
              sx={{
                mb: 3,
                borderBottom: "1.5px solid #e2e8f0",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#64748b",
                },
                "& .Mui-selected": { color: "#2563eb", fontWeight: 700 },
              }}
            >
              <Tab label={`My Requests (${requests.length})`} />
              <Tab label={`Pending Review (${pendingRequests.length})`} />
            </Tabs>
          )}

          {/* Filters */}
          {tabValue === 0 && (
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
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>
              <TextField
                select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                size="small"
                sx={{
                  width: 150,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    background: "#fff",
                  },
                }}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="vacation">Vacation</MenuItem>
                <MenuItem value="sick">Sick</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </TextField>
            </Box>
          )}

          {/* Requests Table */}
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
                    "Leave Type",
                    "From",
                    "To",
                    "Days",
                    "Status",
                    "Reason",
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
                {(tabValue === 0 ? filtered : pendingRequests).length > 0 ? (
                  (tabValue === 0 ? filtered : pendingRequests).map((req) => {
                    const statusInfo =
                      STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                    const startDate = new Date(req.start_date);
                    const endDate = new Date(req.end_date);
                    const days =
                      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) +
                      1;
                    return (
                      <TableRow
                        key={req.id}
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
                              {req.employee_name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#1e293b",
                              }}
                            >
                              {req.employee_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                          <Chip
                            label={
                              LEAVE_TYPES[req.leave_type]?.label ||
                              req.leave_type
                            }
                            size="small"
                            sx={{
                              background: `${LEAVE_TYPES[req.leave_type]?.color}20`,
                              color: LEAVE_TYPES[req.leave_type]?.color,
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
                          {req.start_date}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#64748b",
                            fontSize: 13,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {req.end_date}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#0f172a",
                            fontSize: 13,
                            fontWeight: 600,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {days}
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
                            fontSize: 12,
                            borderBottom: "1px solid #f1f5f9",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {req.reason || "—"}
                        </TableCell>
                        <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                          {tabValue === 1 &&
                          (user?.role === "admin" ||
                            user?.role === "manager") ? (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                onClick={() => openReview(req, "approve")}
                                size="small"
                                sx={{
                                  background: "#f0fdf4",
                                  color: "#16a34a",
                                  fontWeight: 600,
                                  textTransform: "none",
                                  borderRadius: "8px",
                                  "&:hover": { background: "#dcfce7" },
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => openReview(req, "reject")}
                                size="small"
                                sx={{
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  fontWeight: 600,
                                  textTransform: "none",
                                  borderRadius: "8px",
                                  "&:hover": { background: "#fecaca" },
                                }}
                              >
                                Reject
                              </Button>
                            </Box>
                          ) : tabValue === 0 &&
                            user?.role === "employee" &&
                            req.status === "pending" ? (
                            <Button
                              onClick={() => handleCancelRequest(req.id)}
                              size="small"
                              sx={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                fontWeight: 600,
                                textTransform: "none",
                                borderRadius: "8px",
                                "&:hover": { background: "#fecaca" },
                              }}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}
                    >
                      No leave requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      {/* Submit Leave Request Dialog */}
      <Dialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 450, p: 1 } }}
      >
        <DialogTitle
          sx={{ fontWeight: 800, fontSize: 18, color: "#0f172a", pb: 1 }}
        >
          Request Leave
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
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            value={requestForm.start_date}
            onChange={(e) =>
              setRequestForm({ ...requestForm, start_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={requestForm.end_date}
            onChange={(e) =>
              setRequestForm({ ...requestForm, end_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            fullWidth
            select
            label="Leave Type"
            value={requestForm.leave_type}
            onChange={(e) =>
              setRequestForm({ ...requestForm, leave_type: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          >
            <MenuItem value="vacation">Vacation</MenuItem>
            <MenuItem value="sick">Sick Leave</MenuItem>
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
            <MenuItem value="emergency">Emergency</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={requestForm.reason}
            onChange={(e) =>
              setRequestForm({ ...requestForm, reason: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setRequestOpen(false)}
            sx={{ color: "#64748b", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitLeaveRequest}
            variant="contained"
            sx={{
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Leave Request Dialog */}
      <Dialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 450, p: 1 } }}
      >
        <DialogTitle
          sx={{ fontWeight: 800, fontSize: 18, color: "#0f172a", pb: 1 }}
        >
          {reviewForm.action === "approve" ? "Approve" : "Reject"} Leave Request
        </DialogTitle>
        <DialogContent
          sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={reviewForm.review_notes}
            onChange={(e) =>
              setReviewForm({ ...reviewForm, review_notes: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setReviewOpen(false)}
            sx={{ color: "#64748b", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReviewRequest}
            variant="contained"
            sx={{
              background:
                reviewForm.action === "approve"
                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                  : "linear-gradient(90deg,#dc2626,#ef4444)",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {reviewForm.action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
