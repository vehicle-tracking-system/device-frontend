const path = require('path');
const webpack = require('webpack');

const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = {
    configureWebpack: config => {
        config.optimization = {
            runtimeChunk: 'single',
            minimizer: [
                new OptimizeCSSAssetsPlugin({
                    cssProcessorPluginOptions: {
                        preset: ['default', {discardComments: {removeAll: true}}],
                    }
                }),
            ]
        };
        config.output = {
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/',
            filename: 'js/[hash:5].js',
            chunkFilename: 'js/[id].[hash:5].js'
        };
        config.plugins.concat([
            new webpack.optimize.AggressiveMergingPlugin(),
        ]);

    }
}
