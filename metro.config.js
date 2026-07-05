const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // React Native ships an experimental file that uses a newer "match" syntax
  // Metro cannot parse yet. We redirect it to a safe local stub instead.
  if (moduleName.includes('VirtualView') && moduleName.includes('NativeComponent')) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'patches/VirtualViewStub.js'),
    };
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
