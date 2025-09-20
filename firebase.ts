import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjUq1maWvuBGjJp9-uXDc0A4akuzCXjDc",
    authDomain: "project-management-2b36a.firebaseapp.com",
    databaseURL: "https://project-management-2b36a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-management-2b36a",
    storageBucket: "project-management-2b36a.firebasestorage.app",
    messagingSenderId: "639890153384",
    appId: "1:639890153384:web:f77564b40f3a35e365879d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db };
