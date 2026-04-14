/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import {
  getStoredUser,
  clearStoredUser,
  getAuthHeaders,
  API_BASE_URL,
} from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (
      !user?.id ||
      !user?.email ||
      !user?.role ||
      !getAuthHeaders().Authorization
    ) {
      setChecked(true);
      setAllowed(false);
      return;
    }

    axios
      .get(`${API_BASE_URL}/me`, { headers: getAuthHeaders() })
      .then(() => {
        setAllowed(true);
      })
      .catch(() => {
        clearStoredUser();
        setAllowed(false);
      })
      .finally(() => {
        setChecked(true);
      });
  }, []);

  if (!checked) {
    return null;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
