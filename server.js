const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(express.json())

const SECRET = "notaflow@2026"

const supabase = createClient(
  'https://xzleybnvkosnwilwiigu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bGV5Ym52a29zbndpbHdpaWd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc3MDczMSwiZXhwIjoyMDg4MzQ2NzMxfQ.BA-2PAbgKJ5Hhwe5A5bxtiW8mQM3IdsKetXJ1PDCVXQ'
)

// Criar usuários iniciais
async function criarUsuarios() {
  const usuarios = [
    { username: "paulo.parada", senha: "paulo123", nome: "Paulo Parada" },
    { username: "bruno.silva", senha: "bruno123", nome: "Bruno Silva" },
  ]
  for (const u of usuarios) {
    const { data } = await supabase.from('usuarios').select('id').eq('username', u.username).single()
    if (!data) {
      const hash = bcrypt.hashSync(u.senha, 10)
      await supabase.from('usuarios').insert({ username: u.username, senha: hash, nome: u.nome })
      console.log(`✅ Usuário criado: ${u.username} / senha: ${u.senha}`)
    }
  }
}
criarUsuarios()

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
app.post('/login', async (req, res) => {
  const { username, senha } = req.body
  const { data: usuario } = await supabase.from('usuarios').select('*').eq('username', username).single()
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    return res.status(401).json({ erro: "Usuário ou senha incorretos" })
  }
  const token = jwt.sign({ id: usuario.id, username: usuario.username, nome: usuario.nome }, SECRET, { expiresIn: '8h' })
  res.json({ token, nome: usuario.nome, username: usuario.username })
})

// Buscar todas as notas
app.get('/notas', auth, async (req, res) => {
  const { data, error } = await supabase.from('notas').select('*').order('id', { ascending: false })
  if (error) return res.status(500).json({ erro: error.message })
  res.json(data)
})

// Cadastrar nova nota
app.post('/notas', auth, async (req, res) => {
  const { fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status, arquivo } = req.body
  const { data, error } = await supabase.from('notas').insert({
    fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status: status || 'recebida', arquivo
  }).select().single()
  if (error) return res.status(500).json({ erro: error.message })
  res.json(data)
})

// Atualizar nota
app.put('/notas/:id', auth, async (req, res) => {
  const { fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status, arquivo } = req.body
  const { data, error } = await supabase.from('notas').update({
    fornecedor, cnpj, numero, dataRecebimento, vencimento, valor, status, arquivo
  }).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ erro: error.message })
  res.json(data)
})

// Deletar nota
app.delete('/notas/:id', auth, async (req, res) => {
  const { error } = await supabase.from('notas').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ erro: error.message })
  res.json({ ok: true })
})

// Atualizar status
app.patch('/notas/:id/status', auth, async (req, res) => {
  const { status } = req.body
  const { error } = await supabase.from('notas').update({ status }).eq('id', req.params.id)
  if (error) return res.status(500).json({ erro: error.message })
  res.json({ ok: true })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`)
})

process.on('uncaughtException', (err) => {
  console.error('Erro:', err)
})
