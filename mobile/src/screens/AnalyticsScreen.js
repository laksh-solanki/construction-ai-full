import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  TrendingUp,
  BarChart3,
  Clock3,
  CalendarDays,
  Sparkles,
} from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";

export default function AnalyticsScreen() {
  const { projectData, dashboardData, forecastData, refreshing, refreshProjectData } =
    useApp();

  const p = projectData;
  const dash = dashboardData;
  const fc = forecastData;

  const activities = p?.activities || [];

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
      <View style={styles.header}>
        <Text style={styles.title}>Progress Analytics & AI Forecasting</Text>
        <Text style={styles.subtitle}>
          Compare project velocity against schedule baselines
        </Text>
      </View>

      {/* 4 Metric Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <TrendingUp size={18} color={colors.primary} />
          <Text style={styles.metricTitle}>Actual</Text>
          <Text style={styles.metricVal}>{dash?.overall_actual ?? 0}%</Text>
          <Text style={styles.metricMeta}>Current average</Text>
        </View>

        <View style={styles.metricCard}>
          <BarChart3 size={18} color="#6366f1" />
          <Text style={styles.metricTitle}>Plan</Text>
          <Text style={styles.metricVal}>{dash?.overall_planned ?? 0}%</Text>
          <Text style={styles.metricMeta}>Baseline average</Text>
        </View>

        <View style={styles.metricCard}>
          <Clock3 size={18} color={colors.warn} />
          <Text style={styles.metricTitle}>Daily Trend</Text>
          <Text style={styles.metricVal}>{fc?.daily_trend ?? 0}%</Text>
          <Text style={styles.metricMeta}>Estimated / day</Text>
        </View>

        <View style={styles.metricCard}>
          <CalendarDays size={18} color={colors.success} />
          <Text style={styles.metricTitle}>Forecast</Text>
          <Text style={styles.metricVal}>
            {fc?.estimated_completion ? fc.estimated_completion.slice(5) : "—"}
          </Text>
          <Text style={styles.metricMeta}>Delay {fc?.delay_days ?? 0} days</Text>
        </View>
      </View>

      {/* S-Curve Activity Progress Tracks */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>S-Curve Activity View</Text>
            <Text style={styles.panelSubtitle}>
              Planned baseline vs actual field progress
            </Text>
          </View>
        </View>

        <View style={styles.trackList}>
          {activities.map((a) => (
            <View key={a.id} style={styles.trackItem}>
              <View style={styles.trackHead}>
                <Text style={styles.trackName}>{a.name}</Text>
                <Text style={styles.trackStats}>
                  {a.actual_progress}% actual ({a.planned_progress}% plan)
                </Text>
              </View>

              <View style={styles.barContainer}>
                {/* Planned bar outline */}
                <View
                  style={[
                    styles.planBar,
                    { width: `${Math.min(100, a.planned_progress)}%` },
                  ]}
                />
                {/* Actual bar fill */}
                <View
                  style={[
                    styles.actualBar,
                    { width: `${Math.min(100, a.actual_progress)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* AI Forecast Banner */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastHead}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.forecastTitle}>AI Completion Forecast</Text>
          </View>
          <Text style={styles.forecastText}>
            Projected completion:{" "}
            <Text style={styles.forecastBold}>
              {fc?.estimated_completion || "Calculated from site velocity"}
            </Text>
            . Uses historical DPR trends to dynamically predict delivery risk.
          </Text>
        </View>
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
  header: {
    marginBottom: 4,
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    gap: 4,
  },
  metricTitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
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
    gap: 14,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  panelSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  trackList: {
    gap: 12,
  },
  trackItem: {
    gap: 4,
  },
  trackHead: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trackName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  trackStats: {
    fontSize: 11,
    color: colors.textMuted,
  },
  barContainer: {
    height: 9,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    position: "relative",
    overflow: "hidden",
  },
  planBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#93c5fd",
    borderRadius: 5,
  },
  actualBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  forecastCard: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  forecastHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  forecastTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryText,
  },
  forecastText: {
    fontSize: 12,
    color: "#1e3a8a",
    lineHeight: 18,
  },
  forecastBold: {
    fontWeight: "700",
  },
});
