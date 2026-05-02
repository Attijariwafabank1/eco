import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDq02btRreh8uY86dKeF_E6SsvIsfpcwOM",
  authDomain: "projet-banque-164eb.firebaseapp.com",
  projectId: "projet-banque-164eb",
  storageBucket: "projet-banque-164eb.firebasestorage.app",
  messagingSenderId: "77077924318",
  appId: "1:77077924318:web:446afae0b493960891754f",
  measurementId: "G-1YJ1NERKZM",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);