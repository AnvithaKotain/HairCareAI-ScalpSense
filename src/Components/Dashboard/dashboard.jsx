import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firbaseauth/firbaseconfig";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import "./dashboard.css";
import HairTracker from "./hairtrack";
import CommunityForum from "./communityForum";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [username, setUsername] = useState("");
  const [showTest, setShowTest] = useState(false);
  const [gender, setGender] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState("https://via.placeholder.com/100");
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // const [lastTestDate, setLastTestDate] = useState(null);
  // const [canRetakeTest, setCanRetakeTest] = useState(true);
  // const [daysUntilRetake, setDaysUntilRetake] = useState(0);

  const navigate = useNavigate();

  const questions = [
    {
      question: "What is your natural hair type?",
      options: ["Straight", "Wavy", "Curly", "Coily"],
      category: "hair_type"
    },
    {
      question: "How would you describe your scalp condition?",
      options: ["Oily", "Dry", "Normal", "Combination"],
      category: "scalp_health"
    },
    {
      question: "How often do you wash your hair?",
      options: ["Daily", "Every 2-3 days", "Once a week", "Less than once a week"],
      category: "hair_care"
    },
    {
      question: "How long have you been experiencing hair fall?",
      options: ["Less than 3 months", "3-6 months", "6-12 months", "Over a year"],
      category: "hair_health"
    },
    {
      question: "Where do you notice the most hair thinning?",
      options: ["Front hairline", "Crown/top", "Temples", "Overall thinning", "No noticeable thinning"],
      category: "hair_health"
    },
    {
      question: "Do you color or chemically treat your hair?",
      options: ["Yes, frequently", "Occasionally", "Rarely", "Never"],
      category: "hair_care"
    },
    {
      question: "How balanced is your diet?",
      options: ["Very balanced (fruits, veggies, proteins)", "Moderately balanced", "Mostly processed foods", "Not balanced at all"],
      category: "nutrition"
    },
    {
      question: "Do you have any of these health conditions?",
      options: ["PCOD/PCOS", "Thyroid disorder", "Diabetes", "Anemia", "None"],
      category: "health"
    },
    {
      question: "How would you describe your recent stress levels?",
      options: ["Very high", "Moderate", "Mild", "No stress"],
      category: "lifestyle"
    },
    {
      question: "What type of water do you use for washing hair?",
      options: ["Hard water", "Soft water", "Filtered water", "Not sure"],
      category: "environment"
    }
  ];

  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username);
          if (userData.profilePic) {
            setProfilePic(userData.profilePic);
          }

        //   if (userData.lastTestDate) {
        //   setLastTestDate(userData.lastTestDate.toDate());
        //   checkTestCooldown(userData.lastTestDate.toDate());
        // }

      }
    }
  };
  fetchUsername();
}, []);


// // Add this helper function to check the cooldown period
// const checkTestCooldown = (lastDate) => {
//   const now = new Date();
//   const lastTest = new Date(lastDate);
//   const diffTime = now - lastTest;
//   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
//   if (diffDays < 30) {
//     setCanRetakeTest(false);
//     setDaysUntilRetake(30 - diffDays);
//   } else {
//     setCanRetakeTest(true);
//   }
// };



  const handleModalClose = () => {
    setShowModal(false);
    setUploadedFile(null);
    setImagePreview(null);
    setCurrentStep(1);
  };

  const handleLogout = () => {
    auth.signOut().then(() => navigate("/")).catch(console.error);
  };

  const handleProfilePicChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfilePic(e.target.result);
      reader.readAsDataURL(file);

      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), { 
          profilePic: URL.createObjectURL(file) 
        });
      }
    }
    setShowDropdown(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setUploadedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!uploadedFile || !gender) {
      setError("Please select gender and upload an image.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("gender", gender.toLowerCase());
    formData.append("user_id", auth.currentUser.uid);
    formData.append("answers", JSON.stringify(answers));

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      
      const result = await response.json();
      console.log("API Response:", result);

      if (result.is_scalp === false) {
        setModalMessage("Please upload a clear scalp image for accurate analysis.");
        setShowModal(true);
        return;
      }

      if (result.error) throw new Error(result.error);

      setPrediction(result);
      setCurrentStep(2);
      
      // // Store test completion date in Firestore
      // const user = auth.currentUser;
      // if (user) {
      //   await updateDoc(doc(db, "users", user.uid), { 
      //     lastTestDate: new Date() 
      //   });
      //   setLastTestDate(new Date());
      //   setCanRetakeTest(false);
      //   setDaysUntilRetake(30);
      // }




    } catch (error) {
      console.error("Error:", error);
      setModalMessage(error.message || "Analysis failed. Please try again.");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };


  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers({
      ...answers,
      [questionIndex]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentStep(3);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getAnalysisResults = () => {
    const problems = [];
    const solutions = [];
    const lifestyleChanges = [];
    const productRecommendations = [];
    const hairCareRoutine = [];

    // Hair loss stage analysis
    if (prediction?.stage) {
      problems.push(`${prediction.stage} hair thinning/loss`);
      
      switch(prediction.stage.toLowerCase()) {
  case "stage 1":
    solutions.push("Early intervention with topical treatments can prevent further hair loss.");
    productRecommendations.push("Minoxidil 2% solution, apply twice daily to affected areas.");
    break;
  case "stage 2":
    solutions.push("Moderate thinning requires consistent treatment and scalp care.");
    productRecommendations.push("Minoxidil 5% foam or solution, use as directed by a dermatologist.");
    break;
  case "stage 3":
    solutions.push("Advanced thinning may benefit from medical or clinical interventions.");
    productRecommendations.push("Consult a dermatologist for Platelet-Rich Plasma (PRP) therapy or oral medications like finasteride.");
    break;
  case "stage 4":
    solutions.push("Significant hair loss may require surgical options or advanced therapies.");
    productRecommendations.push("Schedule a consultation for hair transplant evaluation or low-level laser therapy.");
    break;
  default:
    solutions.push("General hair care recommendations for maintaining healthy hair.");
    productRecommendations.push("Gentle shampoo and conditioner suitable for your hair type.");
    break;
}
  }

  // Hair type analysis
  if (answers[0] === "Coily" || answers[0] === "Curly") {
      problems.push("Curly/coily hair prone to breakage and dryness.");
      productRecommendations.push("Leave-in conditioners with shea butter or argan oil.");
    }

  // Scalp condition analysis
  if (answers[1] === "Oily") {
    problems.push("Excess sebum production leading to greasy scalp.");
    productRecommendations.push("Clarifying shampoo, use 1-2 times weekly to remove buildup.");
  } else if (answers[1] === "Dry") {
    problems.push("Dry, flaky scalp prone to irritation.");
    productRecommendations.push("Moisturizing shampoo with ceramides or hyaluronic acid.");
  }

  // Chemical treatments analysis
  if (answers[5]?.includes("frequently")) {
    problems.push("Chemical damage from frequent coloring or treatments.");
    productRecommendations.push("Olaplex No. 3 Hair Perfector for bond repair, use weekly.");
  }

  // Nutrition analysis
  if (answers[6]?.includes("processed") || answers[6]?.includes("Not balanced")) {
    problems.push("Poor nutrition impacting hair strength and growth.");
    productRecommendations.push("Biotin (5000 mcg daily) or collagen supplements.");
  }

  // Health conditions analysis
  if (answers[7]?.includes("PCOD/PCOS")) {
    problems.push("Hormonal imbalance from PCOD/PCOS affecting hair growth.");
    productRecommendations.push("Consult an endocrinologist for hormonal management options.");
  } else if (answers[7]?.includes("Thyroid disorder")) {
    problems.push("Thyroid-related hair thinning or loss.");
    productRecommendations.push("Monitor TSH, T3, T4 levels with your doctor.");
  } else if (answers[7]?.includes("Anemia")) {
    problems.push("Iron deficiency contributing to hair shedding.");
    productRecommendations.push("Iron supplements with vitamin C for absorption.");
  }

  // Stress analysis
  if (answers[8] === "Very high" || answers[8] === "Moderate") {
    problems.push("Stress-induced hair shedding (telogen effluvium).");
    productRecommendations.push("Adaptogens like ashwagandha to manage stress.");
  }

  // Water type analysis
  if (answers[9] === "Hard water") {
    problems.push("Mineral buildup from hard water weakening hair.");
    productRecommendations.push("Chelating shampoo, use monthly to remove mineral deposits.");
  }

  // Standardized Hair Care Routine
    const baseRoutine = {
      title: "Basic Care",
      steps: [
        "Wash 2-3 times weekly with sulfate-free shampoo",
        "Condition from mid-length to ends",
        "Air dry when possible or use heat protectant",
        "Trim every 6-8 weeks to prevent split ends"
      ]
    };

    const washingRoutine = {
      title: "Washing Technique",
      steps: [
        "Massage shampoo gently with fingertips (not nails)",
        "Rinse with lukewarm water (not hot)",
        "Apply conditioner to ends only for oily scalp",
        "Final rinse with cool water to seal cuticles"
      ]
    };

    const weeklyTreatments = {
      title: "Weekly Treatments",
      steps: []
    };

    // Add treatments based on hair type
    if (answers[0] === "Coily" || answers[0] === "Curly") {
      weeklyTreatments.steps.push("Deep conditioning mask (20 min)");
    }
    if (answers[1] === "Dry") {
      weeklyTreatments.steps.push("Scalp massage with warm coconut oil");
    }

    hairCareRoutine.push(baseRoutine);
    hairCareRoutine.push(washingRoutine);
    if (weeklyTreatments.steps.length > 0) {
      hairCareRoutine.push(weeklyTreatments);
    }

    return { 
      problems, 
      solutions, 
      lifestyleChanges,
      productRecommendations,
      hairCareRoutine
    };
  };
  const handleRetakeTest = () => {
    setShowTest(false);
    setGender("");
    setUploadedFile(null);
    setImagePreview(null);
    setPrediction(null);
    setError(null);
    setCurrentStep(1);
    setCurrentQuestion(0);
    setAnswers({});
  };

  return (
    <div className="dashboard-container">
      {/* Modal for invalid image */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Invalid Image:Please upload the correct scalp picture</h3>
            <p>{modalMessage}</p>
            <button className="modal-ok-btn" onClick={handleModalClose}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="header-bar">
        <div className="header-left">
          <h1>Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="profile-section">
            <div
              className="profile-pic-container"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img
                src={profilePic}
                alt="User Profile"
                className="profile-pic"
              />
              <p className="username">{username || "Loading..."}</p>
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
                <label htmlFor="profile-pic-upload" className="dropdown-item">
                  Upload Profile Picture
                </label>
                <input
                  id="profile-pic-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  style={{ display: "none" }}
                />
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="menu">
          <button
            className={`menu-btn ${activeSection === "home" ? "active" : ""}`}
            onClick={() => setActiveSection("home")}
          >
            Home
          </button>
          <button
            className={`menu-btn ${activeSection === "healthTracker" ? "active" : ""}`}
            onClick={() => setActiveSection("healthTracker")}
          >
            Hair Tracker
          </button>
          <button
            className={`menu-btn ${activeSection === "communityForum" ? "active" : ""}`}
            onClick={() => setActiveSection("communityForum")}
          >
            Community Forum
          </button>
        </div>
      </div>

      <div className="main-content">
        {activeSection === "home" && (
          <div className="home-section">
            <h2>Take Test for Hairfall</h2>
            
            {!showTest && (
              <button
                className="take-test-btn"
                onClick={() => setShowTest(true)}
              >
                Take Test
              </button>
            )}

            {showTest && (
              <div className="test-section">
                {error && (
                  <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
                    {error}
                  </div>
                )}

                {prediction && (
                  <div className="prediction-result">
                    <h3>Hair Fall Result:</h3>
                    <p>Stage: {prediction.stage}</p>
                  </div>
                )}

                {currentStep === 1 && (
                  <>
                    {!gender && (
                      <div className="gender-selection">
                        <p>Select your gender:</p>
                        <button
                          className="gender-btn"
                          onClick={() => setGender("Male")}
                        >
                          Male
                        </button>
                        <button
                          className="gender-btn"
                          onClick={() => setGender("Female")}
                        >
                          Female
                        </button>
                      </div>
                    )}

                    {gender && !imagePreview && (
                      <div className="upload-section">
                        <p>Upload your picture:</p>
                        <div className="image-upload-container">
                          <label htmlFor="file-upload" className="image-upload-label">
                            <div className="upload-prompt">
                              <span>Click to take/upload a picture</span>
                            </div>
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                          />
                        </div>
                      </div>
                    )}

                    {imagePreview && !prediction && (
                      <div className="upload-section">
                        <div className="image-preview-container">
                          <img src={imagePreview} alt="Uploaded Preview" className="preview-image" />
                        </div>
                        <button
                          className="submit-btn"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? "Analyzing..." : "Analyze Image"}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {currentStep === 2 && (
                  <div className="questions-section">
                    <div className="question-container">
                      <h3 className="question-text">
                        {questions[currentQuestion].question}
                      </h3>
                      <div className="options-container">
                        {questions[currentQuestion].options.map((option, index) => (
                          <button
                            key={index}
                            className={`option-btn ${answers[currentQuestion] === option ? "selected" : ""}`}
                            onClick={() => handleAnswerSelect(currentQuestion, option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="question-navigation">
                      {currentQuestion > 0 && (
                        <button
                          className="nav-btn prev-btn"
                          onClick={handlePreviousQuestion}
                        >
                          Previous
                        </button>
                      )}
                      <button
                        className="nav-btn next-btn"
                        onClick={handleNextQuestion}
                        disabled={!answers[currentQuestion]}
                      >
                        {currentQuestion === questions.length - 1 ? "Get Results" : "Next"}
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="results-section">
                    <h3>Your Personalized Hair Health Report</h3>



                    
                    {/* {lastTestDate && (
                      <p className="test-date">
                        Test taken on: {lastTestDate.toLocaleDateString()}
                      </p>
                    )}                   */}



                    <div className="analysis-container">
                      <div className="problems-section">
                        <h4>Identified Issues:</h4>
                        <ul>
                          {getAnalysisResults().problems.map((problem, index) => (
                            <li key={index}>{problem}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="solutions-section">
                        <h4>Recommended Actions:</h4>
                        <ul>
                          {getAnalysisResults().solutions.map((solution, index) => (
                            <li key={index}>{solution}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="recommendations-grid">
                      <div className="lifestyle-recommendations">
                        <h4>Lifestyle Changes:</h4>
                        <ul>
                          {getAnalysisResults().lifestyleChanges.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="product-recommendations">
                        <h4>Product Suggestions:</h4>
                        <ul>
                          {getAnalysisResults().productRecommendations.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="hair-care-routine">
                      <h4>Recommended Hair Care Routine:</h4>
                      <div className="routine-sections-container">
                        {getAnalysisResults().hairCareRoutine.map((section, index) => (
                          <div key={index} className="routine-section">
                            <h5>{section.title}</h5>
                            <ul className="routine-steps">
                              {section.steps.map((step, i) => (
                                <li key={i} className="routine-step">{step}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      className="retake-test-btn"
                      onClick={handleRetakeTest} 
                    >  

                    {/* <button className="retake-test-btn" onClick={canRetakeTest ? handleRetakeTest : null} disabled={!canRetakeTest}>
                      {canRetakeTest ? "Take New Test" : `Available in ${daysUntilRetake} days`}
                    </button> */}

                      Take New Test
                    </button>
                  </div>
                )}

                {currentStep === 1 && (gender || imagePreview || prediction) && (
                  <div className="test-btn-container">
                    <button
                      className="retake-test-btn"
                      onClick={handleRetakeTest}
                    >
                      Retake Test
                    </button>


                    {/* {canRetakeTest ? (
                    <button
                      className="retake-test-btn"
                      onClick={handleRetakeTest}
                    >
                      Retake Test
                    </button>
                  ) : (
                    <div className="cooldown-message">
                      You can retake the test in {daysUntilRetake} days
                    </div>
                  )} */}


                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === "healthTracker" && <HairTracker />}
        
        {activeSection === "communityForum" && <CommunityForum />}
      </div>
    </div>
  );
};

export default Dashboard;