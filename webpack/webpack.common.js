const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");
const dotenv = require('dotenv')

dotenv.config();

module.exports = {
    entry: {
      sidepanel: path.join(srcDir, 'sidepanel/app.tsx'),
      background: path.join(srcDir, 'background/background.ts'),
      content_script: path.join(srcDir, 'content/content_script.tsx'),
      indicator: path.join(srcDir, 'content/indicator.tsx'),
      welcome: path.join(srcDir, 'content/welcome/welcome.tsx'),
    },
    output: {
        path: path.join(__dirname, "../dist/js"),
        filename: "[name].js",
    },
    optimization: {
        splitChunks: {
            name: "vendor",
            chunks(chunk) {
              return chunk.name !== 'background';
            }
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader",
                    'postcss-loader'
                ],
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "@/components": path.resolve(__dirname, "../src/components/"),
            "@/src/utils": path.resolve(__dirname, "../src/lib/utils"),
        },
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }],
            options: {},
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
         })
    ],
};
