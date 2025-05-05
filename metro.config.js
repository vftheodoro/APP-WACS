// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuração do SVG
const { transformer, resolver } = config;

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Adicionar padrões para excluir módulos problemáticos
config.resolver.blockList = [
  /.*\/node_modules\/@react-native-firebase\/app\/lib\/internal\/index\.js/,
  /.*\/node_modules\/@react-native-firebase\/app\/lib\/internal\/.*/,
  /.*\/node_modules\/@react-native-firebase\/auth\/lib\/internal\/.*/,
  /.*\/node_modules\/@react-native-firebase\/storage\/lib\/internal\/.*/,
];

module.exports = config; 