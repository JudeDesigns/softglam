// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire workspace so changes in packages/* hot-reload.
config.watchFolders = [workspaceRoot];

// Resolve modules from both the app's and the workspace's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Hierarchical lookup stays ON — pnpm stores transitive deps under
// .pnpm/<pkg>@<ver>/node_modules and only walking up node_modules from the
// importing file can find them.
config.resolver.disableHierarchicalLookup = false;

// pnpm uses symlinks heavily; Metro needs this to follow them across the
// workspace and into the .pnpm store.
config.resolver.unstable_enableSymlinks = true;

module.exports = withNativeWind(config, { input: './global.css' });
