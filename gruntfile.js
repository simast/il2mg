// Enable Babel require() hook
require('@babel/register')

module.exports = function(grunt) {

	// JavaScript source files
	const javaScriptFiles = [
		'gruntfile.js',
		'src/**/*.js*',
		'build/tasks/**/*.js'
	]

	// Style sheet files
	const styleFiles = ['src/**/*.css']

	// All source files
	const sourceFiles = [
		...javaScriptFiles,
		...styleFiles
	]

	grunt.initConfig({

		// Source code report task
		sloc: sourceFiles,

		// Clean task
		clean: {
			release: [
				'build/temp',
				'build/il2mg*'
			],
			data: [
				'data/**/*.json',
				'data/**/*.eng',
				'data/**/*.ger',
				'data/**/*.pol',
				'data/**/*.rus',
				'data/**/*.spa',
				'data/**/*.fra'
			]
		}
	})

	// Load all required NPM Grunt tasks
	grunt.loadNpmTasks('grunt-contrib-clean')

	// Load custom build Grunt tasks
	grunt.loadTasks('build/tasks')

	// Default task used for building the project
	grunt.registerTask('default', [
		'clean:data',
		'build:sloc',
		'build:blocks',
		'build:locations',
		'build:airfields',
		'build:fronts',
		'build:index'
	])

	// Task to build a release package for the project
	grunt.registerTask('release', [
		'clean:release',
		'default',
		'build:release'
	])
}
