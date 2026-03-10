/**
 * Navigation and UI state management
 */

function setActiveMenu(page){
  var map = { clients:"mClients", invoices:"mInvoices", expenses:"mExpenses", business:"mBusiness" };
  Object.keys(map).forEach(function(k){
    var el = document.getElementById(map[k]);
    if (el) el.classList.toggle("active", k === page);
  });
  var pill = document.getElementById("pagePill");
  pill.textContent =
    page === "clients" ? "Clients" :
    page === "expenses" ? "Expenses" :
    page === "business" ? "Business" :
    "Estimates / Invoices";
}

function showPage(page){
  var clients = document.getElementById("clientsPage");
  var inv = document.getElementById("invoicePage");
  var exp = document.getElementById("expensesPage");
  var biz = document.getElementById("businessPage");

  clients.style.display = (page === "clients") ? "block" : "none";
  inv.style.display = (page === "invoices") ? "block" : "none";
  exp.style.display = (page === "expenses") ? "block" : "none";
  biz.style.display = (page === "business") ? "block" : "none";

  localStorage.setItem(LS_DEFAULT_TAB, page);
  setActiveMenu(page);
}

function toggleMenu(open){
  var m = document.getElementById("navMenu");
  if (typeof open === "boolean"){ m.classList.toggle("open", open); return; }
  m.classList.toggle("open");
}

function wireNav(){
  document.getElementById("hamburgerBtn").addEventListener("click", function(e){
    e.stopPropagation();
    toggleMenu();
  });

  document.getElementById("navMenu").addEventListener("click", function(e){
    var btn = e.target.closest("button[data-page]");
    if (!btn) return;
    var page = btn.getAttribute("data-page");
    toggleMenu(false);
    showPage(page);
  });

  document.addEventListener("click", function(e){
    var menu = document.getElementById("navMenu");
    var wrap = document.querySelector(".menu-wrap");
    if (wrap && menu && !wrap.contains(e.target)) menu.classList.remove("open");
  });
}
