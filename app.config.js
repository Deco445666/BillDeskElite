module.exports = {
  expo: {
    name: "BillDesk Elite",
    slug: "billdesk-elite",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    
    // I removed the icon links so the build won't fail!
    // It will use a default Expo icon for this test.
    
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.elite.billdesk",
      adaptiveIcon: {
        backgroundColor: "#000000"
      }
    },
    plugins: [
      "expo-secure-store"
    ],
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    }
  }
};


