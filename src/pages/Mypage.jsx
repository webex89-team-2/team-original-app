import React from "react";
import { Link } from "react-router-dom";
import { BrowserRouter } from "react-router";

import { Header } from "../component/Header";
import { List } from "../component/List";
import { useState } from "react";
// import { useEffect } from "react"
// import { addDoc, collection, getDocs } from "firebase/firestore"
// import { db } from "../firebase"

const Mypage = () => {
  const [lists, setLists] = useState([
    { id: crypto.randomUUID(), title: "冷蔵庫" },
    { id: crypto.randomUUID(), title: "冷凍庫" },
    { id: crypto.randomUUID(), title: "常温保管庫" },
  ]);

  const [newListTitle, setNewListTitle] = useState("");

  // リスト追加ボタン
  const handleAddList = () => {
    if (!newListTitle) return;
    setLists([...lists, { id: crypto.randomUUID(), title: newListTitle }]);
    setNewListTitle("");
  };

  // リスト削除ボタン
  const handleDeleteList = (idToDeleteList) => {
    setLists(lists.filter((list) => list.id !== idToDeleteList));
  };

  // const [lists, setLists] = useState([]) // 投稿を格納する変数

  // firebaseにデータを保存する関数
  // const addPost = async () {
  //   const docRef = await addDoc(collection(db, "lists"), {
  //     text: "",
  //   })

  //   const newLists = [
  //     ...lists,
  //     {id: docRef.id, text: ""},
  //   ]
  //   setLists(newLists)
  // }

  //     useEffect(() => {
  //         // データを取得する関数
  //         const getPosts = async () => {
  //             const res = await getDocs(collection(db, ";lists"))
  //             const data = res.docs.map((doc) => ({
  //                 id: doc.id,
  //                 ...doc.data(),
  //             }))
  //             setLists(data)
  //         }

  //         getPosts() // データ取得
  //     }, [])

  return (
    <>
      <Header />
      <div className="main-container">
        {lists.map((l) => (
          <div className="list-container" key={l.id}>
            <List title={l.title} />
            <button onClick={() => handleDeleteList(l.id)}>リスト削除</button>
          </div>
        ))}

        <input
          type="text"
          placeholder="新しいリスト"
          className="new-list"
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
        />
        <div className="input-button" onClick={handleAddList}>
          追加
        </div>
      </div>
    </>
  );
};

export default Mypage;
