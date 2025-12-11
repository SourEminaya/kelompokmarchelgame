import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCoSYOgwYjJ4J9fzJkFnZAm0DTPfH6lenI",
  authDomain: "uas-kelompok4-bwp.firebaseapp.com",
  projectId: "uas-kelompok4-bwp",
  storageBucket: "uas-kelompok4-bwp.appspot.com",
  messagingSenderId: "572071642046",
  appId: "1:572071642046:web:be39c1b03557ba464a2fef",
  measurementId: "G-Z1KNP30ZNZ",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
