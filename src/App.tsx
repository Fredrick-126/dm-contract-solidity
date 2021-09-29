import React from 'react';

import { BrowserRouter, Switch, Route } from 'react-router-dom';

import Home from './Pages/Home';
import Mine from './Pages/Mine';
import MineAct from './Pages/MineAct';
import Swap from './Pages/Swap';
import Presale from './Pages/Presale';
import {UseWalletProvider } from 'use-wallet'

function App() {
	return (
		<UseWalletProvider
          chainId={4002}   
          connectors={{
            // This is how connectors get configured
            portis: { dAppId: 'my-dapp-id-123-xyz' },
          }}
        > 
			<BrowserRouter>
			{
				<Switch>
					<Route exact path="/swap" component={Swap}></Route>
					<Route exact path="/mine" component={Mine}></Route>
					<Route exact path="/presale" component={Presale}></Route>
					<Route exact path="/mine/action/:id" component={MineAct}></Route>
					<Route path="*" component={Home}></Route>
				</Switch>
			}
			</BrowserRouter>
        </UseWalletProvider>
	);
}

export default App;
