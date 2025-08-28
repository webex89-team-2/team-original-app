import { useState } from "react";
import{ Link, useNavigate } from "react-router-dom";
import{auth} from "../firebase";
import{
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();//ナビゲート関数の定義

  const handleGoogleSignIn = async()=> {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider)
    alert("Googleログインに成功しました");
    navigate("/mypage");
  }

  // ログインボタンをクリックしたときの処理
  const handleSubmit = async (e) => {
    e.preventDefault(); // デフォルトの動作を防止

    // ログイン処理
    try{
    await signInWithEmailAndPassword(auth, email, password);
    alert("ログインしました");
    navigate("/mypage");
    }catch(error)
      {
        alert(error.message)
    };
  }

  return (
    <div className="sign-in-page">
      <h1>ログイン</h1>

      <div className="sign-in-form">
        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {/* パスワード */}
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="sign-in-button">
            ログイン
          </button>
        </form>
        <button onClick = {handleGoogleSignIn} className="google-button">Googleでログイン</button>
        <div>
        <Link to = "/signup">新規登録はこちら</Link>
        </div>
      </div>
    </div>
  );
}