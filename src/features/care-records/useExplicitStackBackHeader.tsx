import { useNavigation } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';

type Options = {
  /** 戻る先（スタックに親がないとき） */
  fallback: Href;
  tintColor: string;
  /** false のときは何もしない（パラメータ待ちなど） */
  enabled?: boolean;
};

/**
 * iPad 等で標準のヘッダー戻るが出ないとき用。左に「‹ 戻る」を必ず出す。
 */
export function useExplicitStackBackHeader({ fallback, tintColor, enabled = true }: Options) {
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    if (!enabled) return;

    const goBack = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      router.replace(fallback);
    };

    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={styles.headerBack}
          accessibilityRole="button"
          accessibilityLabel="戻る">
          <Text style={[styles.headerBackGlyph, { color: tintColor }]}>‹</Text>
          <Text style={[styles.headerBackLabel, { color: tintColor }]}>戻る</Text>
        </Pressable>
      ),
    });
  }, [enabled, navigation, router, fallback, tintColor]);
}

const styles = StyleSheet.create({
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Platform.OS === 'ios' ? 4 : 8,
    paddingVertical: 8,
    gap: 2,
  },
  headerBackGlyph: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2,
  },
  headerBackLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
});
