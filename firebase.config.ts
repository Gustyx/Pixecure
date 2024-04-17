// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvQUX7D4IEiYAnPVq5q_qwilWPRDXyBKE",
  authDomain: "fitnessprotrack.firebaseapp.com",
  projectId: "fitnessprotrack",
  storageBucket: "fitnessprotrack.appspot.com",
  messagingSenderId: "759148893353",
  appId: "1:759148893353:web:8c7892c3784b853a3405b8",
  measurementId: "G-SZ1GD686B1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);