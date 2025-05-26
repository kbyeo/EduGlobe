import { useState, useEffect } from "react";
import './App.css';
import LoginPage from './pages/LoginPage.jsx';
import ProfileCreation from "./components/ProfileCreation.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import supabase from "./supabaseClient";


function App() {
    const [id, setId] = useState(null);
    const [session, setSession] = useState(null);
    const [firstSignin, setFirstSignin] = useState(true);

  // Check session on load and listen for changes
  useEffect(() => {
    // Check for an existing session upon component load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setId(session.user.id); // Set the user ID
        console.log(`Existing session found. User ID: ${session.user.id}`);
      }
    });
    // Listen for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setId(session.user.id); // Update the user ID
        console.log(`Authentication state changed. User ID: ${session.user.id}`);
      } else {
        setId(null); // Clear the user ID if logged out
        console.log("User signed out.");
      }
    });
    // Cleanup the subscription on unmount
    return () => subscription.unsubscribe();
  }, [supabase]);

  // When id is set, fetch the first_signin value from the userprofiles table
    useEffect(() => {
      if (!id) return; // Only run if id exists
      const getUserProfile = async () => {
        const { data, error } = await supabase
          .from("userprofiles")
          .select("first_sign_in")
          .eq("id", id)
          .single();
        if (error) {
          console.error("Error retrieving first_sign_in value: ", error.message);
        } else {
          setFirstSignin(data.first_sign_in);
          console.log("first_signin value:", data.first_sign_in);
        }
      };
      getUserProfile();
    }, [id]);

    if (!session) {
        return <LoginPage/>
    }
    if (firstSignin) {
        //this is a new user, direct to create account
        return <ProfileCreation id={id} setId={setId}/>;
    } else {
        //not a new user, straight to dashboard
        return <Dashboard id={id} setId={setId}/>;
    }


}

export default App
