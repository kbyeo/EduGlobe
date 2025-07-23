import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, Outlet } from "react-router-dom";
import images from '../assets/images';
import supabaseClients from "../supabaseClient";
import LogoutButton from "../components/LogoutButton.jsx";
import PostCard from "../components/PostCard.jsx";
import AddPostModal from "../components/AddPostModal.jsx";
import "./Forum.css";
const { supabase, mappings } = supabaseClients;

function Forum( {id, setId} ) {
    const[displayName, setDisplayName] = useState("");
    const[email, setEmail] = useState("");
    const[yearOfStudy, setYearOfStudy] = useState("");
    const[courseOfStudy, setCourseOfStudy] = useState("");
    const[createdAt, setCreatedAt] = useState("");
    const[firstSignIn, setFirstSignIn] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(null);
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [search, setSearch] = useState("");
    const [isModalOpen, setOpen] = useState(false);
    const [isLoading, setLoading] = useState(true);
    const [formSwitch, setFormSwitch] = useState(true);




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
    const userProfile = {
        user_display_name: displayName,
        user_email: email,
        user_year_of_study: yearOfStudy,
        user_course_of_study: courseOfStudy,
        user_avatar: avatarUrl,
        user_id: id
    };
    useEffect(() => {
          getUserProfile();
        }, [id]);

    useEffect(() => {
        const fetchPosts = async () => {
          setLoading(true);
          const { data, error } = await supabase
            .from("forum_posts")
            .select("*")
            .order("karma", { ascending: false })
            .limit(100);                    // safety cap


          if (!error) setPosts(data);
          console.log("Forum posts fetched successfully");
          setLoading(false);
        };
        fetchPosts();
        }, [id, formSwitch]);

    async function handleSubmit(e) {
        e.preventDefault();
        const term = search.trim();
        if (!term) {
            setSearch("*");
        }  // empty search => RESET list
        setLoading(true);
        try {

          const { data, error } = await supabase
            .from("forum_posts")
            .select("*")
            .or(`title.ilike.%${search}%,` + `author_display_name.ilike.%${search}%`)
            .order("karma", { ascending: false });
          if (error) throw error;

          setPosts(data);
          setSearch("");
        } finally {
          setLoading(false);
        }
      }

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
            <div className="forum-container">
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

                        <li className="onPage">
                            <img src={images.selected.forum} alt="forum logo" />
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
                    <header className="forumheader">
                        <h1 className="forum-title">Forum</h1>
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

                    <div className="forum-header">
                        <p className="forum-header-p">Discussion</p>
                        <div className="forum-header-actions">

                            <div className="forum-search-input">
                                <img className="forum-search-icon" src={images.icon.searchIcon} alt="Search forum" />
                                <form onSubmit={handleSubmit}>
                                <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search forum…"
                                className="forum-search-input-t"
                                />
                                </form>
                            </div>
                            <button className="add-post-btn" onClick={() => setOpen(true)}>
                                Add post
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                              <p className="loading-msg">Loading…</p>
                            ) : posts.length === 0 ? (
                              <div className="empty-state">
                                  <img src={images.icon.forumEmptyIcon}/>
                                  <p>No posts yet. Be the first!</p>
                                  <button onClick={() => setOpen(true)} className="add-post-btnE">Create a post</button>
                              </div>
                            ) : (
                              <ul className="posts-list">
                                {posts.map(post => (
                                  <PostCard key={post.id} post={post} userId={id} />
                                ))}
                              </ul>
                    )}
                {isModalOpen && (
                                        <AddPostModal
                                        open={open}
                                          onClose={() => setOpen(false)}
                                          onCreated={() => setSearch("")}   // refresh list
                                          userProfile={userProfile}
                                          formSwitch={formSwitch}
                                          setFormSwitch={setFormSwitch}
                                        />
                )}
                </main>



            </div>
        </>
    );

}

export default Forum