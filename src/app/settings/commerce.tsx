import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import { LegalDocumentScreen } from '@/features/settings/components/LegalDocumentScreen';
import { specifiedCommercialSections } from '@/features/settings/legalContent';
import { useSettingsLegalBackHeader } from '@/features/settings/useSettingsLegalBackHeader';
import { getCareBridgeColors } from '@/theme/careBridge';

export const options = {
  title: '特定商取引法に基づく表記',
};

export default function SpecifiedCommercialNotationScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useSettingsLegalBackHeader(c.accent);
  return (
    <LegalDocumentScreen
      intro="特定商取引法の表示義務の対象となる取引がある場合、下記を実情報で必ず置き換えてください。無料アプリのみで課金がない場合でも、運営者の判断で掲載することがあります。"
      sections={specifiedCommercialSections}
      c={c}
    />
  );
}
