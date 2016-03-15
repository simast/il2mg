/** @copyright Simas Toleikis, 2016 */
"use strict";

// Run GUI application
if (process.versions.electron) {
	require("./gui");
}
// Run CLI application
else {
	require("./cli");
}