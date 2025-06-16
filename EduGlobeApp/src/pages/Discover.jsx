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
import "./Discover.css";


function Discover({ id, setId }) {
    const[displayName, setDisplayName] = useState("");
    const[email, setEmail] = useState("");
    const[yearOfStudy, setYearOfStudy] = useState("");
    const[courseOfStudy, setCourseOfStudy] = useState("");
    const[createdAt, setCreatedAt] = useState("");
    const[firstSignIn, setFirstSignIn] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [invalidSearch, setInvalidSearch] = useState(false);
    const rowsPerPage = 100;
    const totalPages = Math.ceil(searchResults.length / rowsPerPage);
    const currentRows = searchResults.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );
    const handlePageChange = (newPage) => {
      if (newPage > 0 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    };

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
                  console.log("profile fetched successfully");

                } else {
                    console.error("No profile found for this id");

                }
    };

    useEffect(() => {
          getUserProfile();
        }, [id]);

    const handleLogout = async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error logging out: ", error.message);
            } else {
                 // Clear the user ID which will be interpreted as logged out
                 setId(null);
            }
         };
    const handleSearch = async (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            const { data, error } = await mappings.from("edurec_mappings")
                                                  .select("*")
                                                  .or(`faculty.ilike.%${searchQuery}%,` +
                                                      `partner_university.ilike.%${searchQuery}%,` +
                                                      `pu_course_1.ilike.%${searchQuery}%,` +
                                                      `nus_course_1.ilike.%${searchQuery}%,` +
                                                      `nus_course_1_title.ilike.%${searchQuery}%`);

            if (error) {
                console.error("Search failed: ", error.message);
            } else {
                if (searchQuery === "") {
                    setSearchResults([]);
                } else if (data.length === 0){
                    setInvalidSearch(true);
                    setSearchResults([]);
                    //show a component with a warning message, has button "OK" that closes it.

                } else {
                    setSearchResults(data);
                }
                setCurrentPage(1);
                console.log("search query successful");
                console.log("number of results: ", searchResults.length);

            }
        }
    }

    return (
            <div className="discover-container">
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

                        <li className="onPage"  >
                            <img src={images.selected.discover} alt="discover logo" />
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

                        <li className="logout" onClick={handleLogout}>
                            <img src={images.logout} alt="settings logo" />
                                Logout
                        </li>

                    </ul>

                </aside>
                        {/* Main content */}
                        <main className="main-content">
                            <header className="discheader">
                                <h1 className="discover-title">Discover</h1>
                                    <div className="search-bar">
                                        <span className="search-icon" onClick={handleSearch}>
                                            <img src={images.icon.searchIcon} alt="Search" />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Country, University, etc..."
                                            className="search-input"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearch}
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

                            {invalidSearch && (
                              <>
                              <div className="invalid-search-overlay"></div>
                              <div className="invalid-search-container">
                                <div className="invalid-search-message">
                                  <p>No mapping results found. Please search by country, faculty, university or course!</p>
                                  <button
                                    onClick={() => setInvalidSearch(false)}
                                    className="dismiss-button"
                                  >
                                    Got it
                                  </button>
                                </div>
                              </div>

                              </>
                            )}

                            {searchResults.length > 0
                                ? (
                                      <section className="search-results">
                                        <p className="search-query">Search Result for: <em>{searchQuery}</em></p>
                                        <div className="results-table-container">
                                        <table className="results-table">
                                          <thead>
                                            <tr>
                                              <th>Faculty</th>
                                              <th>Country</th>
                                              <th>Partner University</th>
                                              <th>PU Course Code</th>
                                              <th>PU Course</th>

                                              <th>NUS Course Code</th>
                                              <th>NUS Course</th>
                                              <th>NUS Course Credits</th>
                                              <th>Pre-approved</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {currentRows.map((result, index) => (
                                              <tr key={index}>
                                                <td>{result.faculty}</td>
                                                <td>{result.faculty}</td>
                                                <td>{result.partner_university}</td>
                                                <td>{result.pu_course_1}</td>
                                                <td>{result.pu_course_1_title}</td>

                                                <td>{result.nus_course_1}</td>
                                                <td>{result.nus_course_1_title}</td>
                                                <td>{result.nus_crse1_units}</td>
                                                <td>{result.pre_approved ? "Yes" : "No"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                        </div>

                                        <div className="pagination-controls">
                                                <button
                                                  onClick={() => handlePageChange(currentPage - 1)}
                                                  disabled={currentPage === 1}
                                                >
                                                  Previous
                                                </button>
                                                <span>
                                                  Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                  onClick={() => handlePageChange(currentPage + 1)}
                                                  disabled={currentPage === totalPages}
                                                >
                                                  Next
                                                </button>
                                              </div>
                                      </section>
                                   )
                                : (
                                    <section className="landing-page">
                                              <div className="landing-container">
                                                <img src={images.LogoTransparent} alt="EduGlobe Logo" className="Tlogo" />
                                                <div className="landing-text">
                                                <p className="landing-title">EduGlobe</p>
                                                <p className="landing-subtitle">Where would you like to go?</p>
                                                </div>

                                              </div>
                                                <div className="landing-search-bar">
                                                  <span className="search-icon" onClick={handleSearch}>
                                                    <img src={images.icon.searchIcon} alt="Search" />
                                                  </span>
                                                  <input
                                                    type="text"
                                                    placeholder="Country, University, etc..."
                                                    className="landing-search-input"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={handleSearch}
                                                  />
                                                </div>
                                            </section>


                            )}
                        </main>
            </div>

        );
    }

export default Discover

