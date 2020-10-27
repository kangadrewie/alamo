import React from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import ProfileSetup from './ProfileSetup';
import Sidebar from './Sidebar';
import NavigationBar from './NavigationBar';
import Room from './Room';
import Profile from './Profile';
import LogoutButton from './LogoutButton';
import CreateRoom from './CreateRoom';

const Dashboard = () => {
    const { user } = useAuth0();
    const [state, setState] = React.useState([])

    React.useEffect(() => {
        const fetchUserInformation = async () => {
            const response = await axios.get('/user', {params: {email: user.email}})
            setState(response.data[0])
        }
        fetchUserInformation();
    }, [])

    localStorage.setItem('userId', state._id)

    if (state.account_setup === false) {
        return(
            <ProfileSetup user={user}/>
        )
    } else {
        return (
            <Switch>
                <div className="container-fluid">
                    <div className="row">
                        <Sidebar user={state}/>
                        <main className="col px-4">
                            <NavigationBar/>
                            <Route path="/create-room" component={CreateRoom}/>
                            <Route path="/room/" component={Room}/>
                        </main>
                    </div>
                </div>
            </Switch>
        );
    }
}

export default Dashboard;
