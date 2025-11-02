import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyALB_nhoIhOXUNzKRlkO1j1-1fpshd-dSo",
  authDomain: "web-app-anwar.firebaseapp.com",
  projectId: "web-app-anwar",
  storageBucket: "web-app-anwar.firebasestorage.app",
  messagingSenderId: "144351094989",
  appId: "1:144351094989:web:a6f5ba8f807ca1498fa184",
  measurementId: "G-GL8K2MCXEG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const analytics = (typeof window !== 'undefined') 
  ? getAnalytics(app) 
  : null;


export const auth = getAuth(app);

export { GoogleAuthProvider, signInWithPopup };
