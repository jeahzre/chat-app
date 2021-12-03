import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './Firebase';
import { useRouter } from 'next/router';

const AppContext = createContext(null)


function AppProvider(props) {
  const router = useRouter()
  const { children } = props;
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(auth.currentUser);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatTextWidth, setChatTextWidth] = useState(null);
  // Sidebar.js
  const [sidebarWidth, setSidebarWidth] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toggleSidebarBtnLocation, setToggleSidebarBtnLocation] = useState({ top: null, left: null });
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  // const [recData, setRecData] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  // console.log(props);
  // const messagesFromServer = props.messages;

  // Sidebar.js
  useEffect(() => {
    if (user) {
      // If we resize the window, including zooming. 
      const resizeSidebarWidth = () => {
        if (document.getElementById('sidebar-container')) {
          console.log('resize');
          const sidebarContainer = document.getElementById('sidebar-container');
          const sidebarWidth = sidebarContainer.getBoundingClientRect().width;
          setSidebarWidth(sidebarWidth);
        }
      }

      window.addEventListener('resize', () => {
        // setTimeout: avoid lagging due to event is triggered a lot. 
        setTimeout(() => resizeSidebarWidth(), 500);
      });

      const outerSidebarContainer = document.getElementById('outer-sidebar-container');
      const sidebarContainer = document.getElementById('sidebar-container');

      // Set Sidebar and ChatText width whenever we resize window.
      const outputSize = () => {
        const maxSidebarContainerWidth = getComputedStyle(sidebarContainer).maxWidth;
        const minSidebarContainerWidth = getComputedStyle(sidebarContainer).minWidth;
        // outerSidebarContainer's width is "min-content" which is dynamic. 
        const sidebarWidth = outerSidebarContainer.getBoundingClientRect().width;
        
        // console.log(sidebarWidth, maxSidebarContainerWidth)
        
        // If we use Number() to convert '(number)px', we will get NaN. If we use parseInt to convert the string, we will get the first number only.
        if (sidebarWidth < parseInt(maxSidebarContainerWidth) && sidebarWidth > parseInt(minSidebarContainerWidth)) {
          // To avoid performance issue. 
          // console.log('less than sidebar max width');
          setSidebarWidth(sidebarWidth);
          console.log(document.body.clientWidth, sidebarWidth)
        }
        setChatTextWidth(document.body.clientWidth - sidebarWidth);
      }
      if (outerSidebarContainer) {
        new ResizeObserver(outputSize).observe(outerSidebarContainer);
      }

      return () => {
        window.removeEventListener('resize', () => {
          setTimeout(() => resizeSidebarWidth(), 500);
        })
      }
    }
  }, [isSidebarOpen, sidebarWidth, router]);

  const chatTextContainerWidth = document.getElementById('chat-text-container')

  // Toggle button location. 
  useEffect(() => {
    // console.log('toggle btn location')
    if (user) {
      const outerSidebarContainer = document.getElementById('outer-sidebar-container');
      const sidebarContainer = document.getElementById('sidebar-container');
      const sidebarHeader = document.getElementById('sidebar-header');
      const outerSidebarWidth = outerSidebarContainer.getBoundingClientRect().width;
      const toggleBtnTop = sidebarHeader.getBoundingClientRect().height / 3;
      // console.log(outerSidebarWidth);
      setToggleSidebarBtnLocation({ top: toggleBtnTop, left: outerSidebarWidth });
      // Copy of set Sidebar and ChatText width. 
    
      // const outputsize = () => {
      //   const sidebarWidth = outerSidebarContainer.getBoundingClientRect().width;
      //   setSidebarWidth(sidebarWidth);
      //   setChatTextWidth(document.body.clientWidth - sidebarWidth);
      // }
      // new ResizeObserver(outputsize).observe(outerSidebarContainer);
    }
  }, [isSidebarOpen, sidebarWidth, router]);

  // Among users in chat, get the recipient user of chat we send to. 
  const getRecipientEmails = (users, currentUser, chatButtonID) => {
    console.log(users, currentUser)
    let chatWithRecipientEmails = { id: null, recipientEmails: [] };
    if (users && users.length && currentUser) {
      // console.log(users.length)
      users.map(user => {
        // If user in users array is not same as current user email. 
        // console.log(chatButtonID, user);
        if (user !== currentUser) {
          chatWithRecipientEmails = ({
            ...(chatButtonID && { id: chatButtonID }), recipientEmails: [
              ...chatWithRecipientEmails.recipientEmails, user
            ]
          })
        }
      })
    }
    console.log(!chatButtonID && chatWithRecipientEmails.recipientEmails);
    return chatWithRecipientEmails
  }

  // setRecData is provided from each component that use this function. Every component that use this function will have their own recData state. So recData isn't replaced by another component recData. 
  const getRecData = async (users, isRecipient, setRecipientAvatar, chatButtonID, setRecData) => {
    console.log('get rec data');
    // Check ChatText recData.
    // console.log(users, isRecipient && !chatButtonID && users)
    // getRecData used in Sidebar.js, ChatButton.js, and ChatText.js.
    let recipientEmailsWithoutID = {};
    // console.log("chat", chat)
    // console.log(users);
    if (users) {
      recipientEmailsWithoutID = getRecipientEmails(users, user.email, chatButtonID);
      // console.log(chatButtonID, users, recipientEmailsWithoutID)
      const firstLetter = recipientEmailsWithoutID?.recipientEmails[0]?.substr(0, 1).toUpperCase();
      let photoURL = '';
      // Get user's photoURL from "users" collection. 
      if (isRecipient) {
        let recData = []
        recipientEmailsWithoutID.recipientEmails.map(async recEmail => {
          // console.log(recEmail)
          const usersQuery = query(collection(db, 'users'), where('email', '==', recEmail));
          console.log('getting user data')
          const usersQuerySnapshot = await getDocs(usersQuery);
          usersQuerySnapshot.docs.map(async (userQuerySnapshot, i) => {
            // console.log(userQuerySnapshot.data(), i)
            photoURL = (userQuerySnapshot.data().photoURL)
            recData.push(userQuerySnapshot.data());
          });
          // console.log('recData', recData, photoURL)
          // If awaiting just done, we set the photoURL again after we have set it below. 
          if (!setRecipientAvatar) {
            if (photoURL) {
              setCurrentUserAvatar({ photoURL });
            } else {
              setCurrentUserAvatar({ firstLetter });
            }
          } else {
            if (photoURL) {
              setRecipientAvatar({ photoURL })
            } else {
              setRecipientAvatar({ firstLetter })
            }
          }
          setRecData(recData[0]);
        })
      } else if (!isRecipient) {
        let currentUserData = [];
        const usersQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const usersQuerySnapshot = await getDocs(usersQuery);
        usersQuerySnapshot.docs.map(async (userQuerySnapshot, i) => {
          // console.log(userQuerySnapshot.data(), i)
          photoURL = (userQuerySnapshot.data().photoURL)
          currentUserData.push(userQuerySnapshot.data());
        });
        // console.log(isRecipient, photoURL)
        // If awaiting just done, we set the photoURL again after we have set it below. 
        if (!setRecipientAvatar) {
          if (photoURL) {
            setCurrentUserAvatar({ photoURL });
          } else {

          }
        } else {
          setRecipientAvatar({ photoURL })
        }
        setCurrentUserData(currentUserData[0]);
      }

      // console.log(recipientEmailsWithoutID)

      // console.log('photoURL', chatButtonID,  photoURL)
      // console.log(recipientEmailsWithoutID)
      if (!setRecipientAvatar) {
        if (photoURL) {
          setCurrentUserAvatar({ photoURL });
        } else {
          // Return the first letter of user's email.
          setCurrentUserAvatar({ firstLetter });
        }
      } else {
        if (photoURL) {
          setRecipientAvatar({ photoURL })
        } else {
          console.log("rec does not has photoURL", firstLetter);
          setRecipientAvatar({firstLetter})
        }
      }
    }
  }

  const formatLastSeen = (lastSeenObj) => {
    const nowEpoch = new Date().getTime();
    const lastSeenEpoch = lastSeenObj.toDate().getTime(); // ms
    // const oneMinuteMS = 60 * 1000;
    const oneHourMS = 60 * 60 * 1000;
    const oneDayMS = 24 * oneHourMS; //ms
    // console.log(lastSeenObj.toDate().toLocaleString())
    const agoMS = nowEpoch - lastSeenEpoch;
    // const hoursAgo = Math.floor(agoMS / oneHourMS);
    // const minutesAgo = Math.floor(((agoMS % oneHourMS)/1000/60)); // /60 to minute, /1000 to s
    // Get the remaining ms of divided to hour operation and convert it to s and divide it to minute. 
    // const secondsAgo = Math.floor(((agoMS / 1000) % 60)) // Convert to seconds and get the remaining seconds of divided to minute operation. 
    // console.log(hoursAgo, minutesAgo, secondsAgo, lastSeenEpoch);
    if (agoMS <= oneDayMS) {
      // If last seen is less than one day ago. 
      return lastSeenObj.toDate().toLocaleTimeString();
    } else if (agoMS > oneDayMS) {
      // If last seen is more than one hour ago. 
      const lastSeen = lastSeenObj.toDate().toLocaleString();
      return lastSeen;
    }
  }

  // if (recData) {
  //   formatLastSeen(recData.lastSeen);
  // }
  // console.log('chat', chat, 'msgs', messages);

  const value = {
    user,
    setUser,
    getRecipientEmails,
    sidebarWidth,
    chatTextWidth,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebarBtnLocation,
    messages,
    setMessages,
    chat,
    setChat,
    currentUserAvatar,
    getRecData,
    users,
    setUsers,
    formatLastSeen
  }
  return (
    <AppContext.Provider value={value} >
      {children}
    </AppContext.Provider>
  );
}

const useGlobalContext = () => {
  return useContext(AppContext)
}

export { AppContext , AppProvider, useGlobalContext };