import { useState, useEffect } from 'react';
import Logo from '../assets/images/EduGlobeLogoGradient.png';
import supabase from "../supabaseClient";
import ProfileCreation from "../components/ProfileCreation.jsx"
import LogoutButton from "../components/LogoutButton.jsx";
import "./Dashboard.css";
//Dashboard page is reached only when an account is created. It should store the userprofile
//as an object which should be passed around as a property starting from here.
function Dashboard({ id, setId }) {
    const[displayName, setDisplayName] = useState("");
    const[email, setEmail] = useState("");
    const[yearOfStudy, setYearOfStudy] = useState("");
    const[courseOfStudy, setCourseOfStudy] = useState("");
    const[createdAt, setCreatedAt] = useState("");
    const[firstSignIn, setFirstSignIn] = useState("");


    const getUserProfile = async () => {
                const { data, error } = await supabase
                  .from("userprofiles")
                  .select("*")
                  .eq("id", id)
                  .single();
                if (error) {
                  console.error("Error retrieving profile: ", error.message);
                } else if (data) {
                  setDisplayName(data.display_name);
                  setEmail(data.email);
                  setYearOfStudy(data.year_of_study);
                  setCourseOfStudy(data.course_of_study);
                  setCreatedAt(data.created_at);
                  setFirstSignIn(data.first_sign_in);
                  console.log("profile fetched successfully");

                } else {
                    console.error("No profile found for this id");

                }
    };

    useEffect(() => {
          getUserProfile();
        }, [id]);



     const onProfileUpdated = async () => {
        //This function is called only AFTER profile update is done
        //call getUserProfile again to read updated profile data
        await getUserProfile();
        //updated firstSignIn state variable will become false,
        //revealing the dashboard.

      };

        return (

                       <div className="container">
                           {firstSignIn ? (
                               <div className="profile-setup">
                                   <ProfileCreation id={id} setId={setId}
                                   onProfileUpdated={onProfileUpdated}/>
                               </div>
                           ) : null}
                           {/* Dashboard content */}
                           <div className="dashboard-container">
                               <div className="dashboard-content">
                               <h1 style={{ color: "white" }}>Dashboard</h1>
                               <p style={{ color: "white" }}>Welcome back, {displayName}</p>
                               <LogoutButton/>
                               </div>
                           </div>
                       </div>
                   );
    }

export default Dashboard