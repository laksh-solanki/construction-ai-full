import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, ChevronDown, RefreshCw, Check } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";

export default function Header({ title }) {
  const insets = useSafeAreaInsets();
  const {
    auth,
    projectsList,
    projectId,
    setProjectId,
    projectData,
    refreshing,
    refreshProjectData,
  } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  // Ensure ample safe top padding on Android (punch-hole/notch) & iOS
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0
  );
  const safePaddingTop = topInset > 0 ? topInset + 10 : 18;

  return (
    <View style={[styles.container, { paddingTop: safePaddingTop }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} translucent />
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>B</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>BuildSight AI</Text>
            <Text style={styles.brandSubtitle}>Construction Intelligence</Text>
          </View>
        </View>

        <View style={styles.topRight}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Online</Text>
          </View>

          <TouchableOpacity
            onPress={refreshProjectData}
            style={styles.iconBtn}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              color={colors.textLight}
              style={refreshing ? styles.spinning : undefined}
            />
          </TouchableOpacity>

          {auth?.user && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {auth.user.name?.[0] || "U"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Project Selector Bar */}
      <TouchableOpacity
        style={styles.projectBar}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View>
          <Text style={styles.projectLabel}>ACTIVE PROJECT</Text>
          <Text style={styles.projectName} numberOfLines={1}>
            {projectData?.name || "Select Project..."}
          </Text>
        </View>
        <View style={styles.projectSelectorArrow}>
          <ChevronDown size={16} color={colors.textLight} />
        </View>
      </TouchableOpacity>

      {/* Modal for selecting projects */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Construction Project</Text>
            <FlatList
              data={projectsList}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const selected = item.id === projectId;
                return (
                  <TouchableOpacity
                    style={[styles.projectItem, selected && styles.projectItemSelected]}
                    onPress={() => {
                      setProjectId(item.id);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.projectItemInfo}>
                      <Text
                        style={[
                          styles.projectItemName,
                          selected && styles.projectItemNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.projectItemLocation}>
                        {item.location} • {item.client}
                      </Text>
                    </View>
                    {selected && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 18,
  },
  brandTitle: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  brandSubtitle: {
    color: colors.textLight,
    fontSize: 10,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 163, 74, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "600",
  },
  iconBtn: {
    padding: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  projectBar: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.navyCard,
    borderColor: colors.navyBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  projectLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textLight,
    letterSpacing: 0.8,
  },
  projectName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
    marginTop: 1,
  },
  projectSelectorArrow: {
    paddingLeft: 8,
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
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  projectItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  projectItemInfo: {
    flex: 1,
  },
  projectItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  projectItemNameSelected: {
    color: colors.primaryText,
  },
  projectItemLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
