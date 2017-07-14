/** @copyright Simas Toleikis, 2017 */
"use strict"

const {app} = require("electron")

// Run with CLI interface
if (process.argv.length > 2) {

	require("../cli")
	app.quit()
}
// Run with GUI interface
else {
	require("./main")
}