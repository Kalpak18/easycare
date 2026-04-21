import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobsStackParamList } from './types';
import JobsScreen from '../screens/jobs/JobsScreen';
import JobDetailsScreen from '../screens/jobs/JobDetailsScreen';

const Stack = createNativeStackNavigator<JobsStackParamList>();

export default function JobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="JobsList"
        component={JobsScreen}
        options={{ title: 'Your Jobs' }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: 'Job Details' }}
      />
    </Stack.Navigator>
  );
}
