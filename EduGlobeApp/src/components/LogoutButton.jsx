import { useState, useEffect } from 'react';
import supabase from "../supabaseClient";

function LogoutButton({ id, setId }) {

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

    return <button style={{color:"black",}} onClick={handleLogout}> Log out?.</button>




}

export default LogoutButton