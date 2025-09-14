import React from "react";
import { Header } from "../component/Header";
import Calendar from "../component/Calendar";
import "../css/Calender.css";

export default function CalendarView() {
  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gradient-to-b from-[#cce0f5] to-[#e6f0fa]">
      {/* 背景丸 */}
      <Header />
      <div className="absolute top-[-100px] left-[-100px] w-[280px] h-[280px] rounded-full bg-[#0064a5] opacity-20 z-0"></div>
      <div className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-[#005c99] opacity-15 z-0"></div>

      {/* ヘッダー */}

      {/* カレンダー中央 */}
      <main className="flex justify-center w-full mt-6 z-10 p-4">
        <div className="w-full max-w-4xl px-1">
          <Calendar />
        </div>
      </main>
    </div>
  );
}
