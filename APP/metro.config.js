const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Разрешаваме зареждането на .csv файлове като assets
config.resolver.assetExts.push('csv');

module.exports = config;