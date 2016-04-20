/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const ActionBar = require("./ActionBar");

// Screen component
module.exports = ({id, children, actions}) => (
	<div id="screen">
		<div id="content">
			<div id={id}>
				{children}
			</div>
		</div>
		<ActionBar actions={actions} />
	</div>
);