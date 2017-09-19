/** @copyright Simas Toleikis, 2017 */

import React from "react"
import CSSTransition from "react-transition-group/CSSTransition"
import classNames from "classnames"
import ActionBar from "./ActionBar"

// Dialog component
export default ({id, children, onClose, actions, opened = false}) => (
	<CSSTransition in={opened} mountOnEnter unmountOnExit timeout={250} classNames="dialog">
		<div className={classNames("dialog", {opened})}>
			<div id={id} className="container">
				<div className="close">
					<a onClick={() => onClose()}></a>
				</div>
				<div className="content">
					{children}
				</div>
				<ActionBar actions={actions} />
			</div>
		</div>
	</CSSTransition>
)