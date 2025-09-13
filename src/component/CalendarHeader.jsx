import React from "react";

export default function CalendarHeader({ year, month, onPrev, onNext }) {
  return (
    <div>
      <button onClick={onPrev}>←</button>
      <span>
        {year}年 {month + 1}月
      </span>
      <button onClick={onNext}>→</button>
    </div>
  );
}
