/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const {IndexLink} = require("react-router");

// Create mission screen component
module.exports = class CreateMission extends React.Component {
	
	// Render component
	render() {
		
		return (
			<div>
				<IndexLink to="/">Home</IndexLink>
			</div>
		);
	}
};