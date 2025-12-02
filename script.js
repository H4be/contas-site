// =============================
// Banco de dados simples (localStorage)
// =============================
function carregarClientes() {
    return JSON.parse(localStorage.getItem("clientes")) || [];
}

function salvarClientes(clientes) {
    localStorage.setItem("clientes", JSON.stringify(clientes));
}

// =============================
// Adicionar cliente
// =============================
function adicionarCliente() {
    const nome = document.getElementById("nome").value;
    const vencimento = document.getElementById("vencimento").value;
    const valor = parseFloat(document.getElementById("valor").value);

    if (!nome || !vencimento || !valor) {
        alert("Preencha todos os campos!");
        return;
    }

    const clientes = carregarClientes();

    clientes.push({
        nome: nome,
        vencimento: vencimento,
        valor: valor,
        pago: 0
    });

    salvarClientes(clientes);

    alert("Cliente cadastrado com sucesso!");
    listarClientes();
}

// =============================
// Listar clientes
// =============================
function listarClientes() {
    const lista = document.getElementById("listaClientes");
    const clientes = carregarClientes();

    lista.innerHTML = "";

    clientes.forEach((c, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${c.nome}</strong>  
            — Vencimento: ${c.vencimento}  
            — Valor: R$ ${c.valor.toFixed(2)}  
            — Pago: R$ ${c.pago.toFixed(2)}
            <button onclick="removerCliente(${i})">Remover</button>
        `;
        lista.appendChild(li);
    });
}

// =============================
// Remover cliente
// =============================
function removerCliente(index) {
    const clientes = carregarClientes();

    if (confirm("Tem certeza que deseja remover este cliente?")) {
        clientes.splice(index, 1);
        salvarClientes(clientes);
        listarClientes();
    }
}

// =============================
// Pagamento
// =============================
function registrarPagamento() {
    const index = document.getElementById("clienteIndex").value;
    const valorPago = parseFloat(document.getElementById("valorPago").value);

    const clientes = carregarClientes();

    if (!clientes[index]) {
        alert("Cliente inválido.");
        return;
    }

    clientes[index].pago += valorPago;
    salvarClientes(clientes);

    alert("Pagamento registrado!");
    listarClientes();
}

// =============================
// Carregar clientes na página
// =============================
window.onload = () => {
    listarClientes();
};
