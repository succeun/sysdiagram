const webpack = require("webpack");
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

var pkgson = require('./package.json');

module.exports = {
    mode: 'none',    // none, development, production
    entry: {
        sysdiagram: "./src/sysdiagram.js",
        "sysdiagram.min": "./src/sysdiagram.js",
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: (args) => {return args.runtime == "sysdiagram.min" ? 'sysdiagram.bundle.min.js' : 'sysdiagram.bundle.js'},
        publicPath: '/',
        libraryTarget: 'umd',
        library: 'sysdiagram',
        libraryExport: 'default',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: ['/node_modules'],
                options: {
                    presets: [
                        [
                            '@babel/preset-env', {
                                targets: { node: 'current' },
                                modules: 'auto',
                            }
                        ],
                    ],
                },
            },
        ],
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin(), // Clear "./dist",
        new webpack.DefinePlugin({
            SYSDIAGRAM_VERSION: JSON.stringify(pkgson.version),
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                test: /\.min\.js(\?.*)?$/i,
            }),
        ],
    },
    resolve: {
      modules: ['node_modules'],
      extensions: ['.js', '.json', '.jsx', '.css'],
    },
};