import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  login as apiLogin,
  signup as apiSignup,
  resetPassword as apiResetPassword,
  projects as apiProjects,
  project as apiProject,
  dashboard as apiDashboard,
  alerts as apiAlerts,
  reports as apiReports,
  users as apiUsers,
  forecast as apiForecast,
  materials as apiMaterials,
  labor as apiLabor,
  getBaseUrl,
} from "../api";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projectsList, setProjectsList] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [alertsData, setAlertsData] = useState([]);
  const [reportsData, setReportsData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [materialsData, setMaterialsData] = useState([]);
  const [laborData, setLaborData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [serverUrl, setServerUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const savedAuth = await AsyncStorage.getItem("bs_mobile_auth");
        if (savedAuth) setAuth(JSON.parse(savedAuth));
        const url = await getBaseUrl();
        setServerUrl(url);
      } catch (e) {
        console.warn("Storage init error:", e);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const loginUser = async (email, password, role) => {
    const res = await apiLogin(email, password, role);
    await AsyncStorage.setItem("bs_mobile_auth", JSON.stringify(res));
    setAuth(res);
    return res;
  };

  const signupUser = async (email, password, fullName, role) => {
    const res = await apiSignup(email, password, fullName, role);
    await AsyncStorage.setItem("bs_mobile_auth", JSON.stringify(res));
    setAuth(res);
    return res;
  };

  const resetPasswordUser = async (email, newPassword) => {
    return await apiResetPassword(email, newPassword);
  };

  const logoutUser = async () => {
    await AsyncStorage.removeItem("bs_mobile_auth");
    setAuth(null);
    setProjectsList([]);
    setProjectData(null);
  };

  const refreshProjects = useCallback(async () => {
    try {
      const list = await apiProjects();
      setProjectsList(list || []);
      if (list && list.length > 0 && !projectId) {
        setProjectId(list[0].id);
      }
    } catch (e) {
      console.warn("Fetch projects error:", e.message);
    }
  }, [projectId]);

  const refreshProjectData = useCallback(async () => {
    if (!projectId) return;
    setRefreshing(true);
    try {
      const [pp, dd, aa, rr, uu, ff, mm, ll] = await Promise.all([
        apiProject(projectId).catch(() => null),
        apiDashboard(projectId).catch(() => null),
        apiAlerts(projectId).catch(() => []),
        apiReports(projectId).catch(() => []),
        apiUsers().catch(() => []),
        apiForecast(projectId).catch(() => null),
        apiMaterials(projectId).catch(() => []),
        apiLabor(projectId).catch(() => []),
      ]);
      setProjectData(pp);
      setDashboardData(dd);
      setAlertsData(aa || []);
      setReportsData(rr || []);
      setTeamData(uu || []);
      setForecastData(ff);
      setMaterialsData(mm || []);
      setLaborData(ll || []);
    } catch (e) {
      console.warn("Refresh data error:", e.message);
    } finally {
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (auth) {
      refreshProjects();
    }
  }, [auth, refreshProjects]);

  useEffect(() => {
    if (projectId) {
      refreshProjectData();
    }
  }, [projectId, refreshProjectData]);

  return (
    <AppContext.Provider
      value={{
        auth,
        authLoading,
        loginUser,
        signupUser,
        resetPasswordUser,
        logoutUser,
        projectsList,
        projectId,
        setProjectId,
        projectData,
        dashboardData,
        alertsData,
        reportsData,
        teamData,
        forecastData,
        materialsData,
        laborData,
        refreshing,
        refreshProjectData,
        refreshProjects,
        serverUrl,
        setServerUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
