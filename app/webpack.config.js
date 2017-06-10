const webpack = require('webpack');

module.exports = {
    entry: './app/src/app.js',
    output: {
        path: '/src/resources/static',
        filename: 'app.js',
    },

    module: {
        loaders: [
            {
                test: /\.jsx?$/,         // Match both .js and .jsx files
                exclude: /node_modules/,
                loader: "babel-loader"
            }
        ],
    },

    devServer: {
        port: 9000,
        inline: true,
        contentBase: './app',
        historyApiFallback: true,
        host: '0.0.0.0',
        compress: true,
        disableHostCheck: true
    },

    resolve: {
        extensions: ['.js', '.jsx']
    },
    devtool: 'source-map',

    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development'),
            },
        }),
    ]
};