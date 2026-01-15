import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// We don't strictly need analytics for the core logic, but good to have if you want it
// import { getAnalytics } from "firebase/analytics"; 

const firebaseConfig = {
    apiKey: "AIzaSyCf1CSBjjPWDdYfl7UNrN3rbKlwfi4-iXY", // Note: This API Key is public by design in Firebase
    authDomain: "naagraaz--form-filler.firebaseapp.com",
    projectId: "naagraaz--form-filler",
    storageBucket: "naagraaz--form-filler.firebasestorage.app",
    messagingSenderId: "807505583080",
    appId: "1:807505583080:web:4fb009e8b472b8a138625d",
    measurementId: "G-VJHCGZSEZC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
