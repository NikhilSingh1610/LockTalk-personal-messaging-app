import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "Your firebase api",
  authDomain: "Domian",
  databaseURL: "urlm",
  projectId: "id",
  storageBucket: "pema-a9828.appspot.com",
  messagingSenderId: "id",
  appId: "id"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);
export const dbRef = ref;
