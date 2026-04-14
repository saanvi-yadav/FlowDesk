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
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Sidebar from "../components/Sidebar";
import { getAuthHeaders, getStoredUser, API_BASE_URL } from "../utils/auth";
import { getMainContentSx, getPageShellSx, getTopbarSx } from "../theme";
import {
  createProjectRequest,
  fetchDepartmentManager,
  fetchProjects,
  updateProjectRequest,
} from "../services/projectService";

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

export default function Projects() {
  const theme = useTheme();
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [form, setForm] = useState({
    project_name: "",
    description: "",
    department_id: "",
    manager_user_id: null,
    manager_name: "",
    manager_email: "",
  });
  const [editForm, setEditForm] = useState({
    id: null,
    project_name: "",
    description: "",
    department_id: "",
    manager_user_id: null,
    manager_name: "",
    manager_email: "",
  });

  const loadData = async () => {
    const requests = [
      fetchProjects(),
      axios.get(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
    ];

    const responses = await Promise.all(requests);
    setProjects(responses[0].data);
    setDepartments(responses[1].data);
    setEmployees(responses[2].data);
  };

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        const requests = [
          fetchProjects(),
          axios.get(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
        ];
        const responses = await Promise.all(requests);
        if (!ignore) {
          setProjects(responses[0].data);
          setDepartments(responses[1].data);
          setEmployees(responses[2].data);
        }
      } catch {
        if (!ignore) {
          setProjects([]);
          setDepartments([]);
          setEmployees([]);
        }
      }
    };

    void run();
    return () => {
      ignore = true;
    };
  }, []);

  const syncDepartmentManager = async (departmentId, setter) => {
    if (!departmentId) {
      setter((prev) => ({
        ...prev,
        department_id: "",
        manager_user_id: null,
        manager_name: "",
        manager_email: "",
      }));
      return;
    }

    try {
      const response = await fetchDepartmentManager(departmentId);
      setter((prev) => ({
        ...prev,
        department_id: departmentId,
        manager_user_id: response.data.manager_user_id,
        manager_name: response.data.manager_name || "Unassigned",
        manager_email: response.data.manager_email || "",
      }));
    } catch (error) {
      setter((prev) => ({
        ...prev,
        department_id: departmentId,
        manager_user_id: null,
        manager_name: "",
        manager_email: "",
      }));
      window.alert(
        error.response?.data?.error ||
          "Selected department must have a manager assigned first.",
      );
    }
  };

  const createProject = async () => {
    if (!form.project_name.trim()) {
      window.alert("Project name is required.");
      return;
    }
    if (!form.department_id || !form.manager_user_id) {
      window.alert("Department must have an assigned manager before creating a project.");
      return;
    }

    try {
      await createProjectRequest({
        project_name: form.project_name,
        description: form.description,
        department_id: form.department_id,
      });
      setCreateOpen(false);
      setForm({
        project_name: "",
        description: "",
        department_id: "",
        manager_user_id: null,
        manager_name: "",
        manager_email: "",
      });
      await loadData();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to create project.");
    }
  };

  const openEditDialog = (project) => {
    setEditForm({
      id: project.id,
      project_name: project.project_name,
      description: project.description || "",
      department_id: project.department_id || "",
      manager_user_id: project.manager_user_id || null,
      manager_name: project.manager_name || "",
      manager_email: project.manager_email || "",
    });
    setEditOpen(true);
  };

  const updateProject = async () => {
    if (!editForm.project_name.trim() || !editForm.department_id || !editForm.manager_user_id) {
      window.alert("Selected department must have an assigned manager.");
      return;
    }
    try {
      await updateProjectRequest(editForm.id, {
        project_name: editForm.project_name,
        description: editForm.description,
        department_id: editForm.department_id,
      });
      setEditOpen(false);
      await loadData();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to update project.");
    }
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.project_name}" and its linked tasks?`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/projects/${project.id}`, {
        headers: getAuthHeaders(),
      });
      await loadData();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to delete project.");
    }
  };

  const openTeamDialog = async (project) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/projects/${project.id}/team`,
        { headers: getAuthHeaders() },
      );
      setActiveProject(project);
      setTeamMembers(response.data);
      setSelectedEmployeeId("");
      setTeamOpen(true);
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to load project team.");
    }
  };

  const assignEmployee = async () => {
    if (!selectedEmployeeId || !activeProject) {
      window.alert("Select an employee first.");
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/assign-employee-to-project`,
        {
          project_id: activeProject.id,
          employee_id: selectedEmployeeId,
        },
        { headers: getAuthHeaders() },
      );
      await openTeamDialog(activeProject);
    } catch (error) {
      window.alert(
        error.response?.data?.error || "Failed to assign employee to project.",
      );
    }
  };

  const availableEmployees = employees.filter((employee) => {
    if (!activeProject?.department_id) return true;
    return (
      String(employee.department_id || "") === String(activeProject.department_id) ||
      employee.department === activeProject.department_name
    );
  });

  return (
    <Box sx={getPageShellSx(theme)}>
      <Sidebar />

      <Box sx={getMainContentSx()}>
        <Box sx={getTopbarSx(theme)}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              Projects
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              Admin assigns projects to departments, managers assign employees.
            </Typography>
          </Box>
          {isAdmin && (
            <Button
              onClick={() => setCreateOpen(true)}
              variant="contained"
              sx={{
                background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Create Project
            </Button>
          )}
        </Box>

        <Box sx={{ p: 4 }}>
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
                    "Department",
                    "Manager",
                    "Description",
                    "Created By",
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
                      }}
                    >
                      {heading.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} sx={{ "&:hover": { background: "#f8faff" } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ background: "linear-gradient(135deg,#0f172a,#2563eb)" }}>
                          {project.project_name?.[0] || "P"}
                        </Avatar>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                          {project.project_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {project.department_name || "Unassigned"}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {project.manager_name || "Unassigned"}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {project.description || "No description"}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {project.created_by_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        {(isAdmin || isManager) && (
                          <Button
                            size="small"
                            onClick={() => openTeamDialog(project)}
                            sx={{ textTransform: "none", fontWeight: 700, color: "#2563eb" }}
                          >
                            Manage Team
                          </Button>
                        )}
                        {isAdmin && (
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(project)}
                            sx={{ color: "#2563eb", background: "#eff6ff", borderRadius: "8px" }}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        )}
                        {isAdmin && (
                          <IconButton
                            size="small"
                            onClick={() => deleteProject(project)}
                            sx={{ color: "#dc2626", background: "#fff1f2", borderRadius: "8px" }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: "#94a3b8" }}>
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
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 460, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
          Create Project
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Project Name"
              value={form.project_name}
              onChange={(e) => setForm((prev) => ({ ...prev, project_name: e.target.value }))}
              sx={FIELD_SX}
            />
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              sx={FIELD_SX}
            />
            <TextField
              select
              label="Department"
              value={form.department_id}
              onChange={(e) => {
                void syncDepartmentManager(e.target.value, setForm);
              }}
              sx={FIELD_SX}
            >
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Department Manager"
              value={
                form.department_id
                  ? form.manager_name
                    ? `${form.manager_name}${form.manager_email ? ` (${form.manager_email})` : ""}`
                    : "No manager assigned"
                  : "Select a department first"
              }
              InputProps={{ readOnly: true }}
              sx={FIELD_SX}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={createProject}
            variant="contained"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
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
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
          Edit Project
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Project Name"
              value={editForm.project_name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, project_name: e.target.value }))}
              sx={FIELD_SX}
            />
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              sx={FIELD_SX}
            />
            <TextField
              select
              label="Department"
              value={editForm.department_id}
              onChange={(e) => {
                void syncDepartmentManager(e.target.value, setEditForm);
              }}
              sx={FIELD_SX}
            >
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Department Manager"
              value={
                editForm.department_id
                  ? editForm.manager_name
                    ? `${editForm.manager_name}${editForm.manager_email ? ` (${editForm.manager_email})` : ""}`
                    : "No manager assigned"
                  : "Select a department first"
              }
              InputProps={{ readOnly: true }}
              sx={FIELD_SX}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={updateProject}
            variant="contained"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 520, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
          Manage Project Team
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>
            {activeProject?.project_name} - only department employees can be assigned.
          </Typography>
          {(isAdmin || isManager) && (
            <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Employee"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                sx={FIELD_SX}
              >
                {availableEmployees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </MenuItem>
                ))}
              </TextField>
              <Button
                onClick={assignEmployee}
                variant="contained"
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                }}
              >
                Assign
              </Button>
            </Box>
          )}
          <Box sx={{ display: "grid", gap: 1 }}>
            {teamMembers.map((member) => (
              <Box
                key={member.id}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  px: 2,
                  py: 1.2,
                  background: "#f8fafc",
                }}
              >
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>
                  {member.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                  {member.email}
                </Typography>
              </Box>
            ))}
            {teamMembers.length === 0 && (
              <Typography sx={{ fontSize: 12.5, color: "#94a3b8" }}>
                No employees assigned yet.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTeamOpen(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
