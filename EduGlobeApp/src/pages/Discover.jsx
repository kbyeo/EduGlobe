import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, Outlet } from "react-router-dom";
//IMAGES
import images from '../assets/images';
import MappingForm from '../components/MappingForm.jsx';
import supabaseClients from "../supabaseClient";
// Destructure the instances
const { supabase, mappings } = supabaseClients;
import ProfileCreation from "../components/ProfileCreation.jsx"
import LogoutButton from "../components/LogoutButton.jsx";
import CourseDetails from "../components/CourseDetails.jsx";
import "./Discover.css";
const AY = "2024-2025";


function Discover({ id, setId }) {
    const[displayName, setDisplayName] = useState("");
    const[email, setEmail] = useState("");
    const[yearOfStudy, setYearOfStudy] = useState("");
    const[courseOfStudy, setCourseOfStudy] = useState("");
    const[createdAt, setCreatedAt] = useState("");
    const[firstSignIn, setFirstSignIn] = useState("");
    const [userAvatar, setUserAvatar] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [invalidSearch, setInvalidSearch] = useState(false);
    const [filterInterface, setFilterInterface] = useState(false);
    const [filterResults, setFilterResults] = useState([]);
    const [filterFacultyParam, setFilterFacultyParam] = useState("");
    const [filterCountryParam, setFilterCountryParam] = useState("");
    const [filterPUParam, setFilterPUParam] = useState("");
    const [filterCourseCodeParam, setFilterCourseCodeParam] = useState("");
    const [filterApprovedParam, setFilterApprovedParam] = useState("");
    const [coursePopUp, setCoursePopUp] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [selectedCourseDescription, setSelectedCourseDescription] = useState(null);

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
                  setUserAvatar(data.avatar_url);
                  console.log("profile fetched successfully");

                } else {
                    console.error("No profile found for this id");

                }
    };

    const userProfile = {
        user_display_name: displayName,
        user_email: email,
        user_year_of_study: yearOfStudy,
        user_course_of_study: courseOfStudy,
        user_avatar: userAvatar
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
        //reset all filter params
        setCoursePopUp(false);
        setFilterInterface(false);
        setFilterFacultyParam("");
        setFilterCountryParam("");
        setFilterPUParam("");
        setFilterCourseCodeParam("");
        setFilterApprovedParam("");
        if (e.key === 'Enter' || e.type === 'click') {
            //auto-adjust common searches
            let adjustedQuery = searchQuery;
            if (searchQuery.toLowerCase() === "cde" ||
                searchQuery.toLowerCase() === "college of design and engineering") {
                adjustedQuery = "college of design and eng";
            }

            if (searchQuery.toLowerCase() === "soc") {
                adjustedQuery = "school of computing";
            }

            if (searchQuery.toLowerCase() === "fass" ||
                searchQuery.toLowerCase() === "faculty of arts and social science" ||
                searchQuery.toLowerCase() === "faculty of arts and social sciences") {
                adjustedQuery = "faculty of arts & social sci";
            }

            if (searchQuery.toLowerCase() === "school of business") {
                adjustedQuery = "nus business school";
            }

            const { data, error } = await mappings.from("edurec_mappings")
                                                  .select("*")
                                                  .or(`faculty.ilike.%${adjustedQuery}%,` +
                                                      `partner_university.ilike.%${adjustedQuery}%,` +
                                                      `pu_course_1.ilike.%${adjustedQuery}%,` +
                                                      `nus_course_1.ilike.%${adjustedQuery}%,` +
                                                      `nus_course_1_title.ilike.%${adjustedQuery}%`);

            if (error) {
                console.error("Search failed: ", error.message);
            } else {
                //handle search results based on trivial cases
                if (searchQuery === "") {
                    setSearchResults([]);
                    setFilterResults([]);
                } else if (data.length === 0){
                    setInvalidSearch(true);
                    setSearchResults([]);
                    setFilterResults([]);
                    //show a component with a warning message, has button "OK" that closes it.

                } else {
                    setSearchResults(data);
                    setFilterResults(data);
                }
                setCurrentPage(1);
                console.log("search query successful");
                console.log("number of results: ", searchResults.length);

            }
        }
    }

    const activeFilters = {
      Faculty:   filterFacultyParam,
      Country:   filterCountryParam,
      PU:        filterPUParam,
      Course:    filterCourseCodeParam,
      Approved:  filterApprovedParam
    };
    const filterBadges = Object.entries(activeFilters)
      .filter(([, value]) => value !== undefined && value !== "" && value !== null)
      .map(([key, value]) => `${key}: ${value}`);

    const handleFilterReset = async () => {
        setFilterFacultyParam("");
        setFilterCountryParam("");
        setFilterPUParam("");
        setFilterCourseCodeParam("");
        setFilterApprovedParam("");
    }

    const handleFilterSubmit = async () => {
        setFilterInterface(false);
        setSearchResults(filtered);
    }

    const filtered = useMemo(() => {
        return filterResults.filter(r =>
            (filterFacultyParam ? r.faculty === filterFacultyParam : true) &&
            (filterCountryParam ? r.faculty === filterCountryParam : true) &&
            (filterPUParam ? r.partner_university === filterPUParam : true) &&
            (filterCourseCodeParam ? r.nus_course_1 === filterCourseCodeParam : true) &&
            (filterApprovedParam ? (r.pre_approved ? "Yes" : "No") === filterApprovedParam : true)
            );
            }, [searchResults, filterFacultyParam, filterCountryParam, filterPUParam, filterCourseCodeParam, filterApprovedParam]);

    const faculties = useMemo(
        () => Array.from(
          new Set(
            filtered
              .map(r => r.faculty)
              .filter(Boolean)           //skips empty / null
          )
        ),
        [filtered]                  //recompute when results change
    );

    const countries = useMemo(
        () => Array.from(
          new Set(
            filtered
              .map(r => r.faculty)
              .filter(Boolean)           //skips empty / null
          )
        ),
        [filtered]                  //recompute when results change
    );

    const partnerUnis = useMemo(
        () => Array.from(
          new Set(
            filtered
              .map(r => r.partner_university)
              .filter(Boolean)           //skips empty / null
          )
        ),
        [filtered]                  //recompute when results change
    );

    const courseCodes = useMemo(
        () => Array.from(
          new Set(
            filtered
              .map(r => r.nus_course_1)
              .filter(Boolean)           //skips empty / null
          )
        ),
        [filtered]                  //recompute when results change
    );

    const approved = useMemo(
        () => Array.from(
          new Set(
            filtered
              .map(r => r.pre_approved ? "Yes" : "No")
              .filter(Boolean)           //skips empty / null
          )
        ),
        [filtered]                  //recompute when results change
    );

    const handleRowClick = async (result) => {
        setCoursePopUp(true);
        setSelectedRowData(result);

    }

    useEffect(() => {
        if (!selectedRowData?.nus_course_1) {
          console.log("nus course not found");
          setSelectedCourseDescription(null);
          return;
        }
        const abort = new AbortController();      // lets us cancel if user clicks fast
        async function fetchDescription(moduleCode) {
          try {
            const url = `https://api.nusmods.com/v2/${AY}/modules/${moduleCode}.json`;
            const res = await fetch(url, { signal: abort.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            console.log("NUSMods fetch successful");
            setSelectedCourseDescription(json || {title: "Course not documented", description: "This course has not been documented by NUSMods yet. We apologise for the inconvenience! Note: most special exchange electives and short term programs (EX, IE) are not selected for documentation. Try searching for your faculty core courses instead!"});
          } catch (err) {
            if (err.name !== "AbortError") {
              console.error("NUSMods fetch failed:", err);
              setSelectedCourseDescription({title: "Course not documented", description: "This course has not been documented by NUSMods yet. We apologise for the inconvenience! Note: most special exchange electives and short term programs (EX, IE) are not selected for documentation. Try searching for your faculty core courses instead!"});
            }
          }
        }
        fetchDescription(selectedRowData.nus_course_1);
        return () => abort.abort();    // clean-up if effect re-runs
      }, [selectedRowData]);






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

                        <li onClick={() => navigate('/myprofile')}>
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
                                        <div className="preprocess">
                                        <p className="search-query">Search Result for: <em>{searchQuery}</em></p>
                                        <img
                                            src={images.icon.filterIcon}
                                            alt="Filter"
                                            className="filter-icon"
                                            onClick={() => setFilterInterface(true)}/>
                                        </div>
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
                                              <tr key={index} onClick={() => handleRowClick(result)}>
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
                                            <div className="filter-indicator">
                                                <p className="filter-boolean">{filterBadges.length
                                                         ? `Filters active: `
                                                         : "No filters active"}</p>
                                                <p className="filter-content">{filterBadges.length ? filterBadges.join(", ") : ""}</p>
                                            </div>
                                            <div className="pager">
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

                        {coursePopUp && selectedRowData && selectedCourseDescription && (
                                                      <>

                                                      <CourseDetails
                                                      selectedRowData={selectedRowData}
                                                      selectedCourseDescription={selectedCourseDescription}
                                                      onClose={() => setCoursePopUp(false)}
                                                      userProfile={userProfile}
                                                      />


                                                      </>
                                                    )}
                        {filterInterface && (
                                                      <>
                                                      <div className="filter-interface-overlay"></div>
                                                      <div className="filter-interface-container">
                                                        <div className="filter-interface-input">
                                                          <h2>Filter</h2>
                                                          <p>**Available filter options change based on selected parameters</p>
                                                          <div className="filter-input">
                                                          <label>Faculty:</label>
                                                          <select
                                                          value={filterFacultyParam}
                                                          onChange={(e) => setFilterFacultyParam(e.target.value)}
                                                          className={filterFacultyParam === "" ? "placeholder" : ""}
                                                          >
                                                            <option value="" className="empty-selection">Select a Faculty</option>

                                                            {faculties.map(faculty => (
                                                                <option key={faculty} value={faculty} className="valid-select">
                                                                    {faculty}
                                                                </option>
                                                                )
                                                            )}
                                                          </select>
                                                          </div>

                                                          <div className="filter-input">
                                                          <label>Country:</label>
                                                          <select
                                                          value={filterCountryParam}
                                                          onChange={(e) => setFilterCountryParam(e.target.value)}
                                                          className={filterCountryParam === "" ? "placeholder" : ""}
                                                          >
                                                            <option value="" className="empty-selection">Select a Country</option>

                                                            {countries.map(country => (
                                                                <option key={country} value={country} className="valid-select">
                                                                    {country}
                                                                </option>
                                                                )
                                                            )}
                                                          </select>
                                                          </div>

                                                          <div className="filter-input">
                                                          <label>Partner Uni:</label>
                                                          <select
                                                          value={filterPUParam}
                                                          onChange={(e) => setFilterPUParam(e.target.value)}
                                                          className={filterPUParam === "" ? "placeholder" : ""}
                                                          >
                                                            <option value="" className="empty-selection">Select a University</option>

                                                            {partnerUnis.map(pu => (
                                                                <option key={pu} value={pu} className="valid-select">
                                                                    {pu}
                                                                </option>
                                                                )
                                                            )}
                                                          </select>
                                                          </div>

                                                          <div className="filter-input">
                                                          <label>NUS Course Code:</label>
                                                          <select
                                                          value={filterCourseCodeParam}
                                                          onChange={(e) => setFilterCourseCodeParam(e.target.value)}
                                                          className={filterCourseCodeParam === "" ? "placeholder" : ""}
                                                          >
                                                            <option value="" className="empty-selection">Select a Course Code</option>

                                                            {courseCodes.map(code => (
                                                                <option key={code} value={code} className="valid-select">
                                                                    {code}
                                                                </option>
                                                                )
                                                            )}
                                                          </select>
                                                          </div>

                                                          <div className="filter-input">
                                                          <label>Pre-approved:</label>
                                                          <select
                                                          value={filterApprovedParam}
                                                          onChange={(e) => setFilterApprovedParam(e.target.value)}
                                                          className={filterApprovedParam === "" ? "placeholder" : ""}
                                                          >
                                                            <option value="" className="empty-selection">All</option>

                                                            {approved.map(app => (
                                                                <option key={app} value={app} className="valid-select">
                                                                    {app}
                                                                </option>
                                                                )
                                                            )}
                                                          </select>
                                                          </div>


                                                        </div>
                                                        <button
                                                          onClick={() => handleFilterReset()}
                                                          className="filter-reset-button">
                                                            Reset
                                                        </button>

                                                        <button
                                                          onClick={() => handleFilterSubmit()}
                                                          className="done-button"
                                                        >
                                                          Done
                                                        </button>

                                                      </div>

                                                      </>
                                                    )}
                        </main>
            </div>

        );
    }

export default Discover

