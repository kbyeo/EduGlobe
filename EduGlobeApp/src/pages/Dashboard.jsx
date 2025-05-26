import { useState, useEffect } from 'react';
import Logo from '../assets/images/EduGlobeLogoGradient.png';
import supabase from "../supabaseClient";

function Dashboard({ id, setId }) {
    const[displayName, setDisplayName] = useState("");

    //this handles log outs
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error logging out: ", error.message);
        } else {
          // Clear the user ID which will be interpreted as logged out
          setId(null);
        }
    };

    useEffect(() => {
          const getUserProfile = async () => {
            const { data, error } = await supabase
              .from("userprofiles")
              .select("display_name")
              .eq("id", id)
              .single();
            if (error) {
              console.error("Error retrieving display_name: ", error.message);
            } else if (data) {
              setDisplayName(data.display_name);

            }
          };
          getUserProfile();
        }, []);

    return (
        <div>
            <h1 style={{color:"white",}}>Dashboard</h1>
            <p style={{color:"white",}}>Welcome back, {displayName}</p>
            <button style={{color:"black",}} onClick={handleLogout}> Log out?.</button>
        </div>
        );
    }

export default Dashboard