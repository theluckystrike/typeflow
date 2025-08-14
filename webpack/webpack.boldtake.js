
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "boldtake-extension");

module.exports = {
    entry: {
        background: path.join(srcDir, 'background.js'),
        contentScript: path.join(srcDir, 'contentScript.js'),
        popup: path.join(srcDir, 'popup.js'),
        sidepanel: path.join(srcDir, 'sidepanel.js'),
    },
    output: {
        path: path.join(__dirname, "../dist/boldtake"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ],
    },
    resolve: {
        extensions: [".js"],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: ".", to: "../boldtake", context: "boldtake-extension", globOptions: { ignore: ["**/*.js"] } }
            ],
            options: {},
        }),
    ],
};
