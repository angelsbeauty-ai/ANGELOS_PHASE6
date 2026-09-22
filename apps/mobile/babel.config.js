module.exports = function (api) {
  api.cache(true);

  process.env.EXPO_ROUTER_APP_ROOT = './app';

  return {
    presets: ['babel-preset-expo'],
  };
};
