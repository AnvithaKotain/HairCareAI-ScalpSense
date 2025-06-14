import React, { useState, useEffect } from "react";
import './loginregister.css';
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from '../firbaseauth/firbaseconfig';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";

const LoginRegister = () => {
    const [action, setAction] = useState('');
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
    const [registrationSuccess, setRegistrationSuccess] = useState(false); // For success message
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add('login-page');
        return () => {
            document.body.classList.remove('login-page');
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const q = query(collection(db, "users"), where("username", "==", loginData.username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0].data();
                const email = userDoc.email;
                const userId = querySnapshot.docs[0].id;

                console.log("User ID:", userId);

                await signInWithEmailAndPassword(auth, email, loginData.password);
                alert("Login successful!");
                navigate("/dashboard");
            } else {
                alert("Username not found");
            }
        } catch (error) {
            alert("Login failed: " + error.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            console.log("Registering user...");

            const q = query(collection(db, "users"), where("username", "==", registerData.username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert("Username already exists. Please choose another one.");
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, registerData.email, registerData.password);
            const user = userCredential.user;
            console.log("User created in Firebase Auth:", user.uid);

            await setDoc(doc(db, "users", user.uid), {
                username: registerData.username,
                email: registerData.email,
            });

            console.log("User data saved in Firestore");

            alert("Registration successful! Please log in.");

            // Clear form fields and show success message
            setRegisterData({ username: '', email: '', password: '' });
            setRegistrationSuccess(true);
            setAction(''); // Switch to login form
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed: " + error.message);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        const email = prompt("Please enter your registered email to reset the password:");
        if (!email) {
            alert("Email is required to reset the password.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent. Please check your inbox.");
        } catch (error) {
            alert("Error:" + error.message);
        }
    };

    const registerLink = () => {
        setAction('active');
        setRegistrationSuccess(false); // Reset success message
    };
    const loginLink = () => {
        setAction('');
    };

    return (
        <div>
            <h1 className="logo">HairCareAI-ScalpSense</h1>
            <div className={`wrapper ${action}`}>
                <div className="form-box login">
                    <form onSubmit={handleLogin}>
                        <h1>Login</h1>
                        {registrationSuccess && <p className="success-message">Registration successful! Please log in.</p>}
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Username"
                                value={loginData.username}
                                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                required
                            />
                            <FaUser className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                required
                            />
                            <FaLock className="icon" />
                        </div>
                        <div className="remember-forgot">
                            <label>
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#" onClick={handleForgotPassword}>Forgot Password</a>
                        </div>
                        <button type="submit">Login</button>
                        <div className="register-link">
                            <p>Don't have an account? <a href="#" onClick={registerLink}>Register</a></p>
                        </div>
                    </form>
                </div>

                <div className="form-box register">
                    <form onSubmit={handleRegister}>
                        <h1>Registration</h1>
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Username"
                                value={registerData.username}
                                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                required
                            />
                            <FaUser className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="email"
                                placeholder="Email"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                required
                            />
                            <FaEnvelope className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                required
                            />
                            <FaLock className="icon" />
                        </div>
                        <div className="remember-forgot">
                            <label>
                                <input type="checkbox" /> I agree to the terms & conditions
                            </label>
                        </div>
                        <button type="submit">Register</button>
                        <div className="register-link">
                            <p>Already have an account? <a href="#" onClick={loginLink}>Login</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;