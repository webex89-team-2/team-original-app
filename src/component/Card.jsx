 export function Card({card, handleDeleteCard}) {

  //消費期限による色の変化
  let cardClass = "card"
  if (card.dead <= 1){
    cardClass += " red"
  }else if (card.dead <=3){
    cardClass += " yellow"
  }

  return (
    <div className = {cardClass}>
       <div className = "text">{card.text}</div>
       <div className = "number">個数：{card.number}個</div>
       <div className = "deadline">消費期限：あと{card.dead}日</div>
        <div 
        className = "delete"
        onClick = {() => handleDeleteCard(card.id)}
        ></div>
    </div>
)
}