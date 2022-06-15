// Generated using webpack-cli https://github.com/webpack/webpack-cli
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const webpackExt = require("./webpack-extensions");

const isProduction = process.env.NODE_ENV == "production";

const config = {
  entry: "./src/promote-artifact-version-task/index.ts",
  output: {
    path: path.resolve(__dirname, "dist/promote-artifact-version"),
    filename: 'index.js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from:  "./src/promote-artifact-version-task/*.json", to: "[name][ext]",  },
        { from:  "./src/promote-artifact-version-task/*.png", to: "[name][ext]",  },
        { from:  "./overview.md", to: "../[name][ext]",  },
        { from:  "./manifest/*.json", to: "../[name][ext]",  },
      ],
    }),
    webpackExt.VersionStringReplacer(path.resolve("./dist"), [
      "./vss-extension.json",
      "./promote-artifact-version/task.json"
    ]),
  ],target: 'node',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
    modules: ['node_modules'],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
