import { StatusBar } from 'expo-status-bar';
import { type Href } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';
import { getCareBridgeColors } from '@/theme/careBridge';

export default function ModalScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useExplicitStackBackHeader({
    fallback: '/(tabs)' as Href,
    tintColor: c.accent,
    enabled: true,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
