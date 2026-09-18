import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { Users } from "lucide-react-native";
import { colors } from "../theme";
import { useApp } from "../context/AppContext";

export default function TeamScreen() {
  const { teamData, refreshing, refreshProjectData } = useApp();

  return (
    <View style={styles.container}>
      <FlatList
        data={teamData}
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
            <Text style={styles.title}>Project Team & Roles</Text>
            <Text style={styles.subtitle}>
              Engineers, managers and site personnel
            </Text>
          </View>
        }
        renderItem={({ item: u }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{u.name?.[0] || "U"}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{u.name}</Text>
              <Text style={styles.email}>{u.email}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{u.role}</Text>
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
    gap: 10,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  email: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
});
