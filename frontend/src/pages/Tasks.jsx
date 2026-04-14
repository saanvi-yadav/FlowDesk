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
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";

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

export default function Tasks() {
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    project_id: "",
    manager_user_id: "",
    assigned_to: "",
    deadline: "",
  });

  const loadData = async () => {
    const requests = [
      axios.get(`${API_BASE_URL}/tasks`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/projects`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
    ];
    if (isAdmin) {
      requests.push(
        axios.get(`${API_BASE_URL}/managers`, { headers: getAuthHeaders() }),
      );
    }
    const responses = await Promise.all(requests);
    setTasks(responses[0].data);
    setProjects(responses[1].data);
    setEmployees(responses[2].data);
    setManagers(isAdmin ? responses[3].data : []);
  };

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const requests = [
          axios.get(`${API_BASE_URL}/tasks`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/projects`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
        ];
        if (isAdmin) {
          requests.push(
            axios.get(`${API_BASE_URL}/managers`, { headers: getAuthHeaders() }),
          );
        }
        const responses = await Promise.all(requests);
        if (!ignore) {
          setTasks(responses[0].data);
          setProjects(responses[1].data);
          setEmployees(responses[2].data);
          setManagers(isAdmin ? responses[3].data : []);
        }
      } catch {
        if (!ignore) {
          setTasks([]);
          setProjects([]);
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

  const createTask = async () => {
    if (!form.title.trim() || !form.project_id) {
      window.alert("Task title and project are required.");
      return;
    }

    try {
      if (isAdmin) {
        if (!form.manager_user_id) {
          window.alert("Select the manager who should receive this task.");
          return;
        }
        await axios.post(
          `${API_BASE_URL}/assign-task-to-manager`,
          {
            title: form.title,
            description: form.description,
            priority: form.priority,
            project_id: form.project_id,
            manager_user_id: form.manager_user_id,
            deadline: form.deadline || null,
          },
          { headers: getAuthHeaders() },
        );
      } else if (isManager) {
        await axios.post(
          `${API_BASE_URL}/tasks`,
          {
            title: form.title,
            description: form.description,
            priority: form.priority,
            project_id: form.project_id,
            assigned_to: form.assigned_to || null,
            deadline: form.deadline || null,
          },
          { headers: getAuthHeaders() },
        );
      }

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        project_id: "",
        manager_user_id: "",
        assigned_to: "",
        deadline: "",
      });
      setOpen(false);
      await loadData();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to create task.");
    }
  };

  const openAssignDialog = (task) => {
    setActiveTask(task);
    setAssignEmployeeId(task.assigned_to || "");
    setAssignOpen(true);
  };

  const assignTaskToEmployee = async () => {
    if (!activeTask || !assignEmployeeId) {
      window.alert("Select an employee first.");
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/assign-task-to-employee`,
        {
          task_id: activeTask.id,
          employee_id: assignEmployeeId,
        },
        { headers: getAuthHeaders() },
      );
      setAssignOpen(false);
      await loadData();
    } catch (error) {
      window.alert(
        error.response?.data?.error || "Failed to assign task to employee.",
      );
    }
  };

  const activeProject = projects.find(
    (project) => String(project.id) === String(activeTask?.project_id),
  );

  const assignableEmployees = employees.filter((employee) => {
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
              Tasks
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
              {isAdmin
                ? "Admin assigns tasks to department managers."
                : isManager
                  ? "Managers assign received tasks to employees in their department."
                  : "Employees can view and update only their own tasks."}
            </Typography>
          </Box>
          {(isAdmin || isManager) && (
            <Button
              onClick={() => setOpen(true)}
              variant="contained"
              sx={{
                background: "linear-gradient(90deg,#2563eb,#38bdf8)",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {isAdmin ? "Assign Task To Manager" : "Create Or Assign Task"}
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
                  {["Title", "Project", "Manager", "Employee", "Status", "Actions"].map((heading) => (
                    <TableCell
                      key={heading}
                      sx={{ color: "#64748b", fontSize: 11.5, fontWeight: 700, py: 2 }}
                    >
                      {heading.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} sx={{ "&:hover": { background: "#f8faff" } }}>
                    <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>
                      {task.title}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {task.project_name || "Unassigned"}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {task.manager_name || task.project_manager_name || "Department manager"}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {task.employee_name || "Not assigned yet"}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                      {task.status}
                    </TableCell>
                    <TableCell>
                      {isManager && (
                        <Button
                          size="small"
                          onClick={() => openAssignDialog(task)}
                          sx={{ textTransform: "none", fontWeight: 700, color: "#2563eb" }}
                        >
                          Assign Employee
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: "#94a3b8" }}>
                      No tasks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 480, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
          {isAdmin ? "Assign Task To Manager" : "Create Task"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Task Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
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
              label="Project"
              value={form.project_id}
              onChange={(e) => setForm((prev) => ({ ...prev, project_id: e.target.value }))}
              sx={FIELD_SX}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.project_name}
                </MenuItem>
              ))}
            </TextField>
            {isAdmin && (
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
            )}
            {isManager && (
              <TextField
                select
                label="Employee"
                value={form.assigned_to}
                onChange={(e) => setForm((prev) => ({ ...prev, assigned_to: e.target.value }))}
                sx={FIELD_SX}
              >
                <MenuItem value="">Assign later</MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
              sx={FIELD_SX}
            >
              {["LOW", "MEDIUM", "HIGH"].map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label="Deadline"
              InputLabelProps={{ shrink: true }}
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              sx={FIELD_SX}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={createTask}
            variant="contained"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(90deg,#2563eb,#38bdf8)",
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", width: 460, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>
          Assign Task To Employee
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>
            {activeTask?.title}
          </Typography>
          <TextField
            select
            fullWidth
            label="Employee"
            value={assignEmployeeId}
            onChange={(e) => setAssignEmployeeId(e.target.value)}
            sx={FIELD_SX}
          >
            {assignableEmployees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.name} ({employee.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={assignTaskToEmployee}
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
        </DialogActions>
      </Dialog>
    </Box>
  );
}
