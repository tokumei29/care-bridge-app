import { Stack } from 'expo-router';

export default function MealsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '戻る',
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen name="index" options={{ title: '食事の記録' }} />
      <Stack.Screen name="new" options={{ title: '新しく記録' }} />
      <Stack.Screen name="[id]" options={{ title: '記録を編集' }} />
    </Stack>
  );
}
