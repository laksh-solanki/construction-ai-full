import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Server } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { setBaseUrl } from "../api";
import { isSupabaseConfigured } from "../supabase";

export default function LoginScreen() {
  const { loginUser, signupUser, resetPasswordUser, serverUrl, setServerUrl } =
    useApp();
  const [tab, setTab] = useState("login"); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState("pm.sharma@buildsight.ai");
  const [password, setPassword] = useState("SecureSite2026!");
  const [fullName, setFullName] = useState("Er. Rajesh Sharma");
  const [role, setRole] = useState("PROJECT_MANAGER");
  const [busy, setBusy] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);

  const roles = [
    { id: "PROJECT_MANAGER", label: "Project Manager" },
    { id: "SITE_ENGINEER", label: "Site Engineer" },
    { id: "QUALITY_ENGINEER", label: "QC Engineer" },
    { id: "SAFETY_OFFICER", label: "Safety Officer" },
    { id: "ADMIN", label: "Director / Admin" },
  ];

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Required Fields", "Please enter corporate email and password.");
      return;
    }
    setBusy(true);
    try {
      if (tab === "login") {
        await loginUser(email, password, role);
      } else if (tab === "signup") {
        await signupUser(email, password, fullName, role);
        Alert.alert("Account Created", "Engineer profile registered successfully.");
      } else if (tab === "reset") {
        const res = await resetPasswordUser(email, password);
        Alert.alert(
          "Password Reset",
          res.message || "Password updated successfully. Please sign in."
        );
        setTab("login");
      }
    } catch (err) {
      Alert.alert(
        "Authentication Notice",
        `${err.message}\n\nMake sure the backend is reachable at:\n${serverUrl || "http://localhost:8000"}`
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveUrl = async () => {
    const updated = await setBaseUrl(customUrl);
    setServerUrl(updated);
    Alert.alert("Saved", `Server API endpoint set to:\n${updated}`);
    setShowServerConfig(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>B</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>BuildSight AI</Text>
              <Text style={styles.logoSubtitle}>
                Civil Infrastructure Intelligence
              </Text>
            </View>
          </View>

          <View style={styles.eyebrowBadge}>
            <Text style={styles.eyebrowText}>
              ENTERPRISE CIVIL SUITE • IS 1200 / CPWD
            </Text>
          </View>

          <Text style={styles.heading}>Site Progress & Quality</Text>
          <Text style={styles.description}>
            Computer vision daily progress reporting, BOQ measurement tracking,
            and CPWD quality compliance verification.
          </Text>

          {/* Auth Mode Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "login" && styles.tabBtnActive]}
              onPress={() => setTab("login")}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tab === "login" && styles.tabBtnTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "signup" && styles.tabBtnActive]}
              onPress={() => setTab("signup")}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tab === "signup" && styles.tabBtnTextActive,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "reset" && styles.tabBtnActive]}
              onPress={() => setTab("reset")}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tab === "reset" && styles.tabBtnTextActive,
                ]}
              >
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {tab === "signup" && (
              <>
                <Text style={styles.fieldLabel}>Full Name & Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Er. Rajesh Sharma"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Corporate Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.fieldLabel}>
              {tab === "reset" ? "New Password" : "Password"}
            </Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {tab !== "reset" && (
              <>
                <Text style={styles.fieldLabel}>Civil Engineering Role</Text>
                <View style={styles.rolesGrid}>
                  {roles.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.roleChip,
                        role === r.id && styles.roleChipActive,
                      ]}
                      onPress={() => setRole(r.id)}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          role === r.id && styles.roleChipTextActive,
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={busy}
              activeOpacity={0.8}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>
                  {tab === "login"
                    ? "Authorize & Access Site Portal"
                    : tab === "signup"
                      ? "Create Engineer Profile"
                      : "Update Site Password"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              {isSupabaseConfigured
                ? "Protected by Supabase Cloud Authentication & PostgreSQL TLS"
                : "Local Enterprise DB & Cryptographic Hash Protection"}
            </Text>

            <TouchableOpacity
              style={styles.serverToggle}
              onPress={() => {
                setCustomUrl(serverUrl);
                setShowServerConfig(!showServerConfig);
              }}
            >
              <Server size={14} color={colors.textMuted} />
              <Text style={styles.serverToggleText}>
                Backend: {serverUrl || "Auto-detecting"}
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.serverBox}>
                <Text style={styles.serverBoxTitle}>Backend Server URL</Text>
                <Text style={styles.serverBoxDesc}>
                  Enter your PC's IP (e.g. http://192.168.1.10:8000). In Expo
                  Go, this is auto-detected.
                </Text>
                <TextInput
                  style={styles.input}
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSaveUrl}
                >
                  <Text style={styles.secondaryButtonText}>
                    Save Server URL
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.navy,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logoMarkText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  logoSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eyebrowBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 8,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.primary,
  },
  form: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMain,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.textMain,
    minHeight: 46,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 6,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    minHeight: 38,
    justifyContent: "center",
  },
  roleChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  roleChipTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  note: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 14,
  },
  serverToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    minHeight: 40,
  },
  serverToggleText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  serverBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    gap: 8,
  },
  serverBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMain,
  },
  serverBoxDesc: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMain,
  },
});
