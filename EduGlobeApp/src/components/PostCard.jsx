import { Link, Routes, Route, useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import supabaseClients from "../supabaseClient";
import images from '../assets/images';
import "./PostCard.css";

const { supabase, mappings } = supabaseClients;

const tagColors = {
  QUESTION: "#82d7f5",
  GUIDE:    "#c2ff98",
  REQUEST:  "#ff00ed",
  OTHERS:   "#ffec85"
};

function PostCard({ post, userId }) {
  const [myVote, setMyVote] = useState(0);
  const [busy,   setBusy]  = useState(false);
  const [karma,  setKarma] = useState(post.karma);
  const [loading, setLoading] = useState(false);
  const {
      id,
      title,
      tag,
      created_at,
      karma: karmaFromServer,
      author_display_name,
      author_year_of_study,
      author_course_of_study
    } = post;

  const navigate = useNavigate();

  //retrieve user's selected vote once
  useEffect(() => {
      let canceled = false;
      async function fetchData() {
        const [{ data: postRow }, { data: voteRow }] = await Promise.all([
          supabase
            .from("forum_posts")
            .select("karma")
            .eq("id", post.id)
            .single(),
          supabase
            .from("forum_post_votes")
            .select("value")
            .eq("post_id", post.id)
            .eq("voter_id", userId)
            .maybeSingle()
        ]);
        if (canceled) return;
        if (postRow) setKarma(postRow.karma);
        if (voteRow) setMyVote(voteRow.value);
      }
      fetchData();
      return () => { canceled = true; };
    }, [post.id, userId]);

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
             .eq("post_id", post.id)
             .eq("voter_id", userId);
         } else {
           // insert or replace (+1 / -1)
           await supabase
             .from("forum_post_votes")
             .upsert({
               post_id: post.id,
               voter_id: userId,
               value: newValue
             }, { onConflict: ['post_id', 'voter_id'] });
         }
         // Reflect karma change in aggregate table
         const delta = newValue - myVote;
         if (delta !== 0) {
           await supabase.rpc("update_karma", {
             p_post_id: post.id,
             p_delta:   delta
           });
         }
       } finally {
         setLoading(false);
       }
     }, [loading, myVote, post.id, userId]);

  const handleUp   = e => { e.stopPropagation(); sendVote(myVote ===  1 ? 0 :  1); };
  const handleDown = e => { e.stopPropagation(); sendVote(myVote === -1 ? 0 : -1); };


  return (
    <li className="post-card">
      <div className="postcard-container" >
          <div className="postcard-intermediate-container" onClick={() => navigate(`/forum/${id}`)}>
      <Link to={`/forum/${id}`} className="post-link">
        <span className="post-tag" style={{ color: tagColors[tag] }}>
          [{tag.charAt(0) + tag.slice(1).toLowerCase()}]
        </span>{" "}
        {title}
      </Link>

      <span className="post-metadata">
        <div className="author-studies">
            <span className="post-year">Y{author_year_of_study} </span>
            <span className="post-course">{author_course_of_study}</span>
        </div>
        <span className="post-date">{format(new Date(created_at), "dd/MM/yyyy")}</span>
        <span className="post-author">{author_display_name}</span>
      </span>
      </div>
        <div className="karma-section">
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
      </div>
    </li>
  );
}

export default PostCard;