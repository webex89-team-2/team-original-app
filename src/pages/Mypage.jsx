import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrowserRouter } from "react-router";
import { Header } from "../component/Header";
import { List } from "../component/List";
import "../css/Trello.css"
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const Mypage = () => {
  const navigate = useNavigate();

  // 以下、データベース関連

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
          const { id, location, name, amount, expiresAt } = food;

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
              id: crypto.randomUUID(),
              storageLocation: location,
              items: [],
            };
            acc.push(storageGroup);
          }

          // 項目を追加
          storageGroup.items.push({
            id,
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

  // memosのデータ形は次のようになっている
  // const [memos, setMemos] = useState ([
  //   {
  //     id: "refrigerator",
  //     storageLocation: "冷蔵庫",
  //     items: [
  //       {
  //         id: firebaseのid
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

  const [newListTitle, setNewListTitle] = useState("");

  // リスト追加ボタン（Firebase反映版）
  const handleAddList = async () => {
    if (!newListTitle) return;

    try {
      // 1. Firebaseに新しいリストのドキュメントを追加 (仮のアイテムを追加)
      // リスト自体はコレクションではないので、リストの情報をフィールドとして持つダミーのドキュメントを作成
      // リストに紐づくアイテムは location フィールドで識別するため、ここでは何も追加しない
      const docRef = await addDoc(collection(db, "lists"), {
        storageLocation: newListTitle,
      });

      // 2. 新しいリスト用の空のアイテムを`user1`コレクションにも追加
      await addDoc(collection(db, "user1"), {
        location: newListTitle,
        name: "", // 空のアイテムとして追加
        amount: 0,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      // 3. 画面上のステートを更新
      setMemos((prevMemos) => {
        return [
          ...prevMemos,
          {
            id: docRef.id,
            storageLocation: newListTitle,
            items: [], // 空のアイテムを追加
          },
        ];
      });

      setNewListTitle("");
    } catch (e) {
      console.error("Error adding list: ", e);
    }
  };

  // リスト削除ボタン（Firebase反映版）
  const handleDeleteList = async (idToDeleteList) => {
    try {
      // 1. 削除対象のリストのstorageLocation名を取得
      const listToDelete = memos.find((memo) => memo.id === idToDeleteList);
      // リストが見つからない場合は処理を中断
      if (!listToDelete) return;

      // 2. バッチ書き込みを開始
      const batch = writeBatch(db);

      // 3. リストのドキュメントを削除バッチに追加
      const listDocRef = doc(db, "lists", idToDeleteList);
      batch.delete(listDocRef);

      // 4. 削除対象のリストに紐づく食物アイテムを検索
      // リスト名を動的に指定するように修正
      const q = query(
        collection(db, "user1"),
        where("location", "==", listToDelete.storageLocation)
      );
      const querySnapshot = await getDocs(q);

      // 5. 検索でヒットしたすべてのアイテムを削除バッチに追加
      querySnapshot.forEach((document) => {
        batch.delete(document.ref);
      });

      // 6. バッチをコミットして、すべての操作を一括実行
      await batch.commit();

      // 7. 画面上のステートを更新
      setMemos((prevMemos) => {
        return prevMemos.filter((memo) => memo.id !== idToDeleteList);
      });
    } catch (e) {
      console.error("リストとアイテムの削除中にエラーが発生しました:", e);
    }
  };
  // カード追加ボタン（Firebase反映版）
  const handleAddCard = async (listId, newItem) => {
    try {
      // 1. Firebaseに新たなドキュメントを追加
      // listIdはどのlocationに追加するかを識別するために使用
      const docRef = await addDoc(collection(db, "user1"), {
        location: memos.find((memo) => memo.id === listId).storageLocation,
        name: newItem.name,
        amount: newItem.amount,
        // Firebase Timestamp形式に戻す必要がある
        expiresAt: new Date(
          new Date().getTime() + newItem.expirationDate * 24 * 60 * 60 * 1000
        ),
        createdAt: new Date(),
      });
      // 2. memos ステートを更新する
      setMemos((prevMemos) => {
        return prevMemos.map((list) => {
          if (list.id === listId) {
            // Firebaseから割り当てられた新しいIDを追加
            const updatedItem = { ...newItem, id: docRef.id };
            return {
              ...list,
              items: [...list.items, updatedItem],
            };
          }
          return list;
        });
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // カード削除ボタン（Firebase反映版）
  const handleDeleteCard = async (listId, itemIdToDelete) => {
    try {
      // 1. Firebaseのドキュメントを削除
      await deleteDoc(doc(db, "user1", itemIdToDelete));

      // 2. 画面上のステートを更新
      setMemos((prevMemos) => {
        return prevMemos.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              items: list.items.filter((item) => item.id !== itemIdToDelete),
            };
          }
          return list;
        });
      });
    } catch (e) {
      console.error("Error removing document: ", e);
    }
  };

  // カード修正ボタン（Firebase反映版）
  const handleUpdateCard = async (listId, updatedItem) => {
    try {
      // 1. Firebaseのドキュメントを更新
      const foodRef = doc(db, "user1", updatedItem.id);
      await updateDoc(foodRef, {
        name: updatedItem.name,
        amount: updatedItem.amount,
        // Firebase Timestamp形式に戻す
        expiresAt: new Date(
          new Date().getTime() +
            updatedItem.expirationDate * 24 * 60 * 60 * 1000
        ),
      });

      // 2. 画面上のステートを更新
      setMemos((prevMemos) => {
        return prevMemos.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              items: list.items.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              ),
            };
          }
          return list;
        });
      });
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  return (
    <>
      <Header />
      <button onClick={() => navigate("/signin")}>ログアウト</button>
      <div className="main-container">
        {memos.map((l) => (
          <div className="list-container" key={l.id}>
            <List
              title={l.storageLocation}
              items={l.items}
              listId={l.id}
              handleAddCard={handleAddCard}
              handleDeleteCard={handleDeleteCard}
              handleUpdateCard={handleUpdateCard}
            />
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
