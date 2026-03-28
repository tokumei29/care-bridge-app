import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import { LegalDocumentScreen } from '@/features/settings/components/LegalDocumentScreen';
import { privacyPolicySections } from '@/features/settings/legalContent';
import { useSettingsLegalBackHeader } from '@/features/settings/useSettingsLegalBackHeader';
import { getCareBridgeColors } from '@/theme/careBridge';

export const options = {
  title: 'プライバシーポリシー',
};

export default function PrivacyPolicyScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useSettingsLegalBackHeader(c.accent);
  return (
    <LegalDocumentScreen
      intro="本ページはプレースホルダーです。公開前に事業実態に合わせて文言を確定し、最終更新日を記載してください。"
      sections={privacyPolicySections}
      c={c}
    />
  );
}
