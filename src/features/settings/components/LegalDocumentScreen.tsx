import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import type { LegalSection } from '@/features/settings/legalContent';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  intro?: string;
  sections: LegalSection[];
  c: CareBridgeColors;
};

export function LegalDocumentScreen({ intro, sections, c }: Props) {
  const layout = useResponsiveLayout();
  const bodySize = layout.isTablet ? 16 : 15;
  const headingSize = layout.isTablet ? 17 : 16;

  return (
    <ScreenBackdrop>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.isTablet ? 40 : 28 },
        ]}
        showsVerticalScrollIndicator>
        <ContentRail layout={layout}>
          {intro ? (
            <Text style={[styles.intro, { color: c.textSecondary, fontSize: bodySize }]}>{intro}</Text>
          ) : null}
          {sections.map((s, i) => (
            <View key={i} style={styles.block}>
              {s.heading ? (
                <Text style={[styles.heading, { color: c.text, fontSize: headingSize }]}>{s.heading}</Text>
              ) : null}
              <Text style={[styles.body, { color: c.text, fontSize: bodySize }]}>{s.body}</Text>
            </View>
          ))}
        </ContentRail>
      </ScrollView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
  },
  intro: {
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  block: {
    marginBottom: 22,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 10,
    lineHeight: 24,
  },
  body: {
    lineHeight: 24,
    fontWeight: '500',
  },
});
