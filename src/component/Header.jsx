import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";

export const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="header">
      <Link to="/" className="logo">
        My App
      </Link>
      <nav>
        <ul className="nav-links">
          <li>
            <Link to="/mypage">ホーム</Link>
          </li>
          <li>
            <Link to="/calendar">カレンダー</Link>
          </li>
          <li>
            <button onClick={() => navigate("/signin")}>ログアウト</button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

// ...existing code...
