import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAD93bsulR1ftPBS3bjIsUyRDgPGmKefNw",
  authDomain: "namaz-quiz.firebaseapp.com",
  projectId: "namaz-quiz",
  storageBucket: "namaz-quiz.firebasestorage.app",
  messagingSenderId: "75178436017",
  appId: "1:75178436017:web:0b06e7232e6a419d270990"
};

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApp();

export const auth = isNew
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;