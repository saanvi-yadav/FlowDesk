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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAuthHeaders, getStoredUser, API_BASE_URL } from "../utils/auth";

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
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [form, setForm] = useState({
    project_name: "",
    description: "",
    department_id: "",
    manager_user_id: "",
  });

  const loadData = async () => {
    const requests = [
      axios.get(`${API_BASE_URL}/projects`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
    ];
    if (isAdmin) {
      requests.push(
        axios.get(`${API_BASE_URL}/managers`, { headers: getAuthHeaders() }),
      );
    }

    const responses = await Promise.all(requests);
    setProjects(responses[0].data);
    setDepartments(responses[1].data);
    setEmployees(responses[2].data);
    setManagers(isAdmin ? responses[3].data : []);
  };

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        const requests = [
          axios.get(`${API_BASE_URL}/projects`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
        ];
        if (isAdmin) {
          requests.push(
            axios.get(`${API_BASE_URL}/managers`, { headers: getAuthHeaders() }),
          );
        }
        const responses = await Promise.all(requests);
        if (!ignore) {
          setProjects(responses[0].data);
          setDepartments(responses[1].data);
          setEmployees(responses[2].data);
          setManagers(isAdmin ? responses[3].data : []);
        }
      } catch {
        if (!ignore) {
          setProjects([]);
          setDepartments([]);
          setEmployees([]);
          setManagers([]);
        }
      }
    };

    void run();
    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  const createProject = async () => {
    if (!form.project_name.trim()) {
      window.alert("Project name is required.");
      return;
    }
    if (!form.department_id || !form.manager_user_id) {
      window.alert("Department and manager are required.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/projects`, form, {
        headers: getAuthHeaders(),
      });
      setCreateOpen(false);
      setForm({
        project_name: "",
        description: "",
        department_id: "",
        manager_user_id: "",
      });
      await loadData();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to create project.");
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
                      {(isAdmin || isManager) && (
                        <Button
                          size="small"
                          onClick={() => openTeamDialog(project)}
                          sx={{ textTransform: "none", fontWeight: 700, color: "#2563eb" }}
                        >
                          Manage Team
                        </Button>
                      )}
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
              onChange={(e) => setForm((prev) => ({ ...prev, department_id: e.target.value }))}
              sx={FIELD_SX}
            >
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Manager"
              value={form.manager_user_id}
              onChange={(e) => setForm((prev) => ({ ...prev, manager_user_id: e.target.value }))}
              sx={FIELD_SX}
            >
              {managers.map((manager) => (
                <MenuItem key={manager.id} value={manager.id}>
                  {manager.name} ({manager.email})
                </MenuItem>
              ))}
            </TextField>
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
