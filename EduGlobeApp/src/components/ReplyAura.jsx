import { useState, useEffect, useCallback } from "react";
import supabaseClients from "../supabaseClient";
import images from "../assets/images";
import "./ReplyAura.css";

const { supabase } = supabaseClients;

function ReplyAura({ replyId, currentUserId }) {
  const [aura, setAura]   = useState(0);
  const [myVote, setMyVote] = useState(0);   // 1, -1 or 0
  const [busy, setBusy]     = useState(false);

  /* fetch aggregate + my current vote once */
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      const [{ data: r }, { data: v }] = await Promise.all([
        supabase.from("forum_replies")
                .select("aura")
                .eq("id", replyId)
                .single(),
        supabase.from("forum_reply_votes")
                .select("value")
                .eq("reply_id", replyId)
                .eq("voter_id", currentUserId)
                .maybeSingle()
      ]);
      if (cancelled) return;
      if (r) setAura(r.aura);
      if (v) setMyVote(v.value);
    }
    fetch();
    return () => { cancelled = true; };
  }, [replyId, currentUserId]);

  /* send/replace/remove a vote */
  const sendVote = useCallback(async newValue => {
    if (busy || !currentUserId) return;
    setBusy(true);

    // optimistic UI
    setAura(a => a + newValue - myVote);
    setMyVote(newValue);

    try {
      if (newValue === 0) {
        await supabase
          .from("forum_reply_votes")
          .delete()
          .eq("reply_id", replyId)
          .eq("voter_id", currentUserId);
      } else {
        await supabase
          .from("forum_reply_votes")
          .upsert(
            { reply_id: replyId, voter_id: currentUserId, value: newValue },
            { onConflict: ["reply_id", "voter_id"] }
          );
      }


      const delta = newValue - myVote;


    } finally {
      setBusy(false);
    }
  }, [busy, myVote, replyId, currentUserId]);

  const handleUp   = () => sendVote(myVote === 1  ? 0 : 1);
  const handleDown = () => sendVote(myVote === -1 ? 0 : -1);

  return (
    <>
                <div className="reply-aura-section">
                    {myVote === 1
                     ? ( <img
                        src={images.selected.upvote}
                        onClick={busy ? undefined : handleUp}
                        aria-disabled={busy}
                        className="reply-upvoting-image"
                        />)
                    : ( <img
                        src={images.unselected.upvote}
                        onClick={busy ? undefined : handleUp}
                        aria-disabled={busy}
                        className="reply-upvoting-image"
                        />)
                    }
                    <p className="reply-aura-points">{aura}</p>
                    {myVote === -1
                     ? ( <img
                        src={images.selected.downvote}
                        onClick={busy ? undefined : handleDown}
                        aria-disabled={busy}
                        className="reply-downvoting-image"
                        />)
                    : ( <img
                        src={images.unselected.downvote}
                        onClick={busy ? undefined : handleDown}
                        aria-disabled={busy}
                        className="reply-downvoting-image"
                        />)
                    }
                </div>
    </>
  );
}

export default ReplyAura