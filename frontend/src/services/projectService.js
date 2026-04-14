import { apiClient, withAuth } from "./apiClient";

export function fetchProjects() {
  return apiClient.get("/projects", withAuth());
}

export function fetchDepartmentManager(departmentId) {
  return apiClient.get(`/departments/${departmentId}/manager`, withAuth());
}

export function createProjectRequest(payload) {
  return apiClient.post("/projects", payload, withAuth());
}

export function updateProjectRequest(projectId, payload) {
  return apiClient.put(`/projects/${projectId}`, payload, withAuth());
}
