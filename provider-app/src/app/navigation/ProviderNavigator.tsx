import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProviderTabs from "./ProviderTabs";
import KycNavigator from "./KycNavigator";
import JobDetailsScreen from "../screens/jobs/JobDetailsScreen";
import { useAuthStore } from "../../store/auth.store";

const Stack = createNativeStackNavigator();

/**
 * Declarative auth-flow routing:
 * - isVerified=true  → first screen is MainTabs  (KycFlow still accessible from Profile)
 * - isVerified=false → first screen is KycFlow   (auto-redirects to MainTabs on approval)
 *
 * When isVerified flips true (approval), React Navigation automatically
 * transitions to MainTabs without any imperative navigation.navigate() call.
 */
export default function ProviderNavigator() {
  const isVerified = useAuthStore((s) => s.isVerified);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isVerified ? (
        // ── VERIFIED: dashboard first ──────────────────────
        <>
          <Stack.Screen name="MainTabs" component={ProviderTabs} />
          <Stack.Screen
            name="JobDetails"
            component={JobDetailsScreen as any}
            options={{ headerShown: false }}
          />
          {/* Accessible from Profile → "Update Documents" */}
          <Stack.Screen name="KycFlow" component={KycNavigator} />
        </>
      ) : (
        // ── UNVERIFIED: KYC first ──────────────────────────
        <>
          <Stack.Screen name="KycFlow" component={KycNavigator} />
          <Stack.Screen name="MainTabs" component={ProviderTabs} />
          <Stack.Screen
            name="JobDetails"
            component={JobDetailsScreen as any}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
