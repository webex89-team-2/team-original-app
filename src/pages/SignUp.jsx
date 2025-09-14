import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("新規登録に成功しました");
      navigate("/mypage");
    } catch (error) {
      alert(error.message);
    }
  };

  // Googleサインアップ（ログインと同じ）
  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Googleで新規登録しました");
      navigate("/mypage");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 relative p-6">
      {/* 背景装飾 */}
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-300 rounded-full opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full opacity-15"></div>

      {/* サインアップフォーム */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 relative z-10">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-700">
          新規登録
        </h1>
        <p className="text-center text-sm text-blue-600 mb-6">
          消費期限を簡単に管理して、食品ロスを防ぎましょう
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-blue-800 mb-1"
            >
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-blue-800 mb-1"
            >
              パスワード(6文字以上)
            </label>
            <input
              type="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            新規登録
          </button>
        </form>

        <button
          onClick={handleGoogleSignUp}
          className="w-full mt-4 bg-blue-500 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-600 transition"
        >
          Googleで登録
        </button>

        <div className="text-center mt-6">
          <Link to="/signin" className="text-blue-700 hover:underline text-sm">
            ログインはこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
