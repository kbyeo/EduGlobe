import { useState, useEffect } from 'react';
import './MappingForm.css';
import supabase from "../supabaseClient";

function MappingForm({ closePopup, id, mappings, setMappings }) {
    const [country, setCountry] = useState("");
    const [university, setUniversity] = useState("");
    const [type, setType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");


    //fetch user's current mappings from supabase
    useEffect(() => {
      const fetchMappings = async () => {
        const { data, error } = await supabase
          .from("userprofiles")
          .select("mappings")
          .eq("id", id)
          .single();
        if (error) {
          console.error("Error fetching mappings:", error.message);
        } else {
          setMappings(data.mappings || []); // Handle null or undefined
        }
      };
      fetchMappings();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        //create the new mapping
        const newMapping = {
            country,
            university,
            type,
            startDate,
            endDate
        };
        console.log(`new mapping created, country: ${country}, university: ${university}`);
        //add the new mapping by spreading "mappings"
        const updatedMappings = [...mappings, newMapping];

        //update the database and wait for it to complete
        const { error } = await supabase.from("userprofiles")
                                        .update({ mappings: updatedMappings })
                                        .eq("id", id);
        if (error) {
           console.error("Error updating mappings:", error.message);
           alert("An error occured while updating mappings. Please try again.")
           closePopup();
        }
        setMappings(updatedMappings);
        console.log("mappings updated successfully");

        closePopup();



    }



    return (
                <div className="popup-overlay">
                  <div className="popup-content">
                    <p className="mapping-heading">UPDATE MAPPING</p>
                    <p className="description">
                      **Please update your mappings only AFTER your successful application on EduRec**
                    </p>
                    <form onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label>Country:</label>
                        <input
                            type="text"
                            placeholder="Enter a country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required/>
                      </div>
                      <div className="form-group">
                        <label>University:</label>
                        <input
                            type="text"
                            placeholder="Enter a university"
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            required/>
                      </div>
                      <div className="form-group-inline">
                      <div className="form-group-a">
                        <label>Type:</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required>
                          <option value="">Select a type</option>
                          <option value="SEP">SEP</option>
                          <option value="Summer">Summer</option>
                          <option value="Winter">Winter</option>
                        </select>
                      </div>
                      <div className="form-group-a">
                        <label>Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required/>
                      </div>
                      <div className="form-group-a">
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required/>
                      </div>
                      </div>
                      <div className="button-group">
                        <button className="confirm-button" type="submit">
                          Confirm
                        </button>
                        <button
                          className="cancel-button"
                          type="button"
                          onClick={closePopup}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>);

    }


export default MappingForm