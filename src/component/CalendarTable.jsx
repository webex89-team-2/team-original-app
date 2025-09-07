import React from "react";

const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarTable({ dates }) {
  return (
    <table border="1">
      <thead>
        <tr>
          {daysOfWeek.map((day) => (
            <th key={day}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(Math.ceil(dates.length / 7))].map((_, rowIndex) => (
          <tr key={rowIndex}>
            {dates.slice(rowIndex * 7, rowIndex * 7 + 7).map((date, i) => (
              <td key={i}>{date || ""}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
