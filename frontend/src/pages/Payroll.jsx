/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Avatar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import {
  getMainContentSx,
  getPageShellSx,
  getSurfaceSx,
  getTopbarSx,
} from "../theme";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const STATUS_STYLES = {
  pending: { bg: "#fef9c3", color: "#a16207" },
  paid: { bg: "#dcfce7", color: "#15803d" },
  failed: { bg: "#fee2e2", color: "#b91c1c" },
};

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    background: "#fff",
  },
};

const emptyForm = {
  employee_id: "",
  pay_period_start: "",
  pay_period_end: "",
  base_salary: "",
  bonus: "0",
  deductions: "0",
  status: "pending",
};

export default function Payroll() {
  const navigate = useNavigate();
  const theme = useTheme();
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({
    id: null,
    pay_period_start: "",
    pay_period_end: "",
    base_salary: "",
    bonus: "0",
    deductions: "0",
    status: "pending",
  });

  const fetchPayroll = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payroll`, {
        headers: getAuthHeaders(),
      });
      setPayroll(response.data);
      setError("");
    } catch (err) {
      setPayroll([]);
      setError(err.response?.data?.error || "Failed to load payroll records.");
    }
  };

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/employees`, {
        headers: getAuthHeaders(),
      });
      setEmployees(response.data);
    } catch {
      setEmployees([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    void fetchPayroll();
    void fetchEmployees();
  }, [fetchEmployees]);

  const handleCreate = async () => {
    try {
      await axios.post(`${API_BASE_URL}/payroll`, form, {
        headers: getAuthHeaders(),
      });
      setOpenCreate(false);
      setForm(emptyForm);
      await fetchPayroll();
    } catch (err) {
      window.alert(err.response?.data?.error || "Failed to create payroll.");
    }
  };

  const openEditModal = (record) => {
    setEditForm({
      id: record.id,
      pay_period_start: record.pay_period_start,
      pay_period_end: record.pay_period_end,
      base_salary: record.base_salary,
      bonus: record.bonus,
      deductions: record.deductions,
      status: record.status,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_BASE_URL}/payroll/${editForm.id}`, editForm, {
        headers: getAuthHeaders(),
      });
      setEditOpen(false);
      await fetchPayroll();
    } catch (err) {
      window.alert(err.response?.data?.error || "Failed to update payroll.");
    }
  };

  const summary = {
    total: payroll.length,
    paid: payroll.filter((record) => record.status === "paid").length,
    pending: payroll.filter((record) => record.status === "pending").length,
  };

  return (
    <Box sx={getPageShellSx(theme)}>
      <Sidebar />

      <Box sx={getMainContentSx()}>
        <Box sx={getTopbarSx(theme)}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
              Payroll
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              {isAdmin
                ? "Generate and manage employee payroll records"
                : isManager
                  ? "View payroll processing status for your department"
                  : "View your payroll history"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isAdmin && (
              <Button
                onClick={() => setOpenCreate(true)}
                startIcon={<AddRoundedIcon />}
                variant="contained"
                sx={{ background: "linear-gradient(90deg,#2563eb,#38bdf8)", borderRadius: "12px", textTransform: "none", fontWeight: 700 }}
              >
                Generate Payroll
              </Button>
            )}
            <IconButton
              onClick={() => navigate("/notifications")}
              sx={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "12px", "&:hover": { borderColor: "#2563eb" } }}
            >
              <NotificationsNoneRoundedIcon sx={{ color: "#475569", fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          {error && (
            <Box sx={{ mb: 3, background: "#fff1f2", border: "1px solid #fecaca", borderRadius: "16px", px: 2, py: 1.5 }}>
              <Typography sx={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{error}</Typography>
            </Box>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5, mb: 3 }}>
            {[
              { label: "Total Records", value: summary.total, color: "#2563eb" },
              { label: "Paid", value: summary.paid, color: "#15803d" },
              { label: "Pending", value: summary.pending, color: "#a16207" },
            ].map((card) => (
              <Box key={card.label} sx={{ ...getSurfaceSx(theme), borderRadius: "18px", p: 2.5 }}>
                <Typography sx={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, mb: 0.8 }}>
                  {card.label.toUpperCase()}
                </Typography>
                <Typography sx={{ fontSize: 30, fontWeight: 900, color: card.color, lineHeight: 1 }}>
                  {card.value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ ...getSurfaceSx(theme), overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f8faff" }}>
                  {[
                    "Employee",
                    "Period",
                    ...(isManager ? [] : ["Base Salary", "Bonus", "Deductions", "Net Pay"]),
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <TableCell key={heading} sx={{ color: "#64748b", fontSize: 11.5, fontWeight: 700, py: 2 }}>
                      {heading.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {payroll.length > 0 ? (
                  payroll.map((record) => {
                    const style = STATUS_STYLES[record.status] || STATUS_STYLES.pending;
                    return (
                      <TableRow key={record.id} sx={{ "&:hover": { background: "#f8faff" } }}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar sx={{ width: 34, height: 34, background: "linear-gradient(135deg,#2563eb,#38bdf8)", fontSize: 12, fontWeight: 700 }}>
                              {record.employee_name?.[0]?.toUpperCase() || "E"}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                                {record.employee_name || "Employee"}
                              </Typography>
                              <Typography sx={{ fontSize: 11.5, color: "#64748b" }}>
                                {record.employee_department || "No department"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "#475569", fontSize: 13 }}>
                          {record.pay_period_start} to {record.pay_period_end}
                        </TableCell>
                        {!isManager && (
                          <TableCell sx={{ color: "#475569", fontSize: 13 }}>{record.base_salary}</TableCell>
                        )}
                        {!isManager && (
                          <TableCell sx={{ color: "#475569", fontSize: 13 }}>{record.bonus}</TableCell>
                        )}
                        {!isManager && (
                          <TableCell sx={{ color: "#475569", fontSize: 13 }}>{record.deductions}</TableCell>
                        )}
                        {!isManager && (
                          <TableCell sx={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>{record.net_pay}</TableCell>
                        )}
                        <TableCell>
                          <Chip
                            label={record.status}
                            size="small"
                            sx={{ textTransform: "capitalize", background: style.bg, color: style.color, fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <IconButton
                              onClick={() => openEditModal(record)}
                              size="small"
                              sx={{ color: "#2563eb", background: "#eff6ff", borderRadius: "8px", "&:hover": { background: "#dbeafe" } }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                              {isManager ? "Status only" : "View only"}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isManager ? 4 : 8} sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
                      No payroll records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} PaperProps={{ sx: { borderRadius: "20px", width: 500, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>Generate Payroll</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
          <TextField select label="Employee" value={form.employee_id} onChange={(e) => setForm((prev) => ({ ...prev, employee_id: e.target.value }))} sx={FIELD_SX}>
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField type="date" label="Period Start" value={form.pay_period_start} onChange={(e) => setForm((prev) => ({ ...prev, pay_period_start: e.target.value }))} InputLabelProps={{ shrink: true }} sx={FIELD_SX} />
            <TextField type="date" label="Period End" value={form.pay_period_end} onChange={(e) => setForm((prev) => ({ ...prev, pay_period_end: e.target.value }))} InputLabelProps={{ shrink: true }} sx={FIELD_SX} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField type="number" label="Base Salary" value={form.base_salary} onChange={(e) => setForm((prev) => ({ ...prev, base_salary: e.target.value }))} sx={FIELD_SX} />
            <TextField type="number" label="Bonus" value={form.bonus} onChange={(e) => setForm((prev) => ({ ...prev, bonus: e.target.value }))} sx={FIELD_SX} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField type="number" label="Deductions" value={form.deductions} onChange={(e) => setForm((prev) => ({ ...prev, deductions: e.target.value }))} sx={FIELD_SX} />
            <TextField select label="Status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} sx={FIELD_SX}>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" sx={{ background: "linear-gradient(90deg,#2563eb,#38bdf8)", borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} PaperProps={{ sx: { borderRadius: "20px", width: 500, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>Update Payroll</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField type="date" label="Period Start" value={editForm.pay_period_start} onChange={(e) => setEditForm((prev) => ({ ...prev, pay_period_start: e.target.value }))} InputLabelProps={{ shrink: true }} sx={FIELD_SX} />
            <TextField type="date" label="Period End" value={editForm.pay_period_end} onChange={(e) => setEditForm((prev) => ({ ...prev, pay_period_end: e.target.value }))} InputLabelProps={{ shrink: true }} sx={FIELD_SX} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField type="number" label="Base Salary" value={editForm.base_salary} onChange={(e) => setEditForm((prev) => ({ ...prev, base_salary: e.target.value }))} sx={FIELD_SX} />
            <TextField type="number" label="Bonus" value={editForm.bonus} onChange={(e) => setEditForm((prev) => ({ ...prev, bonus: e.target.value }))} sx={FIELD_SX} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField type="number" label="Deductions" value={editForm.deductions} onChange={(e) => setEditForm((prev) => ({ ...prev, deductions: e.target.value }))} sx={FIELD_SX} />
            <TextField select label="Status" value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} sx={FIELD_SX}>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} variant="contained" sx={{ background: "linear-gradient(90deg,#2563eb,#38bdf8)", borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
