import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { ref, push, onValue, off, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';

function ChatInterface({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sending, setSending] = useState(false);
  const chatRef = useRef();

  const generateChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Fetch messages with proper cleanup
  useEffect(() => {
    if (!selectedFriend) {
      setMessages([]);
      return;
    }

    const chatId = generateChatId(user.uid, selectedFriend.uid);
    const messagesRef = ref(db, `chats/${chatId}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val() || {};
      const formattedMessages = Object.entries(messagesData).map(([id, message]) => ({
        id,
        ...message
      }));
      setMessages(formattedMessages);
    });

    return () => unsubscribe();
  }, [selectedFriend, user.uid]);

  // Fetch online friends with proper cleanup
  useEffect(() => {
    const usersRef = ref(db, 'users');

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users = snapshot.val() || {};
      const online = Object.entries(users)
        .filter(([uid, userData]) => uid !== user.uid && userData.online)
        .map(([uid, userData]) => ({ uid, ...userData }));
      setOnlineFriends(online);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Auto-scroll on new messages
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // Send message function with send lock and debug logs
  const sendMessage = async () => {
    if (sending) {
      console.log('Already sending message, ignoring duplicate call.');
      return;
    }

    if (!newMessage.trim() || !selectedFriend) return;

    console.log('sendMessage called');

    setSending(true);

    try {
      const chatId = generateChatId(user.uid, selectedFriend.uid);
      const message = {
        text: newMessage.trim(),
        sender: user.uid,
        timestamp: Date.now(),
        senderName: user.petName || user.displayName
      };

      await push(ref(db, `chats/${chatId}/messages`), message);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }

    setSending(false);
  };

  const deleteMessage = async (messageId) => {
    if (!selectedFriend) return;

    const chatId = generateChatId(user.uid, selectedFriend.uid);
    await remove(ref(db, `chats/${chatId}/messages/${messageId}`));
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="font-bold">Admin</h2>
          <p className="text-sm text-gray-500">@Chess Bot</p>
        </div>

        <div className="p-4">
          <h3 className="font-semibold mb-2">Online Friends</h3>
          <ul>
            {onlineFriends.map(friend => (
              <li
                key={friend.uid}
                className={`p-2 cursor-pointer ${selectedFriend?.uid === friend.uid ? 'bg-blue-100' : ''}`}
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{friend.petName || friend.displayName}</span>
                  <span className="text-sm text-gray-500">Chat: 8.00</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold">
            {selectedFriend ? selectedFriend.petName || selectedFriend.displayName : 'Select a friend'}
          </h2>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {messages.map(message => (
            <div
              key={message.id}
              className={`mb-4 p-3 rounded-lg max-w-xs ${message.sender === user.uid ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">
                  {message.senderName}
                </span>
                {message.sender === user.uid && (
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="text-xs text-red-300 hover:text-red-100"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p>{message.text}</p>
              <div className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t flex items-center">
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 p-2 border rounded"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            className="ml-2 p-2 text-gray-500 hover:text-gray-700"
            // attach button, functionality can be added later
          >
            © Attach
          </button>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
