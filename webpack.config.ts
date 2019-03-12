import * as path from 'path';
import * as webpack from 'webpack';

export default {
    mode: 'development',
    entry: './src/index.ts',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        openPage: "index.html",
        contentBase: path.join(__dirname, "app"),
        watchContentBase: true,
        port: 8080,
    }
} as webpack.Configuration;
