const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Поддръжка за .csv файлове
config.resolver.assetExts.push('csv');

module.exports = config;