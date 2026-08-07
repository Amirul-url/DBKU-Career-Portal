const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const TOKEN_STORAGE_KEYS = {
  access: "dbku_access_token",
  refresh: "dbku_refresh_token",
  session: "dbku_login_session_id",
  user: "dbku_user",
};

let refreshTokenPromise = null;

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

function getRefreshToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.refresh);
}

function getStoredLoginSessionId() {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.session);
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
  const isFormData = options.body instanceof FormData;
  const isPublicAuthRequest =
    path.startsWith("/auth/login/") ||
    path.startsWith("/auth/register/") ||
    path.startsWith("/token/");

  const makeRequest = (token) => {
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(isPublicAuthRequest ? null : accessToken);

  if (response.status === 401 && accessToken && !isPublicAuthRequest) {
    const refreshedAccessToken = await refreshAccessToken();
    if (!refreshedAccessToken) {
      throw new Error("Sesi log masuk telah tamat. Sila log masuk semula.");
    }
    response = await makeRequest(refreshedAccessToken);
  }

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
  if (data.login_session_id) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.session, String(data.login_session_id));
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.session);
  }
  window.dispatchEvent(new Event("dbku:auth-changed"));
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
  localStorage.removeItem(TOKEN_STORAGE_KEYS.session);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.user);
  window.dispatchEvent(new Event("dbku:auth-changed"));
}

export function recordLogoutActivity() {
  return apiRequest("/auth/logout/", {
    method: "POST",
    body: JSON.stringify({
      login_session_id: getStoredLoginSessionId() || undefined,
    }),
  }).catch(() => null);
}

export async function fetchAuthenticatedBlob(url) {
  const makeRequest = (accessToken) =>
    fetch(url, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

  const accessToken = getAccessToken();
  let response = await makeRequest(accessToken);

  if (response.status === 401 && accessToken) {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken) {
      response = await makeRequest(refreshedAccessToken);
    }
  }

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

export function dashboardPathForRole(role) {
  if (role === "superadmin") {
    return "/superadmin/dashboard";
  }

  if (role === "admin") {
    return "/admin/dashboard";
  }

  return "/profile/dashboard";
}

export function dashboardPathForUser(user) {
  return dashboardPathForRole(user?.role);
}

export function getAccessTokenExpiryMs() {
  const token = getAccessToken();
  if (!token) {
    return 0;
  }

  try {
    const payload = JSON.parse(window.atob(token.split(".")[1] || ""));
    return Number(payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

async function requestAccessTokenRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.access) {
      clearAuthSession();
      return null;
    }

    localStorage.setItem(TOKEN_STORAGE_KEYS.access, data.access);
    if (data.refresh) {
      localStorage.setItem(TOKEN_STORAGE_KEYS.refresh, data.refresh);
    }

    return data.access;
  } catch {
    return null;
  }
}

export function refreshAccessToken() {
  if (!refreshTokenPromise) {
    refreshTokenPromise = requestAccessTokenRefresh().finally(() => {
      refreshTokenPromise = null;
    });
  }

  return refreshTokenPromise;
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
