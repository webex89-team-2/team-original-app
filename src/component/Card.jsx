 export function Card({card, handleDeleteCard}) {
    
  return (
    <div className = "card">
       <div className = "text">{card.name}</div>
       <div className = "number">個数：{card.amount}個</div>
       <div className = "deadline">消費期限：あと{card.expirationDate}日</div>
        <div 
        className = "delete"
        onClick = {() => handleDeleteCard(card.id)}
        ></div>
    </div>
)
}