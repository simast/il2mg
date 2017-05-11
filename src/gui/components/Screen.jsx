/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const ActionBar = require("./ActionBar");
const Photos = require("./Photos");

// Screen component
module.exports = ({id, children, actions}) => (

	<div id="screen">
		<Photos screen={id}/>
		<div id="container">
			<div id="content">
				<div id={id}>
					{children}
				</div>
			</div>
			<ActionBar actions={actions} />
		</div>
	</div>
);