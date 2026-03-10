/**
 * Data persistence and loading
 */

// Exported state containers
let invoices = [];
let expenses = [];

function loadAll(){
  invoices = JSON.parse(localStorage.getItem(LS_INVOICES) || "[]");
  expenses = JSON.parse(localStorage.getItem(LS_EXPENSES) || "[]");
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
}

function persistAll(){
  try{
    localStorage.setItem(LS_INVOICES, JSON.stringify(invoices));
    localStorage.setItem(LS_EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(LS_CAT_SORT, document.getElementById("catSortMode").value);
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
