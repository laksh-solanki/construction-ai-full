import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from "react-native";
import { MapPin, Image as ImageIcon, ExternalLink } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { assetUrl, pdfUrl } from "../api";

export default function EvidenceScreen() {
  const { reportsData, refreshing, refreshProjectData, serverUrl } = useApp();

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
            <Text style={styles.title}>Site Evidence Archive</Text>
            <Text style={styles.subtitle}>
              Traceable daily site photos with GPS coordinates and AI metrics
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ImageIcon size={34} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No evidence uploaded yet</Text>
            <Text style={styles.emptySub}>
              Snap photos in the AI DPR tab to record site progress.
            </Text>
          </View>
        }
        renderItem={({ item: r }) => {
          const ev = r.evidence?.[0];
          return (
            <View style={styles.card}>
              <View style={styles.imageWrap}>
                {ev?.image_url ? (
                  <Image
                    source={{ uri: assetUrl(ev.image_url, serverUrl) }}
                    style={styles.evidenceImage}
                  />
                ) : (
                  <View style={styles.placeholderImg}>
                    <ImageIcon size={32} color={colors.textLight} />
                  </View>
                )}

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

                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>
                    {new Date(r.report_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={styles.dprNum}>
                    DPR-{String(r.id).padStart(3, "0")}
                  </Text>
                  <View style={styles.weatherChip}>
                    <Text style={styles.weatherText}>{r.weather || "Sunny"}</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <Text style={styles.metricVal}>
                    AI: <Text style={styles.bold}>{r.ai_progress}%</Text>
                  </Text>
                  <Text style={styles.metricVal}>
                    Plan: <Text style={styles.bold}>{r.planned_progress}%</Text>
                  </Text>
                  <Text style={styles.metricVal}>
                    Var:{" "}
                    <Text
                      style={[
                        styles.bold,
                        r.variance < 0 && { color: colors.danger },
                      ]}
                    >
                      {r.variance > 0 ? "+" : ""}
                      {r.variance}%
                    </Text>
                  </Text>
                </View>

                {ev?.latitude && (
                  <View style={styles.geoRow}>
                    <MapPin size={12} color={colors.primary} />
                    <Text style={styles.geoText}>
                      {Number(ev.latitude).toFixed(4)},{" "}
                      {Number(ev.longitude).toFixed(4)}
                    </Text>
                  </View>
                )}

                {r.notes ? (
                  <Text style={styles.notesText}>{r.notes}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.viewPdfBtn}
                  onPress={() => openPdf(r.id)}
                >
                  <Text style={styles.viewPdfBtnText}>View DPR PDF</Text>
                  <ExternalLink size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
    gap: 14,
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
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  imageWrap: {
    height: 180,
    backgroundColor: "#000",
    position: "relative",
  },
  evidenceImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImg: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  riskBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  riskHigh: {
    backgroundColor: colors.danger,
  },
  riskMedium: {
    backgroundColor: colors.warn,
  },
  riskLow: {
    backgroundColor: colors.success,
  },
  riskText: {
    fontSize: 10,
    fontWeight: "800",
  },
  riskTextHigh: {
    color: colors.white,
  },
  riskTextMedium: {
    color: colors.white,
  },
  riskTextLow: {
    color: colors.white,
  },
  dateBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(16, 27, 45, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dateBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dprNum: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  weatherChip: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weatherText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
  },
  metricVal: {
    fontSize: 12,
    color: colors.textMuted,
  },
  bold: {
    fontWeight: "700",
    color: colors.text,
  },
  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  geoText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  notesText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  viewPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  viewPdfBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
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
