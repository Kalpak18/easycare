import { createNativeStackNavigator } from "@react-navigation/native-stack";

import KycIntroScreen from "../screens/kyc/KycIntroScreen";
import KycStatusScreen from "../screens/kyc/KycStatusScreen";
import UploadDocumentScreen from "../screens/kyc/UploadDocumentScreen";
import VerificationPendingScreen from "../screens/kyc/VerificationPendingScreen";
import WaitingForAdminApprovalScreen from "../screens/kyc/WaitingForAdminApprovalScreen";

const Stack = createNativeStackNavigator();

export default function KycNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen
        name="KycIntro"
        component={KycIntroScreen}
      />

      <Stack.Screen
        name="KycStatus"
        component={KycStatusScreen}
      />

      <Stack.Screen
        name="UploadDocument"
        component={UploadDocumentScreen}
      />

      <Stack.Screen
        name="VerificationPending"
        component={VerificationPendingScreen}
      />

      <Stack.Screen
        name="WaitingApproval"
        component={WaitingForAdminApprovalScreen}
      />

    </Stack.Navigator>
  );
}