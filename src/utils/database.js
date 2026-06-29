const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/users.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas se não existirem
db.serialize(() => {
  // Tabela de usuários autenticados
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      discordId TEXT NOT NULL UNIQUE,
      token TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de quests aceitas
  db.run(`
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      questId TEXT NOT NULL,
      questName TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Tabela de histórico de ações
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      questId TEXT,
      result TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
});

// Funções de usuário
const UserDB = {
  save: (discordId, token) => {
    return new Promise((resolve, reject) => {
      const id = `user_${discordId}_${Date.now()}`;
      db.run(
        'INSERT OR REPLACE INTO users (id, discordId, token, lastUpdated) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [id, discordId, token],
        function(err) {
          if (err) reject(err);
          else resolve(id);
        }
      );
    });
  },

  get: (discordId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE discordId = ?', [discordId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  delete: (discordId) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE discordId = ?', [discordId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
};

// Funções de quests
const QuestDB = {
  add: (userId, questId, questName) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO quests (userId, questId, questName, status) VALUES (?, ?, ?, ?)',
        [userId, questId, questName, 'pending'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  getByUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM quests WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  updateStatus: (questId, status) => {
    return new Promise((resolve, reject) => {
      const completedAt = status === 'completed' ? 'CURRENT_TIMESTAMP' : null;
      db.run(
        `UPDATE quests SET status = ?, completedAt = ${completedAt ? 'CURRENT_TIMESTAMP' : 'NULL'} WHERE questId = ?`,
        [status, questId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  delete: (questId) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM quests WHERE questId = ?', [questId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
};

// Funções de histórico
const HistoryDB = {
  log: (userId, action, questId, result) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO history (userId, action, questId, result) VALUES (?, ?, ?, ?)',
        [userId, action, questId, result],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  getByUser: (userId, limit = 50) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM history WHERE userId = ? ORDER BY timestamp DESC LIMIT ?',
        [userId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
};

module.exports = {
  UserDB,
  QuestDB,
  HistoryDB
};
