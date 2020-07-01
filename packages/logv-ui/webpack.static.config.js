const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const assets = path.resolve(__dirname, 'assets')

module.exports = {
	mode: 'development',
	devtool: 'source-map',
	entry: {
		react: ['./react'],
	},
	output: {
		filename: '[name].js',
		publicPath: '/assets',
		path: assets,
		library: '[name]',
		libraryTarget: 'var',
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				default: false,
			},
		},
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hmr: process.env.NODE_ENV !== 'production',
						},
					},
					{
						loader: 'css-loader',
						options: {
							sourceMap: process.env.NODE_ENV !== 'production',
						},
					},
				],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[id].css',
		}),
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1,
		}),
	],
}
