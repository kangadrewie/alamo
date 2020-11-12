import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './App.css';
import io from 'socket.io-client'

import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Room from './components/Room';
import Loading from './components/Loading';

function App(props) {
    const socket = io.connect('http://localhost:8080')

    const { isAuthenticated, isLoading } = useAuth0();

    const changeOnlineStatus = (account_setup) => {
        if (account_setup === true) {
            socket.emit('online', localStorage.getItem('userId'));
        }
    }

    if (isLoading) {
        return(
            <div className="App">
                <Loading/>
            </div>
        )
    }


    if (isAuthenticated) {
        return (
        <div className="App">
            <Router>
                <ErrorBoundary>
                    <Switch>
                        <Route path="/login" component={Login}/>
                        <Dashboard changeOnlineStatus={(account_setup) => { changeOnlineStatus(account_setup) }}></Dashboard>
                    </Switch>
                </ErrorBoundary>
            </Router>
        </div>
      );
    } else {
        return(
            <div className="App">
                <Home/>
            </div>
        )
    } 

}

export default App;
