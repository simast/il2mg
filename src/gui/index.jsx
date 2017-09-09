/** @copyright Simas Toleikis, 2016 */

import React from "react"
import ReactDOM from "react-dom"
import {HashRouter, Route, Switch, Redirect} from "react-router-dom"
import {useStrict} from "mobx"
import Application from "./app/Application"
import MissionsScreen from "./missions/Screen"
import CreateScreen from "./create/Screen"

// NOTE: Strict mode makes MobX require actions to modify state!
useStrict(true)

// Render application
ReactDOM.render((
	<HashRouter>
		<Route path="/" render={({match}) => {

			if (match.isExact) {
				return <Redirect to="/missions" />
			}

			return (
				<Application>
					<Switch>
						<Route path="/missions/:mission?/:action?" component={MissionsScreen} />
						<Route path="/create" component={CreateScreen} />
					</Switch>
				</Application>
			)
		}}
		/>
	</HashRouter>
), document.getElementById("main"))