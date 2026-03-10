/**
 * Data persistence and loading
 */

// Exported state containers
let invoices = [];
let expenses = [];
let deletedInvoiceMap = {};
let deletedExpenseMap = {};

function normalizeDeletedMap(val){
  if (!val || typeof val !== "object" || Array.isArray(val)) return {};
  return val;
}

function markInvoiceDeleted(id){
  deletedInvoiceMap[String(id)] = Date.now();
}

function markExpenseDeleted(id){
  deletedExpenseMap[String(id)] = Date.now();
}

function getDeletedInvoiceMap(){ return deletedInvoiceMap; }
function getDeletedExpenseMap(){ return deletedExpenseMap; }

function generateId(){
  return Date.now() + Math.floor(Math.random() * 1000);
}

function ensureIdsAndTimestamps(){
  var now = Date.now();
  invoices.forEach(function(d){
    if (d.id == null) d.id = generateId();
    if (!d.createdAt) d.createdAt = now;
    if (!d.updatedAt) d.updatedAt = d.createdAt;
  });
  expenses.forEach(function(e){
    if (e.id == null) e.id = generateId();
    if (!e.createdAt) e.createdAt = now;
    if (!e.updatedAt) e.updatedAt = e.createdAt;
  });
}

function loadAll(){
  invoices = JSON.parse(localStorage.getItem(LS_INVOICES) || "[]");
  expenses = JSON.parse(localStorage.getItem(LS_EXPENSES) || "[]");
  deletedInvoiceMap = normalizeDeletedMap(JSON.parse(localStorage.getItem(LS_DELETED_INVOICES) || "{}"));
  deletedExpenseMap = normalizeDeletedMap(JSON.parse(localStorage.getItem(LS_DELETED_EXPENSES) || "{}"));
  if (!Array.isArray(invoices)) invoices = [];
  if (!Array.isArray(expenses)) expenses = [];

  var savedSort = localStorage.getItem(LS_CAT_SORT);
  if (savedSort){
    document.getElementById("catSortMode").value = savedSort;
  } else {
    document.getElementById("catSortMode").value = "construction";
    localStorage.setItem(LS_CAT_SORT, "construction");
  }

  invoices = invoices.map(function(d){
    var newItems = (d.items || []).map(function(it){
      var cat = it.category || "";
      var desc = it.description || "";
      var qty = (it.qty !== undefined && it.qty !== null) ? it.qty : 1;
      var rate = (it.rate !== undefined && it.rate !== null) ? it.rate : (it.amount != null ? it.amount : "");
      return { category: cat, description: desc, qty: qty, rate: rate };
    });
    var copy = Object.assign({}, d);
    copy.items = newItems;
    return copy;
  });

  expenses = expenses.map(function(e){
    if (e.client) return e;
    var clientGuess = e.clientName || e.jobName || "";
    var copy = Object.assign({}, e);
    copy.client = clientGuess || "";
    return copy;
  });

  var deletedInvoices = new Set(Object.keys(deletedInvoiceMap || {}));
  var deletedExpenses = new Set(Object.keys(deletedExpenseMap || {}));
  invoices = invoices.filter(function(d){ return !deletedInvoices.has(String(d.id)); });
  expenses = expenses.filter(function(e){ return !deletedExpenses.has(String(e.id)); });

  ensureIdsAndTimestamps();
}

function persistAll(){
  try{
    localStorage.setItem(LS_INVOICES, JSON.stringify(invoices));
    localStorage.setItem(LS_EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(LS_CAT_SORT, document.getElementById("catSortMode").value);
    localStorage.setItem(LS_DELETED_INVOICES, JSON.stringify(deletedInvoiceMap));
    localStorage.setItem(LS_DELETED_EXPENSES, JSON.stringify(deletedExpenseMap));
    if (window.onLocalDataChanged && !window.suppressLocalSync) window.onLocalDataChanged();
  }catch(e){
    console.error('persistAll error', e);
  }
}

function getClientsFromData(){
  var set = new Set();
  invoices.forEach(function(d){ if (d.name) set.add(String(d.name).trim()); });
  expenses.forEach(function(e){ if (e.client) set.add(String(e.client).trim()); });
  return Array.from(set).filter(Boolean).sort(function(a,b){ return a.localeCompare(b); });
}

function clientTotals(client){
  var lc = client.trim().toLowerCase();
  var rev = invoices
    .filter(function(d){ return String(d.type) === "invoice" && String(d.name || "").trim().toLowerCase() === lc; })
    .reduce(function(s,d){ return s + Number(d.total || 0); }, 0);

  var exp = expenses
    .filter(function(e){ return String(e.client || "").trim().toLowerCase() === lc; })
    .reduce(function(s,e){ return s + Number(e.amount || 0); }, 0);

  return { rev: rev, exp: exp, profit: rev - exp };
}

function getClientDocs(client){
  var lc = client.trim().toLowerCase();
  return invoices
    .filter(function(d){ return String(d.name || "").trim().toLowerCase() === lc; })
    .slice()
    .sort(function(a,b){ return b.id - a.id; });
}

function getClientExpenses(client){
  var lc = client.trim().toLowerCase();
  return expenses
    .filter(function(e){ return String(e.client || "").trim().toLowerCase() === lc; })
    .slice()
    .sort(function(a,b){
      var ta = (parseISO(a.date) ? parseISO(a.date).getTime() : 0);
      var tb = (parseISO(b.date) ? parseISO(b.date).getTime() : 0);
      return (tb - ta) || (b.id - a.id);
    });
}
