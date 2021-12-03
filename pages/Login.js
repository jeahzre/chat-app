import { Button } from '@mui/material';
import Head from 'next/head';
import React from 'react';
import { signInWithPopup, setPersistence, browserLocalPersistence  } from "firebase/auth";
import {auth, provider} from '../Firebase'

function Login({setUser}) {

  const signIn = () => {
    
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        alert('Your login information is saved until you log out. Click OK to continue.');
        return signInWithPopup(auth, provider)
          .then((result) => {
            // console.log('result', result.user);
            alert('Login successful.');
            setUser(result.user);
          })
          .catch(err => alert('Something went wrong.'));
      })
  }

  return (
    <div className="outer-login-container">
      <Head>
        <title>Login</title>
      </Head>

      <div className="login-container">
        <Button variant="contained" className="sign-in-btn" onClick={signIn}>Sign In With Google</Button>
      </div>
    </div>
  );
}

export default Login;