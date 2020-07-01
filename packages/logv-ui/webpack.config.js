const path = require('path')
const fs = require('fs')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')

const PROD = process.env.NODE_ENV === 'production'

// const ssl = PROD
// 	? {}
// 	: {
// 			key: fs.readFileSync(path.join(__dirname, '.cert/key.pem')),
// 			cert: fs.readFileSync(path.join(__dirname, '.cert/cert.pem')),
// 	  }

console.log(PROD ? 'PRODUCTION' : 'DEVELOPMENT')

module.exports = {
	mode: PROD ? 'production' : 'development',
	devtool: 'source-map',
	devServer: {
		port: 8080,
		hot: true,
		historyApiFallback: true,
		contentBase: path.join(__dirname, 'dist'),
		staticOptions: {
			etag: true,
		},
		writeToDisk: true,
		disableHostCheck: true,
		host: 'local.logv.app',
		// https: ssl,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				ws: true,
				secure: false,
				// ssl,
			},
		},
	},
	entry: {
		index: './src/index.tsx',
	},
	output: {
		filename: PROD ? '[name].[chunkhash].js' : '[name].js',
		publicPath: '/assets/',
		path: path.resolve(__dirname, 'dist', 'assets'),
	},
	externals: {
		react: 'React',
		'react-dom': 'ReactDOM',
		// react: ['react', 'React'],
		// 'react-dom': ['react', 'ReactDOM'],
		// 'monaco-editor': ['monaco_editor'],
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	optimization: {
		namedModules: true,
		runtimeChunk: 'single',
		minimize: PROD,
		minimizer: [new TerserPlugin()],
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendor',
					chunks: 'initial',
				},
				styles: {
					name: 'styles',
					test: /\.css$/,
					chunks: 'all',
					enforce: true,
				},
			},
		},
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				include: [path.join(__dirname, 'src')],
				use: [
					{ loader: 'babel-loader' },
					{
						loader: 'linaria/loader',
						options: {
							sourceMap: process.env.NODE_ENV !== 'production',
							displayName: true,
						},
					},
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true,
							compilerOptions: {
								declarationMap: false,
							},
						},
					},
				],
			},
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
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: ['file-loader'],
			},
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
		],
	},
	stats: 'errors-warnings',
	plugins: [
		new WasmPackPlugin({
			crateDirectory: __dirname,
			outDir: './dist',
			outName: 'rust',
			// extraArgs: "--out-name index",
			watchDirectories: [path.resolve(__dirname, '..', '..', 'packages/rustweb/src')],
		}),
		new MiniCssExtractPlugin({
			filename: PROD ? '[name].[chunkhash].css' : '[name].css',
		}),
		new HtmlWebpackPlugin({
			inject: 'head',
			hash: PROD,
			cdnModule: 'react',
			showErrors: true,
			filename: path.resolve(__dirname, 'dist/index.html'),
			template: path.resolve(__dirname, 'src/index.ejs'),
			templateParameters: {
				react: PROD ? 'production.min' : 'development',
			},
		}),
		new FaviconsWebpackPlugin({
			logo: '../logv.site/src/images/favicon.png',
		}),
	],
}
