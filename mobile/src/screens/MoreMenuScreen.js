import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Package,
  CalendarDays,
  Bell,
  FolderOpen,
  Users,
  Settings,
  ChevronRight,
  ShieldCheck,
} from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";

export default function MoreMenuScreen({ navigation }) {
  const { dashboardData } = useApp();

  const menuItems = [
    {
      title: "BOQ & Activities",
      subtitle: "Planned quantities, units and progress",
      icon: Package,
      route: "Activities",
      badge: dashboardData?.activities ? `${dashboardData.activities}` : null,
    },
    {
      title: "Schedule",
      subtitle: "Baseline start and target completion dates",
      icon: CalendarDays,
      route: "Schedule",
    },
    {
      title: "Alerts & Risk",
      subtitle: "Review and acknowledge schedule delays",
      icon: Bell,
      route: "Alerts",
      badge: dashboardData?.open_alerts ? `${dashboardData.open_alerts}` : null,
      badgeColor: colors.danger,
    },
    {
      title: "Site Evidence",
      subtitle: "Geotagged daily photo repository",
      icon: FolderOpen,
      route: "Evidence",
    },
    {
      title: "Team & Roles",
      subtitle: "Engineers, managers and site personnel",
      icon: Users,
      route: "Team",
    },
    {
      title: "Settings & Connectivity",
      subtitle: "Backend server URL, model status and sign out",
      icon: Settings,
      route: "Settings",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Modules</Text>
        <Text style={styles.subtitle}>
          CPWD Specifications • IS 1200 / IS 456 Civil Engineering Standards
        </Text>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Icon size={20} color={colors.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              {item.badge && (
                <View
                  style={[
                    styles.badge,
                    item.badgeColor && { backgroundColor: item.badgeColor },
                  ]}
                >
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}

              <ChevronRight size={18} color={colors.textLight} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <ShieldCheck size={16} color={colors.textLight} />
        <Text style={styles.footerText}>
          BuildSight AI v1.0 • React Native Mobile Edition
        </Text>
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
  menuList: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  itemSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  footerText: {
    fontSize: 11,
    color: colors.textLight,
  },
});
