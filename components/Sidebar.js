import { Avatar } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../Firebase';
import ChatButton from './ChatButton';
import { signOut } from "firebase/auth";
import * as EmailValidator from 'email-validator';
import { addDoc, getDoc, getDocs, doc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useGlobalContext } from "../context"
import { useRouter } from 'next/router';

function Sidebar(props) {
  const [user, setUser] = useState(auth.currentUser);
  const [chats, setChats] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [menuLocation, setMenuLocation] = useState({ top: null, right: null });
  const [showSearchUserInput, setShowSearchUserInput] = useState(false);
  const [recData, setRecData] = useState(null)
  // const [searchInputLocation, setSearchInputLocation] = useState({ top: null, left: null });
  const { getRecipientEmails, isSidebarOpen, setIsSidebarOpen, toggleSidebarBtnLocation, currentUserAvatar, getRecData } = useGlobalContext();
  // console.log("currentUserAvatar", currentUserAvatar)
  const { chat, messages } = props;
  // console.log(useGlobalContext());
  const [input, setInput] = useState('');
  const [avatar, setAvatar] = useState(null);
  
  // const chatQuery = query(chatsRef, where('users', 'array-contains', input));
  const router = useRouter();

  const getChats = async () => {
    const chatsSnapshot = await getDocs(collection(db, "chats"));
    const chatsQuery = query(collection(db, 'chats'), where("users", "array-contains", user.email));
    const chatsQuerySnap = await getDocs(chatsQuery);

    // recipientEmails = array of users in array of chats (1 in 1 or group chat). 
    const chatsWithRecipientEmails = chatsQuerySnap.docs.map(doc => {
      console.log(doc.data())
      // Set the recipient emails without messages property.
      return getRecipientEmails(doc.data().users, user.email, doc.id)
    });
    // const recipientEmails = [];
    // chatsSnapshot.docs.map((doc) => {
    //   doc.data().users.map(userDB => {
    //     if (userDB !== user.email) {
    //       // If the user is not me. 
    //       recipientEmails.push({ id: doc.id, recipientEmail: userDB });
    //     }
    //   })
    //   // doc.data() is never undefined for query doc snapshots
    // });
    setChats(chatsWithRecipientEmails);
  }

  // Get all chats we have added. 
  useEffect(() => {
    // console.log(user);
    if (user) {
      getChats();
      // recData value is never read. 
      if (chat) {
        getRecData(chat, false, null, null, setRecData);
      } else {
        getRecData(chat, false, null, null, setRecData);
      }
    }
  }, [user]);

  // Check if parent has classname specified to close opening submenu if we click outside of the submenu. 
  useEffect(() => {
    window.addEventListener('click', (e) => {
      const hasClassOnParent = (el, classname) => {
        // console.log(el.className.split(' ').some(classname));
        if (el.className.split(' ').some(classname)) {
          // console.log('has');
        }
      }
      // @ts-ignore
      // console.log(e.target.closest('.dropdown-menu-container'))
      // if (!e.target.closest('.dropdown-menu-container')) {
      //   setShowMenu(false);
      // }
    });

    // Check whether the email to add includes all user in chats that has been added before.

    const chatsQuery = query(collection(db, 'chats'), where("users", "array-contains", user.email));
    
    // try
    const unsub = onSnapshot(chatsQuery, (chatsSnapshot) => {
      console.log('onsnapshot sidebar')
      const source = chatsSnapshot.metadata.hasPendingWrites ? "Local" : "Server";
      console.log(source);
      const chats = []
      chatsSnapshot.forEach(doc => {
        const chatWithRecipientEmails = getRecipientEmails(doc.data().users, user.email, doc.id)
        chats.push({
          ...chatWithRecipientEmails
        });
      });
      setChats(chats);
    });

    // return () => unsub()
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }

  const signOutz = () => {
    signOut(auth)
      .then(() => {
        alert('Sign out successful')
        setUser(auth.currentUser)
        router.replace('/');
      })
      .catch((error) => console.log(error))
  }

  const startNewChat = async () => {
    const input = prompt('Your friend email address');
    // const chatQuerySnapshot = await getDocs(chatQuery);
    // let includeAll;
    // chatQuerySnapshot.forEach((doc) => {
    //   // doc.data() is never undefined for query doc snapshots
    //   const usersArr = [user.email, input];
    //   includeAll = doc.data().users.every(a => usersArr.includes(a));
    // });
    if (input) {
      // If email is valid and the input is not current user. 
      if (EmailValidator.validate(input) && input !== user.email) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          users: [user.email, input]
        });
        const chatsSnapshot = await getDocs(collection(db, "chats"));
        setInput(input);
      } else {
        alert('The email is not valid or has already been added before.');
      }
    }
  }

  const handleClickMenu = () => {
    const sidebarHeader = document.getElementById('sidebar-header');
    const sidebarHeaderBottom = sidebarHeader.getBoundingClientRect().bottom;
    const button = document.getElementById("more-menu-btn");
    const buttonRight = button.getBoundingClientRect().right;
    console.log(sidebarHeaderBottom, document.body.clientWidth - buttonRight);
    setMenuLocation({ top: sidebarHeaderBottom, right: document.body.clientWidth - buttonRight });
    setShowMenu(!showMenu);
  }

  const toggleSearchInput = () => {
    setShowSearchUserInput(!showSearchUserInput);
    // if (document.getElementById('search-user-input')) {
    //   const sidebarHeader = document.getElementById('sidebar-header');
    //   const sidebarContainer = document.getElementById('sidebar-container');
    //   const searchUserInput = document.getElementById('search-user-input');
    //   const sidebarHeaderBottom = sidebarHeader.getBoundingClientRect().bottom;
    //   const halfOfSidebarContainerWidth = (sidebarContainer.getBoundingClientRect().width) / 2;
    //   const halfOfSearchUserInputWidth = (searchUserInput.getBoundingClientRect().width) / 2;
    //   setSearchInputLocation({
    //     top: sidebarHeaderBottom,
    //     left: halfOfSidebarContainerWidth - halfOfSearchUserInputWidth
    //   });
    // }
  }
  // console.log("SideBar props", props);

  // const getRecData = async () => {
  //   let recipientEmailsWithoutID = {};
  //   console.log("chat", chat)
  //   if (chat) {
  //     recipientEmailsWithoutID = getRecipientEmails(chat.users, user.email);
  //     console.log(recipientEmailsWithoutID)
    
  //     let photoURL = [];
  //     // Get users' photoURL from "users" collection. 
  //     await recipientEmailsWithoutID.recipientEmails.map(async recEmail => {
  //       console.log(recEmail)
  //       const usersQuery = query(collection(db, 'users'), where('email', '==', recEmail));
  //       console.log('getting user photoURL')
  //       const usersQuerySnapshot = await getDocs(usersQuery);
  //       usersQuerySnapshot.docs.map((userQuerySnapshot, i) => {
  //         console.log(userQuerySnapshot.data(), i)
  //         photoURL.push(userQuerySnapshot.data().photoURL)
  //       });
  //       setAvatar({ photoURL: photoURL[0] });
  //     })

  //     if (photoURL.length > 0) {
  //       setAvatar({photoURL: photoURL[0]});
  //     } else {
  //       // Return the first letter of user's email.
  //       const firstLetter = recipientEmailsWithoutID.recipientEmails[0].substr(0, 1).toUpperCase();
  //       setAvatar({firstLetter});
  //     }
  //   }
  // }

  return (
    <>
      {
        user &&
        <>
          <div id="outer-sidebar-container" className={`outer-sidebar-container  ${isSidebarOpen && "show"}`}>
            <div id="sidebar-container" className={`sidebar-container`}>
              <div id="sidebar-header"className="sidebar-header">
                <div className="user-info">
                  {/* {console.log('current', currentUserAvatar)} */}
                  {
                    (user && currentUserAvatar) ?
                      
                      (currentUserAvatar.photoURL ?
                        <Avatar src={currentUserAvatar.photoURL} /> :
                        <Avatar>{currentUserAvatar.firstLetter}</Avatar>) :
                      
                      <Avatar src={user.photoURL} />
                  }
                </div>
                <div className="username">{user.email}</div>
                <button id="more-menu-btn" className="more-menu-btn" onClick={handleClickMenu} >
                  <i className={`fas ${!showMenu ? "fa-chevron-circle-down" : "fa-chevron-circle-up"}`}></i>
                </button>
                <ul id="dropdown-menu-list" className={`header-menu-list ${showMenu && "show"}`} style={{
                  top: menuLocation.top,
                  right: menuLocation.right,
                }}>
                  <li>
                    <button onClick={toggleSearchInput}>
                      <i className="fas fa-search"></i> Search
                    </button>
                  </li>
                  <li className="new-chat-dropdown">
                    <button className="new-chat-btn" onClick={startNewChat}>
                      <i className="fas fa-plus"></i> New Chat
                    </button>
                  </li>
                  <li>
                    <button className="sign-out-btn" onClick={signOutz}>Sign Out</button>
                  </li>
                </ul>
              </div>
              <div className={`search-user-input-container  ${showSearchUserInput && 'show'}`}>
                <input id="search-user-input" className="search-user-input" placeholder="Search User" />
              </div>
              <div className="chat-buttons-container">
                {
                  chats.map((chat, i) => {
                    // console.log(chat);
                    const { id, recipientEmails } = chat;
                    const chatButtonProps = {
                      chatButtonID: id,
                      recipientEmails,
                      index: i
                    }
                    return <ChatButton key={id} {...chatButtonProps}  />
                  })
                }
              </div>
            </div>
          </div>
          <button className={`toggle-sidebar-btn`} style={{
            top: toggleSidebarBtnLocation.top,
            left: toggleSidebarBtnLocation.left
          }} onClick={toggleSidebar}>
            <i className={`fas fa-chevron-circle-${isSidebarOpen ? "left" : "right"}`}></i>
          </button>
        </>
      }
    </>
  );
}

export default Sidebar;