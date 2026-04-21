import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/types';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'NearbyProviders'>;
  route: RouteProp<HomeStackParamList, 'NearbyProviders'>;
};

// Web stub — react-native-maps is native-only.
// On web, skip straight to booking with no preferred source.
export default function NearbyProvidersScreen({ navigation, route }: Props) {
  const { categoryId, categoryName } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.center}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Map not available on web</Text>
        <Text style={styles.sub}>The nearby providers map requires the mobile app.</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('CreateRequest', { categoryId, categoryName })}
        >
          <Text style={styles.btnText}>Continue to Book →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  icon: { fontSize: 48 },
  title: { fontSize: TYPOGRAPHY.subtitle, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  sub: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext, textAlign: 'center' },
  btn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: TYPOGRAPHY.body },
});
