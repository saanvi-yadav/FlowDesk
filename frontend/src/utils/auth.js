const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function setStoredUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function setStoredAuth(user, token) {
  setStoredUser(user);
  localStorage.setItem("authToken", token);
}

export function clearStoredUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
}

export function getAuthHeaders() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export { API_BASE_URL };
