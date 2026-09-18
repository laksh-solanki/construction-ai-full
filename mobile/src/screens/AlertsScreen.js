import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert as NativeAlert,
} from "react-native";
import { Bell, Check } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { ackAlert } from "../api";

export default function AlertsScreen() {
  const { alertsData, refreshing, refreshProjectData } = useApp();

  const handleAck = async (id) => {
    try {
      await ackAlert(id);
      refreshProjectData();
    } catch (e) {
      NativeAlert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alertsData}
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
            <Text style={styles.title}>Alerts & Risk</Text>
            <Text style={styles.subtitle}>
              Review and acknowledge project schedule deviations
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={34} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No active alerts</Text>
            <Text style={styles.emptySub}>All activities are operating smoothly.</Text>
          </View>
        }
        renderItem={({ item: a }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
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
              <Text style={styles.statusLabel}>
                {a.acknowledged ? "Acknowledged" : "Pending Review"}
              </Text>
            </View>

            <Text style={styles.alertTitle}>{a.title}</Text>
            <Text style={styles.alertMsg}>{a.message}</Text>

            {!a.acknowledged && (
              <TouchableOpacity
                style={styles.ackButton}
                onPress={() => handleAck(a.id)}
              >
                <Check size={14} color={colors.primary} />
                <Text style={styles.ackButtonText}>Acknowledge Alert</Text>
              </TouchableOpacity>
            )}
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
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
  statusLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  alertMsg: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  ackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  ackButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
