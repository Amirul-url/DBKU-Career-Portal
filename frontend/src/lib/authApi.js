const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const TOKEN_STORAGE_KEYS = {
  access: "dbku_access_token",
  refresh: "dbku_refresh_token",
  user: "dbku_user",
};

function getMessageFromPayload(payload) {
  if (!payload) {
    return "Permintaan tidak berjaya. Sila cuba lagi.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (payload.detail) {
    return payload.detail;
  }

  if (payload.non_field_errors?.length) {
    return payload.non_field_errors[0];
  }

  const firstError = Object.values(payload).flat().find(Boolean);
  if (firstError) {
    return Array.isArray(firstError) ? firstError[0] : firstError;
  }

  return "Permintaan tidak berjaya. Sila semak maklumat yang dimasukkan.";
}

function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.access);
}

async function authRequest(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getMessageFromPayload(data));
  }

  return data;
}

export async function apiRequest(path, options = {}) {
  const accessToken = getAccessToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getMessageFromPayload(data));
  }

  return data;
}

export function saveAuthSession(data) {
  localStorage.setItem(TOKEN_STORAGE_KEYS.access, data.access);
  localStorage.setItem(TOKEN_STORAGE_KEYS.refresh, data.refresh);
  localStorage.setItem(TOKEN_STORAGE_KEYS.user, JSON.stringify(data.user));
}

export function saveStoredUser(user) {
  localStorage.setItem(TOKEN_STORAGE_KEYS.user, JSON.stringify(user));
}

export function getStoredUser() {
  const storedUser = localStorage.getItem(TOKEN_STORAGE_KEYS.user);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEYS.access);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.refresh);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.user);
}

export function recordLogoutActivity() {
  return apiRequest("/auth/logout/", { method: "POST" }).catch(() => null);
}

export async function fetchAuthenticatedBlob(url) {
  const accessToken = getAccessToken();
  const headers = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error("Fail tidak dapat dibuka. Sila cuba lagi.");
  }

  return response.blob();
}

export function registerApplicant({ fullName, email, password, password2 }) {
  return authRequest("/auth/register/", {
    full_name: fullName.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    password,
    password2,
  });
}

export function loginApplicant({ email, password }) {
  return authRequest("/auth/login/", {
    email: email.trim().toLowerCase(),
    password,
  });
}

export function updateCurrentUser(formData) {
  return apiRequest("/auth/me/", {
    method: "PATCH",
    body: formData,
  }).then((user) => {
    saveStoredUser(user);
    return user;
  });
}
