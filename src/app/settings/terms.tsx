import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import { LegalDocumentScreen } from '@/features/settings/components/LegalDocumentScreen';
import { termsOfServiceSections } from '@/features/settings/legalContent';
import { useSettingsLegalBackHeader } from '@/features/settings/useSettingsLegalBackHeader';
import { getCareBridgeColors } from '@/theme/careBridge';

export const options = {
  title: '利用規約',
};

export default function TermsOfServiceScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useSettingsLegalBackHeader(c.accent);
  return (
    <LegalDocumentScreen
      intro="本ページはプレースホルダーです。公開前に弁護士等の確認を得て、事業内容に合わせて整備してください。"
      sections={termsOfServiceSections}
      c={c}
    />
  );
}
