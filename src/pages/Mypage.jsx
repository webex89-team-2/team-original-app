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
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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
      const newExpiresAt = new Date(
        new Date().getTime() + newItem.expirationDate * 24 * 60 * 60 * 1000
      );
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
              expiresAt: newExpiresAt,
            };
            const newItems = [...list.items, updatedItem];
            newItems.sort(
              (a, b) =>
                (a.expiresAt.toDate ? a.expiresAt.toDate() : a.expiresAt) -
                (b.expiresAt.toDate ? b.expiresAt.toDate() : b.expiresAt)
            );
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
      const newExpiresAt = new Date( // 新しい期限日を計算
        new Date().getTime() + updatedItem.expirationDate * 24 * 60 * 60 * 1000
      );

      // 1. Firebaseのドキュメントを更新
      const foodRef = doc(db, "users", uid, "foods", updatedItem.id);
      await updateDoc(foodRef, {
        name: updatedItem.name,
        amount: updatedItem.amount,
        expiresAt: newExpiresAt, // 計算した日付で更新
      });

      // 2. 画面上のステートを更新
      setMemos((prevMemos) => {
        return prevMemos.map((list) => {
          if (list.id === listId) {
            // ソートに必要な`expiresAt`をupdatedItemに追加した完全なオブジェクトを作成
            const itemWithFullDate = {
              ...updatedItem,
              expiresAt: newExpiresAt,
            };

            // 更新されたアイテムをリストに反映
            const newItems = list.items.map((item) =>
              item.id === itemWithFullDate.id ? itemWithFullDate : item
            );

            // すぐにソートを実行
            newItems.sort((a, b) => {
              // FirestoreのTimestamp型とDate型を両方扱えるようにする
              const dateA = a.expiresAt.toDate
                ? a.expiresAt.toDate()
                : a.expiresAt;
              const dateB = b.expiresAt.toDate
                ? b.expiresAt.toDate()
                : b.expiresAt;
              return dateA - dateB;
            });

            return {
              ...list,
              items: newItems,
            };
          }
          return list;
        });
      });
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

  return (
    <>
      <Header />
      <button onClick={() => navigate("/signin")}>ログアウト</button>

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
