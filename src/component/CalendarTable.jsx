import React from "react";
import { useState, useEffect } from "react";
import{useMemo} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  // addDoc,
  // deleteDoc,
  // doc,
  // updateDoc,
  // writeBatch,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
//カレンダーの数字のうち対応する日付のみ色を付けるイメージ
//chatgptのアプリに計画あり
const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarTable({ dates, year, month }) {
  const today = new Date();
  const navigate = useNavigate();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const [uid, setUid] = useState(null); // userIDの変数
  const [alertDates, setAlertDates] = useState([]);

  const alertDateSet = useMemo(
    () => new Set(alertDates.map(a => a.date)),
    [alertDates]
  );


          const getAlertDate = async (uid) =>{
          if(!uid) return;

          //注目する期間の設定
          const span = 14 //何日先の日付までチェックするか
          const standard = 4 //何個以上重なったらアラートを送るか

          const today = new Date();
          today.setHours(0,0,0,0);
          const dayAhead = new Date(today);
          dayAhead.setDate(dayAhead.getDate() + span); 
          dayAhead.setHours(23,59,59,999);

          //firebaseから、消費期限が今日~{span}日後の食品までを取り出す
          const foodRec = collection(db, "users", uid, "foods");
        
          //当該食品はinSpanに保存する
          const inSpan = query( 
            foodRec,
            where("expiresAt", ">=", today),
            where("expiresAt", "<=", dayAhead),
            orderBy("expiresAt", "asc")
          );
          const snap = await getDocs(inSpan);

          const counter = new Map(); //日付を保存するための変数

          snap.forEach((docSnap) => { //snapの保存内容を各ドキュメント順に処理する
            const data = docSnap.data(); //ドキュメントのフィールド群を取り出す
            if(!data.expiresAt) return;//{span}日以内に消費期限が集中している日にちがない場合はドキュメントをスキップ
            const d = 
              typeof data.expiresAt.toDate === "function"
              ? data.expiresAt.toDate()
              : data.expiresAt;

              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              const key = `${y}-${m}-${day}`;

            counter.set(key, (counter.get(key) || 0) + 1);
          });

          const result = Array.from(counter.entries())
          .filter(([,c]) => c >= standard)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1:0))
          .map(([date, count]) => ({date, count})); //count?counter?

          setAlertDates(result);
        };

  useEffect(() => {
      const auth = getAuth();
      // ユーザーのログイン状態を監視
      const unSub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUid(user.uid); // ログインしていればuidを保存
        } else {
          navigate("/signin"); // 未ログインの場合はサインインページへ遷移
        }
      });
      return () => unSub(); // クリーンアップ（監視解除）
    }, [navigate]);

    useEffect(() => {
      if(!uid) return;
      getAlertDate(uid);
    },[uid]);

    //firebaseからデータを取得する関数


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

                const isValidDate = date != null; //先頭のnullマス対策
                const cellKey = isValidDate

                ? `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`
                : null;
                const isAlert = cellKey ? alertDateSet.has(cellKey) : false;

              return (
                <td
                  key={i}
                  className={`py-6 border border-gray-300 text-xl ${
                    isAlert
                    ? "bg-red-400 font-bold rounded-full" 
                    : isToday
                   ? "bg-yellow-300 font-bold rounded-full" : ""
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
