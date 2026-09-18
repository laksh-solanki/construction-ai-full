import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform, NativeModules } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export const getAutoDetectedHost = () => {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoClient?.hostUri ||
      Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
        return ip;
      }
    }

    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:\/]+)/);
      if (match && match[1] && match[1] !== "localhost" && match[1] !== "127.0.0.1") {
        return match[1];
      }
    }
  } catch (e) {
    console.warn("Could not auto-detect dev host:", e);
  }
  return null;
};

export const getDefaultApiUrl = () => {
  const host = getAutoDetectedHost();
  if (host) {
    return `http://${host}:8000`;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
};

const STORAGE_API_KEY = "buildsight_api_url";

export const getBaseUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_API_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // fallback
  }
  return getDefaultApiUrl();
};

export const setBaseUrl = async (url) => {
  const clean = (url || "").trim().replace(/\/+$/, "");
  await AsyncStorage.setItem(STORAGE_API_KEY, clean);
  return clean;
};

export const resetBaseUrl = async () => {
  await AsyncStorage.removeItem(STORAGE_API_KEY);
  return getDefaultApiUrl();
};

const j = async (endpoint, options = {}) => {
  const base = await getBaseUrl();
  const url = `${base}${endpoint}`;
  const headers = {
    ...(options.headers || {}),
  };
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.detail || errJson.message || errMsg;
    } catch {
      try {
        const text = await res.text();
        if (text) errMsg = text;
      } catch {
        // fallback
      }
    }
    throw new Error(errMsg);
  }
  return res.json();
};

// Auth
export const login = async (email, password, role) =>
  j("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });

export const signup = async (email, password, fullName, role) =>
  j("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName, role }),
  });

export const resetPassword = async (email, newPassword) =>
  j("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, new_password: newPassword }),
  });

// Projects
export const projects = async () => j("/api/projects");
export const project = async (id) => j(`/api/projects/${id}`);
export const createProject = async (data) =>
  j("/api/projects", { method: "POST", body: JSON.stringify(data) });
export const updateProject = async (id, data) =>
  j(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProject = async (id) =>
  j(`/api/projects/${id}`, { method: "DELETE" });

// Activities (BOQ)
export const activities = async (projectId) =>
  j(projectId ? `/api/activities?project_id=${projectId}` : "/api/activities");
export const activity = async (id) => j(`/api/activities/${id}`);
export const createActivity = async (data) =>
  j("/api/activities", { method: "POST", body: JSON.stringify(data) });
export const updateActivity = async (id, data) =>
  j(`/api/activities/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteActivity = async (id) =>
  j(`/api/activities/${id}`, { method: "DELETE" });

// Dashboard & Forecast
export const dashboard = async (id) => j(`/api/dashboard?project_id=${id}`);
export const forecast = async (id) => j(`/api/forecast?project_id=${id}`);

// Alerts
export const alerts = async (id) => j(`/api/alerts?project_id=${id}`);
export const createAlert = async (data) =>
  j("/api/alerts", { method: "POST", body: JSON.stringify(data) });
export const ackAlert = async (id) =>
  j(`/api/alerts/${id}/ack`, { method: "POST" });
export const deleteAlert = async (id) =>
  j(`/api/alerts/${id}`, { method: "DELETE" });

// Reports
export const reports = async (id) => j(`/api/reports?project_id=${id}`);
export const report = async (id) => j(`/api/reports/${id}`);
export const users = async () => j("/api/users");

// Materials (IS 1200 / CPWD)
export const materials = async (projectId) =>
  j(projectId ? `/api/materials?project_id=${projectId}` : "/api/materials");
export const createMaterial = async (data) =>
  j("/api/materials", { method: "POST", body: JSON.stringify(data) });

// Labor & Shifts
export const labor = async (projectId) =>
  j(projectId ? `/api/labor?project_id=${projectId}` : "/api/labor");
export const createLabor = async (data) =>
  j("/api/labor", { method: "POST", body: JSON.stringify(data) });

const uploadWithXhr = (url, fields, photo) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(xhr.responseText || `Inference error (${xhr.status})`));
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network connection error: Unable to communicate with server."));
    xhr.ontimeout = () => reject(new Error("Network request timed out."));

    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        formData.append(k, String(v));
      }
    });

    if (photo) {
      const filename = photo.fileName || photo.uri?.split("/").pop() || "evidence.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = photo.mimeType || (match ? `image/${match[1]}` : "image/jpeg");

      if (Platform.OS === "web" && photo.file) {
        formData.append("file", photo.file);
      } else {
        formData.append("file", {
          uri: photo.uri,
          name: filename,
          type,
        });
      }
    }

    xhr.send(formData);
  });
};

export const analyze = async ({
  projectId,
  activityId,
  date,
  notes,
  weather,
  latitude,
  longitude,
  photo,
}) => {
  const base = await getBaseUrl();
  const url = `${base}/api/analyze`;

  const fields = {
    project_id: String(projectId),
    report_date: date || new Date().toISOString().slice(0, 10),
  };
  if (activityId) fields.activity_id = String(activityId);
  if (notes) fields.notes = String(notes);
  if (weather) fields.weather = String(weather);
  if (latitude !== undefined && latitude !== null && latitude !== "")
    fields.latitude = String(latitude);
  if (longitude !== undefined && longitude !== null && longitude !== "")
    fields.longitude = String(longitude);

  // 1. Web browser environment
  if (Platform.OS === "web") {
    const f = new FormData();
    Object.entries(fields).forEach(([k, v]) => f.append(k, v));
    if (photo) {
      const filename = photo.fileName || photo.uri?.split("/").pop() || "evidence.jpg";
      if (photo.file) {
        f.append("file", photo.file);
      } else if (photo.uri) {
        try {
          const resp = await fetch(photo.uri);
          const blob = await resp.blob();
          f.append("file", blob, filename);
        } catch {
          f.append("file", { uri: photo.uri, name: filename });
        }
      }
    }
    const res = await fetch(url, {
      method: "POST",
      body: f,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Inference error (${res.status})`);
    }
    return res.json();
  }

  // 2. Native mobile environment (Expo Go on Android / iOS)
  if (photo?.uri && FileSystem?.uploadAsync) {
    try {
      const filename = photo.fileName || photo.uri.split("/").pop() || "evidence.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = photo.mimeType || (match ? `image/${match[1]}` : "image/jpeg");

      const res = await FileSystem.uploadAsync(url, photo.uri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        mimeType,
        parameters: fields,
        headers: {
          Accept: "application/json",
        },
      });

      if (res.status >= 200 && res.status < 300) {
        return JSON.parse(res.body);
      }
      throw new Error(res.body || `Inference error (${res.status})`);
    } catch (fsErr) {
      if (fsErr.message && fsErr.message.includes("Inference error")) {
        throw fsErr;
      }
      console.warn("FileSystem.uploadAsync fallback to XMLHttpRequest:", fsErr);
    }
  }

  // Fallback to XMLHttpRequest
  return uploadWithXhr(url, fields, photo);
};

export const pdfUrl = async (id) => {
  const base = await getBaseUrl();
  return `${base}/api/reports/${id}/pdf`;
};

export const assetUrl = async (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = await getBaseUrl();
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
};
