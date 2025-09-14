import React from "react";

export default function CalendarHeader({ year, month, onPrev, onNext }) {
  return (
    <div className="flex justify-between items-center mb-6 p-4 bg-blue-200 rounded-xl shadow">
      <button
        onClick={onPrev}
        className="px-5 py-2 bg-blue-500 text-white text-lg font-semibold rounded-xl hover:bg-blue-600 transition"
      >
        ←
      </button>
      <span className="text-2xl font-bold">
        {year}年 {month + 1}月
      </span>
      <button
        onClick={onNext}
        className="px-5 py-2 bg-blue-500 text-white text-lg font-semibold rounded-xl hover:bg-blue-600 transition"
      >
        →
      </button>
    </div>
  );
}
