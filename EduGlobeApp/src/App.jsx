import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage.jsx';
import ProfileCreation from "./components/ProfileCreation.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Discover from "./pages/Discover.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import Forum from "./pages/Forum.jsx";
import PostDetail from "./components/PostDetail.jsx";
import supabaseClients from "./supabaseClient";
// Destructure the instances
const { supabase, mappings } = supabaseClients;


function App() {
    const [id, setId] = useState(null);
    const [session, setSession] = useState(null);
    const [firstSignin, setFirstSignin] = useState(true);

  //check session on load and listen for changes
  useEffect(() => {
    //check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setId(session.user.id);
        console.log(`Existing session found. User ID: ${session.user.id}`);
      }
    });
    //listen for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setId(session.user.id);
        console.log(`Authentication state changed. User ID: ${session.user.id} signed in`);
      } else {
        setId(null); //clear the user ID if logged out
        console.log("User signed out.");
      }
    });
    //cleanup the subscription on unmount
    return () => {
        console.log("unsubscribing from auth");
        subscription.unsubscribe();

        }
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
    } else {
        //straight to dashboard which handles new user checks
        return <Router>
                     <Routes>
                       {/* Once signed in, route within the app */}

                       <Route path="/" element={<Dashboard id={id} setId={setId} />} />
                       <Route path="/profile" element={<ProfileCreation userId={id} />} />
                       <Route path="/discover" element={<Discover id={id} setId={setId} />} />
                       <Route path="/myprofile" element={<MyProfile id={id} setId={setId} />} />
                       <Route path="/forum" element={<Forum id={id} setId={setId} />} />
                       <Route path="/forum/:id" element={<PostDetail userId={id} setUserId={setId} />} />

                     </Routes>
                   </Router>
    }


}

export default App
