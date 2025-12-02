// Projeto completo com login + backend Node.js + API de contas a receber
// Arquivos separados serão adicionados abaixo.

// === server.js ===
// Servidor Node.js com Express, login, e API de contas

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Usuários (login simples) ---
const usuarios = [
  { usuario: "admin", senha: "1234" }
];

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  const user = usuarios.find(u => u.usuario === usuario && u.senha === senha);
  if (user) res.json({ status: "ok" });
  else res.json({ status: "erro", msg: "Usuário ou senha incorretos" });
});

// --- Banco de dados simples em arquivo ---
const DB = "contas.json";
if (!fs.existsSync(DB)) fs.writeFileSync(DB, "[]");

function carregarContas() {
  return JSON.parse(fs.readFileSync(DB));
}

function salvarContas(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// --- API CONTAS ---
app.get('/contas', (req, res) => {
  res.json(carregarContas());
});

app.post('/contas', (req, res) => {
  const contas = carregarContas();
  contas.push(req.body);
  salvarContas(contas);
  res.json({ status: "ok" });
});

app.post('/pagar', (req, res) => {
  const contas = carregarContas();
  const { index, valor } = req.body;
  contas[index].valor_pago += valor;
  if (contas[index].valor_pago > contas[index].valor_total)
    contas[index].valor_pago = contas[index].valor_total;
  salvarContas(contas);
  res.json({ status: "ok" });
});

app.post('/remover', (req, res) => {
  const contas = carregarContas();
  const { index } = req.body;
  contas.splice(index, 1);
  salvarContas(contas);
  res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));


// === index.html ===
/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sistema de Contas</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="login">
    <h2>Login</h2>
    <input id="user" placeholder="Usuário"><br>
    <input id="pass" type="password" placeholder="Senha"><br>
    <button onclick="login()">Entrar</button>
    <p id="msg"></p>
  </div>

  <div id="app" style="display:none">
    <h2>Contas a Receber</h2>
    <button onclick="carregar()">Atualizar lista</button>
    <button onclick="mostrarCadastro()">Cadastrar Cliente</button>

    <div id="lista"></div>

    <div id="cadastro" style="margin-top:20px; display:none;">
      <h3>Novo Cliente</h3>
      <input id="nome" placeholder="Nome"><br>
      <input id="venc" placeholder="Vencimento (dd/mm/aaaa)"><br>
      <input id="valor" placeholder="Valor" type="number"><br>
      <button onclick="salvarCliente()">Salvar</button>
      <button onclick="fecharCadastro()">Cancelar</button>
    </div>
  </div>

<script src="script.js"></script>
</body>
</html>
*/


// === style.css ===
/*
body {
  font-family: Arial;
  background: #f4f4f4;
  padding: 20px;
}
#login, #app {
  background: white;
  padding: 20px;
  width: 300px;
  border-radius: 10px;
  margin: auto;
  box-shadow: 0 0 10px #aaa;
}
input {
  width: 100%; margin: 5px 0; padding: 8px;
}
button {
  padding: 8px;
  margin-top: 10px;
}
.cliente {
  background: #fff;
  padding: 10px;
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
}
*/

// === script.js ===
/*
const api = "http://localhost:3000";

function login() {
  fetch(api + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: user.value, senha: pass.value })
  }).then(r => r.json()).then(d => {
    if (d.status === "ok") {
      login.style.display = "none";
      app.style.display = "block";
      carregar();
    } else msg.innerText = "Login inválido";
  })
}

function carregar() {
  fetch(api + "/contas").then(r => r.json()).then(lista => {
    let html = "";
    lista.forEach((c, i) => {
      const rest = c.valor_total - c.valor_pago;
      html += `
      <div class='cliente'>
        <b>${c.nome}</b><br>
        Venc: ${c.vencimento}<br>
        Total: R$ ${c.valor_total}<br>
        Pago: R$ ${c.valor_pago}<br>
        Restante: R$ ${rest}<br><br>
        <input id='p${i}' placeholder='Valor' type='number'>
        <button onclick='pagar(${i})'>Pagar</button>
        <button onclick='remover(${i})' style='background:red;color:white'>Remover</button>
      </div>`;
    });
    listaDiv = document.getElementById("lista");
    listaDiv.innerHTML = html;
  });
}

function mostrarCadastro() {
  cadastro.style.display = "block";
}
function fecharCadastro() {
  cadastro.style.display = "none";
}

function salvarCliente() {
  fetch(api + "/contas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: nome.value,
      vencimento: venc.value,
      valor_total: parseFloat(valor.value),
      valor_pago: 0
    })
  }).then(() => {
    fecharCadastro();
    carregar();
  });
}

function pagar(i) {
  const v = parseFloat(document.getElementById("p" + i).value);
  fetch(api + "/pagar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index: i, valor: v })
  }).then(() => carregar());
}

function remover(i) {
  fetch(api + "/remover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index: i })
  }).then(() => carregar());
}
*/
