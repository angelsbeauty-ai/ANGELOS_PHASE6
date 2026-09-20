const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
// Tell expo-router where the app root is
if (!process.env.EXPO_ROUTER_APP_ROOT) {
  process.env.EXPO_ROUTER_APP_ROOT = `${__dirname}/app`;
}

// Also search the workspace root node_modules so hoisted packages like
// expo-updates are resolvable even if not duplicated into mobile's own node_modules/
const workspaceRootModules = path.resolve(__dirname, '..', '..', 'node_modules');
if (config.resolver) {
  config.resolver.nodeModulesPaths = [
    ...(Array.isArray(config.resolver.nodeModulesPaths)
      ? config.resolver.nodeModulesPaths
      : []),
    workspaceRootModules,
  ];
}

module.exports = config;
