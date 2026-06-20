import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Gmail scopes requested
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let cachedAccessToken: string | null = null;

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Auth Error:", error);
    throw error;
  }
};

export const getCachedToken = () => cachedAccessToken;

export const logout = () => {
  cachedAccessToken = null;
  return auth.signOut();
};

export const initAuthListener = (callback: (user: User | null, token: string | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    // Note: onAuthStateChanged doesn't provide the accessToken directly after first login
    // We might need to handle re-auth or use the cached one if still valid.
    // For this simple app, we'll rely on the loginWithGoogle call to set the token.
    callback(user, cachedAccessToken);
  });
};
