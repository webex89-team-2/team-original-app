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
  getDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const Mypage = () => {
  const navigate = useNavigate();
  const [memos, setMemos] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [uid, setUid] = useState(null); // userIDの変数
  const [settings, setSettings] = useState({
    enabled: false,
    itemThreshold: 3,
    daysBefore: 3,
    notificationTime: "09:00",
  }); // 通知設定管理State

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

  // ユーザの通知設定を読み込む
  useEffect(() => {
    if (!uid) return;
    const fetchSettings = async () => {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().notificationSettings) {
        setSettings(docSnap.data().notificationSettings);
      }
    };
    fetchSettings();
  }, [uid]);

  // データを取得する関数
  useEffect(() => {
    if (!uid) return; // uidが取得できるまで実行しない
    const getFoodsAndLists = async () => {
      try {
        // ユーザーのリストコレクションへの参照
        const listsCollectionRef = collection(db, "users", uid, "lists");
        const querySnapshot = await getDocs(listsCollectionRef);

        // もしリストがなければ、初期リストを個別に作成する
        if (querySnapshot.size === 0) {
          console.log("初期リストを作成します...");
          const batch = writeBatch(db);

          batch.set(doc(listsCollectionRef), {
            storageLocation: "冷蔵庫",
            order: 0,
          });
          batch.set(doc(listsCollectionRef), {
            storageLocation: "冷凍庫",
            order: 1,
          });
          batch.set(doc(listsCollectionRef), {
            storageLocation: "棚",
            order: 2,
          });

          await batch.commit();
          console.log("初期リストの作成が完了しました。");
        }

        // 1. `lists`コレクションを`order`フィールドで並び替えて取得
        const q = query(listsCollectionRef, orderBy("order"));
        const listsRes = await getDocs(q);
        const listsData = listsRes.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          items: [],
        }));

        // 2. `foods`コレクションから食品アイテムを取得
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
          itemsInList.sort(
            (a, b) => a.expiresAt.toDate() - b.expiresAt.toDate()
          );

          const formattedItems = itemsInList.map((item) => ({
            ...item,
            expiresAt: item.expiresAt.toDate(),
          }));

          return { ...list, items: formattedItems };
        });
        setMemos(combinedMemos);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };
    getFoodsAndLists();
  }, [uid]);
  // uidが変わるたびにデータを再取得

  // リスト追加ボタン（Firebase反映版）
  const handleAddList = async () => {
    if (!newListTitle) return;

    try {
      // 1. Firebaseの`lists`コレクションに新しいリストのドキュメントを追加
      const docRef = await addDoc(collection(db, "users", uid, "lists"), {
        storageLocation: newListTitle,
        order: memos.length,
      });
      // 2. 画面上のステートを更新
      setMemos((prevMemos) => {
        return [
          ...prevMemos,
          {
            id: docRef.id,
            storageLocation: newListTitle,
            order: memos.length,
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
    // 元の機能：削除確認
    const result = window.confirm(
      "本当にこのリストを削除しますか？\n中の食材もすべて消えてしまいます!"
    );

    if (!result) {
      return;
    }

    try {
      // --- ステップ1: 削除処理（元の機能） ---
      const listToDelete = memos.find((memo) => memo.id === idToDeleteList);
      if (!listToDelete) return;

      const deleteBatch = writeBatch(db);

      const listDocRef = doc(db, "users", uid, "lists", idToDeleteList);
      deleteBatch.delete(listDocRef);

      const q = query(
        collection(db, "users", uid, "foods"),
        where("location", "==", listToDelete.storageLocation)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((document) => {
        deleteBatch.delete(document.ref);
      });

      await deleteBatch.commit(); // ここで削除を確定

      // --- ステップ2: orderの再採番（追加機能） ---
      // 画面表示用のStateから、削除されたものを除いた新しいリスト配列を作成
      const remainingLists = memos.filter((memo) => memo.id !== idToDeleteList);

      // 再採番用の新しいバッチを作成
      const reorderBatch = writeBatch(db);
      remainingLists.forEach((list, index) => {
        const listRef = doc(db, "users", uid, "lists", list.id);
        // 新しいインデックスをorderとして更新
        reorderBatch.update(listRef, { order: index });
      });

      await reorderBatch.commit(); // 再採番を確定

      // --- ステップ3: 画面表示の更新 ---
      // 7. 画面上のステートを更新（元の機能）
      // フィルターしただけだとState内のorderが古いため、mapで更新する
      const updatedMemos = remainingLists.map((list, index) => ({
        ...list,
        order: index,
      }));
      setMemos(updatedMemos);
    } catch (e) {
      console.error("リストの削除と再採番中にエラーが発生しました:", e);
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

  // カード追加ボタン（Firebase反映版）
  const handleAddCard = async (listId, newItem) => {
    try {
      const newExpiresAt = Timestamp.fromDate(new Date(newItem.expirationDate));
      const docRef = await addDoc(collection(db, "users", uid, "foods"), {
        location: memos.find((memo) => memo.id === listId).storageLocation,
        name: newItem.name,
        amount: newItem.amount,
        expiresAt: newExpiresAt,
        createdAt: new Date(),
      });
      setMemos((prevMemos) =>
        prevMemos.map((list) => {
          if (list.id === listId) {
            const updatedItem = {
              ...newItem,
              id: docRef.id,
              expiresAt: newExpiresAt.toDate(),
            };
            const newItems = [...list.items, updatedItem];
            newItems.sort((a, b) => a.expiresAt - b.expiresAt);
            return { ...list, items: newItems };
          }
          return list;
        })
      );
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // カード修正ボタン（Firebase反映版）
  const handleUpdateCard = async (listId, updatedItem) => {
    try {
      const newExpiresAt = Timestamp.fromDate(
        new Date(updatedItem.expirationDate)
      );
      const foodRef = doc(db, "users", uid, "foods", updatedItem.id);
      await updateDoc(foodRef, {
        name: updatedItem.name,
        amount: updatedItem.amount,
        expiresAt: newExpiresAt,
      });
      setMemos((prevMemos) =>
        prevMemos.map((list) => {
          if (list.id === listId) {
            const itemWithFullDate = {
              ...updatedItem,
              expiresAt: newExpiresAt.toDate(),
            };
            const newItems = list.items.map((item) =>
              item.id === itemWithFullDate.id ? itemWithFullDate : item
            );
            newItems.sort((a, b) => a.expiresAt - b.expiresAt);
            return { ...list, items: newItems };
          }
          return list;
        })
      );
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  // ドラッグ&ドロップ処理
  const handleDragEnd = async (result) => {
    const { source, destination } = result;

    // ドロップ先がない場合や、同じ場所に戻した場合は何もしない
    if (!destination || source.index === destination.index) {
      return;
    }

    // 1. まず画面上の表示を即座に入れ替える
    const newMemos = Array.from(memos);
    const [reorderedItem] = newMemos.splice(source.index, 1); // ドラッグしたアイテムを一度取り出す
    newMemos.splice(destination.index, 0, reorderedItem); // 新しい場所に挿入する

    setMemos(newMemos); // Stateを更新して画面に反映

    // 2. 次にFirestoreの`order`フィールドを更新して、並び順を永続化する
    const batch = writeBatch(db);
    newMemos.forEach((list, index) => {
      const listRef = doc(db, "users", uid, "lists", list.id);
      batch.update(listRef, { order: index }); // 配列の新しい順番を`order`として書き込む
    });

    await batch.commit(); // Firestoreへの一括更新を実行
  };

  // 通知設定保存関数
  const handleSaveSettings = async () => {
    if (!uid) return;
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(
        userDocRef,
        { notificationSettings: settings },
        { merge: true }
      );
      alert("設定を保存しました！");
    } catch (error) {
      console.error("設定の保存に失敗しました:", error);
      alert("設定の保存に失敗しました。");
    }
  };

  // 通知設定入力反映関数
  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : type === "time" ? value : Number(value),
    }));
  };

  // テストメール関数
  const handleSendTestEmail = async () => {
    const functions = getFunctions();
    const sendTestEmail = httpsCallable(functions, "sendTestEmail");
    try {
      await sendTestEmail();
      alert(
        "テストメールの送信をリクエストしました。受信トレイを確認してください。"
      );
    } catch (error) {
      console.error("関数の呼び出しに失敗しました:", error);
      alert(
        "テストメールの送信に失敗しました。コンソールでエラーを確認してください。"
      );
    }
  };

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "10px",
        }}
      >
        <div style={{ padding: "0 10px" }}>
          <button onClick={handleSendTestEmail}>テストメールを送信</button>
        </div>
        <div
          className="settings-container"
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>通知設定</h2>
          <div>
            <label>
              <input
                type="checkbox"
                name="enabled"
                checked={settings.enabled}
                onChange={handleSettingChange}
              />{" "}
              通知メールを有効にする
            </label>
          </div>
          <div>
            <label>
              <input
                type="number"
                name="itemThreshold"
                value={settings.itemThreshold}
                onChange={handleSettingChange}
                min="1"
              />{" "}
              個以上の食品が同日に期限切れになる場合
            </label>
          </div>
          <div>
            <label>
              <input
                type="number"
                name="daysBefore"
                value={settings.daysBefore}
                onChange={handleSettingChange}
                min="1"
              />{" "}
              日前に通知する
            </label>
          </div>
          <div>
            <label>
              通知時間：
              <input
                type="time"
                name="notificationTime"
                value={settings.notificationTime}
                onChange={handleSettingChange}
              />
            </label>
          </div>
          <button onClick={handleSaveSettings}>設定を保存</button>
        </div>
      </div>
      {/* このdivが、リストエリアと追加フォームを横に並べる親コンテナ */}
      <div className="main-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal">
            {(provided) => (
              // このdivはドラッグ可能なリストだけを囲むエリア
              <div
                className="lists-droppable-area" // 新しいクラス名
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {memos.map((list, index) => (
                  <Draggable key={list.id} draggableId={list.id} index={index}>
                    {(provided) => (
                      // Draggableな要素のラッパー
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div className="list-container">
                          <List
                            title={list.storageLocation}
                            items={list.items}
                            listId={list.id}
                            handleAddCard={handleAddCard}
                            handleDeleteCard={handleDeleteCard}
                            handleUpdateCard={handleUpdateCard}
                          />
                          <button onClick={() => handleDeleteList(list.id)}>
                            リスト削除
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* フォームはDroppableの外、main-containerの直接の子として配置 */}
        <div className="add-list-form-container">
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
      </div>
    </>
  );
};

export default Mypage;
