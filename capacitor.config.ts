import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bcc5728632f442ac8e43309f4eefaa7d',
  appName: 'spotin-smart-hub-35',
  webDir: 'dist',
  server: {
    url: 'https://bcc57286-32f4-42ac-8e43-309f4eefaa7d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;