const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// 미들웨어
app.use(cors()); // CORS 허용 (프론트가 다른 포트여도 허용)
app.use(express.json()); // JSON 요청 본문 파싱

// SQLite 데이터베이스 연결 (파일이 없으면 자동 생성)
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
  } else {
    console.log('SQLite 데이터베이스 연결 성공');
  }
});

// users 테이블 없으면 생성
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  password TEXT
)`);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('서버가 정상 작동 중입니다!');
});

// 회원가입 API
app.post('/api/register', (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: '모든 필드를 입력하세요.' });
  }

  const query = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
  db.run(query, [email, username, password], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: '이미 존재하는 이메일 또는 아이디입니다.' });
      }
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
    res.json({ message: '회원가입 성공', userId: this.lastID });
  });
});

// 로그인 API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
  }

  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.get(query, [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
    if (!row) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
    res.json({ message: '로그인 성공', user: { id: row.id, email: row.email, username: row.username } });
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
