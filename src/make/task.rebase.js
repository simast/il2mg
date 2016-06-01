/** @copyright Simas Toleikis, 2016 */
"use strict";

// Make mission rebase task
module.exports = function makeTaskRebase(flight) {
	
	const rand = this.rand;
	const unit = this.units[flight.unit];
	const rebaseAirfield = this.airfields[rand.pick(unit.rebase)];
	
	// Register target airfield location as flight target
	// flight.target = patrolPoints.slice();
};