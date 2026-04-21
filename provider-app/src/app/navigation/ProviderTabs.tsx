import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Home:     { active: 'home',          inactive: 'home-outline' },
  Jobs:     { active: 'briefcase',     inactive: 'briefcase-outline' },
  Earnings: { active: 'wallet',        inactive: 'wallet-outline' },
  Profile:  { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function ProviderTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Jobs"     component={JobsScreen}      options={{ tabBarLabel: 'Jobs' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen}  options={{ tabBarLabel: 'Earnings' }} />
      <Tab.Screen name="Profile"  component={ProfileStack}    options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
