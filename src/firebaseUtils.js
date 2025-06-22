import { ref, query, orderByChild, startAt, endAt, onValue } from "firebase/database";
import { db } from "./firebase";

export function searchUsers(searchTerm, callback) {
  const usersRef = ref(db, 'users');
  const q = query(
    usersRef,
    orderByChild('petName'),
    startAt(searchTerm),
    endAt(searchTerm + "\uf8ff")
  );

  onValue(q, (snapshot) => {
    const results = [];
    snapshot.forEach(childSnap => {
      const user = childSnap.val();
      if (user.online) results.push(user);
    });
    callback(results);
  });
}
