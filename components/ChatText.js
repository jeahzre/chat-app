import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '@mui/material';
import { useGlobalContext } from "../context"
import { db } from '../Firebase';
import { doc, getDoc, getDocs, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { useRouter } from 'next/router';
import Message from './Message';

function ChatText(props) {
  const router = useRouter();
  // String(): make sure router.query.id isn't object.
  const chatRef = doc(db, 'chats', String(router.query.id));
  const { chat, users, messages: messagesFromServer } = props;
  const { chatTextWidth, user, getRecipientEmails, formatLastSeen } = useGlobalContext();
  const [recData, setRecData] = useState(null)
  const [showMenu, setShowMenu] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [recipientAvatar, setRecipientAvatar] = useState(null);
  const endOfMessages = useRef(null);
  const { messages, setMessages, setChat, getRecData, setUsers } = useGlobalContext();
  // console.log('chatText props', props);

  const recipientEmailsWithoutID = getRecipientEmails(chat.users, user.email);

  const scrollToBottom = () => {
    // console.log(endOfMessages);
    if (endOfMessages.current) {
      // console.log(!!endOfMessages.current)
      endOfMessages.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
    console.log('scroll');
    
  }

  // Do scrollToBottom() when ChatText first mount. 
  useEffect(() => {
    console.log('first init')
    // Time out to make sure that the ref component has mounted. 
    const timeout = setTimeout(() => {
      console.log('mount scroll timeout')
      scrollToBottom()
    }, 0);
    return () => clearTimeout(timeout);
  }, [router]);

  const showMessages = async () => {
    // Get messages from database.
    // const messagesSnapshot = await getDocs(collection(chatRef, 'messages'));
    // let messagesToRender = []
    // messagesSnapshot.docs.map((doc, i) => {
    //   messagesToRender.push(doc.data());
    // })

    // Set messages which is taken from props. 
    console.log('change route', props);
    setMessages(messagesFromServer);
    setUsers(users);
    setChat(chat);
  }

  useEffect(() => {
    console.log('router effect')
    showMessages();
    getRecData(chat.users, true, setRecipientAvatar, null, setRecData);
  }, [router])

  useEffect(() => {
    const messagesQuery = query(collection(chatRef, 'messages'), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(messagesQuery, (messagesQuerySnapshot) => {
      const source = messagesQuerySnapshot.metadata.hasPendingWrites ? "Local" : "Server";
      console.log('onsnapshot scroll', source);
      console.log(source);
      const messages = []
      messagesQuerySnapshot.forEach(doc => {
        messages.push({
          ...doc.data(),
          id: doc.id,
        });
      });
      // console.log(messages);
      setMessages(messages);
      setChat(chat);
      if (source === 'Local') {
        // It seems endOfMessages ref go out for a while while we send message which moves endOfMessages to down/ re-render. So make it out of cycle using setTimeout. 
        const timeout = setTimeout(() => {
          console.log('add scroll timeout')
          scrollToBottom()
        }, 0)
        return () => clearTimeout(timeout);
      };
    })

    // If we return unsub(), we can't see the change after we switch ChatButton because we detach the change listener.
    // return () => unsub()
  }, [router]);

  const handleSendMessage = async (e) => {
    // Prevent adding new line.
    e.preventDefault();
    if (inputMessage) {
      setInputMessage('');
      const chatRef = doc(db, 'chats', String(router.query.id));
      await addDoc(collection(chatRef, 'messages'), {
        message: inputMessage,
        user: user.email,
        timestamp: serverTimestamp(),
        photoURL: user.photoURL
      });
      console.log('sent');
    }
  }

  const handleKeyPress = async (e) => {
    if (e.which === 13 && e.ctrlKey) {
      // If we press ctrl + enter, submit/send message. 
      handleSendMessage(e);
    }
  }

  const handleTextAreaChange = (e) => {
    setInputMessage(e.target.value);
  }

  // console.log(recData);

  // This emoji picker causes lagging in this project. 
  // const picker = new EmojiButton();
  // const trigger = document.querySelector('#emoji-trigger');

  // picker.on('emoji', selection => {
  //   // handle the selected emoji here
  //   const textarea = document.getElementById('chat-textarea');
  //   textarea.innerText += (selection.emoji);
  // });

  // trigger.addEventListener('click', () => picker.togglePicker(trigger));

  return (
    <div className="chat-text-container" style={{
      width: chatTextWidth
    }}>
      <div className="chat-text-header">
         
        {
          recipientAvatar ?
            (recipientAvatar.photoURL ?

              <Avatar src={recipientAvatar.photoURL} className="chat-text-header-avatar"/> :
              <Avatar className="chat-text-header-avatar">{recipientAvatar.firstLetter}</Avatar>
            )
            :

            ''
        }
        <div className="chat-text-header-info">
          <div className="header-recipient-email">{recipientEmailsWithoutID.recipientEmails[0]}</div>
          <p className="header-last-seen">Last seen {
            recData ?
            formatLastSeen(recData.lastSeen)
            :
            '...'
          }</p>
        </div>
        <div className="chat-text-header-action">
          <button className="chat-text-header-more-btn">
            <i className={`fas ${!showMenu ? "fa-chevron-circle-down" : "fa-chevron-circle-up"}`}></i>
          </button>
        </div>
      </div>
      <div className="chat-text-messages">
        {
          messages?.map((message, i) =>
            {
            return <Message messageData={message} index={i}/>
          })
        }
        <div className="end-of-messages" ref={endOfMessages}></div>
      </div>
      <div className="chat-textarea-container">
        {/* <button id="emoji-trigger" className="chat-textarea-emoticon" tabIndex={0}>
          <i className="fas fa-meh-blank"></i>
        </button> */}
        <textarea id="chat-textarea" className="chat-textarea" onKeyPress={handleKeyPress} value={inputMessage} onChange={handleTextAreaChange}/>
        <button className="chat-textarea-send-btn" onClick={handleSendMessage} tabIndex={0}>
          <i className="fas fa-rocket"></i>
        </button>
      </div>
    </div>
  );
}

export default ChatText;