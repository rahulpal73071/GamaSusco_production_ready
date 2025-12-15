import { Link } from "react-router-dom";

const GettingStarted = () => {
    return (
        <section className="getting-started-section">
            <div className="container">
                <h2>Getting Started</h2>
                <p>Follow these simple steps to get started with our application:</p>
                <ol>
                    <li>Sign up for an account.</li>
                    <li>Verify your email address.</li>
                    <li>Complete your profile setup.</li>
                    <li>Explore the dashboard and features.</li>
                </ol>
                <Link to="/signup" className="btn btn-primary">Get Started Now</Link>
            </div>
        </section>
    );
}