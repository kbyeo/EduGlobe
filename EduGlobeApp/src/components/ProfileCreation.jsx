import { useState, useEffect } from 'react';
import Logo from '../assets/images/EduGlobeLogoGradient.png';
import './ProfileCreation.css';
import supabase from "../supabaseClient";

function ProfileCreation({ id, setId, onProfileUpdated }) {
    const [displayName, setDisplayName] = useState("");
    const [yearOfStudy, setYearOfStudy] = useState("");
    const [courseOfStudy, setCourseOfStudy] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!displayName || !yearOfStudy || !courseOfStudy) {
            alert("All fields are required!");
            return;
        }
        setIsProcessing(true);

        const updated = await updateProfile();
        //await because we only want to call onProfileUpdated AFTER
        //asynchronous update queries are done
        if (updated && onProfileUpdated) {
            onProfileUpdated();
            console.log("Telling dashboard that update is done");
        }

        setIsProcessing(false);


    };

    const updateProfile = async () => {
        const { error } = await supabase.from("userprofiles")
                                 .update({ display_name: displayName,
                                           year_of_study: yearOfStudy,
                                           course_of_study: courseOfStudy,
                                           first_sign_in: false})
                                 .eq("id", id)

        if (error) {
            console.error("Error updating profile: ", error.message);
            alert("Something went when updating, please try again!")
            return false;
        }
        if (!error) {
            setDisplayName("");
            setYearOfStudy("");
            setCourseOfStudy("");
            console.log(`updated, displayName: ${displayName},
                        year: ${yearOfStudy}, course: ${courseOfStudy}
                        `);
            return true;
        }
    }



    return (

            <div className="profile-creation-container">
                <div className="header">
                    <img src={Logo} className="logos" alt="NUS EduGlobe logo"/>

                    <div className="text-container">
                        <p className="EduGlobe-header">NUS EduGlobe</p>
                        <p className="caption">Exchange made easier.</p>
                    </div>
                </div>

                <div className="input-form">
                    <p className="setup-text">Let's set up your profile!</p>
                    <form onSubmit={handleSubmit}>

                        <input type="text" required placeholder="Display name" className="field"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}/>

                        <input type="number" required placeholder="Current year of study" className="field"
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}/>

                        <input type="text" required placeholder="Course of study" className="field"
                        value={courseOfStudy}
                        onChange={(e) => setCourseOfStudy(e.target.value)}/>

                        <button type="submit" className="submit-button">
                                                {isProcessing ? "Processing..." : "All set!"}
                        </button>

                    </form>

                </div>

            </div>


            );
}

export default ProfileCreation