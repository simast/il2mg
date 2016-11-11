/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const ActionBar = require("./ActionBar");
const Photos = require("./Photos");

// Screen component
module.exports = ({id, children, actions}) => {

	return (
		<div id="screen">
			<div id="container">
				<div id="content">
					<div id={id}>
						{children}
					</div>
				</div>
				<ActionBar actions={actions} />
			</div>
			<Photos screen={id}/>
		</div>
	);
};