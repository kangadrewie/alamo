import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';

import AddStreamCard from './AddStreamCard';
import Admins from './UpdateAdmins';
import AddStream from './AddStream';

class EditRoom extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            admin: false,
            admins: [],
            room: [],
            selected: '',
            showSearchBar: false,
            friends: ['null']
        }
    }

    getRoomInformation = () =>  {
        axios.get('/room', {params: {roomId: window.location.pathname.substring(5)}})
            .then((response) => {
                this.setState({room: response.data, admins: response.data.admins, selected: response.data.stream})
                if (response.data.admins.includes(localStorage.getItem('userId'), 0)) {
                    this.setState({admin: true})
                    console.log(this.state.admins)
                }
            })
    }

    componentDidMount() {
        this.getRoomInformation();
        axios.get('/user', {params: {userId: localStorage.getItem('userId')}})
            .then((response) => this.setState({friends: response.data[0].friends}))
            .catch((err) => console.log(err))
    }

    handleUpdateRoom = (event) => {
        event.preventDefault();
        let roomTitle = event.target[0].value

        axios.post('/room/update', {roomId: window.location.pathname.substring(5), roomTitle: roomTitle, stream: this.state.selected})
            .then((response) => {
                this.props.socket.emit('change-stream', window.location.pathname.substring(5), this.state.selected)
                this.props.socket.emit('update-this-room', window.location.pathname.substring(5))
            })
            .catch((err) => console.log(err))
    }

    handleClick = (event) => {
        if (event.currentTarget.id === 'add-stream') {
            this.setState({showSearchBar: true})
        } else {
            this.setState({selected: event.currentTarget.id})
            if (event.currentTarget.id === this.state.selected) {
                this.setState({showSearchBar: true})
                this.setState({selected: ''})
            }
        }
    }

    render() {
        return(
            <div className="container-fluid margin-bottom px-4">
                <div className="row">
                    <div className="col">
                        <div className="room-headings">
                            <i className="fas back-arrow font-color fa-2x fa-arrow-left" onClick={() => this.props.history.goBack()}></i>
                            <h1 className="room-title">Edit Room</h1>
                        </div>

                        <form action="post" onSubmit={this.handleUpdateRoom}>

                            {this.state.admin ? 
                                <input name="roomName" autoFocus required minLength="3" maxLength="20" defaultValue={this.state.room.room_title}/>
                                :
                                <input name="roomName" autoFocus required minLength="3" maxLength="20" placeholder={this.state.room.room_title} disabled/>
                            }


                            <label htmlFor="username">Stream</label>
                            <AddStream
                                createRoomStream={this.props.createRoomStream}
                                handleClick={this.handleClick}
                                selected={this.state.selected}
                            />

                            {this.state.admin ?
                                <Admins friends={this.state.friends} admins={this.state.admins} adminRights={this.state.admin}/>
                                : null
                            }

                            <button type="submit" className={this.state.admin ? "primary-btn setup-btn" : "primary-btn setup-btn disabled"} style={{marginRight: '25px'}}>Save</button>
                            <button type="button" className="secondary-btn setup-btn" onClick={() => this.props.history.push('/')}>Cancel</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(EditRoom);
