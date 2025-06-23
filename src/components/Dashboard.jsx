import React, { useState, useEffect, useRef } from "react";
import { db, auth, storage } from "../firebase";
import {
  ref,
  set,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  push,
  onChildAdded,
  remove,
  get
} from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import DarkModeToggle from "./theme";
import ChatList from "./chatlist";
import UserSearch from "./UserSearch";

export default function Dashboard({ user }) {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const chatRef = useRef();
  
  const getChatId = () => {
    if (!user?.uid || !selectedUser?.uid) return null;
    return [user.uid, selectedUser.uid].sort().join("_");
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search and fetch online users
  useEffect(() => {
    const usersQuery = query(ref(db, "users"), orderByChild("online"), equalTo(true));
    const unsubscribe = onValue(usersQuery, (snapshot) => {
      const users = snapshot.val() || {};
      const filtered = Object.entries(users)
        .filter(([uid]) => uid !== user.uid)
        .map(([uid, data]) => ({ uid, ...data }));

      setOnlineFriends(filtered);

      if (debouncedTerm.trim()) {
        const filteredSearch = filtered.filter(
          (u) =>
            u.petName?.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
            u.displayName?.toLowerCase().includes(debouncedTerm.toLowerCase())
        );
        setSearchResults(filteredSearch);
      } else {
        setSearchResults([]);
      }
    });

    return () => off(usersQuery);
  }, [debouncedTerm, user.uid]);

  // Load messages for selected chat
  useEffect(() => {
    const chatId = getChatId();
    if (!chatId) return;
    
    setMessages([]);
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      setMessages((prev) => [...prev, {
        id: snapshot.key,
        ...snapshot.val()
      }]);
    });
    
    return () => off(messagesRef, "child_added", unsubscribe);
  }, [selectedUser?.uid]);

  
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    const chatId = getChatId();
    if (!chatId || (!newMessage.trim() && !file)) return;

    try {
      setUploading(true);
      
      const message = {
        sender: user.uid,
        timestamp: Date.now(),
        senderName: user.petName || user.displayName,
      };
      
      if (newMessage.trim()) {
        message.text = newMessage.trim();
      }

      // Handle file upload if present
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filename = `${Date.now()}.${fileExt}`;
        const filePath = `chat_uploads/${chatId}/${filename}`;
        const fileRef = storageRef(storage, filePath);
        
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);

        message.file = {
          url: downloadURL,
          name: file.name,
          type: file.type,
          size: file.size
        };
      }

      
      await push(ref(db, `chats/${chatId}/messages`), message);

      
      setNewMessage("");
      setFile(null);
      document.getElementById("file-input").value = "";

    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteMessage = async (messageId, hasFile) => {
    const chatId = getChatId();
    if (!chatId || !messageId) return;

    try {
      // Optimistic UI update
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Delete from Realtime Database
      await remove(ref(db, `chats/${chatId}/messages/${messageId}`));
      
      // If message has file, delete from Storage
      if (hasFile) {
        try {
          const fileRef = storageRef(storage, `chat_uploads/${chatId}/${messageId}`);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn("File not found in storage:", storageError);
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      // Revert optimistic update if deletion failed
      const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
      const snapshot = await get(messageRef);
      if (snapshot.exists()) {
        setMessages(prev => [...prev, { id: messageId, ...snapshot.val() }]);
      }
      alert("Failed to delete message. Please try again.");
    }
  };

  // Handle delete click (shows confirmation)
  const handleDeleteClick = (messageId, hasFile) => {
    setMessageToDelete({ messageId, hasFile });
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!messageToDelete) return;
    await deleteMessage(messageToDelete.messageId, messageToDelete.hasFile);
    setMessageToDelete(null);
  };

  // Logout handler
  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="bg-white text-black transition-all duration-500 h-screen">
      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Delete this message?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The message will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex max-w-6xl mx-auto h-full border rounded-xl shadow overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r bg-gray-50 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-indigo-200" 
            />
            <div>
              <h2 className="font-bold text-indigo-600">{user.petName || user.displayName}</h2>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full mb-4 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {/* Online friends list */}
          <div className="text-gray-700 font-semibold mb-2">Online Friends</div>
          <ul className="flex-1 overflow-y-auto space-y-2">
            {(searchResults.length > 0 ? searchResults : onlineFriends).map((u) => (
              <motion.li
                key={u.uid}
                onClick={() => setSelectedUser(u)}
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-indigo-50 transition-all ${
                  selectedUser?.uid === u.uid ? "bg-indigo-100 border border-indigo-300" : ""
                }`}
              >
                <div className="relative">
                  <img 
                    src={u.photoURL} 
                    alt={u.displayName} 
                    className="w-8 h-8 rounded-full" 
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-medium">{u.petName}</p>
                  <p className="text-xs text-gray-500">{u.displayName}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="mt-4 w-full text-sm text-red-600 hover:underline py-2"
          >
            Logout
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="p-4 bg-indigo-600 text-white flex items-center justify-between border-b border-indigo-700">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedUser.photoURL} 
                    className="w-10 h-10 rounded-full border-2 border-white" 
                    alt={selectedUser.displayName} 
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUser.petName}</h3>
                    <p className="text-sm text-indigo-200">@{selectedUser.displayName}</p>
                  </div>
                </div>
              </div>

              {/* Messages container */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
              >
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: msg.sender === user.uid ? 20 : -20 }}
                    transition={{ duration: 0.3 }}
                    className={`max-w-xs rounded-lg px-3 py-2 break-words relative group ${
                      msg.sender === user.uid
                        ? "ml-auto bg-indigo-100"
                        : "mr-auto bg-gray-200"
                    }`}
                  >
                    {/* Message text */}
                    {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                    
                    {/* File attachment */}
                    {msg.file && (
                      <div className="mt-2">
                        {msg.file.type.startsWith('image/') ? (
                          <img 
                            src={msg.file.url} 
                            alt={msg.file.name}
                            className="max-w-full max-h-40 rounded-lg border border-gray-300"
                          />
                        ) : (
                          <a
                            href={msg.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:underline"
                          >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            {msg.file.name} ({Math.round(msg.file.size / 1024)}KB)
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Delete button (only for user's own messages) */}
                    {msg.sender === user.uid && (
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteClick(msg.id, !!msg.file)}
                          className="p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600"
                          title="Delete message"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Message input area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                {/* File preview */}
                {file && (
                  <div className="flex items-center justify-between mb-2 p-2 bg-gray-100 rounded-lg">
                    <span className="text-sm text-gray-700 truncate max-w-xs">
                      {file.name} ({Math.round(file.size / 1024)}KB)
                    </span>
                    <button 
                      onClick={() => {
                        setFile(null);
                        document.getElementById("file-input").value = "";
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {/* Text input */}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    disabled={uploading}
                  />
                  
                  {/* File input */}
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm">
                    <input
                      id="file-input"
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={uploading}
                    />
                    📎 Attach
                  </label>
                  
                  {/* Send button */}
                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !file) || uploading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                  >
                    {uploading ? (
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <div className="text-center p-6">
                <h3 className="text-xl font-medium mb-2">No chat selected</h3>
                <p className="text-sm">Choose a friend from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
