// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "vingo-food-delivery-66174.firebaseapp.com",
  projectId: "vingo-food-delivery-66174",
  storageBucket: "vingo-food-delivery-66174.firebasestorage.app",
  messagingSenderId: "46801432393",
  appId: "1:46801432393:web:09b8b5a6e499e707f3f498"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { app, auth }

