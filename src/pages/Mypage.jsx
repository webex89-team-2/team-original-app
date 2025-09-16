import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../component/Header";
import { List } from "../component/List";
import "../css/Trello.css";
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
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Mypage = () => {
  const navigate = useNavigate();

  const [memos, setMemos] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [uid, setUid] = useState(null); // userIDの変数

  useEffect(() => {
    const auth = getAuth();
    // ユーザーのログイン状態を監視
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid); // ログインしていればuidを保存
      } else {
        navigate("/signin"); // 未ログインの場合はサインインページへ遷移
      }
    });
    return () => unSub(); // クリーンアップ（監視解除）
  }, [navigate]);

  useEffect(() => {
    if (!uid) return; // uidが取得できるまで実行しない

    // データを取得する関数
    const getFoodsAndLists = async () => {
      try {
        // 1. `lists`コレクションから保管場所のリストを取得
        const listsRes = await getDocs(collection(db, "lists"));
        const listsData = listsRes.docs.map((doc) => ({
          id: doc.id,
          storageLocation: doc.data().storageLocation,
          items: [],
        }));

        // 2. ログインユーザーの`foods`コレクションから食品アイテムを取得
        const foodsRes = await getDocs(collection(db, "users", uid, "foods"));
        const foodsData = foodsRes.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 3. 取得した食品アイテムを、対応するリストに割り当てる
        const combinedMemos = listsData.map((list) => {
          const itemsInList = foodsData.filter(
            (food) => food.location === list.storageLocation
          );
          const formattedItems = itemsInList.map((item) => ({
            ...item,
            expirationDate: Math.ceil(
              (new Date(item.expiresAt.toDate()) - new Date()) /
                (1000 * 60 * 60 * 24)
            ),
          }));
          return { ...list, items: formattedItems };
        });

        setMemos(combinedMemos);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    getFoodsAndLists();
  }, [uid]); // uidが変わるたびにデータを再取得

  // リスト追加ボタン（Firebase反映版）
  const handleAddList = async () => {
    if (!newListTitle) return;

    try {
      // 1. Firebaseの`lists`コレクションに新しいリストのドキュメントを追加
      const docRef = await addDoc(collection(db, "lists"), {
        storageLocation: newListTitle,
      });

      // 2. 新しいリスト用の空のアイテムをユーザーの`foods`コレクションにも追加
      await addDoc(collection(db, "users", uid, "foods"), {
        location: newListTitle,
        name: "",
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
            items: [],
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
    const result = window.confirm(
      "本当にこのリストを削除しますか？\n中の食材もすべて消えてしまいます！"
    );

    if (!result) {
      return;
    }

    try {
      // 1. 削除対象のリストのstorageLocation名を取得
      const listToDelete = memos.find((memo) => memo.id === idToDeleteList);
      if (!listToDelete) return;

      // 2. バッチ書き込みを開始
      const batch = writeBatch(db);

      // 3. リストのドキュメントを削除バッチに追加
      const listDocRef = doc(db, "lists", idToDeleteList);
      batch.delete(listDocRef);

      // 4. 削除対象のリストに紐づく食物アイテムを検索
      const q = query(
        collection(db, "users", uid, "foods"),
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
      const docRef = await addDoc(collection(db, "users", uid, "foods"), {
        location: memos.find((memo) => memo.id === listId).storageLocation,
        name: newItem.name,
        amount: newItem.amount,
        expiresAt: new Date(
          new Date().getTime() + newItem.expirationDate * 24 * 60 * 60 * 1000
        ),
        createdAt: new Date(),
      });

      // 2. 画面上のステートを更新
      setMemos((prevMemos) => {
        return prevMemos.map((list) => {
          if (list.id === listId) {
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
      await deleteDoc(doc(db, "users", uid, "foods", itemIdToDelete));

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
      const foodRef = doc(db, "users", uid, "foods", updatedItem.id);
      await updateDoc(foodRef, {
        name: updatedItem.name,
        amount: updatedItem.amount,
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
