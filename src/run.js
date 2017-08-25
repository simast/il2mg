/** @copyright Simas Toleikis, 2017 */

// Enable Babel require() hook
if (process.env.NODE_ENV !== "production") {
	require("babel-register")
}

// Run as Electron application with both GUI and CLI interfaces
if (process.versions.electron) {
	require("./gui/run")
}
// Run as Node application with CLI interface only
else {
	require("./cli").default(process.argv)
}