import { Stack } from 'expo-router';

export default function CareRecipientStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '戻る',
        headerTitleAlign: 'center',
      }}>
      {/* 食事・排泄・バイタルは内側の _layout だけヘッダー表示（ここで戻るを出すと二重になる） */}
      <Stack.Screen name="meals" options={{ headerShown: false }} />
      <Stack.Screen name="excretion" options={{ headerShown: false }} />
      <Stack.Screen name="vitals" options={{ headerShown: false }} />
    </Stack>
  );
}
