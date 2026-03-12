import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.purrrrse.android',
  appName: 'Purrrrse - Money Tracker',
  appVersion: '1.0.1',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
}

export default config;