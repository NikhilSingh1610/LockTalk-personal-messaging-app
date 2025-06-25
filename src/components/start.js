import { getDatabase, ref, get, set, update } from "firebase/database";

export const startOrGetChat = async (currentUser, otherUser) => {
  const db = getDatabase();

  const chatId = [currentUser.uid, otherUser.uid].sort().join("_");
  const chatRef = ref(db, `chats/${chatId}`);

  const snapshot = await get(chatRef);

  if (!snapshot.exists()) {
    
    await set(chatRef, {
      members: {
        [currentUser.uid]: true,
        [otherUser.uid]: true,
      },
      messages: {}
    });

   
    await update(ref(db), {
      [`users/${currentUser.uid}/chats/${chatId}`]: true,
      [`users/${otherUser.uid}/chats/${chatId}`]: true
    });

    console.log("New chat created:", chatId);
  } else {
    console.log("Chat already exists:", chatId);
  }

  return chatId;
};
