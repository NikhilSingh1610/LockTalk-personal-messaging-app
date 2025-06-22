import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function UserSearch({ currentUser, onSelectUser }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const usersRef = ref(db, "users");
    const chatRef = ref(db, `messages/${currentUser.uid}`);

    onValue(usersRef, (snap) => {
      const allUsers = snap.val() || {};
      onValue(chatRef, (chatSnap) => {
        const messagedUserIds = chatSnap.exists() ? Object.keys(chatSnap.val()) : [];

        const filtered = Object.entries(allUsers)
          .filter(([uid, user]) =>
            uid !== currentUser.uid &&
            user.online &&
            !messagedUserIds.includes(uid) &&
            (user.petName?.toLowerCase().includes(query.toLowerCase()) ||
              user.displayName?.toLowerCase().includes(query.toLowerCase()))
          )
          .map(([uid, user]) => ({ uid, ...user }));

        setOnlineUsers(filtered);
      });
    });
  }, [query, currentUser.uid]);

  return (
    <div className="user-search p-2">
      <input
        type="text"
        placeholder="Search online users"
        className="border p-2 w-full mb-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {onlineUsers.map((user) => (
        <div key={user.uid} onClick={() => onSelectUser(user)}>
          <p>{user.petName || user.displayName}</p>
          <span className="text-green-500">Online</span>
        </div>
      ))}
    </div>
  );
}
