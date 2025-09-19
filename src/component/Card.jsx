import { useState } from "react";
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

export function Card({ card, onDeleteCard, onUpdateCard }) {
  // ★★★ `card.expiresAt` (Dateオブジェクト) から「あと何日か」を計算する ★★★
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const diffTime = card.expiresAt.getTime() - todayStart.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let cardClass = "card";
  if (daysRemaining <= 0) cardClass += " glay";
  else if (daysRemaining <= 1) cardClass += " red";
  else if (daysRemaining <= 3) cardClass += " yellow";

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(card.name);
  const [editedAmount, setEditedAmount] = useState(card.amount);
  const [editedDeadline, setEditedDeadline] = useState(
    formatDateForInput(card.expiresAt)
  );

  const handleSave = () => {
    const updatedCard = {
      ...card,
      name: editedName,
      amount: Number(editedAmount),
      // ★★★ expirationDateに日付文字列を渡す ★★★
      expirationDate: editedDeadline,
    };
    onUpdateCard(updatedCard);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(card.name);
    setEditedAmount(card.amount);
    setEditedDeadline(formatDateForInput(card.expiresAt));
  };

  return (
    <div className={cardClass}>
      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
          <input
            type="number"
            value={editedAmount}
            onChange={(e) => setEditedAmount(e.target.value)}
          />
          {/* ★★★ 期限の入力欄を `<input type="date">` に変更 ★★★ */}
          <input
            type="date"
            value={editedDeadline}
            onChange={(e) => setEditedDeadline(e.target.value)}
          />
          <button onClick={handleSave}>修正保存</button>
          <button onClick={handleCancel}>キャンセル</button>
        </div>
      ) : (
        <>
          <div className="text">{card.name}</div>
          <div className="number">個数：{card.amount}個</div>
          {/* ★★★ 表示も計算した `daysRemaining` を使う ★★★ */}
          <div className="deadline">
            {daysRemaining > 0
              ? `消費期限：あと${daysRemaining}日`
              : daysRemaining === 0
              ? "消費期限：本日まで"
              : `消費期限切れ！${Math.abs(daysRemaining)}日経過`}
          </div>
            {/* <button onClick={() => setIsEditing(true)}>修正</button>
            <div className="delete" onClick={() => onDeleteCard(card.id)}>
              削除
            </div> */}
        </>
      )}
    </div>
  );
}
