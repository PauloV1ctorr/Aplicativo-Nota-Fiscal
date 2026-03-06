const express = require('express')
const Database = require('better-sqlite3')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
app.use(cors())
app.use(express.json())

const SECRET = "notaflow@2026"

const db = new Database(path.join(__dirname, 'notaflow.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fornecedor TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    numero TEXT,
    dataRecebimento TEXT NOT NULL,
    vencimento TEXT NOT NULL,
    valor REAL DEFAULT 0,
    status TEXT DEFAULT 'recebida',
    arquivo TEXT
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL
  );
`)

// Criar usuários iniciais se não existirem
const usuarios = [
  { username: "paulo.parada", senha: "paulo123", nome: "Paulo Parada" },
  { username: "bruno.silva", senha: "bruno123", nome: "Bruno Silva" },
]

usuarios.forEach(u => {
  const existe = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(u.username)
  if (!existe) {
    const hash = bcrypt.hashSync(u.senha, 10)
    db.prepare('INSERT INTO usuarios (username, senha, nome) VALUES (?, ?, ?)').run(u.username, hash, u.nome)
    console.log(`✅ Usuário criado: ${u.username} / senha: ${u.senha}`)
  }
})

// Middleware de autenticação
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ erro: "Não autorizado" })
  try {
    req.usuario = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ erro: "Token inválido" })
  }
}

// Login
app.post('/login', (req, res) => {
  const { username, senha } = req.body
  const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username)
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    return res.status(401).json({ erro: "Usuário ou senha incorretos" })
  }
  const token = jwt.sign({ id: usuario.id, username: usuario.username, nome: usuario.nome }, SECRET, { expiresIn: '8h' })
  res.json({ token, nome: usuario.nome, username: usuario.username })
})

// Rotas de notas (protegidas)
app.get('/notas', auth, (req, res) => {
  const notas = db.prepare('SELECT * FROM notas ORDER BY id DESC').all()
  res.json(notas)
})

app.post('/notas', auth, (req, res) => {
  const { fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status, arquivo } = req.body
  const result = db.prepare(`
    INSERT INTO notas (fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status, arquivo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status || 'recebida', arquivo)
  const nova = db.prepare('SELECT * FROM notas WHERE id = ?').get(result.lastInsertRowid)
  res.json(nova)
})

app.put('/notas/:id', auth, (req, res) => {
  const { fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status, arquivo } = req.body
  db.prepare(`
    UPDATE notas SET fornecedor=?, cnpj=?, numero=?, dataRecebimento=?, vencimento=?, valor=?, status=?, arquivo=?
    WHERE id=?
  `).run(fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status, arquivo, req.params.id)
  const atualizada = db.prepare('SELECT * FROM notas WHERE id = ?').get(req.params.id)
  res.json(atualizada)
})

app.delete('/notas/:id', auth, (req, res) => {
  db.prepare('DELETE FROM notas WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.patch('/notas/:id/status', auth, (req, res) => {
  const { status } = req.body
  db.prepare('UPDATE notas SET status=? WHERE id=?').run(status, req.params.id)
  res.json({ ok: true })
})
// Mantém o servidor acordado
const https = require('https')
setInterval(() => {
  https.get('https://aplicativo-nota-fiscal.onrender.com')
}, 14 * 60 * 1000) // ping a cada 14 minutos
app.listen(3001, '0.0.0.0', () => {
  console.log('✅ Servidor rodando em http://localhost:3001')
})

process.on('uncaughtException', (err) => {
  console.error('Erro:', err)

})
