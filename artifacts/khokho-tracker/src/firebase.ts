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

export async function resizeImageToBase64(file: File, size = 120): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}
