import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  BarChart3,
  Camera,
  Package,
  Bell,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";

export default function DashboardScreen({ navigation }) {
  const { projectData, dashboardData, alertsData, refreshing, refreshProjectData } =
    useApp();

  const p = projectData;
  const dash = dashboardData;
  const als = alertsData;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshProjectData}
          colors={[colors.primary]}
        />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeInfo}>
          <Text style={styles.welcomeTitle}>{p?.name || "Metro Viaduct Elevated Package 02"}</Text>
          <Text style={styles.welcomeSubtitle}>
            {p?.location || "Sector 62, Noida, Uttar Pradesh"} • Client:{" "}
            {p?.client || "National Highways Authority of India (NHAI)"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.aiDprButton}
          onPress={() => navigation.navigate("AI DPR")}
          activeOpacity={0.8}
        >
          <Camera size={18} color={colors.white} />
          <Text style={styles.aiDprButtonText}>Create AI DPR</Text>
        </TouchableOpacity>
      </View>

      {/* 4 Metric Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: "#eff6ff" }]}>
            <BarChart3 size={18} color={colors.primary} />
          </View>
          <Text style={styles.metricTitle}>Overall Progress</Text>
          <Text style={styles.metricValue}>{dash?.overall_actual ?? 0}%</Text>
          <Text style={styles.metricMeta}>
            Plan {dash?.overall_planned ?? 0}%
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: "#f0fdf4" }]}>
            <Package size={18} color={colors.success} />
          </View>
          <Text style={styles.metricTitle}>Activities</Text>
          <Text style={styles.metricValue}>{dash?.activities ?? 0}</Text>
          <Text style={styles.metricMeta}>Tracked fronts</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: "#fef2f2" }]}>
            <Bell size={18} color={colors.danger} />
          </View>
          <Text style={styles.metricTitle}>Open Alerts</Text>
          <Text style={[styles.metricValue, { color: colors.danger }]}>
            {dash?.open_alerts ?? 0}
          </Text>
          <Text style={styles.metricMeta}>Needs review</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: "#f8fafc" }]}>
            <FileText size={18} color="#475569" />
          </View>
          <Text style={styles.metricTitle}>DPRs</Text>
          <Text style={styles.metricValue}>{dash?.reports ?? 0}</Text>
          <Text style={styles.metricMeta}>Evidence reports</Text>
        </View>
      </View>

      {/* Planned vs Actual Panel */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Planned vs Actual</Text>
            <Text style={styles.panelSubtitle}>Current activity performance</Text>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#93c5fd" }]} />
              <Text style={styles.legendText}>Plan</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
          </View>
        </View>

        <View style={styles.activityList}>
          {p?.activities?.map((a) => (
            <View style={styles.progressRow} key={a.id}>
              <View style={styles.rowHead}>
                <Text style={styles.activityName}>{a.name}</Text>
                <Text style={styles.activityStats}>
                  {a.actual_progress}% act / {a.planned_progress}% plan
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barPlanned,
                    { width: `${Math.min(100, a.planned_progress)}%` },
                  ]}
                />
                <View
                  style={[
                    styles.barActual,
                    { width: `${Math.min(100, a.actual_progress)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Project Signals Panel */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Project Signals</Text>
            <Text style={styles.panelSubtitle}>What needs attention</Text>
          </View>
        </View>

        <View style={styles.signalCard}>
          <View style={[styles.signalIcon, { backgroundColor: colors.successLight }]}>
            <CheckCircle2 size={18} color={colors.success} />
          </View>
          <View style={styles.signalBody}>
            <Text style={styles.signalTitle}>Evidence-first workflow</Text>
            <Text style={styles.signalText}>
              Daily site photos are geotagged and attached directly to DPRs.
            </Text>
          </View>
        </View>

        <View style={styles.signalCard}>
          <View style={[styles.signalIcon, { backgroundColor: colors.warnLight }]}>
            <AlertTriangle size={18} color={colors.warn} />
          </View>
          <View style={styles.signalBody}>
            <Text style={styles.signalTitle}>Column activity behind plan</Text>
            <Text style={styles.signalText}>
              Current variance is -8% against baseline schedule.
            </Text>
          </View>
        </View>

        <View style={styles.signalCard}>
          <View style={[styles.signalIcon, { backgroundColor: colors.primaryLight }]}>
            <TrendingUp size={18} color={colors.primary} />
          </View>
          <View style={styles.signalBody}>
            <Text style={styles.signalTitle}>AI forecast ready</Text>
            <Text style={styles.signalText}>
              Analytics uses report history to estimate project completion.
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Alerts Panel */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Recent Alerts</Text>
            <Text style={styles.panelSubtitle}>Delay and evidence signals</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Alerts")}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {als.slice(0, 4).map((a) => (
          <View style={styles.alertRow} key={a.id}>
            <View
              style={[
                styles.severityBadge,
                a.severity === "HIGH"
                  ? styles.severityHigh
                  : a.severity === "MEDIUM"
                  ? styles.severityMedium
                  : styles.severityLow,
              ]}
            >
              <Text
                style={[
                  styles.severityText,
                  a.severity === "HIGH"
                    ? styles.severityTextHigh
                    : a.severity === "MEDIUM"
                    ? styles.severityTextMedium
                    : styles.severityTextLow,
                ]}
              >
                {a.severity}
              </Text>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>{a.title}</Text>
              <Text style={styles.alertMessage}>{a.message}</Text>
            </View>
            <Text style={styles.alertStatus}>
              {a.acknowledged ? "Ack" : "Open"}
            </Text>
          </View>
        ))}
      </View>
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
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    gap: 12,
  },
  welcomeInfo: {},
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  aiDprButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 1,
  },
  aiDprButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginVertical: 2,
  },
  metricMeta: {
    fontSize: 11,
    color: colors.textLight,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  panelSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  activityList: {
    gap: 12,
  },
  progressRow: {},
  rowHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  activityName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  activityStats: {
    fontSize: 11,
    color: colors.textMuted,
  },
  barTrack: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  barPlanned: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#93c5fd",
    borderRadius: 4,
  },
  barActual: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  signalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  signalIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  signalBody: {
    flex: 1,
  },
  signalTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  signalText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityHigh: {
    backgroundColor: colors.dangerLight,
  },
  severityMedium: {
    backgroundColor: colors.warnLight,
  },
  severityLow: {
    backgroundColor: colors.primaryLight,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  severityTextHigh: {
    color: colors.dangerText,
  },
  severityTextMedium: {
    color: colors.warnText,
  },
  severityTextLow: {
    color: colors.primaryText,
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  alertMessage: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  alertStatus: {
    fontSize: 11,
    color: colors.textLight,
  },
});
