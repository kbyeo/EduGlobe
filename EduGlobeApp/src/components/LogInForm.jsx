import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './LoginForm.css';
import Logo from '../assets/images/EduGlobeLogoGradient.png';



function LogInForm() {


    const supabase = createClient(
        'https://osoyhekwotdpazclekmu.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zb3loZWt3b3RkcGF6Y2xla211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDY2ODksImV4cCI6MjA2MzcyMjY4OX0.ACtumr_cCW2r4fE5Kus_PCdiIHhDueiMPl_YR_0qJQM'
        );


    return (
        <div className="login-container">
            <div className="header">
                <img src={Logo} className="logos" alt="NUS EduGlobe logo"/>

                <div className="text-container">
                    <p className="EduGlobe-header">NUS EduGlobe</p>
                    <p className="caption">Exchange made Easier.</p>
                </div>
            </div>



            <Auth
                    supabaseClient={supabase}
                    appearance={{
                          theme: ThemeSupa,
                          variables: {
                            default: {
                              colors: {
                                brand: '#8c52ff',
                                brandAccent: '#5400a1',
                                inputBackground: '#11103c',
                                inputBorder: '#976efe',
                                inputBorderHover: '#e7cdea',
                                inputBorderFocus: '#976efe',
                                inputText: '#a6a4f5',
                                inputPlaceholder: 'a6a4f5',
                                messageText: '#11103c',
                                anchorTextColor: '#a6a4f5',
                                anchorTextHoverColor: '#e7cdea',
                              },
                              fontSizes: {
                                  baseBodySize: '15px',
                                  baseInputSize: '18px',
                                  baseLabelSize: '12px',
                                  baseButtonSize: '19px',
                              },
                              fonts: {
                                  bodyFontFamily: `Poppins, sans-serif`,
                                  buttonFontFamily: `Poppins, sans-serif`,
                                  inputFontFamily: `Poppins, sans-serif`,
                                  labelFontFamily: `Poppins, sans-serif`,
                              },
                              borderWidths: {
                                  buttonBorderWidth: '3px',
                                  inputBorderWidth: '3px',
                              },
                              radii: {
                                  borderRadiusButton: '4px',
                                  buttonBorderRadius: '6px',
                                  inputBorderRadius: '6px',
                              },
                            },
                          },
                        }}
                        localization={{
                              variables: {
                                sign_in: {
                                  email_label: '',
                                  password_label: '',
                                  email_input_placeholder: 'Email address',
                                  password_input_placeholder:'Password',
                                },
                                sign_up: {
                                  email_label: '',
                                  password_label: '',
                                  email_input_placeholder: 'Your email address',
                                  password_input_placeholder:'Create a password',
                                }
                              },
                            }}
                    providers={[]}
                />

        </div>

        );

}

export default LogInForm