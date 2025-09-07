import { useState } from "react";
import CalendarHeader from "./CalendarHeader";
import CalendarTable from "./CalendarTable";

export default function Calendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const firstDay = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dates = [];
  for (let i = 0; i < firstDay.getDay(); i++) dates.push(null);
  for (let d = 1; d <= daysInMonth; d++) dates.push(d);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div>
      <CalendarHeader
        year={currentYear}
        month={currentMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
      />
      <CalendarTable dates={dates} />
    </div>
  );
}
