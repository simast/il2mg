/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to build a release package
	grunt.registerTask("build:release", "Build a release package.", function() {

		const path = require("path");
		const JSON5 = require("json5");
		const UglifyJS = require("uglify-js");
		const browserify = require("browserify");
		const electronPackager = require("electron-packager");
		const enclose = require("enclose");

		const done = this.async();
		const pkg = grunt.config("pkg");
		const outDir = "build/";
		const buildDir = outDir + "temp/";
		const appDir = buildDir + "app/";
		
		// Set production mode (required for React.js)
		process.env.NODE_ENV = "production";
		
		// Build CLI application
		function buildCLIApp() {
			
			return new Promise((resolve, reject) => {

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
				const appFileJS = "main.js";

				// Build application package.json file
				grunt.file.write(appDir + "package.json", JSON.stringify({
					"name": pkg.name,
					"private": true,
					"main": appFileMain,
					"author": pkg.author
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
				
				// Build renderer process JavaScript file (main.js)
				browserify("src/gui/" + appFileJS + "x")
					.transform("babelify")
					.bundle((error, buffer) => {
					
						if (error) {
							return reject(error);
						}
						
						const content = buffer.toString("utf-8");
						
						grunt.file.write(appDir + appFileJS, UglifyJS.minify(content, {
							fromString: true
						}).code);
						
						resolve();
					}
				);
				
				// TODO: Build renderer process CSS file
				// TODO: Include data and asset files
			});
		}
		
		// Package Electron application
		function packageElectron() {
			
			return new Promise((resolve, reject) => {
				
				electronPackager({
					arch: "x64",
					platform: process.platform,
					dir: appDir,
					out: outDir,
					asar: true
				}, (error, appPath) => {
					
					if (error) {
						return reject(error);
					}
					
					resolve(appPath.pop());
				});
			});
		}
		
		// Compile CLI application to binary file
		function compileCLIApp(appPath) {
			
			return new Promise((resolve, reject) => {
				
				const options = [];
				const extension = (process.platform === "win32") ? ".exe" : "";
				const binaryFilePath = "../../" + appPath + "/resources/" + pkg.name + extension;
				
				grunt.file.setBase(buildDir);
		
				options.push("--version", "5.10.0");
				options.push("--x64"); // Build 64-bit binary
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