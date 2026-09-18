import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { Package } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";

export default function ActivitiesScreen() {
  const { projectData, refreshing, refreshProjectData } = useApp();
  const activities = projectData?.activities || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProjectData}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>BOQ & Activities</Text>
            <Text style={styles.subtitle}>
              Planned quantities, progress and schedule baseline
            </Text>
          </View>
        }
        renderItem={({ item: a }) => (
          <View style={styles.activityCard}>
            <View style={styles.cardTop}>
              <Text style={styles.activityName}>{a.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  a.status === "Delayed" && styles.statusBadgeDelayed,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    a.status === "Delayed" && styles.statusBadgeTextDelayed,
                  ]}
                >
                  {a.status}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Plan Progress</Text>
                <Text style={styles.statVal}>{a.planned_progress}%</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Actual Progress</Text>
                <Text
                  style={[
                    styles.statVal,
                    a.status === "Delayed" && { color: colors.danger },
                  ]}
                >
                  {a.actual_progress}%
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statVal}>
                  {a.completed_quantity} {a.unit}
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Qty</Text>
                <Text style={styles.statVal}>
                  {a.planned_quantity} {a.unit}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.planBar,
                  { width: `${Math.min(100, a.planned_progress)}%` },
                ]}
              />
              <View
                style={[
                  styles.actualBar,
                  { width: `${Math.min(100, a.actual_progress)}%` },
                ]}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  header: {
    marginBottom: 6,
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
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeDelayed: {
    backgroundColor: colors.dangerLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.successText,
  },
  statusBadgeTextDelayed: {
    color: colors.dangerText,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    rowGap: 8,
  },
  statCol: {
    width: "50%",
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statVal: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  barContainer: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    position: "relative",
    overflow: "hidden",
  },
  planBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#93c5fd",
  },
  actualBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.primary,
  },
});
