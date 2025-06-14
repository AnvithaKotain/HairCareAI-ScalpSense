
# HairCare AI - Scalp Sense 💇‍♀️🧠

**Scalp Sense** is an AI-powered solution designed to analyze scalp images and detect hair fall stages in real-time. It provides users with personalized problem statements, treatment suggestions, and hair care routines based on image analysis and lifestyle factors. The system enables users to monitor progress and engage with a community for shared support and tips.

---

## 🚀 Features

- 🔍 **Hair Fall Stage Detection:** AI model identifies hair fall stages separately for males (1-6) and females (1-5) using scalp images.
- 🧠 **Intelligent Diagnosis:** Based on user-provided lifestyle, health, and environmental data, it generates tailored problem statements and care plans.
- 📈 **Progress Tracking:** Users can upload weekly images to monitor scalp/hair changes over time.
- 🌐 **Community Sharing:** A platform for users to share hair care experiences, tips, and results.
- ☁️ **Cloud Integration:** Images are stored using Cloudinary, and metadata is managed using MongoDB.
- 🧑‍💻 **Admin Dashboard:** Built with React for real-time predictions and user interaction.

---

## 📁 Project Structure

HairCareAI-ScalpSense/
│
├── backend/ # Flask server for handling predictions and image uploads
│ ├── app.py # Main Flask app
│ ├── model_male.h5 # Trained model for male hair fall detection
│ ├── model_female.h5 # Trained model for female hair fall detection
│ └── utils/ # Helper functions (preprocessing, prediction, DB ops)
│
├── frontend/ # React-based dashboard
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ └── App.js
│ └── public/
│
├── dataset/ # Structured image dataset (for model training)
│ ├── scalp/
│ │ ├── male/ # Male stage folders (1 to 6)
│ │ └── female/ # Female stage folders (1 to 5)
│ └── non-scalp/ # Non-scalp images for binary classification
│
└── README.md


---

## 🧠 AI Workflow

1. **Input:** User uploads scalp image + selects gender.
2. **Detection:**
   - Binary classification: Scalp vs Non-scalp.
   - Hair fall stage prediction (gender-specific model).
3. **User Input:** Lifestyle, health, and environmental data collected.
4. **Output:**
   - Problem Statement
   - Personalized Haircare Plan
   - Weekly Tracking Support

---

## 🛠️ Tech Stack

### ⚙️ Backend
- Python
- Flask
- TensorFlow / Keras (custom CNN-ANN models)
- MongoDB (user data & predictions)
- Cloudinary (image hosting)

### 🌐 Frontend
- React.js
- Tailwind CSS / ShadCN UI
- Axios (API integration)

---



