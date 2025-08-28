 import { initializeApp } from "firebase/app";
 import { getFirestore } from "firebase/firestore";
 import { getAuth } from "firebase/auth";
 
 // Firebaseコンソールからコピペする
 const firebaseConfig = {
  apiKey: "AIzaSyB_VbiT0GuMVlsjDUnCTTmKNYZIhT2PL8k",
  authDomain: "webex-89-team2.firebaseapp.com",
  projectId: "webex-89-team2",
  storageBucket: "webex-89-team2.firebasestorage.app",
  messagingSenderId: "687136905352",
  appId: "1:687136905352:web:4f7be89300d651d3e5a73d",
  measurementId: "G-8HMM27Y3MK"
 };
 
 const app = initializeApp(firebaseConfig);
 const db = getFirestore(app);
 const auth = getAuth(app);  // ← 認証機能を使うのに必要
 
 export { db, auth };