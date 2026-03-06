import { useState, useEffect, useRef } from "react";

const STATUS_CONFIG = {
  recebida: { label: "Recebida", color: "#6366f1", bg: "#6366f115", icon: "📥" },
  enviada_goevo: { label: "Enviada p/ Goevo", color: "#f59e0b", bg: "#f59e0b15", icon: "📤" },
  pedido_gerado: { label: "Pedido Gerado", color: "#8b5cf6", bg: "#8b5cf615", icon: "🔄" },
  enviado_next: { label: "Enviado p/ Next", color: "#06b6d4", bg: "#06b6d415", icon: "🚀" },
  aprovado: { label: "Aprovado/finalizado", color: "#10b981", bg: "#10b98115", icon: "✅" },
  devolvida: { label: "Devolvida", color: "#ef4444", bg: "#ef444415", icon: "↩️" },
};

function getToken() { return localStorage.getItem("notascondInc-token") }
function getUsuario() { const u = localStorage.getItem("notascondInc-usuario"); return u ? JSON.parse(u) : null }

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!username || !senha) { setErro("Preencha todos os campos"); return }
    setLoading(true)
    try {
      const r = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, senha })
      })
      const data = await r.json()
      if (!r.ok) { setErro(data.erro); setLoading(false); return }
      localStorage.setItem("notascondInc-token", data.token)
      localStorage.setItem("notascondInc-usuario", JSON.stringify({ nome: data.nome, username: data.username }))
      onLogin({ nome: data.nome, username: data.username })
    } catch {
      setErro("Erro ao conectar com o servidor")
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Space+Grotesk:wght@700&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 400, padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>📋</div>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 28, fontWeight: 700, color: "#fff" }}>Notas Cond/Inc</h1>
          <p style={{ color: "#64748b", marginTop: 6 }}>Faça login para continuar</p>
        </div>
        <div style={{ background: "#161926", border: "1px solid #1e2438", borderRadius: 16, padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Usuário</label>
            <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="seu.usuario" style={{ background: "#1a1d2e", border: "1px solid #252840", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" style={{ background: "#1a1d2e", border: "1px solid #252840", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          {erro && <div style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>❌ {erro}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {loading ? "Entrando..." : "Entrar →"}
          </button>
        </div>
      </div>
    </div>
  )
}

function calcDias(vencimento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + "T00:00:00");
  return Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
}

function formatCNPJ(v) {
  v = v.replace(/\D/g, "").slice(0, 14);
  if (v.length <= 2) return v;
  if (v.length <= 5) return v.replace(/(\d{2})(\d+)/, "$1.$2");
  if (v.length <= 8) return v.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (v.length <= 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
}

function formatMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function DiasBadge({ dias }) {
  let bg, color, text;
  if (dias < 0) { bg = "#ef444420"; color = "#ef4444"; text = `${Math.abs(dias)}d vencida`; }
  else if (dias === 0) { bg = "#ef444420"; color = "#ef4444"; text = "Vence hoje"; }
  else if (dias <= 3) { bg = "#ef444420"; color = "#ef4444"; text = `${dias}d`; }
  else if (dias <= 10) { bg = "#f59e0b20"; color = "#f59e0b"; text = `${dias}d`; }
  else { bg = "#10b98120"; color = "#10b981"; text = `${dias}d`; }
  return <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{text}</span>;
}

export default function App() {
  // TODOS os hooks primeiro, sem nenhum return antes deles
  const [usuario, setUsuario] = useState(getUsuario())
  const [notas, setNotas] = useState([]);
  const [view, setView] = useState("dashboard");
  const [form, setForm] = useState({ fornecedor: "", cnpj: "", dataRecebimento: "", vencimento: "", numero: "", valor: "", arquivo: null });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterMes, setFilterMes] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [alertas, setAlertas] = useState([]);
  const [toast, setToast] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!usuario) { setNotas([]); return; }
    fetch("http://localhost:3001/notas", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotas(data) })
      .catch(() => {})
  }, [usuario]);

  useEffect(() => {
    const urgentes = notas.filter(n => { const d = calcDias(n.vencimento); return d >= 0 && d <= 10 && n.status !== "aprovado"; });
    setAlertas(urgentes);
  }, [notas]);

  // Agora sim o return condicional, depois de todos os hooks
  if (!usuario) return <LoginPage onLogin={setUsuario} />

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!form.fornecedor || !form.cnpj || !form.vencimento || !form.dataRecebimento) {
      showToast("Preencha todos os campos obrigatórios", "error"); return;
    }
    if (editId) {
      const r = await fetch(`http://localhost:3001/notas/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, valor: parseFloat(form.valor) || 0 })
      })
      const atualizada = await r.json()
      setNotas(notas.map(n => n.id === editId ? atualizada : n))
      showToast("Nota atualizada com sucesso!")
      setEditId(null)
    } else {
      const r = await fetch("http://localhost:3001/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, valor: parseFloat(form.valor) || 0 })
      })
      const nova = await r.json()
      setNotas([nova, ...notas])
      showToast("Nota cadastrada com sucesso!")
    }
    setForm({ fornecedor: "", cnpj: "", dataRecebimento: "", vencimento: "", numero: "", valor: "", arquivo: null });
    setView("notas");
  }

  function handleEdit(nota) {
    setForm({ ...nota });
    setEditId(nota.id);
    setView("cadastro");
  }

  async function handleDelete(id) {
    await fetch(`http://localhost:3001/notas/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } })
    setNotas(notas.filter(n => n.id !== id))
    setDetalhe(null)
    showToast("Nota removida")
  }

  async function handleStatus(id, status) {
    await fetch(`http://localhost:3001/notas/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status })
    })
    setNotas(notas.map(n => n.id === id ? { ...n, status } : n))
    showToast(`Status atualizado: ${STATUS_CONFIG[status].label}`)
  }

  function handleLogout() {
    localStorage.removeItem("notascondInc-token");
    localStorage.removeItem("notascondInc-usuario");
    setNotas([]);
    setView("dashboard");
    setUsuario(null);
  }

  const notasFiltradas = notas.filter(n => {
    const s = search.toLowerCase();
    const match = !s || n.fornecedor.toLowerCase().includes(s) || n.cnpj.includes(s) || (n.numero || "").toLowerCase().includes(s);
    const st = filterStatus === "todos" || n.status === filterStatus;
    const mesNota = n.vencimento.slice(0, 7);
    const mesMatch = filterMes === "todos" || mesNota === filterMes;
    return match && st && mesMatch;
  });

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const notasMes = notas.filter(n => {
    if (filterMes === "todos") {
      const d = new Date(n.dataRecebimento);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    }
    return n.vencimento.slice(0, 7) === filterMes;
  });
  const notasVencendo = notas.filter(n => { const d = calcDias(n.vencimento); return d >= 0 && d <= 10 && n.status !== "aprovado"; });
  const notasDevolvidas = notas.filter(n => n.status === "devolvida");
  const totalMes = notasMes.reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, k) => { acc[k] = notas.filter(n => n.status === k).length; return acc; }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1a1d27; } ::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 3px; }
        input, select, textarea { outline: none; }
        .btn { cursor: pointer; border: none; transition: all .15s; }
        .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .nav-item { cursor: pointer; padding: 10px 18px; border-radius: 10px; transition: all .15s; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #94a3b8; }
        .nav-item:hover { background: #1e2235; color: #e2e8f0; }
        .nav-item.active { background: #6366f120; color: #818cf8; }
        .card { background: #161926; border: 1px solid #1e2438; border-radius: 16px; }
        .input-field { background: #1a1d2e; border: 1px solid #252840; border-radius: 10px; padding: 10px 14px; color: #e2e8f0; font-size: 14px; width: 100%; transition: border .15s; font-family: inherit; }
        .input-field:focus { border-color: #6366f1; }
        .nota-row { transition: background .15s; cursor: pointer; }
        .nota-row:hover { background: #1a1d2e; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .toast { animation: slideIn .2s ease; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }
      `}</style>

      {/* Header */}
      <div style={{ background: "#11141f", borderBottom: "1px solid #1a1d2e", padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #0026fc, #825096)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#ffffff" }}>Notas Mensais Condumax e Incesa</span>
        </div>
        <div style={{ flex: 1 }} />
        {alertas.length > 0 && (
          <div className="pulse" style={{ display: "flex", alignItems: "center", gap: 6, background: "#f59e0b15", border: "1px solid #f59e0b40", borderRadius: 20, padding: "4px 12px", fontSize: 13, color: "#f59e0b", cursor: "pointer" }} onClick={() => setView("notas")}>
            <span>⚠️</span> {alertas.length} nota{alertas.length > 1 ? "s" : ""} vencendo em breve
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>👤 {usuario.nome}</span>
          <button onClick={handleLogout} style={{ background: "#1e2235", color: "#64748b", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Sair</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#11141f", borderRight: "1px solid #1a1d2e", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 60, height: "calc(100vh - 60px)", overflowY: "auto" }}>
          {[
            { id: "dashboard", icon: "📊", label: "Dashboard" },
            { id: "notas", icon: "📄", label: "Notas Fiscais" },
            { id: "cadastro", icon: "➕", label: "Nova Nota" },
            { id: "vencendo", icon: "⏰", label: `Vencendo (${notasVencendo.length})` },
          ].map(item => (
            <div key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => { setView(item.id); if (item.id !== "cadastro") { setEditId(null); setForm({ fornecedor: "", cnpj: "", dataRecebimento: "", vencimento: "", numero: "", valor: "", arquivo: null }); } }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "12px", background: "#1a1d2e", borderRadius: 10, fontSize: 12, color: "#64748b" }}>
            <div style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>Resumo rápido</div>
            {Object.entries(STATUS_CONFIG).slice(0, 4).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#64748b" }}>{v.label.split(" p/")[0]}</span>
                <span style={{ color: v.color, fontWeight: 700 }}>{statusCounts[k] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <div style={{ animation: "fadeIn .3s" }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 24, fontWeight: 700, color: "#fff" }}>Dashboard</h1>
                <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Visão geral das suas notas fiscais</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Notas no Mês", value: notasMes.length, sub: formatMoeda(totalMes), icon: "📥", color: "#6366f1" },
                  { label: "Vencendo em 10 dias", value: notasVencendo.length, sub: "requer atenção", icon: "⏰", color: "#f59e0b" },
                  { label: "Aprovadas", value: statusCounts.aprovado, sub: "concluídas", icon: "✅", color: "#10b981" },
                  { label: "Devolvidas", value: notasDevolvidas.length, sub: "pendente ação", icon: "↩️", color: "#ef4444" },
                ].map((kpi, i) => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{kpi.label}</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{kpi.value}</div>
                        <div style={{ fontSize: 12, color: kpi.color, marginTop: 4 }}>{kpi.sub}</div>
                      </div>
                      <div style={{ fontSize: 28, opacity: .7 }}>{kpi.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ color: "#fff", fontWeight: 600, marginBottom: 20 }}>Pipeline de Notas</h3>
                <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v], i, arr) => (
                    <div key={k} style={{ flex: 1, minWidth: 100, textAlign: "center", position: "relative" }}>
                      <div style={{ background: v.bg, border: `1px solid ${v.color}40`, borderRadius: 12, padding: "16px 8px", margin: "0 4px" }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{v.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: v.color }}>{statusCounts[k] || 0}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{v.label}</div>
                      </div>
                      {i < arr.length - 1 && <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", color: "#2d3148", fontSize: 20 }}>›</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ color: "#fff", fontWeight: 600 }}>Notas Recentes</h3>
                  <button className="btn" onClick={() => setView("notas")} style={{ fontSize: 13, color: "#6366f1", background: "none", padding: "4px 8px" }}>Ver todas →</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e2438" }}>
                      {["Fornecedor", "Valor", "Vencimento", "Status"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontSize: 12, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notas.slice(0, 5).map(n => {
                      const dias = calcDias(n.vencimento);
                      const st = STATUS_CONFIG[n.status];
                      return (
                        <tr key={n.id} className="nota-row" onClick={() => setDetalhe(n)} style={{ borderBottom: "1px solid #1a1d2e" }}>
                          <td style={{ padding: "12px", fontSize: 14, color: "#e2e8f0" }}>
                            <div style={{ fontWeight: 600 }}>{n.fornecedor}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{n.numero}</div>
                          </td>
                          <td style={{ padding: "12px", fontSize: 14, color: "#a3e635", fontWeight: 600 }}>{formatMoeda(n.valor)}</td>
                          <td style={{ padding: "12px" }}><DiasBadge dias={dias} /></td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{st.icon} {st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NOTAS */}
          {(view === "notas" || view === "vencendo") && (
            <div style={{ animation: "fadeIn .3s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 24, fontWeight: 700, color: "#fff" }}>
                    {view === "vencendo" ? "⏰ Vencendo em Breve" : "Notas Fiscais"}
                  </h1>
                  <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{notasFiltradas.length} notas encontradas</p>
                </div>
                <button className="btn" onClick={() => setView("cadastro")} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                  + Nova Nota
                </button>
              </div>
              <div className="card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input className="input-field" placeholder="🔍 Buscar por fornecedor, CNPJ ou número..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "auto" }}>
                  <option value="todos">Todos os status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="month" value={filterMes === "todos" ? "" : filterMes} onChange={e => setFilterMes(e.target.value || "todos")} style={{ background: "#1a1d2e", border: "1px solid #252840", borderRadius: 10, padding: "8px 16px", fontSize: 14, color: "#e2e8f0", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }} />
                  <button className="btn" onClick={() => setFilterMes("todos")} style={{ background: "#1e2235", color: "#64748b", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>Todos</button>
                </div>
              </div>
              <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#13162080", borderBottom: "1px solid #1e2438" }}>
                      {["Nota / Fornecedor", "CNPJ", "Recebimento", "Vencimento", "Valor", "Status", "Ações"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#64748b", fontSize: 12, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(view === "vencendo" ? notasVencendo : notasFiltradas).map(n => {
                      const dias = calcDias(n.vencimento);
                      const st = STATUS_CONFIG[n.status];
                      return (
                        <tr key={n.id} className="nota-row" style={{ borderBottom: "1px solid #1a1d2e" }}>
                          <td style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => setDetalhe(n)}>
                            <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 14 }}>{n.fornecedor}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{n.numero || "—"} {n.arquivo && "📎"}</div>
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>{n.cnpj}</td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>{new Date(n.dataRecebimento + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                          <td style={{ padding: "14px 16px" }}><DiasBadge dias={dias} /></td>
                          <td style={{ padding: "14px 16px", fontSize: 14, color: "#a3e635", fontWeight: 700 }}>{formatMoeda(n.valor)}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <select value={n.status} onChange={e => handleStatus(n.id, e.target.value)} style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}50`, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k} style={{ background: "#161926", color: "#e2e8f0" }}>{v.label}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="btn" onClick={() => handleEdit(n)} style={{ background: "#1e2235", color: "#94a3b8", padding: "5px 10px", borderRadius: 7, fontSize: 13 }}>✏️</button>
                              <button className="btn" onClick={() => handleDelete(n.id)} style={{ background: "#ef444415", color: "#ef4444", padding: "5px 10px", borderRadius: 7, fontSize: 13 }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(view === "vencendo" ? notasVencendo : notasFiltradas).length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Nenhuma nota encontrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CADASTRO */}
          {view === "cadastro" && (
            <div style={{ animation: "fadeIn .3s", maxWidth: 680 }}>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 24, fontWeight: 700, color: "#fff" }}>{editId ? "✏️ Editar Nota" : "📥 Nova Nota Fiscal"}</h1>
                <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Preencha os dados da nota fiscal</p>
              </div>
              <div className="card" style={{ padding: 28 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Fornecedor *</label>
                    <input className="input-field" placeholder="Nome do fornecedor" value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>CNPJ *</label>
                    <input className="input-field" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: formatCNPJ(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Número da Nota</label>
                    <input className="input-field" placeholder="NF-001" value={form.numero || ""} onChange={e => setForm({ ...form, numero: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Data de Recebimento *</label>
                    <input className="input-field" type="date" value={form.dataRecebimento} onChange={e => setForm({ ...form, dataRecebimento: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Vencimento *</label>
                    <input className="input-field" type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Valor (R$)</label>
                    <input className="input-field" type="number" step="0.01" placeholder="0,00" value={form.valor || ""} onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, display: "block" }}>Arquivo PDF da Nota</label>
                    <div style={{ background: "#1a1d2e", border: "2px dashed #252840", borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer" }} onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setForm({ ...form, arquivo: f.name }); }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                      <div style={{ fontSize: 14, color: "#94a3b8" }}>{form.arquivo ? `✅ ${typeof form.arquivo === "string" ? form.arquivo : form.arquivo.name}` : "Clique ou arraste o PDF aqui"}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>PDF, máx. 10MB</div>
                      <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) setForm({ ...form, arquivo: e.target.files[0].name }); }} />
                    </div>
                  </div>
                </div>
                {form.vencimento && (
                  <div style={{ marginTop: 20, padding: "12px 16px", background: "#1a1d2e", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, color: "#94a3b8" }}>Dias até vencimento:</span>
                    <DiasBadge dias={calcDias(form.vencimento)} />
                    {calcDias(form.vencimento) <= 10 && calcDias(form.vencimento) >= 0 && <span style={{ fontSize: 12, color: "#f59e0b" }}>⚠️ Atenção: prazo curto!</span>}
                  </div>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button className="btn" onClick={handleSave} style={{ flex: 1, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 15, fontWeight: 700 }}>
                    {editId ? "💾 Salvar Alterações" : "✅ Cadastrar Nota"}
                  </button>
                  <button className="btn" onClick={() => { setView("notas"); setEditId(null); }} style={{ background: "#1e2235", color: "#94a3b8", padding: "12px 20px", borderRadius: 10, fontSize: 14 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalhe */}
      {detalhe && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDetalhe(null)}>
          <div className="card" style={{ width: "100%", maxWidth: 500, padding: 28, animation: "slideIn .2s" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>{detalhe.fornecedor}</h2>
                <div style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>{detalhe.cnpj}</div>
              </div>
              <button className="btn" onClick={() => setDetalhe(null)} style={{ background: "#1e2235", color: "#94a3b8", padding: "6px 10px", borderRadius: 8 }}>✕</button>
            </div>
            {[
              ["Número", detalhe.numero || "—"],
              ["Valor", formatMoeda(detalhe.valor)],
              ["Data Recebimento", new Date(detalhe.dataRecebimento + "T00:00:00").toLocaleDateString("pt-BR")],
              ["Vencimento", new Date(detalhe.vencimento + "T00:00:00").toLocaleDateString("pt-BR")],
              ["Dias restantes", <DiasBadge dias={calcDias(detalhe.vencimento)} />],
              ["Arquivo", detalhe.arquivo ? `📎 ${detalhe.arquivo}` : "Nenhum arquivo"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1d2e" }}>
                <span style={{ color: "#64748b", fontSize: 14 }}>{k}</span>
                <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8, display: "block" }}>Atualizar Status</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button key={k} className="btn" onClick={() => { handleStatus(detalhe.id, k); setDetalhe({ ...detalhe, status: k }); }}
                    style={{ background: detalhe.status === k ? v.bg : "#1e2235", color: detalhe.status === k ? v.color : "#64748b", border: `1px solid ${detalhe.status === k ? v.color + "60" : "transparent"}`, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn" onClick={() => { handleEdit(detalhe); setDetalhe(null); }} style={{ flex: 1, background: "#1e2235", color: "#94a3b8", padding: "10px", borderRadius: 10, fontSize: 14 }}>✏️ Editar</button>
              <button className="btn" onClick={() => handleDelete(detalhe.id)} style={{ background: "#ef444415", color: "#ef4444", padding: "10px 16px", borderRadius: 10, fontSize: 14, border: "1px solid #ef444430" }}>🗑️ Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 300, boxShadow: "0 8px 30px #0006" }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}