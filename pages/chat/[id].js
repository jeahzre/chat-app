import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { auth, db } from '../../Firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, getFirestore, serverTimestamp, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import ChatText from '../../components/ChatText';
import { AppProvider, useGlobalContext } from '../../context';


function Chat(props) {
  const [user, setUser] = useState(auth.currentUser);
  const { messages, chat, users } = props;
  const { setChat, setMessages, setUsers, getRecipientEmails } = useGlobalContext();

  console.log('id props', props);

  useEffect(() => {
    // Set context state with props that come from getServerSideProps().
    console.log('set in context');
    setMessages(messages);
    // console.log('b', chat)
    setChat(chat);
    setUsers(users)
  }, [props])

  // Check if current user has signed in. 
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // To determine showing login page.
        setUser(user);
        // Set the user info in db. 
        // doc(db, collection, document)
        setDoc(doc(getFirestore(), 'users', user.uid), {
          email: user.email,
          lastSeen: serverTimestamp(),
          photoURL: user.photoURL
        })
      }
    });
  }, [user])

  const sidebarProps = {
    setUser,
    user,
    messages,
    chat
  }

  const chatTextProps = {
    chat,
    messages,
    users,
  }

  return (
    <AppProvider>
      <div className="chat-screen-container">
        <Head>
          <title>Chat with {getRecipientEmails(chat.users, user.email).recipientEmails[0]}</title>
        </Head>
        <Sidebar {...sidebarProps} />
        <ChatText {...chatTextProps} />
      </div>
    </AppProvider>
  );
}

export async function getServerSideProps(context) {
  // Get users in a document of "chats" collection.
  // console.log(context.query.id);
  const chatRef = doc(db, 'chats', String(context.query.id));
  const chatSnap = await getDoc(chatRef);
  const chat = {
    id: chatSnap.id,
    ...chatSnap.data()
  }

  const messagesQuery = query(collection(chatRef, 'messages'), orderBy("timestamp", "asc"));

  let messagesData = [];

  const getUsersCollection = async () => {
    const usersDocs = await getDocs(collection(db, 'users'))
    const users = usersDocs.docs.map((user) => {
      return {
        ...user.data(),
        lastSeen: user.data().lastSeen.toDate().getTime()
      }
    });
    return users;
  }

  const users = await getUsersCollection();

  if (chatSnap.exists()) {
    // Get message doc from messages collection inside a doc of chats collection. 
    messagesData = [];

    const unsub = onSnapshot(messagesQuery, (messagesQuerySnapshot) => {
      console.log('onsnapshot id');
      const source = messagesQuerySnapshot.metadata.hasPendingWrites ? "Local" : "Server";
      console.log(source);
      messagesQuerySnapshot.forEach(doc => {
        messagesData.push
          (
            {
              ...doc.data(),
              id: doc.id
            }
          );
      });
    });

    const messagesSnapShot = await getDocs(query(collection(chatRef, "messages"), orderBy("timestamp", "asc")));
    messagesData =
      messagesSnapShot.docs
        .map(message => {
          return {
            id: message.id,
            ...message.data()
          }
        }).map(message => {
          const msgObj = Object(message);
          console.log('changing timestamp')
          return {
            ...msgObj,
            timestamp: msgObj.timestamp.toDate().toLocaleTimeString()
          }
        });
  } else {
    // doc.data() will be undefined in this case.
    console.log("No such document!");
  }

  console.log(messagesData);

  return {
    props: {
      messages: messagesData,
      chat,
      users
    }
  }
}

export default Chat;