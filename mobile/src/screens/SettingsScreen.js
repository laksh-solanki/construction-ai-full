import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LogOut, Server, Cpu, FileText, CheckCircle2, RotateCcw } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { setBaseUrl, resetBaseUrl } from "../api";

export default function SettingsScreen() {
  const { auth, logoutUser, serverUrl, setServerUrl, refreshProjects } = useApp();
  const [urlInput, setUrlInput] = useState(serverUrl);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    try {
      const updated = await setBaseUrl(urlInput);
      setServerUrl(updated);
      Alert.alert("Success", `Backend API server updated to:\n${updated}`);
      refreshProjects();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleReset = async () => {
    const def = await resetBaseUrl();
    setUrlInput(def);
    setServerUrl(def);
    Alert.alert("Reset", `Backend URL reset to default:\n${def}`);
    refreshProjects();
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const clean = (urlInput || "").trim().replace(/\/+$/, "");
      const res = await fetch(`${clean}/api/projects`, { method: "GET" });
      if (res.ok) {
        Alert.alert("Success", "Successfully connected to BuildSight AI Backend!");
      } else {
        Alert.alert("Response Notice", `Backend returned HTTP status ${res.status}`);
      }
    } catch (err) {
      Alert.alert(
        "Connection Failed",
        `Could not reach backend:\n${err.message}\n\nEnsure FastAPI is running: python -m uvicorn app.main:app --port 8000`
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings & Configuration</Text>
        <Text style={styles.subtitle}>
          Mobile application and backend connectivity
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Signed-in Account</Text>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.val}>{auth?.user?.email || "demo"}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.val}>{auth?.user?.role || "PROJECT_MANAGER"}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.val}>{auth?.user?.name || "User"}</Text>
        </View>
      </View>

      {/* Backend API Configuration */}
      <View style={styles.panel}>
        <View style={styles.rowBetween}>
          <Text style={styles.panelTitle}>Backend API Host</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <RotateCcw size={13} color={colors.primary} />
            <Text style={styles.resetText}>Reset Default</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>
          When running in Expo Go on your mobile phone, the backend server URL is
          automatically configured to your PC's IP address. You can also specify your
          PC's Wi-Fi IP manually (e.g. <Text style={styles.bold}>http://192.168.1.5:8000</Text>).
        </Text>

        <TextInput
          style={styles.input}
          value={urlInput}
          onChangeText={setUrlInput}
          autoCapitalize="none"
          placeholder="http://192.168.1.5:8000"
        />

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTest}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Server size={14} color={colors.primary} />
                <Text style={styles.testBtnText}>Test Connection</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save URL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prototype Configuration */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>System Diagnostics</Text>
        <View style={styles.settingRow}>
          <View style={styles.iconLabel}>
            <Cpu size={15} color={colors.primary} />
            <Text style={styles.label}>AI Model</Text>
          </View>
          <Text style={styles.val}>YOLOv8 via ai-model/weights/best.pt</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.iconLabel}>
            <FileText size={15} color={colors.success} />
            <Text style={styles.label}>PDF Reports</Text>
          </View>
          <Text style={styles.val}>ReportLab Active</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logoutUser}
        activeOpacity={0.8}
      >
        <LogOut size={16} color={colors.danger} />
        <Text style={styles.logoutButtonText}>Sign Out of BuildSight AI</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    gap: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resetText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
  val: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  bold: {
    fontWeight: "700",
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    minHeight: 44,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  testBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  testBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    minHeight: 48,
  },
  logoutButtonText: {
    color: colors.dangerText,
    fontSize: 14,
    fontWeight: "700",
  },
});
