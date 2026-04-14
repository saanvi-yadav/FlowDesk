import { useEffect, useState } from "react";
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
  TextField,
  DialogActions,
  Avatar,
  Chip,
  IconButton,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAuthHeaders, getStoredUser, API_BASE_URL } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const DEPT_COLORS = {
  Engineering: { bg: "#eff6ff", color: "#2563eb" },
  Design: { bg: "#fdf4ff", color: "#9333ea" },
  Marketing: { bg: "#fff7ed", color: "#ea580c" },
  HR: { bg: "#f0fdf4", color: "#16a34a" },
  Finance: { bg: "#fefce8", color: "#ca8a04" },
};

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    fontSize: 14,
    background: "#f8fafc",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#93c5fd" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" },
  },
  "& .MuiOutlinedInput-input": { py: 1.4 },
};

const EMPLOYEE_FIELDS = [
  { label: "Full Name", key: "name" },
  { label: "Email Address", key: "email" },
  { label: "Role / Position", key: "role" },
];

function EmployeeFormFields({ form, setForm, departments }) {
  return (
    <>
      {EMPLOYEE_FIELDS.map((field) => (
        <Box key={field.key} sx={{ mb: 1.5 }}>
          <Typography
            sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.7 }}
          >
            {field.label}
          </Typography>
          <TextField
            fullWidth
            type={field.key === "email" ? "email" : "text"}
            value={form[field.key]}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
            }
            sx={FIELD_SX}
          />
        </Box>
      ))}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.7 }}
        >
          Department
        </Typography>
        <TextField
          select
          fullWidth
          value={form.department_id || ""}
          onChange={(e) =>
            setForm((prev) => {
              const department = departments.find(
                (item) => String(item.id) === String(e.target.value),
              );
              return {
                ...prev,
                department_id: e.target.value,
                department: department?.name || "",
              };
            })
          }
          sx={FIELD_SX}
        >
          <MenuItem value="">Unassigned</MenuItem>
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>
              {department.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );
}

export default function Employees() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: "",
    department_id: "",
    department: "",
  });

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    name: "",
    email: "",
    role: "",
    department_id: "",
    department: "",
  });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  const canEditEmployees = user?.role === "admin";

  const fetchEmployees = async () => {
    const res = await axios.get(`${API_BASE_URL}/employees`, {
      headers: getAuthHeaders(),
    });
    setEmployees(res.data);
  };

  useEffect(() => {
    let ignore = false;

    const loadEmployees = async () => {
      try {
        const [employeesResponse, departmentsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/departments`, {
            headers: getAuthHeaders(),
          }),
        ]);
        if (!ignore) {
          setEmployees(employeesResponse.data);
          setDepartments(departmentsResponse.data);
        }
      } catch {
        if (!ignore) {
          setEmployees([]);
          setDepartments([]);
        }
      }
    };

    void loadEmployees();

    return () => {
      ignore = true;
    };
  }, []);

  /* ── ADD ── */
  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.email.trim()) {
      window.alert("Employee name and email are required.");
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/employees`, addForm, {
        headers: getAuthHeaders(),
      });
      setAddOpen(false);
      setAddForm({ name: "", email: "", role: "", department_id: "", department: "" });
      fetchEmployees();

      if (response.data?.temporary_password) {
        window.alert(
          `Employee created successfully. Temporary password: ${response.data.temporary_password}`,
        );
      }
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to add employee.");
    }
  };

  /* ── EDIT ── */
  const openEdit = (emp) => {
    setEditForm({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      department_id: emp.department_id || "",
      department: emp.department,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      window.alert("Employee name and email are required.");
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/employees/${editForm.id}`,
        {
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          department_id: editForm.department_id || null,
          department: editForm.department,
        },
        { headers: getAuthHeaders() },
      );
      setEditOpen(false);
      fetchEmployees();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to update employee.");
    }
  };

  /* ── DELETE ── */
  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/employees/${deleteTarget.id}`, {
        headers: getAuthHeaders(),
      });
      setDeleteTarget(null);
      fetchEmployees();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to delete employee.");
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()),
  );

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
        {/* Topbar */}
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
              Employees
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              {employees.length} team members total
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                px: 2,
                py: 1,
                width: 230,
                "&:focus-within": { borderColor: "#2563eb" },
                transition: "border-color 0.2s",
              }}
            >
              <SearchRoundedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#475569",
                  background: "transparent",
                  width: "100%",
                }}
              />
            </Box>
            <Box
              onClick={() => navigate("/notifications")}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                "&:hover": { borderColor: "#2563eb" },
              }}
            >
              <NotificationsNoneRoundedIcon
                sx={{ color: "#475569", fontSize: 20 }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  border: "2px solid #f0f4ff",
                }}
              />
            </Box>
            <Avatar
              onClick={() => navigate("/profile")}
              sx={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg,#2563eb,#38bdf8)",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* Action row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Chip
              label={`All (${employees.length})`}
              sx={{
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                fontSize: 12,
              }}
            />
            {canEditEmployees && (
              <Button
                onClick={() => setAddOpen(true)}
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
                Add Employee
              </Button>
            )}
          </Box>

          {/* Table */}
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
                  {["Employee", "Email", "Role", "Department", "Actions"].map(
                    (h) => (
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
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((emp) => {
                  const dept = DEPT_COLORS[emp.department] || {
                    bg: "#f1f5f9",
                    color: "#475569",
                  };
                  return (
                    <TableRow
                      key={emp.id}
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
                              background: `hsl(${(emp.name?.charCodeAt(0) || 65) * 5},65%,55%)`,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {emp.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {emp.name}
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
                        {emp.email}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: 13,
                          color: "#475569",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {emp.role}
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                        <Chip
                          label={emp.department || "—"}
                          size="small"
                          sx={{
                            background: dept.bg,
                            color: dept.color,
                            fontWeight: 600,
                            fontSize: 11.5,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                        {canEditEmployees && (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {/* Edit */}
                            <IconButton
                              onClick={() => openEdit(emp)}
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
                            {/* Delete */}
                            <IconButton
                              onClick={() =>
                                setDeleteTarget({ id: emp.id, name: emp.name })
                              }
                              size="small"
                              sx={{
                                color: "#f87171",
                                background: "#fff1f2",
                                borderRadius: "8px",
                                "&:hover": { background: "#fee2e2" },
                              }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{
                        textAlign: "center",
                        py: 5,
                        color: "#94a3b8",
                        fontSize: 13,
                      }}
                    >
                      No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      {/* ── ADD MODAL ── */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 420, p: 1 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 0,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
            Add New Employee
          </Typography>
          <IconButton
            onClick={() => setAddOpen(false)}
            size="small"
            sx={{ color: "#94a3b8" }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <EmployeeFormFields
            form={addForm}
            setForm={setAddForm}
            departments={departments}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setAddOpen(false)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              color: "#64748b",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
              px: 3,
            }}
          >
            Add Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── EDIT MODAL ── */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 420, p: 1 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 0,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
            Edit Employee
          </Typography>
          <IconButton
            onClick={() => setEditOpen(false)}
            size="small"
            sx={{ color: "#94a3b8" }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <EmployeeFormFields
            form={editForm}
            setForm={setEditForm}
            departments={departments}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setEditOpen(false)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              color: "#64748b",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
              px: 3,
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DELETE CONFIRM ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: "20px", width: 380, p: 1 } }}
      >
        <DialogContent sx={{ pt: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: "#fff1f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <WarningAmberRoundedIcon sx={{ color: "#f87171", fontSize: 28 }} />
          </Box>
          <Typography
            sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a", mb: 1 }}
          >
            Remove Employee?
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "#64748b" }}>
            Are you sure you want to remove{" "}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: "center" }}
        >
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              color: "#64748b",
              border: "1.5px solid #e2e8f0",
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              background: "#ef4444",
              px: 3,
              "&:hover": { background: "#dc2626" },
            }}
          >
            Yes, Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
