const base = require('./app.json');

const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const isProduction = appEnv === 'production';
const isStaging = appEnv === 'staging';
const suffix = isProduction ? '' : isStaging ? '.staging' : '.dev';
const label = isProduction ? '' : isStaging ? ' Staging' : ' Dev';
const scheme = isProduction ? 'angelos' : isStaging ? 'angelos-staging' : 'angelos-dev';

module.exports = {
  expo: {
    ...base.expo,
    name: `AngelOS${label}`,
    scheme,
    ios: {
      ...base.expo.ios,
      bundleIdentifier: `${base.expo.ios.bundleIdentifier}${suffix}`
    },
    android: {
      ...base.expo.android,
      package: `${base.expo.android.package}${suffix}`
    },
    extra: {
      ...(base.expo.extra || {}),
      appEnv
    }
  }
};
