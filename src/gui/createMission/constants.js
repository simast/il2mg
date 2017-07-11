/** @copyright Simas Toleikis, 2017 */
"use strict"

// Starting mode
const Start = Object.freeze({
	Parking: 0,
	Runway: 1,
	Air: 2
})

// Supported battles
const Battle = Object.freeze({
	Stalingrad: "stalingrad"
})

module.exports = {
	Start,
	Battle
}