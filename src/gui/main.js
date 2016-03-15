/** @copyright Simas Toleikis, 2016 */
"use strict";

// NOTE: This file is used only in development mode - production main.js file
// is an output (bundle) of browserify command.

const {ipcRenderer} = require("electron");

// Show Developer Tools (with F12 keyboard shortcut)
// TODO: Also show Developer Tools when any JavaScript errors are detected?
document.addEventListener("keydown", (event) => {
	
	if (event.code !== "F12") {
		return;
	}
	
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
	
	ipcRenderer.send("showDevTools");
	
}, true);

// Enable Babel require() hook for .es6, .es, .jsx and .js extensions
require("babel-register");

// Run application logic
require("./main.jsx");