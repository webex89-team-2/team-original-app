import "../css/Trello.css";

export function Card({ card, handleDeleteCard }) {

  //消費期限による色の変化
  let cardClass = "card"
  if(card.expirationDate <= 1){ // もし消費期限が1日以内ならば
    cardClass += " red" // cardClassにredを追加する
  }else if(card.expirationDate <= 3){
    cardClass += " yellow" //cardClassにyellowを追加する
  }

  return (
    <div className={cardClass}>
      <div className="text">{card.name}</div>
      <div className="number">個数：{card.amount}個</div>
      <div className="deadline">消費期限：あと{card.expirationDate}日</div>
      <div className="delete" onClick={() => handleDeleteCard(card.id)}></div>
    </div>
  );
}
