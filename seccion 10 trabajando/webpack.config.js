const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {

    mode: 'development',
    output : {
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader',
                options: {
                    sources: false,
                },
            },
            {
                test: /\.css$/i,
                exclude: /styles.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /styles.css$/,
                use: [ MiniCssExtractPlugin.loader, 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif)$/,
                loader: 'file-loader',
                options: {
                    outputPath: 'asset/images',
                }
            }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
             template: './src/index.html',
             filename: './index.html',
             inject: 'body'
        }), 

        new MiniCssExtractPlugin({
            filename: 'style.css',
            ignoreOrder: true,
        }),
        new CopyPlugin({
            patterns: [
              { from: "src/assets/", to: "assets/", noErrorOnMissing: true },
            ],
        }),
    ]
}