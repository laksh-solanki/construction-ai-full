import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { CalendarDays, ArrowRight } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";

export default function ScheduleScreen() {
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
            <Text style={styles.title}>Project Schedule</Text>
            <Text style={styles.subtitle}>
              Activity baseline start and target completion dates
            </Text>
          </View>
        }
        renderItem={({ item: a }) => (
          <View style={styles.card}>
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
                    styles.statusText,
                    a.status === "Delayed" && styles.statusTextDelayed,
                  ]}
                >
                  {a.status}
                </Text>
              </View>
            </View>

            <View style={styles.dateBox}>
              <CalendarDays size={15} color={colors.primary} />
              <Text style={styles.dateText}>
                {a.planned_start || "—"}
              </Text>
              <ArrowRight size={13} color={colors.textLight} />
              <Text style={styles.dateText}>
                {a.planned_end || "—"}
              </Text>
            </View>

            <View style={styles.progressFooter}>
              <Text style={styles.progressText}>
                Progress: {a.actual_progress}% of {a.planned_progress}% plan
              </Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    gap: 10,
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
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.successText,
  },
  statusTextDelayed: {
    color: colors.dangerText,
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
