import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from "react-native";
import { FileText, ExternalLink } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { pdfUrl } from "../api";

export default function ReportsScreen() {
  const { reportsData, refreshing, refreshProjectData } = useApp();

  const openPdf = async (id) => {
    const url = await pdfUrl(id);
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reportsData}
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
            <Text style={styles.title}>Daily Report Archive</Text>
            <Text style={styles.subtitle}>
              Reopen and download generated planned-vs-actual DPRs
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={36} color={colors.textLight} />
            <Text style={styles.emptyText}>No DPRs generated yet.</Text>
            <Text style={styles.emptySub}>
              Use the AI DPR tab to capture site photos and generate reports.
            </Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <View style={styles.dprBadge}>
                <Text style={styles.dprBadgeText}>
                  DPR-{String(r.id).padStart(3, "0")}
                </Text>
              </View>
              <View
                style={[
                  styles.riskBadge,
                  r.risk === "HIGH"
                    ? styles.riskHigh
                    : r.risk === "MEDIUM"
                    ? styles.riskMedium
                    : styles.riskLow,
                ]}
              >
                <Text
                  style={[
                    styles.riskText,
                    r.risk === "HIGH"
                      ? styles.riskTextHigh
                      : r.risk === "MEDIUM"
                      ? styles.riskTextMedium
                      : styles.riskTextLow,
                  ]}
                >
                  {r.risk}
                </Text>
              </View>
            </View>

            <Text style={styles.reportDate}>
              {new Date(r.report_date).toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>AI Progress</Text>
                <Text style={styles.metricVal}>{r.ai_progress}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Confidence</Text>
                <Text style={styles.metricVal}>{r.confidence}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Variance</Text>
                <Text
                  style={[
                    styles.metricVal,
                    r.variance < 0 && { color: colors.danger },
                  ]}
                >
                  {r.variance > 0 ? "+" : ""}
                  {r.variance}%
                </Text>
              </View>
              {r.weather && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Weather</Text>
                  <Text style={styles.metricVal}>{r.weather}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.openPdfBtn}
              onPress={() => openPdf(r.id)}
            >
              <Text style={styles.openPdfBtnText}>View DPR PDF</Text>
              <ExternalLink size={13} color={colors.primary} />
            </TouchableOpacity>
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
    marginBottom: 8,
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
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dprBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dprBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryText,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskHigh: {
    backgroundColor: colors.dangerLight,
  },
  riskMedium: {
    backgroundColor: colors.warnLight,
  },
  riskLow: {
    backgroundColor: colors.successLight,
  },
  riskText: {
    fontSize: 10,
    fontWeight: "700",
  },
  riskTextHigh: {
    color: colors.dangerText,
  },
  riskTextMedium: {
    color: colors.warnText,
  },
  riskTextLow: {
    color: colors.successText,
  },
  reportDate: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  metricsRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    justifyContent: "space-between",
  },
  metricItem: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  openPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openPdfBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
});
