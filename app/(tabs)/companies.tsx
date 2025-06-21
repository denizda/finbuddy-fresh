import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import CompanySearch from '@/components/CompanySearch';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';

export default function CompaniesScreen() {
  const { user } = useAuthStore();
  if (!user?.id) return null; // or a loading spinner
  // CompanySearch will only mount after login
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <CompanySearch />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});