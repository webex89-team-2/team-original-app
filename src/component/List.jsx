import { useState } from "react";
import { Card } from "./Card";
import "../css/Trello.css";


export function List({ title, items }) {
  const [cards, setCards] = useState([
    { id: crypto.randomUUID(), text: "じゃがいも", number: 1, dead: 1 },
    { id: crypto.randomUUID(), text: "にんじん", number: 2, dead: 2 },
    { id: crypto.randomUUID(), text: "豚肉", number: 3, dead: 3 },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [inputNumber, setInputNumber] = useState("");
  const [inputDead, setInputDead] = useState("");

  // 追加ボタン
  const handleAddCard = () => {
    if (!inputValue) return;
    setCards([
      ...cards,
      {
        id: crypto.randomUUID(),
        text: inputValue,
        number: Number(inputNumber) || 1,
        dead: Number(inputDead) || 1,
      },
    ]);
    setInputValue("");
    setInputNumber("");
    setInputDead("");
  };

  // 削除ボタン
  const handleDeleteCard = (idToDelete) => {
    setCards(cards.filter((card) => card.id !== idToDelete));
  };

  return (
    <>
      <div className="list-header">
        <div className="list-title">{title}</div>
      </div>

      <div className="cards-container">
        {items.map((item) => (
          <Card
            key={crypto.randomUUID()}
            card={item}
            handleDeleteCard={handleDeleteCard}
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
          {/* 消費期限をdateに */}
          <input type="date" placeholder="消費期限（日）" required />
          <div className="input-button" onClick={handleAddCard}>
            追加
          </div>
        </div>
      </div>
    </>
  );
}
