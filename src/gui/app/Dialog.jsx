/** @copyright Simas Toleikis, 2017 */

import React from "react"
import CSSTransition from "react-transition-group/CSSTransition"
import classNames from "classnames"

// Dialog component
export default ({id, children, onClose, opened = false}) => (
	<CSSTransition in={opened} mountOnEnter unmountOnExit timeout={300} classNames="dialog">
		<div className={classNames("dialog", {opened})}>
			<div id={id} className="content">
				<div className="close">
					<a onClick={() => onClose()}></a>
				</div>
				{children}
			</div>
		</div>
	</CSSTransition>
)