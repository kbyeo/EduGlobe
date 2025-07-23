/* components/AddPostModal.jsx --------------------------------- */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import supabaseClient from "../supabaseClient";
import "./AddPostModal.css";

const supabase = supabaseClient.supabase;

const schema = z.object({
  tag:   z.enum(["QUESTION", "GUIDE", "REQUEST", "OTHERS"]),
  title: z.string().min(1).max(120),
  body:  z.string().min(30).max(2000)
});

function AddPostModal({ open, onClose, onCreated, userProfile, formSwitch, setFormSwitch }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async values => {
      /* ── 1. Get the signed-in user (for author_id) ─────────────────────────── */
      const {
        data: { user },
        error: authErr
      } = await supabase.auth.getUser();
      if (authErr || !user) {
        alert("You must be logged in to post");
        return;
      }
      /* ── 2. Build the payload ─────────────────────────────────────────────── */
      const payload = {
        ...values,                       // tag, title, body
        author_id: user.id,              // NOT NULL
        author_display_name:  userProfile?.user_display_name ?? null,
        author_year_of_study: userProfile?.user_year_of_study ?? null,
        author_course_of_study: userProfile?.user_course_of_study ?? null
      };
      /* ── 3. Insert ────────────────────────────────────────────────────────── */
      const { error } = await supabase
        .from("forum_posts")
        .insert(payload);
      if (!error) {
        onCreated?.();
        onClose();
        setFormSwitch(!formSwitch);
        console.log("Post submitted successfully");
      } else {
        alert(error.message);
      }
    };

  return (
    <div className="modal-overlay">
    <div className="modal-content">
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)}>
        <p>New Post</p>

        <label>
          Tag
          <select {...register("tag")} required>
            <option value="QUESTION">Question</option>
            <option value="GUIDE">Guide</option>
            <option value="REQUEST">Request</option>
            <option value="OTHERS">Others</option>
          </select>
        </label>

        <label>
          Title (≤ 120 chars)
          <input {...register("title")} required />
          {errors.title && <span className="err">{errors.title.message}</span>}
        </label>

        <label>
          Description (≥ 30 chars)
          <textarea rows={6} {...register("body")} required />
          {errors.body && <span className="err">{errors.body.message}</span>}
        </label>

        <div className="modal-actions">
          <button className="modal-cancel-btn" type="button" onClick={onClose}>Cancel</button>
          <button className="modal-submit-btn" type="submit" disabled={isSubmitting}>Post</button>
        </div>
      </form>
    </div>
    </div>
  );
}

export default AddPostModal;