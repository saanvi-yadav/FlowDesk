import { apiClient } from "./apiClient";

export function loginRequest(payload) {
  return apiClient.post("/login", payload);
}

export function registerRequest(payload) {
  return apiClient.post("/register", payload);
}
