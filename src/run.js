/** @copyright Simas Toleikis, 2017 */
"use strict"

// Run as Electron application with both GUI and CLI interfaces
if (process.versions.electron) {
	require("./gui/run")
}
// Run as Node application with CLI interface only
else {
	require("./cli")(process.argv)
}