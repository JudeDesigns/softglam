// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire workspace so changes in packages/* hot-reload.
config.watchFolders = [workspaceRoot];

// Block non-JS workspace folders so Metro doesn't parse Python/binary files.
config.resolver.blockList = [
  /apps\/api\/.*/,
  /apps\/admin\/.*/,
];

// Resolve modules from both the app's and the workspace's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// pnpm uses symlinks heavily; Metro needs this to follow them.
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = false;

// react-native-svg ships "react-native": "src/index.ts" (raw TS source).
// Redirect to the pre-compiled CJS output so Hermes never sees raw TS.
const svgPkgDir = path.dirname(require.resolve('react-native-svg/package.json'));

// Force a single copy of React and React Native across the entire workspace.
// Without this, pnpm may resolve a second React instance (e.g. react@18) for
// workspace packages that declare react: "*" as a peer dep, causing the
// "Invalid hook call" / "Cannot read property 'useState' of null" crash.
const reactDir = path.dirname(require.resolve('react/package.json'));
const reactNativeDir = path.dirname(require.resolve('react-native/package.json'));
const reactDomDir = path.dirname(require.resolve('react-dom/package.json'));

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-svg': path.join(svgPkgDir, 'lib/commonjs/index.js'),
  'react': reactDir,
  'react-dom': reactDomDir,
  'react-native': reactNativeDir,
};

// Intercept any resolution that resolves to react@18 and redirect to react@19.
// This handles the case where pnpm symlinks a workspace package (e.g. @softglow/ui)
// that pulls react@18 from its own node_modules in the pnpm virtual store.
const REACT_18_PATTERN = /react@18\.[^/]+[/\\]node_modules[/\\]react([/\\]|$)/;
const REACT_DOM_18_PATTERN = /react@18\.[^/]+[/\\]node_modules[/\\]react-dom([/\\]|$)/;
const reactIndexJs = path.join(reactDir, 'index.js');
const reactDomIndexJs = path.join(reactDomDir, 'index.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const result = context.resolveRequest(context, moduleName, platform);
  if (result && result.filePath) {
    if (REACT_18_PATTERN.test(result.filePath)) {
      return { ...result, filePath: reactIndexJs };
    }
    if (REACT_DOM_18_PATTERN.test(result.filePath)) {
      return { ...result, filePath: reactDomIndexJs };
    }
  }
  return result;
};

module.exports = withNativeWind(config, { input: './global.css' });
