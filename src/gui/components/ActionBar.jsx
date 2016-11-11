/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const {Link} = require("react-router");

// ActionBar component
module.exports = ({actions}) => {

	return (
		<footer id="actionBar">
			{Object.keys(actions).map((side) => {
				return (
					<nav className={side} key={side}>
						{(() => {

							const elements = [];
							let key = 1;

							// Build a list of action links
							actions[side].forEach((props, children) => {

								let linkElement;

								if (props.disabled) {
									linkElement = <span key={key}>{children}</span>;
								}
								else if (props.to) {
									linkElement = <Link key={key} {...props}>{children}</Link>;
								}
								else {
									linkElement = <a key={key} {...props}>{children}</a>;
								}

								// Render separator element
								if (key > 1) {
									elements.push(<span key={++key}>▪</span>);
								}

								elements.push(linkElement);
								key++;
							});

							return elements;
						})()}
					</nav>
				);
			})}
		</footer>
	);
};