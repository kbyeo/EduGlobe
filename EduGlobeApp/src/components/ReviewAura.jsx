import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import supabaseClients from "../supabaseClient";
import images from '../assets/images';
import "./ReviewAura.css"
const { supabase, mappings } = supabaseClients;

function ReviewAura( { reviewId, currentUserId } ) {
    const [aura, setAura] = useState(0);
    const [myVote, setMyVote] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let canceled = false;
        async function fetchData() {
          const [{ data: review }, { data: vote }] = await Promise.all([
            supabase
              .from('reviews')
              .select('aura')
              .eq('id', reviewId)
              .single(),
            supabase
              .from('review_aura_votes')
              .select('value')
              .eq('review_id', reviewId)
              .eq('user_id', currentUserId)
              .maybeSingle()
          ]);
          if (canceled) return;
          if (review) setAura(review.aura);
          if (vote)   setMyVote(vote.value);
        }
        fetchData();
        return () => { canceled = true; };
      }, [reviewId, currentUserId]);

    const sendVote = useCallback(
        async newValue => {
          setLoading(true);
          // optimistic update
          setAura(a => a + newValue - myVote);
          setMyVote(newValue);
          try {
            if (newValue === 0) {
              // delete existing vote
              await supabase
                .from('review_aura_votes')
                .delete()
                .eq('review_id', reviewId)
                .eq('user_id', currentUserId);
            } else {
              // insert or replace (+1 or -1)
              await supabase
                .from('review_aura_votes')
                .upsert({
                  review_id: reviewId,
                  user_id: currentUserId,
                  value: newValue
                });
            }
          } finally {
            setLoading(false);
          }
        },
        [reviewId, currentUserId, myVote]
    );

    const handleUp   = () => sendVote(myVote === 1  ? 0 : 1);
    const handleDown = () => sendVote(myVote === -1 ? 0 : -1);


    return (
        <>
            <div className="aura-section">
                {myVote === 1
                 ? ( <img
                    src={images.selected.upvote}
                    disabled={loading}
                    onClick={handleUp}
                    className="upvoting-image"
                    />)
                : ( <img
                    src={images.unselected.upvote}
                    disabled={loading}
                    onClick={handleUp}
                    className="upvoting-image"
                    />)
                }
                <p className="aura-points">{aura}</p>
                {myVote === -1
                 ? ( <img
                    src={images.selected.downvote}
                    disabled={loading}
                    onClick={handleDown}
                    className="downvoting-image"
                    />)
                : ( <img
                    src={images.unselected.downvote}
                    disabled={loading}
                    onClick={handleDown}
                    className="downvoting-image"
                    />)
                }
            </div>
        </>
        )
}

export default ReviewAura