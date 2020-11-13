import React from 'react';
import { withRouter } from 'react-router-dom';

import ProfileContext from './ProfileContext';
import RoomContext from './RoomContext';

class ContextMenu extends React.Component {
    constructor(props) {
        super(props);
    }


    handleContextMenu = (id, x, y) => {
        console.log('context menu clicked dashboard at', id, x, y)
    }

    profileMenu = (show, x, y) => {
        return (
            <ProfileContext show={show} x={x} y={y} />
        )
    }

    roomMenu = (show, id,  x, y) => {
        return (
            <RoomContext show={show} id={id} x={x} y={y} fetchUserInformation={this.props.fetchUserInformation} />
        )
    }

    contextMenu = () => {
        const id = this.props.status && this.props.status.id;
        const x = this.props.status && this.props.status.x;
        const y = this.props.status && this.props.status.y;
        const type = this.props.status && this.props.status.type

        if (type === 'profile') return this.profileMenu('block', x, y)
        if (type === 'room') return this.roomMenu('block', id, x, y)
    }

    render() {
        console.log(this.props.status)
        return(
            <React.Fragment>
                {this.contextMenu()}
            </React.Fragment>
        )
    }
}

export default withRouter(ContextMenu);
