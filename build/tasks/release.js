/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to build a release package
	grunt.registerTask("build:release", "Build a release package.", function() {

		const path = require("path");
		const JSON5 = require("json5");
		const UglifyJS = require("uglify-js");
		const CleanCSS = require("clean-css");
		const browserify = require("browserify");
		const envify = require("envify/custom");
		const electronPackager = require("electron-packager");
		const enclose = require("enclose");
		const data = require("../../src/data");

		const done = this.async();
		const pkg = grunt.config("pkg");
		const outDir = "build/";
		const buildDir = outDir + "temp/";
		const appDir = buildDir + "app/";
		
		// Build CLI application
		function buildCLIApp() {
			
			return new Promise((resolve) => {

				// List of CLI application files to process
				const appFiles = [
					"@(data|src)/**/*.@(js|json|json5)",
					"!src/gui/**"
				];
				
				// Process all CLI application source and data files
				grunt.file.expand(appFiles).forEach((file) => {
					
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
		}
		
		// Build GUI application package
		function buildGUIApp() {
			
			return new Promise((resolve, reject) => {
				
				const appFileMain = "app.js";
				const appFileHTML = "main.html";
				const appFileCSS = "style.css";
				const appFileJS = "main.js";

				// Build application package.json file
				grunt.file.write(appDir + "package.json", JSON.stringify({
					name: pkg.name,
					private: true,
					main: appFileMain,
					author: pkg.author
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
		}
		
		// Package Electron application
		function packageElectron() {
			
			// HACK: electron-packager is using console.error for logging - and this
			// is causing a "fatal error" for this Grunt task.
			const origConsoleError = console.error;
			console.error = console.log;
			
			return new Promise((resolve, reject) => {
				
				electronPackager({
					arch: "x64",
					platform: process.platform,
					prune: false,
					dir: appDir,
					out: outDir,
					asar: true,
					icon: "src/gui/app.ico",
					"app-copyright": data.copyright,
					"app-version": "0." + data.version.match(/[0-9]+/)[0],
					win32metadata: {
						CompanyName: "",
						FileDescription: pkg.description,
						OriginalFilename: pkg.name + ".exe",
						ProductName: pkg.name,
						InternalName: pkg.name
					}
				}, (error, appPath) => {
					
					if (error) {
						return reject(error);
					}
					
					appPath = appPath.pop();
					
					// Clean some default files from packaged distribution
					["version"].forEach((file) => {
						grunt.file.delete(path.join(appPath, file));
					});
					
					// Move license files to "licenses" directory
					["LICENSE", "LICENSES.chromium.html"].forEach((file) => {
						
						const sourcePath = path.join(appPath, file);
						const destinationPath = path.join(appPath, "licenses", file);
						
						grunt.file.copy(sourcePath, destinationPath);
						grunt.file.delete(sourcePath);
					});
					
					console.error = origConsoleError;
					resolve(appPath);
				});
			});
		}
		
		// Compile CLI application to binary file
		function compileCLIApp(appPath) {
			
			return new Promise((resolve, reject) => {
				
				const options = [];
				const extension = (process.platform === "win32") ? ".exe" : "";
				const binaryFilePath = path.join(
					"../..",
					appPath,
					"resources",
					pkg.name + "-cli" + extension
				);
				
				grunt.file.setBase(buildDir);
		
				options.push("--version", "6");
				options.push("--arch", "x64"); // Build 64-bit binary
				options.push("--config", "../enclose.js");
				options.push("--loglevel", "error");
				options.push("--output", binaryFilePath);
				options.push("./src/app.js");
				
				enclose.exec(options, (error) => {
					
					grunt.file.setBase("../../");
					
					if (error) {
						return reject(error);
					}
		
					resolve();
				});
			});
		}
		
		// Build final release distribution package
		buildCLIApp()
			.then(buildGUIApp)
			.then(packageElectron)
			.then(compileCLIApp)
			.then(() => {
				
				// Clean up temporary build directory
				grunt.file.delete(buildDir);
				
				grunt.log.ok();
				done();
			})
			.catch(done);
	});
};