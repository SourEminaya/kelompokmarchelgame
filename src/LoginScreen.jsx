import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function LoginScreen({ onLogin, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      onLogin(res.user);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRegister() {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      onLogin(res.user);
    } catch (err) {
      alert(err.message);
    }
  }

  function handleOverlayClick(e) {
    if (e.target.classList.contains("login-overlay") && onClose) {
      onClose();
    }
  }

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-box" onClick={(e) => e.stopPropagation()}>
        <h2>Login / Register</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="login-btns">
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </div>
      </div>
    </div>
  );
}
