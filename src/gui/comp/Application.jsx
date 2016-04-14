/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");

// Application component
module.exports = class Application extends React.Component {
	
	// Render component
	render() {
		
		// NOTE: Router will provide child components
		return (
			<div>
				{this.props.children}
			</div>
		);
	}
};