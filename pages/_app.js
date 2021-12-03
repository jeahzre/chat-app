import '../styles/globals.css'
import '../styles/App.css'
import React, { useEffect, useState } from 'react';
import { auth } from '../Firebase';
import Script from 'next/script';
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getFirestore, serverTimestamp } from "firebase/firestore";
import Login from './Login';
import Loading from '../components/Loading';
import { AppProvider } from '../context';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  // console.log(auth.currentUser);
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Set the user info in db. 
        // doc(db, collection, document)
        setDoc(doc(getFirestore(), 'users', user.uid), {
          email: user.email,
          lastSeen: serverTimestamp(),
          photoURL: user.photoURL
        })
        setLoading(false);
      } else {
        setLoading(false);
        // User state (auth.current) user is still null.
      }
    })
  }, [auth.currentUser]);

  if (loading) {
    return <Loading />
  } else {
    if (auth.currentUser) {
      return (
        <>
          <AppProvider>
            <Component {...pageProps} />
            <Script src="https://kit.fontawesome.com/23cc219af3.js" />
          </AppProvider>
        </>
      )
    } else {
      return <Login setUser={setUser} />
    }
  }
}

export default MyApp
