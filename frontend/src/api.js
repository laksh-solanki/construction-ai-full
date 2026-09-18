const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const j = async (u, o = {}) => {
  const headers = {
    ...(o.headers || {}),
  };
  if (o.body && !(o.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const r = await fetch(`${API}${u}`, {
    ...o,
    headers,
  });

  if (!r.ok) {
    let errMsg = `Request failed (${r.status})`;
    try {
      const errJson = await r.json();
      errMsg = errJson.detail || errJson.message || errMsg;
    } catch {
      try {
        const errText = await r.text();
        if (errText) errMsg = errText;
      } catch {
        // use fallback errMsg
      }
    }
    throw new Error(errMsg);
  }
  return r.json();
};

// Authentication
export const login = (email, password, role) =>
  j("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });

export const signup = (email, password, fullName, role) =>
  j("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName, role }),
  });

export const resetPassword = (email, newPassword) =>
  j("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, new_password: newPassword }),
  });

// Projects CRUD
export const projects = () => j("/api/projects");
export const project = (id) => j(`/api/projects/${id}`);
export const createProject = (data) =>
  j("/api/projects", { method: "POST", body: JSON.stringify(data) });
export const updateProject = (id, data) =>
  j(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProject = (id) =>
  j(`/api/projects/${id}`, { method: "DELETE" });

// Activities (BOQ) CRUD
export const activities = (projectId) =>
  j(projectId ? `/api/activities?project_id=${projectId}` : "/api/activities");
export const activity = (id) => j(`/api/activities/${id}`);
export const createActivity = (data) =>
  j("/api/activities", { method: "POST", body: JSON.stringify(data) });
export const updateActivity = (id, data) =>
  j(`/api/activities/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteActivity = (id) =>
  j(`/api/activities/${id}`, { method: "DELETE" });

// Dashboard & Forecast
export const dashboard = (id) => j(`/api/dashboard?project_id=${id}`);
export const forecast = (id) => j(`/api/forecast?project_id=${id}`);

// Alerts Management
export const alerts = (id) => j(`/api/alerts?project_id=${id}`);
export const createAlert = (data) =>
  j("/api/alerts", { method: "POST", body: JSON.stringify(data) });
export const ackAlert = (id) =>
  j(`/api/alerts/${id}/ack`, { method: "POST" });
export const deleteAlert = (id) =>
  j(`/api/alerts/${id}`, { method: "DELETE" });

// Reports
export const reports = (id) => j(`/api/reports?project_id=${id}`);
export const report = (id) => j(`/api/reports/${id}`);
export const updateReport = (id, data) =>
  j(`/api/reports/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Materials Management (IS 1200 / CPWD)
export const materials = (projectId) =>
  j(projectId ? `/api/materials?project_id=${projectId}` : "/api/materials");
export const createMaterial = (data) =>
  j("/api/materials", { method: "POST", body: JSON.stringify(data) });

// Labor Force & Attendance (IS 1200 / CPWD)
export const labor = (projectId) =>
  j(projectId ? `/api/labor?project_id=${projectId}` : "/api/labor");
export const createLabor = (data) =>
  j("/api/labor", { method: "POST", body: JSON.stringify(data) });

// Users
export const users = () => j("/api/users");

// AI Vision & Progress Analysis
export const analyze = async ({
  projectId,
  activityId,
  date,
  notes,
  weather,
  latitude,
  longitude,
  file,
}) => {
  const f = new FormData();
  f.append("project_id", projectId);
  if (activityId) f.append("activity_id", activityId);
  f.append("report_date", date);
  if (notes) f.append("notes", notes);
  if (weather) f.append("weather", weather);
  if (latitude !== undefined && latitude !== null)
    f.append("latitude", latitude);
  if (longitude !== undefined && longitude !== null)
    f.append("longitude", longitude);
  f.append("file", file);
  return j("/api/analyze", { method: "POST", body: f });
};

export const pdfUrl = (id) => `${API}/api/reports/${id}/pdf`;
export const assetUrl = (path) =>
  path ? `${API}${path.startsWith("/") ? path : "/" + path}` : "";
