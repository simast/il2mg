/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to build a release package
	grunt.registerTask("build:release", "Build a release package.", async function() {

		const path = require("path");
		const JSON5 = require("json5");
		const UglifyJS = require("uglify-js");
		const CleanCSS = require("clean-css");
		const browserify = require("browserify");
		const envify = require("envify/custom");
		const electronPackager = require("electron-packager");
		const pkg = require("pkg");
		const data = require("../../src/data");

		const done = this.async();
		const packageData = grunt.config("pkg");
		const outDir = "build/";
		const buildDir = outDir + "temp/";
		const appDir = buildDir + "app/";

		// Build CLI application
		const buildCLIApp = async () => new Promise(resolve => {

			// List of CLI application files to process
			const appFiles = [
				"@(data|src)/**/*.@(js|json|json5)",
				"!src/gui/**"
			];

			// Process all CLI application source and data files
			grunt.file.expand(appFiles).forEach(file => {

				const fileExt = path.extname(file);

				// Copy over app JavaScript source code files
				// TODO: Use UglifyJS to uglify the code?
				if (fileExt === ".js") {
					grunt.file.copy(file, buildDir + file);
				}
				// Convert JSON5 data files to JSON format
				else {

					let jsonParse = JSON.parse;

					if (fileExt === ".json5") {
						jsonParse = JSON5.parse;
					}

					// Rename file path to always use .json extension
					const fileJSON = path.join(
						path.dirname(file),
						path.basename(file, path.extname(file)) + ".json"
					);

					grunt.file.write(buildDir + fileJSON, JSON.stringify(
						jsonParse(grunt.file.read(file))
					));
				}
			});

			resolve();
		});

		// Build GUI application package
		const buildGUIApp = async () => new Promise((resolve, reject) => {

			const appFileMain = "app.js";
			const appFileHTML = "main.html";
			const appFileCSS = "style.css";
			const appFileJS = "main.js";

			// Build application package.json file
			grunt.file.write(appDir + "package.json", JSON.stringify({
				name: packageData.name,
				private: true,
				main: appFileMain,
				author: packageData.author
			}, null, "\t"));

			// Build main process JavaScript file (app.js)
			grunt.file.copy("src/gui/" + appFileMain, appDir + appFileMain, {
				process(content) {

					return UglifyJS.minify(content, {
						fromString: true,
						mangle: {
							toplevel: true
						}
					}).code;
				}
			});

			// Build renderer process HTML file (main.html)
			grunt.file.copy("src/gui/" + appFileHTML, appDir + appFileHTML);

			// Build renderer process CSS file (style.css)
			grunt.file.copy("src/gui/" + appFileCSS, appDir + appFileCSS, {
				process(content) {
					return new CleanCSS().minify(content).styles;
				}
			});

			// Build renderer process JavaScript file (main.js)
			browserify({
				entries: ["src/gui/" + appFileJS + "x"],
				debug: false,
				node: true,
				ignoreMissing: true,
				detectGlobals: false,
				transform: [
					"babelify",
					[envify({_: "purge", NODE_ENV: "production"}), {global: true}]
				],
				extensions: [".jsx"]
			})
			.bundle((error, buffer) => {

				if (error) {
					return reject(error);
				}

				const content = buffer.toString("utf-8");

				grunt.file.write(appDir + appFileJS, UglifyJS.minify(content, {
					fromString: true
				}).code);

				resolve();
			});

			// Include assets
			grunt.file.copy("src/gui/assets", appDir + "assets");
		});

		// Package Electron application
		const packageElectron = async () => new Promise((resolve, reject) => {

			electronPackager({
				arch: "x64",
				platform: process.platform,
				prune: false,
				dir: appDir,
				out: outDir,
				asar: true,
				icon: "src/gui/app.ico",
				appCopyright: data.copyright,
				appVersion: "0." + data.version.match(/[0-9]+/)[0],
				win32metadata: {
					CompanyName: "",
					FileDescription: packageData.description,
					OriginalFilename: packageData.name + ".exe",
					ProductName: packageData.name,
					InternalName: packageData.name
				}
			}, (error, appPath) => {

				if (error) {
					return reject(error);
				}

				appPath = appPath.pop();

				// Remove not needed files from packaged distribution
				["version"].forEach(file => {
					grunt.file.delete(path.join(appPath, file));
				});

				// Move license files to "licenses" directory
				["LICENSE", "LICENSES.chromium.html"].forEach(file => {

					const sourcePath = path.join(appPath, file);
					const destinationPath = path.join(appPath, "licenses", file);

					grunt.file.copy(sourcePath, destinationPath);
					grunt.file.delete(sourcePath);
				});

				resolve(appPath);
			});
		});

		// Compile CLI application to binary file
		const compileCLIApp = async appPath => {

			const options = [];
			const extension = (process.platform === "win32") ? ".exe" : "";
			const binaryFilePath = path.join(
				"../..",
				appPath,
				"resources",
				packageData.name + "-cli" + extension
			);

			options.push("--target", "node7-win-x64");
			options.push("--config", "../pkg.js");
			options.push("--output", binaryFilePath);
			options.push("./src/app.js");

			grunt.file.setBase(buildDir);

			try {
				await pkg.exec(options);
			}
			finally {
				grunt.file.setBase("../../");
			}
		};

		// Build final release distribution package
		try {

			await buildCLIApp();
			await buildGUIApp();
			const appPath = await packageElectron();
			await compileCLIApp(appPath);

			grunt.log.ok();
			done();
		}
		catch (error) {
			done(error);
		}
		finally {

			// Clean up temporary build directory
			grunt.file.delete(buildDir);
		}
	});
};