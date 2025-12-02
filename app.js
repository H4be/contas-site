// app.js (modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* ----- INSIRA AQUI SUA CONFIG DO FIREBASE ----- */
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};
/* ----------------------------------------------- */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// DOM
const authArea = document.getElementById('authArea');
const mainArea = document.getElementById('mainArea');
const navArea = document.getElementById('navArea');
const authTitle = document.getElementById('authTitle');
const authAlert = document.getElementById('authAlert');

const formLogin = document.getElementById('formLogin');
const btnGotoSignup = document.getElementById('btnGotoSignup');
const btnGoogle = document.getElementById('btnGoogle');

const formCadastrar = document.getElementById('formCadastrar');
const listaDiv = document.getElementById('lista');
const totalGeralSpan = document.getElementById('totalGeral');

// estado
let unsubscribeSnapshot = null;
let currentUser = null;

// helpers
function showAuthAlert(msg, type='danger') {
  authAlert.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}
function clearAuthAlert(){ authAlert.innerHTML = ''; }
function formatCurrency(v){ return Number(v).toFixed(2).replace('.', ','); }

// AUTH UI handlers
btnGotoSignup.addEventListener('click', () => {
  // trocar formulário para signup
  authTitle.textContent = 'Registrar';
  formLogin.innerHTML = `
    <div class="mb-2">
      <label class="form-label">Email</label>
      <input id="email" class="form-control" type="email" required />
    </div>
    <div class="mb-2">
      <label class="form-label">Senha</label>
      <input id="password" class="form-control" type="password" required />
    </div>
    <div class="d-flex gap-2">
      <button id="btnSignup" class="btn btn-primary">Registrar</button>
      <button id="btnBack" type="button" class="btn btn-outline-secondary">Voltar</button>
      <button id="btnGoogle" type="button" class="btn btn-outline-danger ms-auto">Entrar com Google</button>
    </div>
  `;
  // re-bind
  document.getElementById('btnBack').addEventListener('click', ()=> location.reload());
  document.getElementById('btnSignup').addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAuthAlert('Registro realizado! Entrando...', 'success');
    } catch (err) {
      showAuthAlert(err.message);
    }
  });
  document.getElementById('btnGoogle').addEventListener('click', doGoogleSignIn);
});

// Google sign in
async function doGoogleSignIn(){
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    showAuthAlert(err.message);
  }
}

// Login submit
formLogin.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  clearAuthAlert();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    showAuthAlert(err.message);
  }
});

// Observa mudanças de auth
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    showAppForUser(user);
  } else {
    currentUser = null;
    showAuth();
  }
});

// Show app
function showAuth(){
  authArea.style.display = 'block';
  mainArea.style.display = 'none';
  navArea.innerHTML = '';
}

// build nav with logout
function buildNav(username){
  navArea.innerHTML = `
    <span class="text-white me-3">Olá, ${username}</span>
    <button id="btnLogout" class="btn btn-outline-light btn-sm">Sair</button>
  `;
  document.getElementById('btnLogout').addEventListener('click', async ()=>{
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    await signOut(auth);
    location.reload();
  });
}

// Ao logar: carrega e ativa snapshot
function showAppForUser(user){
  authArea.style.display = 'none';
  mainArea.style.display = 'block';
  buildNav(user.email || user.displayName || user.uid);

  // escuta coleção users/{uid}/clientes
  const collRef = collection(db, 'users', user.uid, 'clientes');
  const q = query(collRef, orderBy('nome', 'asc'));

  if (unsubscribeSnapshot) unsubscribeSnapshot();

  unsubscribeSnapshot = onSnapshot(q, snap => {
    const docs = [];
    snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
    renderList(docs);
  }, err=>{
    console.error('snapshot error', err);
  });
}

// render lista
function renderList(items){
  listaDiv.innerHTML = '';
  let total = 0;
  if (items.length === 0) {
    listaDiv.innerHTML = '<div class="col-12"><div class="alert alert-secondary">Nenhum cliente cadastrado.</div></div>';
    totalGeralSpan.textContent = '0,00';
    return;
  }
  items.forEach(c => {
    const restante = (c.valor_total - c.valor_pago);
    total += restante;
    const col = document.createElement('div');
    col.className = 'col-md-12 mb-2';
    col.innerHTML = `
      <div class="card p-3 client-card">
        <div class="d-flex justify-content-between">
          <h6>${escapeHtml(c.nome)}</h6>
          <div class="small-muted">Venc: ${escapeHtml(c.vencimento || '-')}</div>
        </div>
        <p class="mb-1">Total: R$ ${formatCurrency(c.valor_total)} — Pago: R$ ${formatCurrency(c.valor_pago)}</p>
        <p class="mb-2">Restante: <strong>R$ ${formatCurrency(restante)}</strong></p>
        <div>
          <button class="btn btn-sm btn-success me-2" data-action="pagar" data-id="${c.id}">Registrar pagamento</button>
          <button class="btn btn-sm btn-outline-primary me-2" data-action="editar" data-id="${c.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-action="remover" data-id="${c.id}">Remover</button>
        </div>
      </div>
    `;
    listaDiv.appendChild(col);
  });
  totalGeralSpan.textContent = formatCurrency(total);
}

// escape
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function formatCurrency(v){ return Number(v||0).toFixed(2).replace('.', ','); }

// CADASTRAR
formCadastrar.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const venc = document.getElementById('vencimento').value.trim();
  const valor = parseFloat(document.getElementById('valor_total').value) || 0;
  if (!nome || valor <= 0) return alert('Preencha nome e valor válido.');

  try {
    const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'clientes'), {
      nome, vencimento: venc, valor_total: valor, valor_pago: 0, createdAt: new Date()
    });
    formCadastrar.reset();
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
});

// Delegation click na lista (pagar/editar/remover)
listaDiv.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  const docRef = doc(db, 'users', currentUser.uid, 'clientes', id);

  if (action === 'remover') {
    if (!confirm('Remover esse cliente?')) return;
    await deleteDoc(docRef);
    return;
  }

  if (action === 'pagar') {
    // buscar doc
    // (simulate fetch by reading current rendered item - safer to getDoc, but we avoid extra call)
    const val = prompt('Valor recebido (use ponto ou vírgula):');
    if (val === null) return;
    const pago = parseFloat(String(val).replace(',', '.'));
    if (isNaN(pago) || pago <= 0) return alert('Valor inválido');
    // obter dados atuais e atualizar
    // read current doc then update: (we will call updateDoc with new valor)
    try {
      // we use updateDoc with FieldValue? simpler: get the document snapshot quickly via onSnapshot is live
      // but to avoid extra get, we will perform a transactional style naive read->update with getDoc not imported.
      // Simpler approach: updateDoc with valor_pago = increment (unsafe concurrency) -> use get then update
      // Use getDoc:
      const { getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
      const snap = await getDoc(docRef);
      if (!snap.exists()) return alert('Documento não encontrado');
      const data = snap.data();
      let novoPago = (data.valor_pago || 0) + pago;
      if (novoPago > (data.valor_total || 0)) novoPago = data.valor_total || 0;
      await updateDoc(docRef, { valor_pago: novoPago });
    } catch (err) {
      alert('Erro ao registrar pagamento: ' + err.message);
    }
    return;
  }

  if (action === 'editar') {
    try {
      const { getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");
      const snap = await getDoc(docRef);
      if (!snap.exists()) return alert('Documento não encontrado');
      const data = snap.data();
      const nome = prompt('Nome:', data.nome);
      if (nome === null) return;
      const venc = prompt('Vencimento:', data.vencimento || '');
      if (venc === null) return;
      const totalTxt = prompt('Valor total (R$):', (data.valor_total || 0));
      if (totalTxt === null) return;
      const total = parseFloat(String(totalTxt).replace(',', '.'));
      if (isNaN(total) || total < (data.valor_pago || 0)) return alert('Valor total inválido (menor que já pago).');
      await updateDoc(docRef, { nome: nome.trim(), vencimento: venc.trim(), valor_total: total });
    } catch (err) {
      alert('Erro ao editar: ' + err.message);
    }
    return;
  }
});
