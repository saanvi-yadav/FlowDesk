import { apiClient, withAuth } from "./apiClient";

export function fetchTasks() {
  return apiClient.get("/tasks", withAuth());
}

export function createTaskRequest(payload) {
  return apiClient.post("/tasks", payload, withAuth());
}

export function updateTaskStatusRequest(taskId, status) {
  return apiClient.put(`/tasks/${taskId}`, { status }, withAuth());
}

export function assignTaskToEmployeeRequest(payload) {
  return apiClient.post("/assign-task-to-employee", payload, withAuth());
}
