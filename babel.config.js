module.exports = {
  plugins: [
    // "@babel/plugin-transform-classes",
    "@babel/plugin-proposal-class-properties"
  ],
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current"
        }
      }
    ]
  ]
};
