// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDKiPaZCAnL6aPFNhw1IEMTXKdh9ObE7Vc",
  authDomain: "pema-a9828.firebaseapp.com",
  databaseURL: "https://pema-a9828-default-rtdb.firebaseio.com",
  projectId: "pema-a9828",
  storageBucket: "pema-a9828.appspot.com",
  messagingSenderId: "135048530996",
  appId: "1:135048530996:web:5aa583cdea60648ad18e61"
};

// ✅ Initialize the app first
const app = initializeApp(firebaseConfig);


export const db = getDatabase(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);
export const dbRef = ref;
