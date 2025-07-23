/* components/PostDetail.jsx ----------------------------------- */
import { useParams, useNavigate, Routes, Route, Outlet } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import supabaseClients from "../supabaseClient";
import "./PostDetail.css";
import images from '../assets/images';
import LogoutButton from "../components/LogoutButton.jsx";
import ReplyAura from "../components/ReplyAura.jsx";

const { supabase, mappings } = supabaseClients;

const tagColors = {
  QUESTION: "#82d7f5",
  GUIDE:    "#c2ff98",
  REQUEST:  "#ff00ed",
  OTHERS:   "#ffec85"
};

function PostDetail( {userId, setUserId} ) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [replies, setReplies] = useState([]);

    const[displayName, setDisplayName] = useState("");
    const[email, setEmail] = useState("");
    const[yearOfStudy, setYearOfStudy] = useState("");
    const[courseOfStudy, setCourseOfStudy] = useState("");
    const[createdAt, setCreatedAt] = useState("");
    const[firstSignIn, setFirstSignIn] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(null);

    const [myVote, setMyVote] = useState(0);
    const [busy,   setBusy]  = useState(false);
    const [karma,  setKarma] = useState(0);
    const [loading, setLoading] = useState(false);

    const [replyText, setReplyText] = useState("");
    const [busyReply, setBusyReply] = useState(false);
    const textAreaRef = useRef(null);

    const getUserProfile = async () => {
                        const { data, error } = await supabase
                          .from("userprofiles")
                          .select("*")
                          .eq("id", userId)
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
            user_id: userId
    };
    useEffect(() => {
        getUserProfile();
    }, [userId]);


    const handleLogout = async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error logging out: ", error.message);
            } else {
                 // Clear the user ID which will be interpreted as logged out
                 setId(null);
            }
    };

    useEffect(() => {
        const fetchAll = async () => {
        const { data: p, error: pErr } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("id", id)
        .single();
        if (pErr) { console.error(pErr.message); return; }
        console.log("post found");
        setPost(p);



        const { data: r, error: rErr } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("post_id", id)
        .order("aura", { ascending: false });
        if (rErr) { console.error(rErr.message); return; }
        console.log("replies retrieved");
        setReplies(r);
    };
    fetchAll();
  }, [id]);

    //retrieve user's selected vote once
    useEffect(() => {
      let canceled = false;
      async function fetchData() {
        const [{ data: postRow }, { data: voteRow }] = await Promise.all([
          supabase
            .from("forum_posts")
            .select("karma")
            .eq("id", id)
            .single(),
          supabase
            .from("forum_post_votes")
            .select("value")
            .eq("post_id", id)
            .eq("voter_id", userId)
            .maybeSingle()
        ]);
        if (canceled) return;
        if (postRow) setKarma(postRow.karma);
        if (voteRow) setMyVote(voteRow.value);
      }
      fetchData();
      return () => { canceled = true; };
    }, [id, userId]);

    const sendVote = useCallback(async newValue => {
       if (!userId || loading) return;          // block anonymous + double-clicks
       setLoading(true);
       // optimistic UI
       setKarma(k => k + newValue - myVote);
       setMyVote(newValue);
       try {
         if (newValue === 0) {
           // delete existing vote
           await supabase
             .from("forum_post_votes")
             .delete()
             .eq("post_id", id)
             .eq("voter_id", userId);
         } else {
           // insert or replace (+1 / -1)
           await supabase
             .from("forum_post_votes")
             .upsert({
               post_id: id,
               voter_id: userId,
               value: newValue
             }, { onConflict: ['post_id', 'voter_id'] });
         }
         // Reflect karma change in aggregate table
         const delta = newValue - myVote;
         if (delta !== 0) {
           await supabase.rpc("update_karma", {
             p_post_id: id,
             p_delta:   delta
           });
         }
       } finally {
         setLoading(false);
       }
     }, [loading, myVote, id, userId]);

    const handleUp   = e => { e.stopPropagation(); sendVote(myVote ===  1 ? 0 :  1); };
    const handleDown = e => { e.stopPropagation(); sendVote(myVote === -1 ? 0 : -1); };


    const handleReplySubmit = async e => {
      e.preventDefault();
      if (busyReply || !replyText.trim()) return;
      if (!userId) { alert("Please sign in to reply."); return; }
      setBusyReply(true);
      const { data: newReply, error } = await supabase
        .from("forum_replies")
        .insert({
          post_id:  id,
          author_id: userId,
          body:     replyText.trim(),
          author_display_name: userProfile.user_display_name,
          author_year_of_study: userProfile.user_year_of_study,
          author_course_of_study: userProfile.user_course_of_study,
          author_avatar: userProfile.user_avatar
        })
        .select()      // echo the inserted row
        .single();
      setBusyReply(false);
      if (error) {
        console.error("Failed to post reply:", error.message);
        return;
      }
      // Optimistically add to UI
      setReplies(old => [newReply, ...old]);
      setReplyText("");
      if (textAreaRef.current) textAreaRef.current.style.height = "auto";
    };

    const handleReplyCancel = e => {
      e.preventDefault();
      setReplyText("");
      if (textAreaRef.current) textAreaRef.current.style.height = "auto";
    };

    //automatic resize textarea script
    useLayoutEffect(() => {
      resize();                       // run once after each render
    }, [replyText]);                  // …when replyText changes
    const resize = () => {
      const el = textAreaRef.current; // use the correct ref here
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };


  if (!post) return <p>Loading…</p>;

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
                <main className="main-content-post-details">
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

                    <div className="post-detail">
                        <button className="post-back-btn" onClick={() => navigate("/forum")}>Back</button>
                        <div className="post-head">
                            <p className="reply-post-tag" style={{ color: tagColors[post.tag] }}>
                                [{post.tag.charAt(0) + post.tag.slice(1).toLowerCase()}]
                            </p>
                            <h2 className="post-detail-title">
                                {post.title}
                            </h2>
                        </div>
                        <div className="post-details-meta">
                            <img src={userProfile.user_avatar || images.selected.profile}/>
                            <p className="post-meta-author">{post.author_display_name} </p>
                            <span className="post-meta-date"> • {new Date(post.created_at).toLocaleDateString()}</span>
                        </div>

                        <p className="post-body">{post.body}</p>
                        <div className="Pkarma-section">
                                              {myVote === 1
                                               ? ( <img
                                                  src={images.selected.upvote}
                                                  onClick={handleUp}
                                                  className="upvoting-image"
                                                  />)
                                              : ( <img
                                                  src={images.unselected.upvote}
                                                  onClick={handleUp}
                                                  className="upvoting-image"
                                                  />)
                                              }
                                              <p className="post-karma">{karma}</p>
                                              {myVote === -1
                                               ? ( <img
                                                  src={images.selected.downvote}
                                                  onClick={handleDown}
                                                  className="downvoting-image"
                                                  />)
                                              : ( <img
                                                  src={images.unselected.downvote}
                                                  onClick={handleDown}
                                                  className="downvoting-image"
                                                  />)
                                              }
                                </div>

                        <h3 className="forum-post-replies-header">Replies ({replies.length})</h3>
                        <form className="reply-form" onSubmit={handleReplySubmit}>
                                                        <textarea
                                                            type="text"
                                                            required
                                                            value={replyText}
                                                            onChange={e => setReplyText(e.target.value)}
                                                            placeholder="Add a reply..."
                                                            rows={1}
                                                            ref={textAreaRef}
                                                        />


                                                        <div className="reply-buttons">
                                                            <button type="button" className="cancel-reply-button" onClick={handleReplyCancel}>Cancel</button>
                                                            <button
                                                                type="submit"
                                                                className="submit-reply-button"
                                                                disabled={!replyText.trim() || busyReply}
                                                            >
                                                            {busyReply ? "Posting…" : "Submit"}
                                                            </button>
                                                        </div>
                                                    </form>
                        <ul className="replies">
                          {replies.length ? (
                            replies.map(r => (
                              <li key={r.id} className="reply-card">
                                <img className="reply-img" src={r.author_avatar || images.selected.profile}/>
                                    <div className="reply-text">
                                        <p className="reply-meta">
                                            <strong>{r.author_display_name}</strong>{" "}
                                            <span className="reply-auth">· Year {r.author_year_of_study} {r.author_course_of_study} </span>
                                            <span className="reply-date">· {new Date(r.created_at).toLocaleDateString()}</span>
                                        </p>

                                        <p className="reply-body">{r.body}</p>
                                        <ReplyAura replyId={r.id} currentUserId={userProfile.user_id} />
                                    </div>
                              </li>
                            ))
                          ) : (
                            <li>
                                <img className="no-replies-img" src={images.icon.forumEmptyIcon}/>
                                <div className="forum-no-replies-container">
                                    <p className="forum-no-replies">No replies yet. Help</p>
                                    <p className="no-replies-spec">{post.author_display_name}</p>
                                    <p>out!</p>
                                </div>
                            </li>
                          )}
                        </ul>
                    </div>

                </main>
            </div>
        </>


  );
}

export default PostDetail;