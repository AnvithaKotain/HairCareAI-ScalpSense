import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyDOlnw_HQmJJ1KaElyDfEj0zzK3i0UokPw",
  authDomain: "scalpsense-961ef.firebaseapp.com",
  projectId: "scalpsense-961ef",
  storageBucket: "scalpsense-961ef.firebasestorage.app",
  messagingSenderId: "86098030579",
  appId: "1:86098030579:web:7415caa4db96077bfe6c86",
  measurementId: "G-KQRKJF0WMY"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db=getFirestore(app)

export { auth,db };
