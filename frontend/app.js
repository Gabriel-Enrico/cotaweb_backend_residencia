const API_URL = "http://localhost:3000";
const RESTAURANTE_ID = 1; // ID do restaurante para testes

// Toast
function toast(mensagem, tipo = "info", duracao = 3500) {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast toast-${tipo}`;

  const icones = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  el.innerHTML = `<span class="toast-icon">${icones[tipo] || "ℹ️"}</span><span>${mensagem}</span>`;
  container.appendChild(el);

  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, duracao);
}

function confirmar(mensagem) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modal-overlay");
    const texto = document.getElementById("modal-texto");
    const btnSim = document.getElementById("modal-sim");
    const btnNao = document.getElementById("modal-nao");

    texto.textContent = mensagem;
    overlay.classList.add("show");

    const fechar = (resposta) => {
      overlay.classList.remove("show");
      btnSim.removeEventListener("click", onSim);
      btnNao.removeEventListener("click", onNao);
      resolve(resposta);
    };

    const onSim = () => fechar(true);
    const onNao = () => fechar(false);

    btnSim.addEventListener("click", onSim);
    btnNao.addEventListener("click", onNao);
  });
}

function validarTelefone(tel) {
  const limpo = tel.replace(/\D/g, "");
  return /^(\d{10,11})$/.test(limpo);
}

function normalizarTelefone(tel) {
  return tel.replace(/\D/g, "");
}

function mascaraTelefone(input) {
  let valor = input.value.replace(/\D/g, "");
  
  if (valor.length > 0) {
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d)(\d{4})$/, "$1-$2");
  }

  input.value = valor;
}

// API
async function api(endpoint, options = {}) {
  const headers = {};

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

function renderFornecedor(f) {
  const lista = document.getElementById("listaFornecedores");
  const div = document.createElement("div");
  div.className = "item";
  div.dataset.id = f.id;

  const detalhes = [f.email, f.cnpj, f.contato_nome].filter(Boolean).join(" · ");

  div.innerHTML = `
    <span>
      <strong>${f.nome}</strong> — ${f.telefone}
      ${detalhes ? `<br/><small>${detalhes}</small>` : ""}
    </span>
    <div class="actions">
      <button onclick="editarFornecedor(${f.id}, this)">Editar</button>
      <button class="btn-remover" onclick="removerFornecedor(${f.id}, this)">Remover</button>
    </div>
  `;
  lista.appendChild(div);
}

function renderItem(item) {
  const lista = document.getElementById("listaItens");
  const div = document.createElement("div");
  div.className = "item";
  div.dataset.id = item.id;
  div.innerHTML = `
    <span>${item.produto} - ${item.quantidade} ${item.unidade}</span>
    <div class="actions">
      <button onclick="editarItem(${item.id}, this)">Editar</button>
      <button class="btn-remover" onclick="removerItem(${item.id}, this)">Remover</button>
    </div>
  `;
  lista.appendChild(div);
}

async function carregarFornecedores() {
  const lista = document.getElementById("listaFornecedores");
  lista.innerHTML = "";
  try {
    const fornecedores = await api(`/restaurantes/${RESTAURANTE_ID}/fornecedores`);
    fornecedores.forEach(renderFornecedor);
  } catch (err) {
    toast("Erro ao carregar fornecedores: " + err.message, "error");
  }
}

async function carregarItens() {
  const lista = document.getElementById("listaItens");
  lista.innerHTML = "";
  try {
    const itens = await api(`/restaurantes/${RESTAURANTE_ID}/itens`);
    itens.forEach(renderItem);
  } catch (err) {
    toast("Erro ao carregar itens: " + err.message, "error");
  }
}

async function addFornecedor() {
  const nome = document.getElementById("nomeFornecedor").value.trim();
  const tel = document.getElementById("telFornecedor").value.trim();
  const email = document.getElementById("emailFornecedor").value.trim();
  const cnpj = document.getElementById("cnpjFornecedor").value.trim();
  const contato_nome = document.getElementById("contatoFornecedor").value.trim();

  if (!nome) { toast("Informe o nome do fornecedor.", "warning"); return; }
  if (!tel) { toast("Informe o telefone do fornecedor.", "warning"); return; }
  if (!validarTelefone(tel)) { toast("Telefone inválido.", "error"); return; }

  try {
    const f = await api("/fornecedores", {
      method: "POST",
      body: JSON.stringify({ nome, restaurante_id: RESTAURANTE_ID, telefone: normalizarTelefone(tel), email, cnpj, contato_nome }),
    });
    renderFornecedor(f);
    ["nomeFornecedor", "telFornecedor", "emailFornecedor", "cnpjFornecedor", "contatoFornecedor"]
      .forEach(id => document.getElementById(id).value = "");
    toast(`Fornecedor "${f.nome}" adicionado!`, "success");
  } catch (err) {
    toast("Erro ao adicionar fornecedor: " + err.message, "error");
  }
}

async function editarFornecedor(id, btn) {
  const item = btn.closest(".item");
  const span = item.querySelector("span");

  // Busca dados atuais da API para não depender do que está renderizado
  const f = await api(`/fornecedores/${id}`);

  span.innerHTML = `
    <input class="edit-input" id="edit-nome-${id}" value="${f.nome}" placeholder="Nome *"/>
    <input class="edit-input" id="edit-tel-${id}" value="${f.telefone}" placeholder="Telefone *" oninput="mascaraTelefone(this)" maxlength="15"/>
    <input class="edit-input" id="edit-email-${id}" value="${f.email || ''}" placeholder="E-mail"/>
    <input class="edit-input" id="edit-cnpj-${id}" value="${f.cnpj || ''}" placeholder="CNPJ"/>
    <input class="edit-input" id="edit-contato-${id}" value="${f.contato_nome || ''}" placeholder="Nome do contato"/>
  `;
  btn.textContent = "Salvar";
  btn.onclick = () => salvarFornecedor(id, btn, span);
}

async function salvarFornecedor(id, btn, span) {
  const nome = document.getElementById(`edit-nome-${id}`).value.trim();
  const tel = document.getElementById(`edit-tel-${id}`).value.trim();
  const email = document.getElementById(`edit-email-${id}`).value.trim();
  const cnpj = document.getElementById(`edit-cnpj-${id}`).value.trim();
  const contato_nome = document.getElementById(`edit-contato-${id}`).value.trim();

  if (!nome || !tel) { toast("Nome e telefone são obrigatórios.", "warning"); return; }
  if (!validarTelefone(tel)) { toast("Telefone inválido.", "error"); return; }

  try {
    const f = await api(`/fornecedores/${id}`, {
      method: "PUT",
      body: JSON.stringify({ nome, telefone: normalizarTelefone(tel), email, cnpj, contato_nome }),
    });
    // Re-renderiza o card com os dados atualizados
    const item = span.closest(".item");
    item.replaceWith(criarElementoFornecedor(f));
    toast("Fornecedor atualizado!", "success");
  } catch (err) {
    toast("Erro ao editar: " + err.message, "error");
  }
}

async function removerFornecedor(id, btn) {
  const ok = await confirmar("Remover este fornecedor?");
  if (!ok) return;
  try {
    await api(`/fornecedores/${id}`, { method: "DELETE" });
    btn.closest(".item").remove();
    toast("Fornecedor removido.", "success");
  } catch (err) {
    toast("Erro ao remover: " + err.message, "error");
  }
}

async function addItem() {
  const produto = document.getElementById("produto").value.trim();
  const qtd = Number(document.getElementById("qtd").value);
  const unidade = document.getElementById("unidade").value;

  if (!produto) {
    toast("Informe o nome do produto.", "warning");
    return;
  }
  if (!qtd || qtd <= 0) {
    toast("Informe uma quantidade válida.", "warning");
    return;
  }

  try {
    const it = await api("/itens", {
      method: "POST",
      body: JSON.stringify({ produto, quantidade: qtd, unidade }),
    });
    renderItem(it);
    document.getElementById("produto").value = "";
    document.getElementById("qtd").value = "";
    toast(`Item "${it.produto}" adicionado!`, "success");
  } catch (err) {
    toast("Erro ao adicionar item: " + err.message, "error");
  }
}

async function editarItem(id, btn) {
  const item = btn.closest(".item");
  const span = item.querySelector("span");
  const partes = span.innerText.split(" - ");
  const produtoAtual = partes[0];
  const [qtdAtual, unidadeAtual] = partes[1].split(" ");

  span.innerHTML = `
    <input class="edit-input" id="edit-qtd-${id}" type="number" value="${qtdAtual}" placeholder="Qtd" style="width:80px"/>
    <select class="edit-input" id="edit-un-${id}">
      ${["un","kg","g","L","ml","cx","sacos","m","pct"].map(u =>
        `<option value="${u}" ${u === unidadeAtual ? "selected" : ""}>${u}</option>`
      ).join("")}
    </select>
  `;
  btn.textContent = "Salvar";
  btn.onclick = () => salvarItem(id, btn, span, produtoAtual, qtdAtual, unidadeAtual);
}

async function salvarItem(id, btn, span, produto, qtdAnterior, unAnterior) {
  const novaQtd = Number(document.getElementById(`edit-qtd-${id}`).value);
  const novaUn = document.getElementById(`edit-un-${id}`).value;

  if (!novaQtd || novaQtd <= 0) {
    toast("Quantidade inválida.", "warning");
    return;
  }

  try {
    const it = await api(`/itens/${id}`, {
      method: "PUT",
      body: JSON.stringify({ quantidade: novaQtd, unidade: novaUn }),
    });
    span.innerText = `${it.produto} - ${it.quantidade} ${it.unidade}`;
    btn.textContent = "Editar";
    btn.onclick = () => editarItem(id, btn);
    toast("Item atualizado!", "success");
  } catch (err) {
    span.innerText = `${produto} - ${qtdAnterior} ${unAnterior}`;
    btn.textContent = "Editar";
    btn.onclick = () => editarItem(id, btn);
    toast("Erro ao editar: " + err.message, "error");
  }
}

async function removerItem(id, btn) {
  const ok = await confirmar("Remover este item?");
  if (!ok) return;
  try {
    await api(`/itens/${id}`, { method: "DELETE" });
    btn.closest(".item").remove();
    toast("Item removido.", "success");
  } catch (err) {
    toast("Erro ao remover: " + err.message, "error");
  }
}

function abrirImportacao(tipo) {
  document.getElementById("modal-import").classList.add("show");
  document.getElementById("import-tipo").value = tipo;
  document.getElementById("import-textarea").value = "";
  document.getElementById("import-titulo").textContent =
    tipo === "fornecedores"
      ? "Colar lista de fornecedores"
      : "Colar lista de pedidos";
  document.getElementById("import-dica").textContent =
    tipo === "fornecedores"
      ? 'Cole os contatos do WhatsApp. Cada linha: "Nome - 11987654321"'
      : 'Cole a lista de pedidos. Cada linha: "Produto - quantidade unidade"\nOu use o formato WhatsApp: "Alcatra – 3 CX"';
}

function fecharImportacao() {
  document.getElementById("modal-import").classList.remove("show");
}

async function processarImportacao() {
  const tipo = document.getElementById("import-tipo").value;
  const texto = document.getElementById("import-textarea").value.trim();
  if (!texto) {
    toast("Cole algum conteúdo antes de importar.", "warning");
    return;
  }

  const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);
  let importados = 0;
  let erros = 0;

  for (const linha of linhas) {
    // Ignora linhas que são apenas departamento (ex: "PROTEÍNAS", "MERCEARIA")
    if (/^[A-ZÁÀÃÉÍÓÚÜÇ\s+]+$/.test(linha) && linha.length < 30) continue;

    if (tipo === "fornecedores") {
      // Tenta separar "Nome - telefone" ou "Nome: telefone"
      const match = linha.match(/^(.+?)[\-–:]\s*(\d[\d\s\(\)\-]+)$/);
      if (!match) { erros++; continue; }
      const nome = match[1].trim();
      const tel = normalizarTelefone(match[2]);
      if (!validarTelefone(tel)) { erros++; continue; }
      try {
        const f = await api("/fornecedores", {
          method: "POST",
          body: JSON.stringify({ nome, telefone: tel }),
        });
        renderFornecedor(f);
        importados++;
      } catch { erros++; }

    } else {
      // Tenta separar "Produto – quantidade unidade" ou "Produto - N cx"
      const match = linha.match(/^(.+?)[\-–]\s*(\d+(?:[.,]\d+)?)\s*([a-zA-ZÀ-ÿ]+)?$/);
      if (!match) { erros++; continue; }
      const produto = match[1].trim();
      const quantidade = parseFloat(match[2].replace(",", "."));
      const unidade = match[3]?.toLowerCase() || "un";
      const unMap = { cx: "cx", kg: "kg", g: "g", l: "L", ml: "ml", un: "un", pct: "pct", sacos: "sacos", m: "m" };
      const unNorm = unMap[unidade] || "un";
      try {
        const it = await api("/itens", {
          method: "POST",
          body: JSON.stringify({ produto, quantidade, unidade: unNorm }),
        });
        renderItem(it);
        importados++;
      } catch { erros++; }
    }
  }

  fecharImportacao();
  if (importados > 0) toast(`${importados} item(s) importado(s) com sucesso!`, "success");
  if (erros > 0) toast(`${erros} linha(s) não reconhecida(s) e ignorada(s).`, "warning");
}

function exportarCSV(tipo) {
  const itens = document.querySelectorAll(`#lista${tipo === "fornecedores" ? "Fornecedores" : "Itens"} .item span`);
  if (itens.length === 0) {
    toast("Nenhum dado para exportar.", "warning");
    return;
  }

  let csv = tipo === "fornecedores"
    ? "Nome,Telefone\n"
    : "Produto,Quantidade,Unidade\n";

  itens.forEach(span => {
    const texto = span.innerText;
    if (tipo === "fornecedores") {
      const [nome, tel] = texto.split(" - ");
      csv += `"${nome}","${tel}"\n`;
    } else {
      const partes = texto.split(" - ");
      const produto = partes[0];
      const [qtd, un] = partes[1].split(" ");
      csv += `"${produto}","${qtd}","${un}"\n`;
    }
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cotaweb_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Exportado com sucesso!", "success");
}

function exportarJSON(tipo) {
  const itens = document.querySelectorAll(`#lista${tipo === "fornecedores" ? "Fornecedores" : "Itens"} .item`);
  if (itens.length === 0) {
    toast("Nenhum dado para exportar.", "warning");
    return;
  }

  const dados = [];
  itens.forEach(el => {
    const id = el.dataset.id;
    const texto = el.querySelector("span").innerText;
    if (tipo === "fornecedores") {
      const [nome, telefone] = texto.split(" - ");
      dados.push({ id, nome, telefone });
    } else {
      const partes = texto.split(" - ");
      const produto = partes[0];
      const [quantidade, unidade] = partes[1].split(" ");
      dados.push({ id, produto, quantidade, unidade });
    }
  });

  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cotaweb_${tipo}_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Exportado com sucesso!", "success");
}

async function enviarWhatsApp() {
  const fornecedores = document.querySelectorAll("#listaFornecedores .item");
  const itens = document.querySelectorAll("#listaItens .item");

  if (fornecedores.length === 0 || itens.length === 0) {
    toast("Adicione fornecedores e itens antes de enviar!", "warning");
    return;
  }

  let mensagem = "📋 *Cotação - CotaWeb*\n\n";
  mensagem += "🛒 *Itens:*\n";
  itens.forEach(item => {
    mensagem += "- " + item.querySelector("span").innerText + "\n";
  });
  mensagem += "\n🏢 *Fornecedores:*\n";
  fornecedores.forEach(f => {
    mensagem += "- " + f.querySelector("span").innerText + "\n";
  });
  mensagem += "\n📲 Aguardo retorno com os valores. Obrigado!";

  const mensagemCodificada = encodeURIComponent(mensagem);
  const primeiroTel = fornecedores[0]
    .querySelector("span")
    .innerText.split(" - ")[1]
    .replace(/\D/g, "");

  window.open(`https://wa.me/55${primeiroTel}?text=${mensagemCodificada}`, "_blank");
}

window.addEventListener("DOMContentLoaded", () => {
  carregarFornecedores();
  carregarItens();
});