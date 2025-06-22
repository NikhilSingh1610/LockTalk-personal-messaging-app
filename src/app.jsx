import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/login";
import SetPetName from "./components/setpetname";
import Dashboard from "./components/Dashboard";
import { db, auth } from "./firebase";
import { ref, onDisconnect, onValue, set, update, get } from "firebase/database";
import Loading from "./components/Loading";
import SignUp from "./components/SignUp"; 
import ForgotPassword from './components/ForgotPassword';
<Route path="/forgot-password" element={<ForgotPassword />} />



function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);

          if (!snapshot.exists()) {
            await set(userRef, {
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              petName: "",
              online: false,
              lastSeen: Date.now(),
            });
          }

          const userProfile = (await get(userRef)).val();
          setCurrentUser({
            uid: user.uid,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            email: user.email || "",
            ...userProfile,
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const connectedRef = ref(db, ".info/connected");
    const onlineRef = ref(db, `users/${currentUser.uid}/online`);
    const lastSeenRef = ref(db, `users/${currentUser.uid}/lastSeen`);

    const unsubscribe = onValue(connectedRef, async (snap) => {
      if (snap.val() === true) {
        onDisconnect(onlineRef).set(false);
        onDisconnect(lastSeenRef).set(Date.now());
        await update(ref(db, `users/${currentUser.uid}`), {
          online: true,
          lastSeen: Date.now(),
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handlePetNameSet = (updatedPetName) => {
    setCurrentUser((prev) => ({ ...prev, petName: updatedPetName }));
  };
  


  if (loading) return <Loading />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/signup" element={<SignUp />} />

      {/* Login */}
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/dashboard" /> : <Login />}
      />

      {/* Protected dashboard */}
      <Route
        path="/dashboard"
        element={
          !currentUser ? (
            <Navigate to="/login" />
          ) : !currentUser.petName ? (
            <SetPetName user={currentUser} onPetNameSet={handlePetNameSet} />
          ) : (
            <Dashboard user={currentUser} />
          )
        }
      />

      {/* Default */}
      <Route
        path="*"
        element={<Navigate to={currentUser ? "/dashboard" : "/login"} />}
      />
    </Routes>
  
  );
}

export default App;
