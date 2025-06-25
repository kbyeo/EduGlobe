import { useState, useEffect, useRef, useLayoutEffect } from "react";
import supabaseClients from "../supabaseClient";
import images from '../assets/images';
import "./CourseDetails.css"
const { supabase, mappings } = supabaseClients;


function CourseDetails( { selectedRowData, selectedCourseDescription, onClose, userProfile } ){
    const [text, setText]         = useState("");
    const [reviewLoading, setReviewLoading]   = useState(false);
    const [reviewError, setReviewError]       = useState(null);
    const [reviews, setReviews] = useState([]);
    const ref = useRef(null);
    const bodyRef = useRef(null);

    //automatic resize textarea script

    useLayoutEffect(() => resize(), [text]);
      const resize = () => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      };

    //fetch reviews upon selectedRowData render
    useEffect(() => {
        if (!selectedRowData?.pu_course_1) return;     // nothing to query
        let isMounted = true;
        const fetchReviews = async () => {
          setReviewLoading(true);
          setReviewError(null);
          const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("pu_course", selectedRowData.pu_course_1)
            .order("created_at", { ascending: false });
          if (isMounted) {
            if (error) setError(error.message);
            else       setReviews(data);
            setReviewLoading(false);
          }
        };
        fetchReviews();
        return () => { isMounted = false };
      }, [selectedRowData]);




    const handleReviewSubmit = async (e) => {
        e.preventDefault()
        if (!text.trim()) return;
        setReviewLoading(true);
        setReviewError(null);
        const newReview = {
            pu_course: selectedRowData.pu_course_1,
            author: userProfile.user_display_name,
            body: text.trim()
        };
        const tempId = Math.random().toString();
        setReviews(r => [{ ...newReview, id: tempId, created_at: new Date().toISOString() }, ...r]);
        setText("");

        const { data, error } = await supabase
            .from("reviews")
            .insert(newReview)
            .select()
            .single();                        // returns the inserted row
        if (error) {
            //rollback optimistic review
            setReviews(r => r.filter(rev => rev.id !== tempId));
            setReviewError(error.message);
        } else {
            //replace temp with real row
            setReviews(
                r => r.map(rev => rev.id === tempId ? data : rev)
              );
          setReviewLoading(false);
            console.log("New review submitted");
        }

    };

    const handleReviewCancel = async (e) => {
            e.preventDefault();
            setText("");
            setReviewError(null);

    }

    const backToTop = async () => {
        if (!bodyRef.current) return;
            // wait one frame in case the content just changed
        requestAnimationFrame(() =>
            bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        );

    }
    return (
        <>
            <div className="course-info-overlay"></div>
                <div className="course-info-container" ref={bodyRef}>
                    <div className="course-info-head" >
                        <p className="header">{selectedRowData.nus_course_1} </p>
                        <p>{selectedCourseDescription.title}</p>

                    </div>
                    <div className="course-info-description">
                        <p className="mapping-direction-add">Country ○ {selectedRowData.pre_approved ? "Pre-approved" : "Not pre-approved"}</p>
                        <p className="mapping-direction">NUS ({selectedRowData.nus_course_1}, {selectedRowData.nus_crse1_units} units)
                                                    --> {selectedRowData.partner_university} ({selectedRowData.pu_course_1}, {selectedRowData.pu_crse1_units} units)</p>
                        <p>{selectedCourseDescription.description}</p>

                    </div>
                    <div className="reviews-section">
                        <div className="review-header">
                        <p>Reviews</p>
                        <img src={images.icon.reviewIcon} alt="Write a review" className="review-icon" title="leave a review"/>
                        </div>
                        <div className="review-form">
                            <form className="review-form" onSubmit={handleReviewSubmit}>
                                <textarea
                                    type="text"
                                    required
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder="Add a review..."
                                    rows={1}
                                    ref={ref}
                                />


                                <div className="review-buttons">
                                    <button className="cancel-review-button" onClick={handleReviewCancel}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="submit-review-button"
                                        disabled={!text.trim()}
                                    >
                                    Submit
                                    </button>
                                </div>
                            </form>
                            {reviewError   && <p className="error">{reviewError}</p>}
                            {reviewLoading && <p className="loading-reviews">Loading reviews…</p>}
                        </div>
                        <div className="reviews">
                            <ul className="reviews-list">
                                {reviews.map(r => (
                                    <li key={r.id} className="review-card">

                                        <img src={userProfile.user_avatar || images.selected.profile}/>
                                        <div className="review-text">
                                            <p className="review-meta">
                                                <strong>{r.author}</strong>{" "}
                                                <span className="review-date">· Year {userProfile.user_year_of_study} {userProfile.user_course_of_study} · {new Date(r.created_at).toLocaleDateString()}</span>
                                            </p>

                                            <p className="review-body">{r.body}</p>
                                        </div>
                                    </li>
                                ))}
                                {(!reviewLoading && reviews.length === 0) && <p className="no-reviews">No reviews yet.</p>}
                            </ul>





                        </div>
                    </div>
                    {(reviews.length >= 2) && <button onClick={backToTop} className="back-to-top-button">Back to top</button>}
                    <button
                    onClick={onClose}
                    className="course-close-button"
                    >
                        Done
                    </button>
                </div>

        </>)

}

export default CourseDetails