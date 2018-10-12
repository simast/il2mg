import path from 'path'
import yaml from 'js-yaml'
import CleanCSS from 'clean-css'
import webpack from 'webpack'
import electronPackager from 'electron-packager'
import TerserPlugin from 'terser-webpack-plugin'

import {
	APPLICATION_NAME,
	APPLICATION_TITLE,
	APPLICATION_VERSION,
	APPLICATION_COPYRIGHT
} from '../../src/constants'

module.exports = function(grunt) {

	// Grunt task used to build a release package
	grunt.registerTask('build:release', 'Build a release package.', async function() {

		const done = this.async()
		const outDir = 'build'
		const buildDir = path.join(outDir, 'temp')
		const guiDir = path.join('src', 'gui')

		// Build application data
		const buildData = () => new Promise(resolve => {

			// Process all application JSON/YAML data files
			grunt.file.expand('data/**/*.@(json|yaml)').forEach(file => {

				let parseDataFile = JSON.parse

				// NOTE: All YAML files are converted to JSON in production build
				if (path.extname(file) === '.yaml') {
					parseDataFile = yaml.safeLoad
				}

				// Rename file path to always use .json extension
				const fileJSON = path.join(
					path.dirname(file),
					path.basename(file, path.extname(file)) + '.json'
				)

				// Write minified JSON files
				grunt.file.write(path.join(buildDir, fileJSON), JSON.stringify(
					parseDataFile(grunt.file.read(file))
				))
			})

			resolve()
		})

		// Build GUI application package
		const buildApplication = () => {

			const appFileHTML = 'index.html'
			const appFileCSS = 'style.css'
			const appFileMain = 'main.js'
			const appFileRenderer = 'index.js'
			const terserOptions = {
				toplevel: true,
				mangle: true,
				compress: true,
				parse: {
					ecma: 8
				},
				output: {
					ecma: 7,
					comments: false,
					beautify: false
				}
			}

			// Build application package.json file
			grunt.file.write(path.join(buildDir, 'package.json'), JSON.stringify({
				name: APPLICATION_NAME,
				private: true,
				main: appFileMain
			}, null, '\t'))

			// Build renderer process HTML file
			grunt.file.copy(
				path.join(guiDir, appFileHTML),
				path.join(buildDir, appFileHTML)
			)

			// Build renderer process CSS file
			grunt.file.copy(
				path.join(guiDir, appFileCSS),
				path.join(buildDir, appFileCSS),
				{
					process(content) {

						grunt.file.setBase(guiDir)
						const {styles} = new CleanCSS().minify(content)
						grunt.file.setBase('../../')

						return styles
					}
				}
			)

			// Include assets
			grunt.file.copy(path.join(guiDir, 'assets'), path.join(buildDir, 'assets'))

			// Build main and renderer process JavaScript files
			return new Promise((resolve, reject) => {

				// Common webpack config options
				const commonOptions = {
					mode: 'production',
					devtool: false,
					resolve: {
						extensions: ['.js', '.jsx']
					},
					module: {
						rules: [
							// Load .js and .jsx files using Babel
							{
								test: /\.jsx?$/,
								exclude: /node_modules/,
								use: {
									loader: 'babel-loader'
								}
							}
						]
					},
					optimization: {
						minimizer: [new TerserPlugin({terserOptions})]
					},
					node: {
						global: false,
						process: false,
						Buffer: false,
						setImmediate: false,
						__filename: false,
						__dirname: false
					},
					plugins: [new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/)]
				}

				webpack([
					// Main process
					Object.assign({}, commonOptions, {
						entry: './src/gui/run.js',
						output: {
							path: path.resolve(buildDir),
							filename: appFileMain
						},
						target: 'electron-main'
					}),
					// Renderer process
					Object.assign({}, commonOptions, {
						entry: './src/gui/index.jsx',
						output: {
							path: path.resolve(buildDir),
							filename: appFileRenderer
						},
						target: 'electron-renderer'
					})
				], (error, stats) => {

					if (error) {
						return reject(error)
					}

					if (stats.hasErrors()) {
						return reject(new Error(stats.toJson().errors))
					}

					resolve()
				})
			})
		}

		// Package application using Electron
		const packageApplication = () => electronPackager({
			quiet: true,
			arch: 'x64',
			platform: process.platform,
			prune: false,
			dir: buildDir,
			out: outDir,
			asar: true,
			icon: path.join(guiDir, 'app.ico'),
			appCopyright: APPLICATION_COPYRIGHT,
			appVersion: '0.' + APPLICATION_VERSION,
			win32metadata: {
				CompanyName: '',
				FileDescription: APPLICATION_TITLE,
				OriginalFilename: APPLICATION_NAME + '.exe',
				ProductName: APPLICATION_NAME,
				InternalName: APPLICATION_NAME
			}
		})

		// Build final release distribution package
		try {

			await buildData()
			await buildApplication()
			await packageApplication()

			grunt.log.ok()
			done()
		}
		catch (error) {
			done(error)
		}
		finally {

			// Clean up temporary build directory
			grunt.file.delete(buildDir)
		}
	})
}
