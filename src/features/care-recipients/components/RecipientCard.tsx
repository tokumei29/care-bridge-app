import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import type { CareRecipient } from '@/features/care-recipients/types';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipient: CareRecipient;
  onOpenCare: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function initialGlyph(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  return t.slice(0, 1);
}

export function RecipientCard({ recipient, onOpenCare, onEdit, onDelete }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const layout = useResponsiveLayout();
  const isTablet = layout.isTablet;
  const avatarSize = layout.isWideTablet ? 58 : isTablet ? 54 : 48;
  const nameSize = isTablet ? 19 : 17;
  const subSize = isTablet ? 14 : 13;

  const confirmDelete = () => {
    Alert.alert(
      '登録を削除',
      `「${recipient.name}」を削除しますか？\nサーバー上の登録が削除されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.surfaceSolid,
          borderColor: c.borderStrong,
          ...Platform.select({
            ios: {
              shadowColor: c.accent,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: scheme === 'dark' ? 0.35 : 0.12,
              shadowRadius: 20,
            },
            android: { elevation: 6 },
            default: {},
          }),
        },
      ]}>
      <LinearGradient
        colors={[c.accent, c.accentSecondary]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.accentBar}
      />
      <View
        pointerEvents="none"
        style={[styles.innerGlow, { borderBottomColor: c.glassHighlight }]}
      />
      <Pressable
        onPress={onOpenCare}
        style={({ pressed }) => [styles.mainTap, { opacity: pressed ? 0.92 : 1 }]}
        android_ripple={{ color: c.accentMuted }}>
        <View
          style={[
            styles.avatarRing,
            {
              width: avatarSize + 6,
              height: avatarSize + 6,
              borderRadius: (avatarSize + 6) / 2,
              borderColor: c.accentMuted,
            },
          ]}>
          <LinearGradient
            colors={[c.avatarBg, c.accentMuted]}
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}>
            {recipient.avatarUrl ? (
              <Image
                source={{ uri: recipient.avatarUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={180}
              />
            ) : (
              <Text style={[styles.avatarText, { color: c.accent, fontSize: avatarSize * 0.38 }]}>
                {initialGlyph(recipient.name)}
              </Text>
            )}
          </LinearGradient>
        </View>
        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: c.text, fontSize: nameSize }]} numberOfLines={1}>
            {recipient.name}
          </Text>
          <Text style={[styles.sub, { color: c.textSecondary, fontSize: subSize }]}>
            記録を見る・入力する
          </Text>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          tintColor={c.accent}
          size={isTablet ? 20 : 18}
          style={styles.chevron}
        />
      </Pressable>
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.toolBtn, { opacity: pressed ? 0.65 : 1 }]}
          hitSlop={10}>
          <SymbolView
            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            tintColor={c.accent}
            size={isTablet ? 22 : 20}
          />
          <Text style={[styles.toolLabel, { color: c.accent, fontSize: isTablet ? 15 : 14 }]}>
            編集
          </Text>
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [styles.toolBtn, { opacity: pressed ? 0.65 : 1 }]}
          hitSlop={10}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            tintColor={c.danger}
            size={isTablet ? 22 : 20}
          />
          <Text style={[styles.toolLabel, { color: c.danger, fontSize: isTablet ? 15 : 14 }]}>
            削除
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 0,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  innerGlow: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    opacity: 0.8,
  },
  mainTap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  name: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 5,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 18,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  toolbarTablet: {
    paddingVertical: 14,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  toolLabel: {
    fontWeight: '700',
  },
});
