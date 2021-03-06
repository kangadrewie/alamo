import React from 'react';
import { withRouter } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    componentDidCatch(error, info) {
        // Display fallback UI
        this.setState({ hasError: true });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="container-fluid">
                    <div className="row">
                        <div className="error-message">
                            <h1>OH GOD. WHAT HAVE YOU DONE?</h1>
                            <h3 className="thin margin-bottom">This page has generated an error.</h3>
                            <h5 className="thin margin-bottom">Please report it so we can fix it. Do it for beaker!</h5>
                            <button className="primary-btn">Report It</button>
                            <a href="/">
                                <button className="secondary-btn margin-left">Return Home</button>
                            </a>
                        </div>
                    </div>
                    <img className="error-image" src="/images/error/beaker-error-page.png" alt=""/>
                </div>
            );
        }
        return this.props.children;
    }
}

export default withRouter(ErrorBoundary);
