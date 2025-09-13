import React from "react";
import {useState} from "react"
import{Link} from "react-router-dom";
import { createUserWithEmailAndPassword, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

export default function SignUp(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async(e) =>{
    e.preventDefault(); //ページのリロードを防ぐ

    //サインアップ
    try{
        await createUserWithEmailAndPassword(auth,email,password);
        alert("新規登録に成功しました")
        }catch(error){
            console.error(error.message);
        }
    };

    return(
        <div className = "sign-up-page">
            <h1>新規登録</h1>

            <div className = "sign-up-form">
                <form onSubmit = {handleSubmit}>
                    <div className = "form-group">
                    <label htmlFor = "email">メールアドレス</label>
                    <input
                    type = "email"
                    name = "email"
                    required
                    value = {email}
                    onChange = {(e) =>setEmail(e.target.value)}
                    />
                    </div>
                    <div className = "form-group">
                    <label htmlFor = "password">パスワード(6文字以上)</label>
                    <input
                    type = "password"
                    name = "password"
                    required
                    value = {password}
                    onChange = {(e) =>setPassword(e.target.value)}
                    />
                    </div>
                    <button type = "submit" className = "sign-up-button">
                        新規登録
                    </button>
                </form>
                <div>
                    <Link to = "/signin">ログインはこちら</Link>
                </div>
            </div>
        </div>
    );
}