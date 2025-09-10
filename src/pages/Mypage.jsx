import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrowserRouter } from "react-router";
import { Header } from "../component/Header";
import { List } from "../component/List";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Mypage = () => {
  const navigate = useNavigate();

  // 以下、データベース関連

  //firebaseにデータを保存する関数
  // const addPost = async () => {
  //   const docRef = await addDoc(collection(db, "posts"), {
  //     text: "",
  //   })

  //   const newPosts = [
  //     ...posts,
  //     {id: docRef.id, text: ""},
  //   ]
  //   setPosts(newPosts)
  // }

  const [memos, setMemos] = useState([]);

  useEffect(() => {
    // データを取得する関数
    const getFoods = async () => {
      try {
        const res = await getDocs(collection(db, "user1"));
        const data = res.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Firebaseから取得したデータをmemosの形式に変換
        const newMemos = data.reduce((acc, food) => {
          const { location, name, amount, expiresAt } = food;

          // 変換された日付を計算
          const expirationDate = Math.ceil(
            (new Date(expiresAt.toDate()) - new Date()) / (1000 * 60 * 60 * 24)
          );

          // 既存の保管場所を探す
          let storageGroup = acc.find(
            (memo) => memo.storageLocation === location
          );

          // 存在しない場合は新しいグループを作成
          if (!storageGroup) {
            storageGroup = {
              id: location, // locationをidとして使用
              storageLocation: location,
              items: [],
            };
            acc.push(storageGroup);
          }

          // 項目を追加
          storageGroup.items.push({
            name,
            amount,
            expirationDate,
          });

          return acc;
        }, []);

        setMemos(newMemos);
      } catch (error) {
        console.error("Error fetching documents: ", error);
      }
    };

    getFoods();
  }, []); // 依存配列は空のまま

  // const [memos, setMemos] = useState ([
  //   {
  //     id: "refrigerator",
  //     storageLocation: "冷蔵庫",
  //     items: [
  //       {
  //         name: "じゃがいも",
  //         amount: 1,
  //         expirationDate: 2
  //       },
  //       {
  //         name: "にんじん",
  //         amount: 2,
  //         expirationDate: 2
  //       },
  //       {
  //         name: "豚肉",
  //         amount: 3,
  //         expirationDate: 3
  //       }
  //     ]
  //   },
  // ])

  // const [newListTitle, setNewListTitle] = useState("")

  // // リスト追加ボタン
  // const handleAddList = () => {
  //   if(!newListTitle) return
  //   setLists([...lists, {id: crypto.randomUUID(), title: newListTitle}])
  //   setNewListTitle("")
  // }

  // // リスト削除ボタン
  // const handleDeleteList = (idToDeleteList) => {
  //   setLists(lists.filter((list) => list.id !== idToDeleteList))
  // }

  return (
    <>
      <Header />
      <button onClick={() => navigate("/signin")}>ログアウト</button>
      <div className="main-container">
        {memos.map((l) => (
          <div className="list-container" key={l.id}>
            <List title={l.storageLocation} items={l.items} />
            {/* <button onClick={() => handleDeleteList(l.id)}>リスト削除</button> */}
            <button>リスト削除</button>
          </div>
        ))}

        <input
          type="text"
          placeholder="新しいリスト"
          className="new-list"
          // value = {newListTitle}
          // onChange = {(e) => setNewListTitle(e.target.value)}
        />
        {/* <div className = "input-button" onClick = {handleAddList}>追加</div> */}
        <div className="input-button">追加</div>
      </div>
    </>
  );
};

export default Mypage;
