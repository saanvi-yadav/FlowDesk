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
  IconButton,
  Chip,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAuthHeaders, getStoredUser, API_BASE_URL } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

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

function DepartmentFields({ form, setForm, managers }) {
  return (
    <>
      <Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.7 }}
        >
          Department Name
        </Typography>
        <TextField
          fullWidth
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          sx={FIELD_SX}
        />
      </Box>
      <Box>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.7 }}
        >
          Description
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          sx={FIELD_SX}
        />
      </Box>
      <Box sx={{ mt: 1.5 }}>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.7 }}
        >
          Department Manager
        </Typography>
        <TextField
          select
          fullWidth
          value={form.manager_user_id || ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              manager_user_id: e.target.value,
            }))
          }
          sx={FIELD_SX}
        >
          <MenuItem value="">Assign later</MenuItem>
          {managers.map((manager) => (
            <MenuItem key={manager.id} value={manager.id}>
              {manager.name} ({manager.email})
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );
}

export default function Departments() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    manager_user_id: "",
  });
  const [editForm, setEditForm] = useState({
    id: null,
    name: "",
    description: "",
    manager_user_id: "",
  });

  const fetchDepartments = async () => {
    const response = await axios.get(`${API_BASE_URL}/departments`, {
      headers: getAuthHeaders(),
    });
    setDepartments(response.data);
  };

  const fetchManagers = async () => {
    const response = await axios.get(`${API_BASE_URL}/managers`, {
      headers: getAuthHeaders(),
    });
    setManagers(response.data);
  };

  useEffect(() => {
    let ignore = false;

    const loadDepartments = async () => {
      try {
        const [departmentsResponse, managersResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/departments`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${API_BASE_URL}/managers`, {
            headers: getAuthHeaders(),
          }),
        ]);
        if (!ignore) {
          setDepartments(departmentsResponse.data);
          setManagers(managersResponse.data);
        }
      } catch {
        if (!ignore) {
          setDepartments([]);
          setManagers([]);
        }
      }
    };

    void loadDepartments();

    return () => {
      ignore = true;
    };
  }, []);

  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      window.alert("Department name is required.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/departments`, addForm, {
        headers: getAuthHeaders(),
      });
      setAddOpen(false);
      setAddForm({ name: "", description: "", manager_user_id: "" });
      fetchDepartments();
      fetchManagers();
    } catch (error) {
      window.alert(
        error.response?.data?.error || "Failed to create department.",
      );
    }
  };

  const handleEdit = async () => {
    if (!editForm.name.trim()) {
      window.alert("Department name is required.");
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/departments/${editForm.id}`,
        {
          name: editForm.name,
          description: editForm.description,
          manager_user_id: editForm.manager_user_id || null,
        },
        { headers: getAuthHeaders() },
      );
      setEditOpen(false);
      fetchDepartments();
      fetchManagers();
    } catch (error) {
      window.alert(
        error.response?.data?.error || "Failed to update department.",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/departments/${deleteTarget.id}`, {
        headers: getAuthHeaders(),
      });
      setDeleteTarget(null);
      fetchDepartments();
    } catch (error) {
      window.alert(
        error.response?.data?.error || "Failed to delete department.",
      );
    }
  };

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
              Departments
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              {departments.length} departments configured
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Chip
              label={`Total (${departments.length})`}
              sx={{
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                fontSize: 12,
              }}
            />
            {user?.role === "admin" && (
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
                Add Department
              </Button>
            )}
          </Box>

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
                  {["Department", "Manager", "Description", "Created", "Actions"].map(
                    (heading) => (
                      <TableCell
                        key={heading}
                        sx={{
                          color: "#64748b",
                          fontSize: 11.5,
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          py: 2,
                          borderBottom: "1.5px solid #f1f5f9",
                        }}
                      >
                        {heading.toUpperCase()}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department) => (
                  <TableRow
                    key={department.id}
                    sx={{ "&:hover": { background: "#f8faff" } }}
                  >
                    <TableCell
                      sx={{ py: 1.8, borderBottom: "1px solid #f1f5f9" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            background:
                              "linear-gradient(135deg,#2563eb,#38bdf8)",
                          }}
                        >
                          <ApartmentRoundedIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#1e293b",
                          }}
                        >
                          {department.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#475569",
                        fontSize: 13,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {department.manager_name || "Unassigned"}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#64748b",
                        fontSize: 13,
                        borderBottom: "1px solid #f1f5f9",
                        maxWidth: 420,
                      }}
                    >
                      {department.description || "No description added yet."}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#64748b",
                        fontSize: 13,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {department.created_at
                        ? new Date(department.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                      {user?.role === "admin" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditForm({
                                id: department.id,
                                name: department.name,
                                description: department.description || "",
                                manager_user_id: department.manager_user_id || "",
                              });
                              setEditOpen(true);
                            }}
                            sx={{
                              color: "#2563eb",
                              background: "#eff6ff",
                              borderRadius: "8px",
                              "&:hover": { background: "#dbeafe" },
                            }}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setDeleteTarget({
                                id: department.id,
                                name: department.name,
                              })
                            }
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
                ))}
                {departments.length === 0 && (
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
                      No departments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 460, p: 1 } }}
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
            Add Department
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
          <DepartmentFields
            form={addForm}
            setForm={setAddForm}
            managers={managers}
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
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 460, p: 1 } }}
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
            Edit Department
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
          <DepartmentFields
            form={editForm}
            setForm={setEditForm}
            managers={managers}
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
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
            Delete Department?
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "#64748b" }}>
            Deleting <strong>{deleteTarget?.name}</strong> will clear that
            department from any employees currently linked to it.
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
            onClick={handleDelete}
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
