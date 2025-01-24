// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDa7dvfXJyVYSrjhaJu2m7M_Q-spGzICzM",
  authDomain: "wireshark-report-app.firebaseapp.com",
  projectId: "wireshark-report-app",
  storageBucket: "wireshark-report-app.firebasestorage.app",
  messagingSenderId: "987511323908",
  appId: "1:987511323908:web:d44c53afc0a9331331a451",
  measurementId: "G-KWYFN7RGGN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and the Google provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export auth and googleProvider
export { auth, googleProvider };