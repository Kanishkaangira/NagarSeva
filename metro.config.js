const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// OneDrive's Windows directory entries can be reported as symlinks even when
// the files are regular files. Metro then calls readlink() and fails with
// EINVAL. This project does not rely on filesystem symlinks, so treat those
// entries as regular files when Metro scans the project on Windows.
if (process.platform === 'win32') {
  require('node:fs').Dirent.prototype.isSymbolicLink = () => false;
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Use Metro's Node crawler, which honors the Dirent workaround above.
  useWatchman: false,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
