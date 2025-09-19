import { useState } from "react";
import { Card } from "./Card";
import "../css/Trello.css";

// ★★★ 日付を "yyyy-MM-dd" 形式に変換するヘルパー関数 ★★★
const formatDateForInput = (date) => {
  const d = new Date(date);
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
};

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

  // ★★★ 期限日の初期値を、明日の日付文字列に設定 ★★★
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [inputDead, setInputDead] = useState(formatDateForInput(tomorrow));

  const onAddCard = () => {
    if (!inputValue || !inputNumber || !inputDead) {
      return;
    }
    const newItem = {
      name: inputValue,
      amount: Number(inputNumber),
      // ★★★ expirationDateに、数値ではなく日付文字列を渡す ★★★
      expirationDate: inputDead,
    };
    handleAddCard(listId, newItem);
    setInputValue("");
    setInputNumber("");
    const newTomorrow = new Date();
    newTomorrow.setDate(newTomorrow.getDate() + 1);
    setInputDead(formatDateForInput(newTomorrow));
  };

  const onDeleteCard = (itemIdToDelete) => {
    handleDeleteCard(listId, itemIdToDelete);
  };

  const onUpdateCard = (updatedItem) => {
    handleUpdateCard(listId, updatedItem);
  };

  return (
    <>
      <div className="list-header">{title}</div>
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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <input
            type="number"
            placeholder="個数"
            value={inputNumber}
            onChange={(e) =>
              setInputNumber(Number(e.target.value) < 0 ? 0 : e.target.value)
            }
          />
          <input
            type="date"
            value={inputDead}
            onChange={(e) => setInputDead(e.target.value)}
          />
          <button className="input-button" onClick={onAddCard}>
            追加
          </button>
        </div>
      </div>
    </>
  );
}
