import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfjbsTX3dsm49H--0UhNwzaQ05ynN8Mko",
  authDomain: "kho-kho-tracker.firebaseapp.com",
  projectId: "kho-kho-tracker",
  storageBucket: "kho-kho-tracker.firebasestorage.app",
  messagingSenderId: "1765682371",
  appId: "1:1765682371:web:6d753adfbc4e7b1d794676",
  measurementId: "G-TJLD83C38E",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const COACH_EMAIL = "anuragkumar.pandit2000@gmail.com";
