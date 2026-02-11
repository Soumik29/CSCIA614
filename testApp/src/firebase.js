// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
//   import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
  import {getFirestore, collection } from 'firebase/firestore';
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBnR4_orCVsBt2rWxS1BREjqheCZomsjWM",
    authDomain: "cscia514.firebaseapp.com",
    projectId: "cscia514",
    storageBucket: "cscia514.firebasestorage.app",
    messagingSenderId: "112206249894",
    appId: "1:112206249894:web:41787a78eae1971aef1967",
    measurementId: "G-Z109MS51B4"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
//   const analytics = getAnalytics(app);
export const db = getFirestore(app);
//   const auth = getAuth(app);
export const shoppingdata = collection(db, 'ShoppingList');
