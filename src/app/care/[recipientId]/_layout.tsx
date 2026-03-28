import { Stack } from 'expo-router';

export default function CareRecipientStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '戻る',
        headerTitleAlign: 'center',
      }}>
      {/* 食事・排泄・バイタル・入浴・リハビリ活動・睡眠は内側の _layout だけヘッダー表示（ここで戻るを出すと二重になる） */}
      <Stack.Screen name="meals" options={{ headerShown: false }} />
      <Stack.Screen name="excretion" options={{ headerShown: false }} />
      <Stack.Screen name="vitals" options={{ headerShown: false }} />
      <Stack.Screen name="bathing" options={{ headerShown: false }} />
      <Stack.Screen name="rehab" options={{ headerShown: false }} />
      <Stack.Screen name="sleep" options={{ headerShown: false }} />
      <Stack.Screen name="notes" options={{ headerShown: false }} />
      <Stack.Screen name="image-memos" options={{ headerShown: false }} />
    </Stack>
  );
}
