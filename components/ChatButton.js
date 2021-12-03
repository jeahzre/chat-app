import { Avatar } from '@mui/material';
import React, { useEffect, useState } from 'react';
import router, { useRouter } from 'next/router';
import { useGlobalContext } from '../context';
import Link from 'next/link';
import { collection, deleteDoc, doc, getDoc } from '@firebase/firestore';
import { db } from '../Firebase';

function ChatButton({ chatButtonID, recipientEmails, index }) {
  // const [users, setUsers] = useState(null);
  // console.log(recipientEmails);
  const [recipientAvatar, setRecipientAvatar] = useState(null);
  const [recData, setRecData] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(null);

  const { getRecData, chat, users } = useGlobalContext();
  // const router = useRouter();
  useEffect(() => {
    // console.log(chat, chatButtonID)
    getRecData(recipientEmails, true, setRecipientAvatar, chatButtonID, setRecData);
  }, [users, chat]);

  // console.log("recipientAvatar", recipientAvatar);
  const formatRecipientEmails = (recipientEmails) => {
    let recipientEmailsFormat = '';
    if (recipientEmails.length > 1 && recipientEmails.length < 3) {
      recipientEmailsFormat += recipientEmails.join(', ');
    } else if (recipientEmails.length >= 3) {
      const showName = recipientEmails.filter((recipientEmail, index) => {
        return index < 2
      }).join(', ');
      const other = recipientEmails.length - 2;
      recipientEmailsFormat += `${showName}, and ${other} other more.`
    }
    else if (recipientEmails.length === 1) {
      recipientEmailsFormat += recipientEmails[0];
    }
    return recipientEmailsFormat;
  }

  // const handleChatButtonClick = (e) => {
  //   // console.log(e.currentTarget.id)
  //   router.push(`/chat/${e.currentTarget.id}`);
  // };

  const handleClickChatMenu = () => {
    setShowChatMenu(!showChatMenu);
  }

  const handleDeleteChat = async (e) => {
    setShowChatMenu(false);
    if (router.query.id === chatButtonID) {
      router.replace('/');
    }
    // Stop event bubbling.
    e.stopPropagation();
    console.log('delete');
    // Subcollection (messages) of this deleted doc isn't deleted. It requires cloud function to delete. An cloud function requires Blaze plan which isn't free.
    await deleteDoc(doc(db, "chats", e.target.id));
    const docRef = await getDoc(doc(db, "chats", e.target.id))
    // console.log(docRef.data());
  }

  return (
    <div className="chat-button-container">
      {/* {console.log(index, recipientAvatar, recipientAvatar?.firstLetter)} */}
      {
        (recipientAvatar && users) &&
        (recipientAvatar.photoURL ?

          <Avatar src={recipientAvatar.photoURL} />
          :
          (<Avatar>
            {`${recipientAvatar.firstLetter}`}
          </Avatar>)
        )
      }
      <Link href={`/chat/${chatButtonID}`}>
        <div className="recipient-name"> {
          formatRecipientEmails(recipientEmails)
        }
        </div>
      </Link>
      <div className="chat-menu-container">
        <button className="chat-menu-btn" onClick={handleClickChatMenu}>
          <i className="fas fa-ellipsis-v"></i>
        </button>
        <div className={`chat-menu ${showChatMenu && 'show'}`}>
          <button id={chatButtonID} className="delete-chat-btn" onClick={handleDeleteChat}>
            Delete Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatButton;