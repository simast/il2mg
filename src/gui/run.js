/** @copyright Simas Toleikis, 2017 */
"use strict"

const {app} = require("electron")
const path = require("path")

const argv = process.argv.slice()
let runAsCLI = argv.length > 2

// NOTE: Packaged Electron app will be missing second "script" argument
if (!process.defaultApp) {

	runAsCLI = argv.length > 1

	// Add a fake "script" argument as current executable name
	if (runAsCLI) {
		argv.splice(1, 0, path.basename(argv[0]))
	}
}

// Run with CLI interface
if (runAsCLI) {

	app.on("ready", async () => {

		await require("../cli")(argv)
		app.exit()
	})
}
// Run with GUI interface
else {
	require("./main")
}