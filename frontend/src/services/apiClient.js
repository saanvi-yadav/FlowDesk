import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../utils/auth";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export function withAuth(config = {}) {
  return {
    ...config,
    headers: {
      ...getAuthHeaders(),
      ...(config.headers || {}),
    },
  };
}
