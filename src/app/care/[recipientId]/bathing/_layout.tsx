import { Stack } from 'expo-router';

export default function BathingStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '戻る',
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen name="index" options={{ title: '入浴の記録' }} />
      <Stack.Screen name="new" options={{ title: '新しく記録' }} />
      <Stack.Screen name="[id]" options={{ title: '記録を編集' }} />
    </Stack>
  );
}
