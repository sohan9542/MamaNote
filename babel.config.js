module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Disable auto worklets/reanimated plugins — nativewind/babel adds worklets for SDK 54
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: false, worklets: false }],
      'nativewind/babel',
    ],
  };
};
