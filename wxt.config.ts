import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'HireExtension',
    description: 'AI-powered job matching assistant for Jobright',
    permissions: [
      'storage',
      'sidePanel',
      'activeTab',
      'identity'
    ],
    host_permissions: [
      '*://jobright.ai/*',
      '*://www.linkedin.com/*'
    ],
    oauth2: {
      client_id: '462582287982-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
      scopes: [
        'openid',
        'email',
        'profile'
      ]
    }
  },
  runner: {
    startUrls: ['https://jobright.ai/jobs']
  },
  vite: () => ({
    plugins: [
      // Add React plugin manually
      {
        name: 'configure-react',
        async config() {
          const react = await import('@vitejs/plugin-react');
          return {
            plugins: [react.default()]
          };
        }
      }
    ]
  })
});
