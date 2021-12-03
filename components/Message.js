import React, { useState } from 'react';
import { useGlobalContext } from '../context';
import ReactMarkdown from 'react-markdown'
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from '@firebase/firestore';
import { db } from '../Firebase';
import { useRouter } from 'next/router';

function Message({ messageData, index }) {
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const currentUser = useGlobalContext().user.email;
  const { user, message, timestamp, id } = messageData;
  const router = useRouter();
  let timeStampToAdd = '';
  // If timestamp is not (null because of Firebase onSnapshot latency compensation).

  if (timestamp) {
    if (typeof (timestamp) === 'object') {
      timeStampToAdd = timestamp.toDate().toLocaleTimeString();
    } else if (typeof (timestamp) === 'string') {
      timeStampToAdd = timestamp;
    }
  } else {
    timeStampToAdd = '...'
  }

  const handleShowMessageMenu = () => {
    setShowMessageMenu(!showMessageMenu);
  }

  const handleDeleteMessage = async (e) => {
    const messageContainer = e.target.closest('.message-container');
    const isMyMessage = messageContainer.classList.contains('me');
    console.log(isMyMessage);
    setShowMessageMenu(false);
    const chatRef = doc(db, 'chats', String(router.query.id));
    // const chatSnap = await getDoc(chatRef);
    // console.log(id);
    const messagesRef = collection(chatRef, 'messages');
    const messageRef = doc(messagesRef, id);
    await deleteDoc(messageRef);
    // const messageSnap = await getDoc(messageRef);
    // const messageSnap = await getDocs(collection(chatRef, 'messages'));
    // const messageSnap = query(collection(chatRef, 'messages'), where("__name__", "==", id));
    // const messageSnapshot = await getDocs(messageSnap);
    // const messagesSnap = await getDocs(messagesRef);

    // query can't be an argument of deleteDoc();
    // messageSnap.docs.map(async doc => {
    //   console.log(doc.data())
    // });
    
    // console.log(messageSnap.data());
  }

  return (
    <div className={`message-container ${(user === currentUser) && "me"} ${index===0 && "first-message"}}`}>
      <div className="message-name">{user}</div>
      {/* Without using dangerouslySetInnerHTML  */}
      <div className="message"><ReactMarkdown>{message}</ReactMarkdown></div>
      <div className="message-timestamp">{timeStampToAdd}</div>
      <button className="message-menu-btn" onClick={handleShowMessageMenu}>
        <i className="fas fa-ellipsis-v"></i>
      </button>
      <div className={`message-menu ${showMessageMenu && "show"}`} >
        <button className="delete-message-btn" onClick={handleDeleteMessage}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default Message;