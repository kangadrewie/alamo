import React, { Component } from 'react';
import LoginButton from './LoginButton';
import SignUpButton from './SignUpButton';

class Home extends Component {
    render() {
        return (
            <div className="container-fluid home">
                <img className="tr-home-wave" src="/images/home/tr-home-wave-3.svg" alt="Alamo" />
                <img className="br-home-wave" src="/images/home/br-home-wave-1.svg" alt="Alamo" />
                <nav className="navbar justify-content-between">
                    <a href="/" className="logo-main">alamo</a>
                    <LoginButton></LoginButton>
                </nav>
                <div className="row">
                    <div className="col-lg-10 banner-primary">
                        Share the moment.
                        <div className="row">
                            <span className="banner-secondary">Sign Up For Free Today.</span>
                        </div>
                    </div>
                </div>
                <div className="row register-btn">
                    <div className="col">
                        <SignUpButton/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Home;
