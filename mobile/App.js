import React from "react";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  Camera,
  FileText,
  BarChart3,
  Menu,
} from "lucide-react-native";

import { AppProvider, useApp } from "./src/context/AppContext";
import Header from "./src/components/Header";
import { colors } from "./src/theme";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AIProgressScreen from "./src/screens/AIProgressScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import MoreMenuScreen from "./src/screens/MoreMenuScreen";
import ActivitiesScreen from "./src/screens/ActivitiesScreen";
import ScheduleScreen from "./src/screens/ScheduleScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import EvidenceScreen from "./src/screens/EvidenceScreen";
import TeamScreen from "./src/screens/TeamScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <Header />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="AI DPR"
          component={AIProgressScreen}
          options={{
            tabBarLabel: "AI DPR",
            tabBarIcon: ({ color, size }) => (
              <Camera size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: "Reports",
            tabBarIcon: ({ color, size }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarLabel: "Analytics",
            tabBarIcon: ({ color, size }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreMenuScreen}
          options={{
            tabBarLabel: "Modules",
            tabBarIcon: ({ color, size }) => (
              <Menu size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

function NavigationRoot() {
  const { auth, authLoading } = useApp();

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} translucent />
      {!auth ? (
        <LoginScreen />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.navy,
            },
            headerTintColor: colors.white,
            headerTitleStyle: {
              fontWeight: "700",
              fontSize: 16,
            },
          }}
        >
          <Stack.Screen
            name="RootTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Activities"
            component={ActivitiesScreen}
            options={{ title: "BOQ & Activities" }}
          />
          <Stack.Screen
            name="Schedule"
            component={ScheduleScreen}
            options={{ title: "Schedule Baseline" }}
          />
          <Stack.Screen
            name="Alerts"
            component={AlertsScreen}
            options={{ title: "Project Alerts & Risk" }}
          />
          <Stack.Screen
            name="Evidence"
            component={EvidenceScreen}
            options={{ title: "Site Evidence Gallery" }}
          />
          <Stack.Screen
            name="Team"
            component={TeamScreen}
            options={{ title: "Project Team Directory" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: "Settings & Connectivity" }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationRoot />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
});
