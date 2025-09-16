
import { useState } from "react"; // useStateを追加
import "../css/Trello.css";

export function Card({ card, onDeleteCard, onUpdateCard }) {
  
  //消費期限による色の変化
  let cardClass = "card"
  if(card.expirationDate <= -1){ // もし消費期限が0日以内ならば
    cardClass += " glay" // cardClassにredを追加する
  }else if(card.expirationDate <= 1){ // もし消費期限が1日以内ならば
    cardClass += " red" // cardClassにredを追加する
  }else if(card.expirationDate <= 3){
    cardClass += " yellow" //cardClassにyellowを追加する
  }
  
  const [isEditing, setIsEditing] = useState(false); // 編集モードのステート
  const [editedName, setEditedName] = useState(card.name);
  const [editedAmount, setEditedAmount] = useState(card.amount);
  const [editedDeadline, setEditedDeadline] = useState(card.expirationDate);

  const handleSave = () => {
    const updatedCard = {
      ...card, // 既存のプロパティを保持
      name: editedName,
      amount: Number(editedAmount),
      expirationDate: Number(editedDeadline),
    };
    onUpdateCard(updatedCard); // 親の関数を呼び出し
    setIsEditing(false); // 編集モードを終了
  };

  const handleCancel = () => {
    // 編集モードを終了し、元の値に戻す
    setIsEditing(false);
    setEditedName(card.name);
    setEditedAmount(card.amount);
    setEditedDeadline(card.expirationDate);
  };

  return (
    <div className="card">
      {isEditing ? (
        // 編集モード
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
          <input
            type="number"
            value={editedDeadline}
            onChange={(e) => setEditedDeadline(e.target.value)}
          />
          <button onClick={handleSave}>修正保存</button>
          <button onClick={handleCancel}>キャンセル</button>
        </div>
      ) : (
        // 通常表示モード
        <>
        <div className={cardClass}>
          <div className="text">{card.name}</div>
          <div className="number">個数：{card.amount}個</div>
          <div className="deadline">
            {card.expirationDate >= 0
              ? // 消費期限が今日か未来の場合
                `消費期限：あと${card.expirationDate}日`
              : // 消費期限が切れている場合
                `消費期限切れてる！${Math.abs(card.expirationDate)}日も！`}
          </div>
          <button onClick={() => setIsEditing(true)}>修正</button>
          <div className="delete" onClick={() => onDeleteCard(card.id)}>
            削除
          </div>
          </div>
        </>
      )}
      </div>
  );
}
