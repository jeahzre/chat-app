import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar';
import { auth } from '../Firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getFirestore, serverTimestamp } from "firebase/firestore";

function Home() {
  const [user, setUser] = useState(auth.currentUser);

  // Check if current user has signed in. 
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // To determine showing login page or no. 
        setUser(user);
        // Set the user info in db. 
        // doc(db, collection, document)
        setDoc(doc(getFirestore(), 'users', user.uid), {
          email: user.email,
          lastSeen: serverTimestamp(),
          photoURL: user.photoURL
        })
      }
    })
  }, [user])

  if (user) {
    return (
      <>
        <Head>
          <title>Chat App</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div>
          <Sidebar setUser={setUser} user={user} />
        </div>
      </>
    )
  }
}

// export async function getServerSideProps(context) {


//   return {
//     props: {
      
//     }
//   }
// }

export default Home;