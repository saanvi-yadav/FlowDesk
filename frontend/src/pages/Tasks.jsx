/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  DragDropContext,
  Draggable,
  Droppable,
} from "@hello-pangea/dnd";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL, getAuthHeaders, getStoredUser } from "../utils/auth";
import {
  getMainContentSx,
  getPageShellSx,
  getSurfaceSx,
  getTopbarSx,
} from "../theme";
import {
  assignTaskToEmployeeRequest,
  createTaskRequest,
  fetchTasks,
  updateTaskStatusRequest,
} from "../services/taskService";
import { fetchProjects } from "../services/projectService";

const STATUSES = [
  { id: "TO_DO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
];

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
  },
};

export default function Tasks() {
  const theme = useTheme();
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    project_id: "",
    assigned_to: "",
    deadline: "",
  });

  const loadData = async () => {
    try {
      const [tasksResponse, projectsResponse, employeesResponse] =
        await Promise.all([
          fetchTasks(),
          fetchProjects(),
          axios.get(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() }),
        ]);
      setTasks(tasksResponse.data);
      setProjects(projectsResponse.data);
      setEmployees(employeesResponse.data);
    } catch {
      setTasks([]);
      setProjects([]);
      setEmployees([]);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const groupedTasks = useMemo(
    () =>
      STATUSES.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.id),
      })),
    [tasks],
  );

  const createTask = async () => {
    if (!form.title.trim() || !form.project_id) {
      window.alert("Task title and project are required.");
      return;
    }

    try {
      await createTaskRequest({
        title: form.title,
        description: form.description,
        priority: form.priority,
        project_id: form.project_id,
        assigned_to: form.assigned_to || null,
        deadline: form.deadline || null,
      });
      setCreateOpen(false);
      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        project_id: "",
        assigned_to: "",
        deadline: "",
      });
      await loadData();
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to create task.");
    }
  };

  const handleDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId || isAdmin) {
      return;
    }

    try {
      await updateTaskStatusRequest(draggableId, destination.droppableId);
      setTasks((current) =>
        current.map((task) =>
          String(task.id) === String(draggableId)
            ? { ...task, status: destination.droppableId }
            : task,
        ),
      );
    } catch (error) {
      window.alert(error.response?.data?.error || "Failed to update task status.");
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
      await assignTaskToEmployeeRequest({
        task_id: activeTask.id,
        employee_id: assignEmployeeId,
      });
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

  const selectableProjectEmployees = employees.filter((employee) => {
    const project = projects.find(
      (item) => String(item.id) === String(form.project_id),
    );
    if (!project?.department_id) return true;
    return (
      String(employee.department_id || "") === String(project.department_id) ||
      employee.department === project.department_name
    );
  });

  return (
    <Box sx={getPageShellSx(theme)}>
      <Sidebar />

      <Box sx={getMainContentSx()}>
        <Box sx={getTopbarSx(theme)}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800 }}>
              Tasks
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.2 }}>
              {isAdmin
                ? "Admins can review company-wide task progress."
                : isManager
                  ? "Department managers break projects into tasks and assign employees."
                  : "Drag your work between stages as you make progress."}
            </Typography>
          </Box>
          {isManager && (
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
              Create Task
            </Button>
          )}
        </Box>

        <Box sx={{ p: 4 }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {groupedTasks.map((column) => (
                <Droppable droppableId={column.id} key={column.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        ...getSurfaceSx(theme),
                        p: 2,
                        minHeight: 460,
                        background:
                          snapshot.isDraggingOver && !isAdmin
                            ? theme.palette.mode === "dark"
                              ? "#13243b"
                              : "#edf4ff"
                            : theme.palette.background.paper,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                          {column.label}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                          {column.tasks.length}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "grid", gap: 1.5 }}>
                        {column.tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={String(task.id)}
                            index={index}
                            isDragDisabled={isAdmin}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                sx={{
                                  p: 2,
                                  borderRadius: "16px",
                                  border: `1px solid ${theme.palette.divider}`,
                                  background:
                                    theme.palette.mode === "dark" ? "#13243b" : "#f8fbff",
                                  boxShadow: dragSnapshot.isDragging
                                    ? "0 14px 28px rgba(37,99,235,0.16)"
                                    : "none",
                                }}
                              >
                                <Typography sx={{ fontWeight: 700, mb: 0.6 }}>
                                  {task.title}
                                </Typography>
                                <Typography
                                  sx={{ color: "text.secondary", fontSize: 12.5, mb: 1 }}
                                >
                                  {task.project_name || "No project"}
                                </Typography>
                                <Typography
                                  sx={{ color: "text.secondary", fontSize: 12.5, mb: 0.5 }}
                                >
                                  Assignee: {task.employee_name || "Not assigned"}
                                </Typography>
                                <Typography
                                  sx={{ color: "text.secondary", fontSize: 12.5 }}
                                >
                                  Deadline: {task.deadline || "Not set"}
                                </Typography>
                                {isManager && (
                                  <Button
                                    size="small"
                                    onClick={() => openAssignDialog(task)}
                                    sx={{
                                      mt: 1.5,
                                      px: 0,
                                      textTransform: "none",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Assign Employee
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {column.tasks.length === 0 && (
                          <Typography
                            sx={{ color: "text.secondary", fontSize: 12.5, py: 2 }}
                          >
                            No tasks in this stage.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Droppable>
              ))}
            </Box>
          </DragDropContext>
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5, width: 460, maxWidth: "100%" }}>
            <TextField
              label="Task Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              sx={FIELD_SX}
            />
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              sx={FIELD_SX}
            />
            <TextField
              select
              label="Project"
              value={form.project_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, project_id: event.target.value }))
              }
              sx={FIELD_SX}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.project_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Employee"
              value={form.assigned_to}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  assigned_to: event.target.value,
                }))
              }
              sx={FIELD_SX}
            >
              <MenuItem value="">Assign later</MenuItem>
              {selectableProjectEmployees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priority"
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({ ...current, priority: event.target.value }))
              }
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
              onChange={(event) =>
                setForm((current) => ({ ...current, deadline: event.target.value }))
              }
              sx={FIELD_SX}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={createTask} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <DialogTitle>Assign Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ width: 420, maxWidth: "100%" }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
              {activeTask?.title}
            </Typography>
            <TextField
              select
              fullWidth
              label="Employee"
              value={assignEmployeeId}
              onChange={(event) => setAssignEmployeeId(event.target.value)}
              sx={FIELD_SX}
            >
              {assignableEmployees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button onClick={assignTaskToEmployee} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
