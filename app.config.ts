import { loadProjectEnv } from '@expo/env';
import type { ExpoConfig } from 'expo/config';
import path from 'node:path';

import appJson from './app.json';

/**
 * `.env.local` / `.env` などを Expo 公式と同じ優先順位で `process.env` に載せる。
 * `app.config` 評価時・prebuild 時にも EXPO_PUBLIC_* が参照できるようにする。
 */
loadProjectEnv(path.resolve(__dirname), { silent: true, force: true });

const config = appJson as { expo: ExpoConfig };

export default config.expo;
