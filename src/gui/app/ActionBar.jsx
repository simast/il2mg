/** @copyright Simas Toleikis, 2016 */

import React from "react"
import {Link} from "react-router-dom"
import classNames from "classnames"

// ActionBar component
export default ({actions}) => (

	<footer className="actionBar">
		{Object.keys(actions).map(side => (
			<nav className={side} key={side}>
				{(() => {

					const elements = []
					let key = 1

					// Build a list of action links
					actions[side].forEach(({to, onClick, disabled, primary}, children) => {

						const className = classNames({primary})
						let linkElement

						if (disabled) {
							linkElement = <span key={key}>{children}</span>
						}
						else if (to) {
							linkElement = <Link key={key} to={to} className={className}>{children}</Link>
						}
						else {
							linkElement = <a key={key} onClick={onClick} className={className}>{children}</a>
						}

						// Render separator element
						if (key > 1) {
							elements.push(<span key={++key}>▪</span>)
						}

						elements.push(linkElement)
						key++
					})

					return elements
				})()}
			</nav>
		))}
	</footer>
)