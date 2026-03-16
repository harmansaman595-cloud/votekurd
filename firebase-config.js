// 🔥 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDZCSjDzJ27tPqGWne_zpbNuSX9M_rpsLQ",
    authDomain: "votekrd.firebaseapp.com",
    projectId: "votekrd",
    storageBucket: "votekrd.firebasestorage.app",
    messagingSenderId: "948514750647",
    appId: "1:948514750647:web:5ad94539c3c7de38c24d32",
    measurementId: "G-RERL6DX7W2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
