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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAuthHeaders, getStoredUser, API_BASE_URL } from "../utils/auth";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
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

function ProjectFields({ form, setForm }) {
  return (
    <>
      <Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151", mb: 0.7 }}
        >
          Project Name
        </Typography>
        <TextField
          fullWidth
          value={form.project_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, project_name: e.target.value }))
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
    </>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [projects, setProjects] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addForm, setAddForm] = useState({ project_name: "", description: "" });
  const [editForm, setEditForm] = useState({
    id: null,
    project_name: "",
    description: "",
  });

  const canManageProjects = ["admin", "manager"].includes(user?.role);

  const fetchProjects = async () => {
    const response = await axios.get(`${API_BASE_URL}/projects`, {
      headers: getAuthHeaders(),
    });
    setProjects(response.data);
  };

  useEffect(() => {
    let ignore = false;

    const loadProjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/projects`, {
          headers: getAuthHeaders(),
        });
        if (!ignore) {
          setProjects(response.data);
        }
      } catch {
        if (!ignore) {
          setProjects([]);
        }
      }
    };

    void loadProjects();

    return () => {
      ignore = true;
    };
  }, []);

  const handleAdd = async () => {
    if (!addForm.project_name.trim()) {
      window.alert("Project name is required.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/projects`, addForm, {
        headers: getAuthHeaders(),
      });
      setAddOpen(false);
      setAddForm({ project_name: "", description: "" });
      fetchProjects();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to create project.");
    }
  };

  const handleEdit = async () => {
    if (!editForm.project_name.trim()) {
      window.alert("Project name is required.");
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/projects/${editForm.id}`,
        {
          project_name: editForm.project_name,
          description: editForm.description,
        },
        { headers: getAuthHeaders() },
      );
      setEditOpen(false);
      fetchProjects();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to update project.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/projects/${deleteTarget.id}`, {
        headers: getAuthHeaders(),
      });
      setDeleteTarget(null);
      fetchProjects();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to delete project.");
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
              Projects
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              {projects.length} active projects in the workspace
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
              label={`Total (${projects.length})`}
              sx={{
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                fontSize: 12,
              }}
            />
            {canManageProjects && (
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
                Add Project
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
                  {[
                    "Project",
                    "Description",
                    "Created By",
                    "Created",
                    "Actions",
                  ].map((heading) => (
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
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
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
                              "linear-gradient(135deg,#0f172a,#2563eb)",
                          }}
                        >
                          <FolderOpenRoundedIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#1e293b",
                          }}
                        >
                          {project.project_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#64748b",
                        fontSize: 13,
                        borderBottom: "1px solid #f1f5f9",
                        maxWidth: 380,
                      }}
                    >
                      {project.description || "No description added yet."}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#64748b",
                        fontSize: 13,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {project.created_by_name || "Unknown"}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#64748b",
                        fontSize: 13,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                      {canManageProjects && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditForm({
                                id: project.id,
                                project_name: project.project_name,
                                description: project.description || "",
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
                                id: project.id,
                                project_name: project.project_name,
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
                {projects.length === 0 && (
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
                      No projects found
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
            Add Project
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
          <ProjectFields form={addForm} setForm={setAddForm} />
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
            Edit Project
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
          <ProjectFields form={editForm} setForm={setEditForm} />
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
            Delete Project?
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "#64748b" }}>
            Deleting <strong>{deleteTarget?.project_name}</strong> will remove
            its project link from related tasks.
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
