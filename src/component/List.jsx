import { useState } from "react";
import { Card } from "./Card";
import "../css/Trello.css";

export function List({
  title,
  items,
  listId,
  handleAddCard,
  handleDeleteCard,
  handleUpdateCard,
}) {
  const [inputValue, setInputValue] = useState("");
  const [inputNumber, setInputNumber] = useState("");
  const [inputDead, setInputDead] = useState("");

  // 追加ボタン;
  const onAddCard = () => {
    // 入力値が一つでも空であれば処理を中断
    if (!inputValue || !inputNumber || !inputDead) {
      return;
    }
    const newItem = {
      id: crypto.randomUUID(),
      name: inputValue,
      amount: Number(inputNumber),
      expirationDate: Number(inputDead),
    };

    // Mypage.jsxで渡された関数を呼び出す
    handleAddCard(listId, newItem);
    setInputValue("");
    setInputNumber("");
    setInputDead("");
  };

  //カード削除ボタン
  const onDeleteCard = (itemIdToDelete) => {
    handleDeleteCard(listId, itemIdToDelete);
  };

  // カード修正ボタン
  const onUpdateCard = (updatedItem) => {
    handleUpdateCard(listId, updatedItem);
  };

  return (
    <>
      <div className="list-header">
        <div className="list-title">{title}</div>
      </div>

      <div className="cards-container">
        {items.map((item) => (
          <Card
            key={item.id}
            card={item}
            onDeleteCard={onDeleteCard}
            onUpdateCard={onUpdateCard}
          />
        ))}
      </div>

      <div className="list-footer">
        <div className="input-container">
          <input
            type="text"
            placeholder="新しいfood"
            className="input-todo"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <input
            type="number"
            placeholder="個数"
            className="input-todo"
            value={inputNumber}
            onChange={(e) => {
              const value = Number(e.target.value);
              setInputNumber(value < 0 ? 0 : value); // ★ 0未満なら0に補正
            }}
          />
          <input
            type="date"
            placeholder="消費期限（日）"
            className="input-todo"
            value={inputDead}
            onChange={(e) => {
              const selectedDate = new Date(e.target.value); //入力した日付
              const today = new Date(); //今日の日付
              const diffDays = Math.ceil(
                (selectedDate - today) / (1000 * 60 * 60 * 24)
              );

              //setInputDead(diffDays < 0 ? 0 : diffDays); // マイナスは0に補正
              setInputDead(diffDays);
            }}
          />
          <button className="input-button" onClick={onAddCard}>
            追加
          </button>
        </div>
      </div>
    </>
  );
}
