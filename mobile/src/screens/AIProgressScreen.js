import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  Camera,
  Image as ImageIcon,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Navigation,
  CheckCircle2,
  X,
  FileText,
  ChevronDown,
  Upload,
} from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";
import { analyze, pdfUrl, assetUrl } from "../api";

export default function AIProgressScreen() {
  const { projectData, projectId, refreshProjectData, serverUrl } = useApp();

  const [activityId, setActivityId] = useState("");
  const [weather, setWeather] = useState("Sunny");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  const activities = projectData?.activities || [];

  useEffect(() => {
    if (activities.length > 0 && !activityId) {
      setActivityId(activities[0].id);
    }
  }, [activities, activityId]);

  const weatherOptions = [
    { id: "Sunny", label: "Sunny", icon: Sun },
    { id: "Cloudy", label: "Cloudy", icon: Cloud },
    { id: "Rainy", label: "Rainy", icon: CloudRain },
    { id: "Wind/Heat", label: "Wind/Heat", icon: Wind },
  ];

  const handleGetGPS = async () => {
    setGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access device location was denied."
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      });
    } catch (err) {
      Alert.alert("GPS Error", err.message || "Failed to detect GPS coordinates");
    } finally {
      setGeoLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Camera permission is required to take site photos.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setPhoto(res.assets[0]);
      }
    } catch (e) {
      Alert.alert("Camera Error", e.message);
    }
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setPhoto(res.assets[0]);
      }
    } catch (e) {
      Alert.alert("Gallery Error", e.message);
    }
  };

  const runAnalysis = async () => {
    if (!photo) {
      Alert.alert("Photo Required", "Please take or upload a site evidence photo first.");
      return;
    }
    setBusy(true);
    try {
      const r = await analyze({
        projectId,
        activityId,
        date: new Date().toISOString().slice(0, 10),
        notes,
        weather,
        latitude: coords.lat,
        longitude: coords.lon,
        photo,
      });
      setResult(r);
      refreshProjectData();
    } catch (e) {
      Alert.alert("AI Inference Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  const openPdf = async (reportId) => {
    const url = await pdfUrl(reportId);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("PDF URL", url);
      }
    } catch {
      Linking.openURL(url);
    }
  };

  const selectedActivity = activities.find((a) => a.id === activityId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Hero Banner */}
      <View style={styles.hero}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>YOLOV8 CIVIL COMPUTER VISION</Text>
        </View>
        <Text style={styles.heroTitle}>From Site Evidence to Certified DPR</Text>
        <Text style={styles.heroSubtitle}>
          Capture site evidence with high-resolution preview, GPS geotagging, and weather context.
          YOLOv8 civil weights inspect visible structural work, benchmark against IS 1200 / CPWD
          specifications, and generate an official planned-vs-actual DPR with PPE compliance tracking.
        </Text>
      </View>

      {/* Step 1: Capture & Context */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>1. Capture & Context</Text>
        <Text style={styles.panelSubtitle}>
          Select activity, site conditions and evidence
        </Text>

        {/* Activity Selector */}
        <Text style={styles.fieldLabel}>Activity Workfront</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setActivityModalVisible(true)}
        >
          <Text style={styles.pickerButtonText} numberOfLines={1}>
            {selectedActivity
              ? `${selectedActivity.name} (${selectedActivity.actual_progress}% act / ${selectedActivity.planned_progress}% plan)`
              : "Select Activity..."}
          </Text>
          <ChevronDown size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Weather Selector */}
        <Text style={styles.fieldLabel}>Site Weather</Text>
        <View style={styles.weatherRow}>
          {weatherOptions.map((w) => {
            const Icon = w.icon;
            const active = weather === w.id;
            return (
              <TouchableOpacity
                key={w.id}
                style={[styles.weatherBtn, active && styles.weatherBtnActive]}
                onPress={() => setWeather(w.id)}
              >
                <Icon
                  size={14}
                  color={active ? colors.white : colors.textMuted}
                />
                <Text
                  style={[
                    styles.weatherBtnText,
                    active && styles.weatherBtnTextActive,
                  ]}
                >
                  {w.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Geotagging */}
        <Text style={styles.fieldLabel}>Geotagging & Coordinates</Text>
        <View style={styles.geoRow}>
          <TouchableOpacity
            style={[styles.geoBtn, coords.lat && styles.geoBtnActive]}
            onPress={handleGetGPS}
            disabled={geoLoading}
          >
            <Navigation
              size={14}
              color={coords.lat ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.geoBtnText,
                coords.lat && styles.geoBtnTextActive,
              ]}
            >
              {geoLoading
                ? "Detecting GPS..."
                : coords.lat
                ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
                : "Auto-Detect Site GPS"}
            </Text>
          </TouchableOpacity>

          {coords.lat && (
            <View style={styles.geoBadge}>
              <CheckCircle2 size={12} color={colors.success} />
              <Text style={styles.geoBadgeText}>Tagged</Text>
            </View>
          )}
        </View>

        {/* Site Diary Notes */}
        <Text style={styles.fieldLabel}>Site Diary Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Observations, workfront grid/zone, gang count..."
          placeholderTextColor={colors.textLight}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Photo Evidence Capture */}
        <View style={styles.captureHeader}>
          <Text style={styles.fieldLabel}>Evidence Photo</Text>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Camera size={13} color={colors.primary} />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <ImageIcon size={13} color={colors.primary} />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {photo ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photo.uri }} style={styles.evidenceThumb} />
            <View style={styles.previewDetails}>
              <Text style={styles.previewFilename} numberOfLines={1}>
                {photo.fileName || "site_photo.jpg"}
              </Text>
              <Text style={styles.previewMeta}>
                {photo.fileSize
                  ? `${(photo.fileSize / 1024).toFixed(1)} KB`
                  : "Ready for inference"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setPhoto(null)}
            >
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.dropZone} onPress={pickImage}>
            <Upload size={28} color={colors.textLight} />
            <Text style={styles.dropTitle}>Snap or select construction photo</Text>
            <Text style={styles.dropSubtitle}>
              JPG, PNG from device camera or site gallery
            </Text>
          </TouchableOpacity>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.runButton,
            (!photo || busy) && styles.runButtonDisabled,
          ]}
          onPress={runAnalysis}
          disabled={!photo || busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <View style={styles.btnRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.runButtonText}>Running AI Inference...</Text>
            </View>
          ) : (
            <Text style={styles.runButtonText}>Analyse With AI</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Step 2: AI Inspection & Verification */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>2. AI Inspection & Verification</Text>
        <Text style={styles.panelSubtitle}>
          Computer vision detections, visible progress and risk
        </Text>

        {!result ? (
          <View style={styles.emptyBox}>
            <Camera size={34} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No AI analysis yet</Text>
            <Text style={styles.emptyDesc}>
              Snap or upload site evidence above to run AI detection and generate a
              planned-vs-actual DPR.
            </Text>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {/* Analyzed Image Preview */}
            {result.image_url && (
              <View style={styles.resultImageWrap}>
                <Image
                  source={{ uri: assetUrl(result.image_url, serverUrl) }}
                  style={styles.resultImage}
                />
                <View style={styles.overlayTags}>
                  {result.detections?.map((d, i) => (
                    <View key={i} style={styles.tagBadge}>
                      <View style={styles.tagDot} />
                      <Text style={styles.tagText}>
                        {d.label} ({d.confidence}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Top Metrics Row */}
            <View style={styles.resultTopGrid}>
              <View style={styles.resultMetric}>
                <Text style={styles.resultMetricLabel}>Visible progress</Text>
                <Text style={styles.resultMetricVal}>{result.progress}%</Text>
              </View>
              <View style={styles.resultMetric}>
                <Text style={styles.resultMetricLabel}>Confidence</Text>
                <Text style={styles.resultMetricVal}>{result.confidence}%</Text>
              </View>
              <View style={styles.resultMetric}>
                <Text style={styles.resultMetricLabel}>Risk</Text>
                <Text
                  style={[
                    styles.resultMetricVal,
                    result.risk === "HIGH" && { color: colors.danger },
                  ]}
                >
                  {result.risk}
                </Text>
              </View>
            </View>

            {/* Inference Mode & Info */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Mode: <Text style={styles.metaBold}>{result.mode}</Text>
                {result.weather && ` • Weather: ${result.weather}`}
                {result.latitude &&
                  ` • GPS: ${Number(result.latitude).toFixed(4)}, ${Number(
                    result.longitude
                  ).toFixed(4)}`}
              </Text>
            </View>

            {/* Planned vs Variance */}
            <View style={styles.compareGrid}>
              <View style={styles.compareCol}>
                <Text style={styles.compareLabel}>Planned</Text>
                <Text style={styles.compareVal}>{result.planned_progress}%</Text>
              </View>
              <View style={styles.compareCol}>
                <Text style={styles.compareLabel}>Variance</Text>
                <Text
                  style={[
                    styles.compareVal,
                    result.variance < 0 && { color: colors.danger },
                  ]}
                >
                  {result.variance > 0 ? "+" : ""}
                  {result.variance}%
                </Text>
              </View>
              <View style={styles.compareCol}>
                <Text style={styles.compareLabel}>Activity hint</Text>
                <Text style={styles.compareVal} numberOfLines={1}>
                  {result.activity_hint}
                </Text>
              </View>
            </View>

            {/* Detections List */}
            <Text style={styles.sectionHeader}>Detections</Text>
            <View style={styles.detectionList}>
              {result.detections?.map((d, i) => (
                <View key={i} style={styles.detectionItem}>
                  <Text style={styles.detectionLabel}>{d.label}</Text>
                  <Text style={styles.detectionConf}>{d.confidence}%</Text>
                </View>
              ))}
            </View>

            {/* AI Observation */}
            <View style={styles.observationCard}>
              <Text style={styles.observationTitle}>AI Observation</Text>
              <Text style={styles.observationText}>{result.observation}</Text>
            </View>

            {/* Download DPR PDF button */}
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => openPdf(result.report_id)}
            >
              <FileText size={16} color={colors.white} />
              <Text style={styles.pdfButtonText}>Download DPR PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Activity Selector Modal */}
      <Modal
        visible={activityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActivityModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActivityModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Activity Workfront</Text>
            <FlatList
              data={activities}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.activityChoice,
                    item.id === activityId && styles.activityChoiceSelected,
                  ]}
                  onPress={() => {
                    setActivityId(item.id);
                    setActivityModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.activityChoiceName,
                      item.id === activityId && styles.activityChoiceNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.activityChoiceMeta}>
                    {item.actual_progress}% actual / {item.planned_progress}% plan
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    padding: 18,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(37, 99, 235, 0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  pillText: {
    color: "#60a5fa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 18,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
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
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerButtonText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
  weatherRow: {
    flexDirection: "row",
    gap: 8,
  },
  weatherBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
  },
  weatherBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weatherBtnText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  weatherBtnTextActive: {
    color: colors.white,
  },
  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  geoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 9,
  },
  geoBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  geoBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  geoBtnTextActive: {
    color: colors.primaryText,
  },
  geoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  geoBadgeText: {
    fontSize: 11,
    color: colors.successText,
    fontWeight: "700",
  },
  notesInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: "top",
    minHeight: 56,
  },
  captureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  photoActions: {
    flexDirection: "row",
    gap: 8,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoBtnText: {
    fontSize: 11,
    color: colors.primaryText,
    fontWeight: "600",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  evidenceThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
  },
  previewDetails: {
    flex: 1,
  },
  previewFilename: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  previewMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
  dropZone: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    gap: 4,
  },
  dropTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  dropSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  runButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    elevation: 2,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 17,
  },
  resultContainer: {
    gap: 12,
  },
  resultImageWrap: {
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  resultImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  overlayTags: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 27, 45, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  tagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "600",
  },
  resultTopGrid: {
    flexDirection: "row",
    gap: 10,
  },
  resultMetric: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultMetricLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  resultMetricVal: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  metaRow: {
    paddingVertical: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metaBold: {
    fontWeight: "700",
    color: colors.text,
  },
  compareGrid: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compareCol: {
    flex: 1,
  },
  compareLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  compareVal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  detectionList: {
    gap: 6,
  },
  detectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detectionLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  detectionConf: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  observationCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  observationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  observationText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  pdfButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  pdfButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "75%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  activityChoice: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityChoiceSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  activityChoiceName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  activityChoiceNameSelected: {
    color: colors.primaryText,
  },
  activityChoiceMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
