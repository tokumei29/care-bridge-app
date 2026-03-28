import { Stack } from 'expo-router';

export default function CareRecipientStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '戻る',
        headerTitleAlign: 'center',
      }}>
      {/* 食事は内側の meals/_layout だけヘッダー表示（ここで戻るを出すと二重になる） */}
      <Stack.Screen name="meals" options={{ headerShown: false }} />
    </Stack>
  );
}
