import { useState } from "react";
import { Card } from "./Card";
import "../css/Trello1.css";


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
    if (!inputValue) return;
    const newItem = {
      id: crypto.randomUUID(),
      name: inputValue,
      amount: Number(inputNumber) || 1,
      expirationDate: Number(inputDead) || 1,
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
            onChange={(e) => setInputNumber(e.target.value)}
          />
          <input
            type="number"
            placeholder="消費期限（日）"
            className="input-todo"
            value={inputDead}
            onChange={(e) => setInputDead(e.target.value)}
          />
          <div className="input-button" onClick={onAddCard}>
            追加
          </div>
        </div>
      </div>
    </>
  );
}
