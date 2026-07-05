import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDEbWcYNKQ8Eq4a9bu-F544yqJEHcDaAVs",
    authDomain: "tnverse2026.firebaseapp.com",
    projectId: "tnverse2026",
    storageBucket: "tnverse2026.firebasestorage.app",
    messagingSenderId: "333991686940",
    appId: "1:333991686940:web:5dfa67b68b9c4fd4d980d9",
    measurementId: "G-ZM53DDHSG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { auth, db, storage, analytics, googleProvider };
