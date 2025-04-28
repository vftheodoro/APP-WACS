module.exports = {
  expo: {
    name: 'WACS',
    slug: 'app-wacs',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#121212'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.wacs.app',
      infoPlist: {
        NSPhotoLibraryUsageDescription: "O WACS precisa de acesso à sua biblioteca de fotos para que você possa selecionar uma foto de perfil.",
        NSCameraUsageDescription: "O WACS precisa de acesso à sua câmera para que você possa capturar uma foto de perfil."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#121212'
      },
      package: 'com.wacs.app',
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.MEDIA_LIBRARY'
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Permitir WACS acessar sua localização.'
        }
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'O WACS precisa de acesso à sua biblioteca de fotos para que você possa selecionar uma foto de perfil.'
        }
      ]
    ],
    newArchEnabled: true
  }
}; 