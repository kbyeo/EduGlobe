import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Outlet } from "react-router-dom";
//IMAGES
import images from '../assets/images';
import MappingForm from '../components/MappingForm.jsx';
import supabaseClients from "../supabaseClient";
// Destructure the instances
const { supabase, mappings } = supabaseClients;
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
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [mappings, setMappings] = useState([]);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedMappingIndex, setSelectedMappingIndex] = useState(null);
    const navigate = useNavigate();



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
                  setMappings(data.mappings);
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

    // Function to handle opening the popup
    const openPopup = () => setPopupOpen(true);
    // Function to handle closing the popup
    const closePopup = () => setPopupOpen(false);

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

     const handleContextMenu = (e, index) => {
         e.preventDefault(); // Prevent the default browser context menu
         setSelectedMappingIndex(index); // Store the index of the clicked mapping
         setContextMenuPosition({ x: e.clientX, y: e.clientY }); // Set the menu position
         setContextMenuVisible(true); // Show the context menu
     };

     //handle deletion of a mapping
     const handleDelete = async () => {
         if (selectedMappingIndex === null) return;
         //remove mapping from current state
         console.log(`index ${selectedMappingIndex} chosen`);
         const updatedMappings = mappings.filter((_, i) => i !== selectedMappingIndex);
         //update the database
         const { error } = await supabase
           .from("userprofiles")
           .update({ mappings: updatedMappings })
           .eq("id", id);
         if (error) {
           console.error("Error deleting mapping:", error.message);
           alert("An error occurred while deleting the mapping. Please try again.");
           return;
         }
         //update local state
         setMappings(updatedMappings);
         console.log(`mapping no ${selectedMappingIndex} deleted successfully`);
         //hide the context menu
         setContextMenuVisible(false);
         setSelectedMappingIndex(null);
     };

     //if clicked outside, context menu disappears
     const handleOutsideClick = () => {
         setContextMenuVisible(false);
         setSelectedMappingIndex(null);
     };



        return (

                       <div className="container" onClick={handleOutsideClick}>
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

                                         <li onClick={() => navigate('/discover')} >
                                             <img src={images.unselected.discover} alt="discover logo" />
                                             Discover
                                         </li>

                                         <li onClick={() => navigate('/forum')}>
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

                                         <li onClick={() => navigate('/myprofile')} >
                                             <img src={images.unselected.profile} alt="profile logo" />
                                             My Profile
                                         </li>

                                         <li>
                                             <img src={images.unselected.settings} alt="settings logo" />
                                             Settings
                                         </li>

                                         <li className="logout" onClick={handleLogout}>
                                             <img src={images.logout} alt="settings logo" />
                                             Logout
                                         </li>

                                       </ul>
                                     </aside>


                                     {/* Main content */}
                                     <main className="main-content">
                                       <header className="dashheader">
                                         <h1 className="dashboard-title">Dashboard</h1>
                                         <div className="search-bar" onClick={() => navigate('/discover')}>
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
                                              <span className="user-name" onClick={() => navigate('/myprofile')}>{displayName}</span>
                                             <img
                                               src={images.selected.profile}
                                               alt="User Avatar"
                                               className="user-avatar"
                                               onClick={() => navigate('/myprofile')}
                                             />

                                           </span>
                                         </div>
                                       </header>


                                       <section className="content-section">
                                         <p className="content-title">Current Mappings</p>
                                         <div className="mapping-box">
                                             {mappings && mappings.length > 0

                                                 ? (<><div className="mappings-table-container">
                                                              <table className="mappings-table">
                                                                <thead>
                                                                  <tr>
                                                                    <th>No.</th>
                                                                    <th>Country</th>
                                                                    <th>University</th>
                                                                    <th>Type</th>
                                                                    <th>Start Date</th>
                                                                    <th>End Date</th>
                                                                  </tr>
                                                                </thead>
                                                                <tbody>
                                                                  {mappings.map((mapping, index) => (
                                                                    <tr key={index}
                                                                        onContextMenu={(e) => handleContextMenu(e, index)}
                                                                    >
                                                                      <td>{index + 1}</td>
                                                                      <td>{mapping.country}</td>
                                                                      <td>{mapping.university}</td>
                                                                      <td>{mapping.type}</td>
                                                                      <td>{new Date(mapping.startDate).toLocaleDateString()}</td>
                                                                      <td>{new Date(mapping.endDate).toLocaleDateString()}</td>
                                                                    </tr>
                                                                  ))}
                                                                </tbody>
                                                              </table>
                                                              {contextMenuVisible && (
                                                                          <div
                                                                            className="context-menu"
                                                                            style={{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }}
                                                                          >
                                                                            <ul>
                                                                              <li onClick={handleDelete}>Delete</li>
                                                                            </ul>
                                                                          </div>
                                                              )}

                                                              <div className="post-table">

                                                                <div className="mapping-buttons2">
                                                                    <button className="add-button1" onClick={openPopup}>+ Add</button>
                                                                    <button className="discover-button1" onClick={() => navigate('/discover')}>Discover mappings</button>
                                                                </div>
                                                                <p className="delete-note">*Right-click on a row to delete an entry</p>
                                                              </div>

                                                            </div>
                                                            </>)

                                                 : (  <><p>You have no current mappings.</p>
                                                        <div className="mapping-buttons">
                                                            <button className="add-button" onClick={openPopup}>+ Add</button>
                                                            <button className="discover-button" onClick={() => navigate('/discover')}>Discover mappings</button>
                                                        </div></>)
                                             }

                                         </div>
                                       </section>


                                     </main>
                                     {isPopupOpen && (<MappingForm closePopup={closePopup} id={id}
                                         mappings={mappings} setMappings={setMappings}/>)}
                                   </div>

                       </div>
                   );
    }

export default Dashboard