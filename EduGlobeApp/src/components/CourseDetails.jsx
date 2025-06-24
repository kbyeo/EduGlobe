import { useState, useEffect, useRef } from "react";
import supabaseClients from "../supabaseClient";
import "./CourseDetails.css"
const { supabase, mappings } = supabaseClients;

function CourseDetails( { selectedRowData, selectedCourseDescription, onClose } ){


    return (
        <>
            <div className="course-info-overlay"></div>
                <div className="course-info-container">
                    <div className="course-info-head">
                        <p className="header">{selectedRowData.nus_course_1}</p>
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
                        <button className="write-review">Write</button>
                        </div>
                        <div className="reviews">



                        </div>
                    </div>
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