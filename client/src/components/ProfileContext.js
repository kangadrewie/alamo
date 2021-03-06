import React from 'react';
import { withRouter } from 'react-router-dom';

import LogoutItem from './LogoutItem';

const ProfileContext = (props) => {
    const redirect = (path) => {
        props.history.push(path);
        props.closeContextMenu();
    }

    return(
        <div className="container context-menu" style={{display: props.show, top: props.y, left: props.x}}>
            <div className="row">
                <div className="col no-padding">
                    <ul className="nav flex-column font-color">
                        <li className="context-item" onClick={() => redirect('/change-avatar')}>Change Avatar</li>
                        <li className="context-item" onClick={() => redirect('/account-settings')}>Account Settings</li>
                        <LogoutItem socket={props.socket}/>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default withRouter(ProfileContext);
