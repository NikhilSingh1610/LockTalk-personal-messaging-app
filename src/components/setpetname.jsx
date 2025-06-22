import React, { useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebase";

export default function Onboarding({ user, onComplete }) {
  const [petName, setPetName] = useState("");

  const submit = async () => {
    if (!petName.trim()) return;
    await update(ref(db, `users/${user.uid}`), { petName });
    onComplete();
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h2 className="text-xl mb-4">Choose a Pet Name</h2>
      <input
        className="border px-3 py-2 mb-3 rounded"
        value={petName}
        onChange={(e) => setPetName(e.target.value)}
        placeholder="e.g. Whiskers"
      />
      <button onClick={submit} className="bg-green-500 text-white px-4 py-2 rounded">
        Save
      </button>
    </div>
  );
}
