import React from "react";

const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarTable({ dates, year, month }) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return (
    <table className="w-full border-collapse text-center text-lg">
      <thead>
        <tr>
          {daysOfWeek.map((day, i) => (
            <th
              key={i}
              className={`py-3 border-b text-xl ${
                i === 0
                  ? "text-red-500"
                  : i === 6
                  ? "text-blue-500"
                  : "text-gray-700"
              }`}
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(Math.ceil(dates.length / 7))].map((_, rowIndex) => (
          <tr key={rowIndex}>
            {dates.slice(rowIndex * 7, rowIndex * 7 + 7).map((date, i) => {
              const isToday =
                date === currentDay &&
                month === currentMonth && // ← 表示中の月と今日の月を比較
                year === currentYear; // ← 表示中の年と今日の年を比較

              return (
                <td
                  key={i}
                  className={`py-6 border border-gray-300 text-xl ${
                    isToday ? "bg-yellow-300 font-bold rounded-full" : ""
                  }`}
                >
                  {date || ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
