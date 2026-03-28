import { Stack } from 'expo-router';

export default function SettingsLegalStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '設定',
      }}
    />
  );
}
