import { useState, useEffect } from 'react';
//IMAGES
import images from '../assets/images';

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
        console.log("profile updated successfully");
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
                                     {/* Sidebar */}
                                     <aside className="sidebar">


                                       <div className="logo-section">
                                         <img src={images.Logo} alt="EduGlobe Logo" className="dlogo" />
                                         <div className="dlogo-text-container">
                                            <p className="dEduGlobe-header">EduGlobe</p>
                                            <p className="dcaption">Exchange made easier.</p>
                                         </div>
                                       </div>


                                       <ul className="nav-links">
                                         <li className="onPage">
                                             <img src={images.selected.dashboard} alt="dashboard logo" />
                                             Dashboard
                                         </li>

                                         <li>
                                             <img src={images.unselected.discover} alt="discover logo" />
                                             Discover
                                         </li>

                                         <li>
                                             <img src={images.unselected.forum} alt="forum logo" />
                                             Forum
                                         </li>

                                         <li>
                                             <img src={images.unselected.notifications} alt="notifications logo" />
                                             Notifications
                                         </li>

                                         <li>
                                             <img src={images.unselected.message} alt="message logo" />
                                             Message
                                         </li>

                                         <li>
                                             <img src={images.unselected.profile} alt="profile logo" />
                                             My Profile
                                         </li>

                                         <li>
                                             <img src={images.unselected.settings} alt="settings logo" />
                                             Settings
                                         </li>
                                       </ul>
                                     </aside>
                                     {/* Main content */}
                                     <main className="main-content">
                                       <header className="dashheader">
                                         <h1 className="dashboard-title">Dashboard</h1>
                                         <div className="search-bar">
                                             <span className="search-icon">
                                                 <img src={images.icon.searchIcon} alt="Search" />
                                             </span>
                                           <input
                                             type="text"
                                             placeholder="Country, University, etc..."
                                             className="search-input"
                                           />
                                         </div>
                                         <div className="header-icons">
                                           <span className="icon-chat">
                                               <img src={images.icon.msgIcon} alt="msg" />
                                           </span>
                                           <span className="icon-favourite">
                                               <img src={images.icon.heartIcon} alt="heart" />
                                           </span>
                                           <span className="user-profile">
                                              <span className="user-name">{displayName}</span>
                                             <img
                                               src={images.selected.profile}
                                               alt="User Avatar"
                                               className="user-avatar"
                                             />

                                           </span>
                                         </div>
                                       </header>
                                       <section className="content-section">
                                         <p className="content-title">Current Mappings</p>
                                         <div className="mapping-box">
                                           <p>You have no current mappings.</p>
                                           <div className="mapping-buttons">
                                             <button className="add-button">+ Add</button>
                                             <button className="discover-button">Discover mappings</button>
                                           </div>
                                         </div>
                                       </section>
                                       <LogoutButton />
                                     </main>
                                   </div>

                       </div>
                   );
    }

export default Dashboard