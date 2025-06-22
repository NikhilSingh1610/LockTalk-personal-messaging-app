import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function ChatList({ currentUser, onSelectUser }) {
  const [chatUsers, setChatUsers] = useState([]);

  useEffect(() => {
    const chatRef = ref(db, `messages/${currentUser.uid}`);

    const unsubscribe = onValue(chatRef, async (snapshot) => {
      if (snapshot.exists()) {
        const userIds = Object.keys(snapshot.val());
        const userPromises = userIds.map((uid) =>
          ref(db, `users/${uid}`)
        );

        const userSnaps = await Promise.all(userPromises.map(r => onValueOnce(r)));
        const users = userSnaps.map((snap, index) => ({
          uid: userIds[index],
          ...snap.val(),
        }));

        setChatUsers(users);
      } else {
        setChatUsers([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  // Helper to get one-time value from ref
  const onValueOnce = (refPath) => {
    return new Promise((resolve) => {
      onValue(refPath, (snap) => resolve(snap), { onlyOnce: true });
    });
  };

  return (
    <div className="chat-list">
      <h2>Your Chats</h2>
      {chatUsers.map((user) => (
        <div key={user.uid} onClick={() => onSelectUser(user)}>
          <p>{user.petName || user.displayName}</p>
          {user.online ? <span className="text-green-400">Online</span> : null}
        </div>
      ))}
    </div>
  );
}
