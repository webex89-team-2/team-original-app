import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrowserRouter } from "react-router";
import { Header } from "../component/Header";
import { List } from "../component/List";
import "../css/Trello.css"
import { useState, useEffect } from "react";
// import { collection, getDocs } from "firebase/firestore";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
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

  //firebase用の配列
  const [form, setForm] = useState({
    name: "",
    amount: "",
    location: "常温保管庫", // 初期値はお好みで
    expiresAt: "", // yyyy-mm-dd（<input type="date">）
  });
  //入力の認識
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddFood = async (e) => {
    e.preventDefault();

    // 1) 値を取り出し & かんたんバリデーション
    const name = form.name.trim();
    const location = form.location.trim();
    const amountNum = Number(form.amount);
    const dateStr = form.expiresAt; // "YYYY-MM-DD"（<input type="date"> の値）

    if (!name) {
      alert("食材名を入力してください");
      return;
    }
    if (!location) {
      alert("保管場所を選択してください");
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert("個数は1以上で入力してください");
      return;
    }
    if (!dateStr) {
      alert("消費期限日を選択してください");
      return;
    }

    // 2) 期限日を JS Date に変換 → Firestore Timestamp へ
    //    ※ その日の 00:00 扱い。23:59:59 にしたいなら `${dateStr}T23:59:59`
    const expiresDate = new Date(dateStr);

    // 3) Firestore に追加
    //    フィールド：name, amount, location, expiresAt(Timestamp), createdAt(serverTimestamp)
    try {
      await addDoc(collection(db, "user1"), {
        name,
        amount: amountNum,
        location,
        expiresAt: Timestamp.fromDate(expiresDate),
        createdAt: serverTimestamp(),
      });

      alert("登録しました！");

      // 4) 入力欄クリア
      setForm({
        name: "",
        amount: "",
        location: "常温保管庫",
        expiresAt: "",
      });

      // （最小構成のため、ここでは一覧の再取得は行いません）
    } catch (err) {
      console.error("Error adding document: ", err);
      alert("登録に失敗しました。コンソールを確認してください。");
    }
  };

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
        {/* <div className="input-button">追加</div> */}
        {/* ここから変更 */}
        <form onSubmit={handleAddFood}>
          <h3>食材追加（仮）</h3>
          <div>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="例：食パン"
              required
            />
          </div>

          <div>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="1"
              placeholder="個数"
              required
            />
          </div>

          <div>
            <h4>オプションは今は選択肢をいじれないです</h4>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
            >
              <option value="常温保管庫">常温保管庫</option>
              <option value="冷蔵庫">冷蔵庫</option>
              <option value="冷凍庫">冷凍庫</option>
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>消費期限日：</label>
            <input
              type="date"
              name="expiresAt"
              value={form.expiresAt}
              onChange={handleChange}
              required
            />
          </div>
          <h4>登録ボタンでFirestoreに登録される</h4>
          <button type="submit">登録</button>
        </form>
      </div>
    </>
  );
};

export default Mypage;
