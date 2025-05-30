import { useState, useEffect } from 'react';
import LoginForm from '../components/LogInForm.jsx';
import MappingForm from '../components/MappingForm.jsx';
import './LoginPage.css';
function LoginPage() {
    //just show the LoginForm component.
    return (<div>
                <LoginForm/>
            </div>);
}

export default LoginPage