import { useState, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { Routes, Route, useNavigate, Outlet } from "react-router-dom";
import images from '../assets/images';
import supabaseClients from "../supabaseClient";
import LogoutButton from "../components/LogoutButton.jsx";
import "./MyProfile.css";
const { supabase, mappings } = supabaseClients;

function MyProfile( {id, setId} ) {
    const[displayName, setDisplayName] = useState("");
    const[email, setEmail] = useState("");
    const[yearOfStudy, setYearOfStudy] = useState("");
    const[courseOfStudy, setCourseOfStudy] = useState("");
    const[createdAt, setCreatedAt] = useState("");
    const[firstSignIn, setFirstSignIn] = useState("");
    const[updateSuccess, setUpdateSuccess] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);
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
                  setAvatarUrl(data.avatar_url);
                  console.log("profile fetched successfully");

                } else {
                    console.error("No profile found for this id");

                }
    };

    useEffect(() => {
          getUserProfile();
        }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();

        const { error } = await supabase
          .from("userprofiles")
          .update({
            display_name: displayName,
            year_of_study: yearOfStudy,
            course_of_study: courseOfStudy
          })
          .eq("id", id);

        if (error) {
          console.error("Error updating profile: ", error.message);
        } else {
          setUpdateSuccess(true);
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          setUploading(true);
          const fileExt = file.name.split(".").pop();
          const filePath = `${id}/${uuid()}.${fileExt}`;
          // upload to storage
          const { error: uploadErr } = await supabase
            .storage
            .from("avatars")
            .upload(filePath, file, { upsert: true });
          if (uploadErr) throw uploadErr;
          //obtain public URL (make bucket public, or use signed URL if private)
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath);
          //save URL in profile table
          const { error: dbErr } = await supabase
            .from("userprofiles")
            .update({ avatar_url: publicUrl })
            .eq("id", id);
          if (dbErr) throw dbErr;
          //reflect immediately
          setAvatarUrl(publicUrl);
        } catch (err) {
          alert(`Avatar upload failed: ${err.message}`);
        } finally {
          setUploading(false);
          e.target.value = "";           // reset file input
        }
    };

    const handleLogout = async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error logging out: ", error.message);
            } else {
                 // Clear the user ID which will be interpreted as logged out
                 setId(null);
            }
    };


    return (
        <>
            <div className="myprofile-container">
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
                        <li onClick={() => navigate('/')} >
                            <img src={images.unselected.dashboard} alt="dashboard logo" />
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

                        <li className="onPage">
                            <img src={images.selected.profile} alt="profile logo" />
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
                            <header className="myprofileheader">
                                <h1 className="myprofile-title">My Profile</h1>
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
                                            <span className="user-name">{displayName}</span>
                                            <img
                                                src={images.selected.profile}
                                                alt="User Avatar"
                                                className="user-avatar"
                                            />

                                        </span>
                                    </div>
                            </header>

                            {updateSuccess && (
                                                          <>
                                                          <div className="update-success-overlay"></div>
                                                          <div className="update-success-container">
                                                            <div className="update-success-message">
                                                              <p>Profile updated successfully!</p>
                                                              <button
                                                                onClick={() => setUpdateSuccess(false)}
                                                                className="dismiss-button"
                                                              >
                                                                Done
                                                              </button>
                                                            </div>
                                                          </div>

                                                          </>
                                                        )}

                            <section className="profile-body">
                                      <div
                                        className="profile-picture"
                                        onClick={triggerFileSelect}
                                        >
                                        <img
                                            src={avatarUrl || images.selected.profile}
                                            alt="User profile"
                                            className="avatar-image" />
                                            {uploading && <div className="avatar-loader" />}
                                      </div>
                                      <input
                                                  type="file"
                                                  accept="image/*"
                                                  ref={fileInputRef}
                                                  style={{ display: "none" }}
                                                  onChange={handleFileChange}
                                                />

                                      <form className="profile-fields" onSubmit={handleUpdate}>
                                                  <label>Display name</label>
                                                  <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

                                                  <label>Current year of Study</label>
                                                  <input required value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} />

                                                  <label>Course of Study</label>
                                                  <input required value={courseOfStudy} onChange={(e) => setCourseOfStudy(e.target.value)} />

                                                  <button type="submit" className="profile-update-button">Update</button>
                                      </form>


                            </section>

                            <div className="history-section">
                                <p>History</p>
                                <div className="history-box"></div>
                            </div>

                        </main>
            </div>

        </>
        )

}

export default MyProfile