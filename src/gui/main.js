/** @copyright Simas Toleikis, 2016 */
"use strict"

// NOTE: This file is used only in development mode - production main.js file
// is an output (bundle) of browserify command.

const {remote} = require("electron")

// Add some local development mode keyboard shortcuts
document.addEventListener("keydown", event => {

	// Show Developer Tools (with F12)
	// TODO: Also show Developer Tools when any JavaScript errors are detected?
	if (event.code === "F12") {
		remote.getCurrentWebContents().openDevTools({mode: "detach"})
	}
	// Force reload (with F5)
	else if (event.code === "F5") {
		remote.getCurrentWebContents().reloadIgnoringCache()
	}
	else {
		return
	}

	event.preventDefault()
	event.stopPropagation()

}, true)

// Enable Babel require() hook for .es6, .es, .jsx and .js extensions
require("babel-register")

// Run application logic
require("./main.jsx")