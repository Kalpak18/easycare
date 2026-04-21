import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';
import TYPOGRAPHY from '../theme/typography';

export default function SplashLoader() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>🏠</Text>
        </View>
        <Text style={styles.appName}>EasyCare</Text>
        <Text style={styles.tagline}>Trusted home services</Text>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.spinner}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: COLORS.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 40,
  },
  appName: {
    fontSize: TYPOGRAPHY.h1,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.subtext,
  },
  spinner: {
    marginTop: 32,
  },
});
