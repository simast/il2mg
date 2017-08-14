/** @copyright Simas Toleikis, 2015 */
"use strict"

const path = require("path")
const JSON5 = require("json5")
const CleanCSS = require("clean-css")
const webpack = require("webpack")
const electronPackager = require("electron-packager")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")

module.exports = function(grunt) {

	// Grunt task used to build a release package
	grunt.registerTask("build:release", "Build a release package.", async function() {

		const data = require("../../src/data")
		const done = this.async()
		const packageData = grunt.config("pkg")
		const outDir = "build"
		const buildDir = path.join(outDir, "temp")
		const guiDir = path.join("src", "gui")

		// Build application data
		const buildData = async () => new Promise(resolve => {

			// Process all application JSON/JSON5 data files
			grunt.file.expand("data/**/*.@(json|json5)").forEach(file => {

				let jsonParse = JSON.parse

				// NOTE: All JSON5 files are converted to JSON in production build
				if (path.extname(file) === ".json5") {
					jsonParse = JSON5.parse
				}

				// Rename file path to always use .json extension
				const fileJSON = path.join(
					path.dirname(file),
					path.basename(file, path.extname(file)) + ".json"
				)

				// Write minified JSON files
				grunt.file.write(path.join(buildDir, fileJSON), JSON.stringify(
					jsonParse(grunt.file.read(file))
				))
			})

			resolve()
		})

		// Build GUI application package
		const buildApplication = async () => {

			const appFileHTML = "index.html"
			const appFileCSS = "style.css"
			const appFileMain = "main.js"
			const appFileRenderer = "index.js"
			const uglifyOptions = {
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
			grunt.file.write(path.join(buildDir, "package.json"), JSON.stringify({
				name: packageData.name,
				private: true,
				main: appFileMain,
				author: packageData.author
			}, null, "\t"))

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
						grunt.file.setBase("../../")

						return styles
					}
				}
			)

			// Include assets
			grunt.file.copy(path.join(guiDir, "assets"), path.join(buildDir, "assets"))

			// Build main and renderer process JavaScript files
			return new Promise((resolve, reject) => {

				// Common webpack config options
				const commonOptions = {
					devtool: false,
					resolve: {
						extensions: [".js", ".jsx"]
					},
					module: {
						rules: [
							// Load .js and .jsx files using Babel
							{
								test: /\.jsx?$/,
								exclude: /node_modules/,
								use: "babel-loader"
							}
						]
					},
					node: {
						global: false,
						process: false,
						Buffer: false,
						setImmediate: false,
						__filename: false,
						__dirname: false
					},
					plugins: [
						new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
						new webpack.DefinePlugin({
							"process.env": {
								NODE_ENV: JSON.stringify("production")
							}
						}),
						new UglifyJsPlugin({uglifyOptions})
					]
				}

				webpack([
					// Main process
					Object.assign({}, commonOptions, {
						entry: "./src/gui/run.js",
						output: {
							path: path.resolve(buildDir),
							filename: appFileMain
						},
						target: "electron-main"
					}),
					// Renderer process
					Object.assign({}, commonOptions, {
						entry: "./src/gui/index.jsx",
						output: {
							path: path.resolve(buildDir),
							filename: appFileRenderer
						},
						target: "electron-renderer"
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
		const packageApplication = async () => new Promise((resolve, reject) => {

			electronPackager({
				arch: "x64",
				platform: process.platform,
				prune: false,
				dir: buildDir,
				out: outDir,
				asar: true,
				icon: path.join(guiDir, "app.ico"),
				appCopyright: data.copyright,
				appVersion: "0." + data.version.match(/[0-9]+/)[0],
				win32metadata: {
					CompanyName: "",
					FileDescription: packageData.description,
					OriginalFilename: packageData.name + ".exe",
					ProductName: packageData.name,
					InternalName: packageData.name
				}
			}, error => {

				if (error) {
					return reject(error)
				}

				resolve()
			})
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