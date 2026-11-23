module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const lanTestBuild = process.env.NATALA_ANDROID_LAN_TEST === 'true';
  const plugins = [...(config.plugins ?? [])];
  if (iosClientId?.endsWith('.apps.googleusercontent.com')) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: iosClientId.split('.').reverse().join('.') }]);
  }
  if (lanTestBuild) plugins.push('./plugins/withLanTestNetwork');
  return { ...config, plugins, extra: { ...config.extra, lanTestBuild } };
};
