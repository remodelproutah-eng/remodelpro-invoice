/**
 * App initialization and event wiring
 */

// Clients page rendering with drill-down details
function renderClientsPage(){
  var list = document.getElementById("clientsList");
  var empty = document.getElementById("clientsEmpty");
  var q = (document.getElementById("clientSearch").value || "").trim().toLowerCase();
  var clients = getClientsFromData().filter(function(c){ return !q || c.toLowerCase().includes(q); });

  var selectedClient = "";

  list.innerHTML = "";
  empty.style.display = clients.length ? "none" : "block";

  clients.forEach(function(c){
    var t = clientTotals(c);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary";
    btn.style.width = "100%";
    btn.style.textAlign = "left";
    btn.innerHTML =
      "<strong>" + esc(c) + "</strong>" +
      "<div class='hint'>Revenue: $" + fmtMoney(t.rev) +
      " - Expenses: $" + fmtMoney(t.exp) +
      " - Profit: $" + fmtMoney(t.profit) + "</div>";

    btn.addEventListener("click", function(){
      selectedClient = (selectedClient === c) ? "" : c;
      renderClientsPage();
    });

    list.appendChild(btn);

    if (selectedClient === c){
      var hub = document.createElement("div");
      hub.style.marginTop = "10px";
      hub.style.background = "#fff";
      hub.style.border = "1px solid #eee";
      hub.style.borderRadius = "14px";
      hub.style.padding = "12px";

      var docs = getClientDocs(c);
      var exps = getClientExpenses(c);
      var latest = docs[0] || null;

      var docsHTML = docs.slice(0,10).map(function(d){
        var badge = d.type === "estimate" ? "badge badge-estimate" : "badge badge-invoice";
        var label = d.type === "estimate" ? "Estimate" : "Invoice";
        return (
          "<div class='card' style='margin-top:10px;background:#fafafa;'>" +
            "<div style='display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;'>" +
              "<div>" +
                "<div class='" + badge + "'>" + label + "</div>" +
                "<div><strong>" + esc(d.num || "") + "</strong></div>" +
                "<div class='hint'>Total: $" + fmtMoney(d.total || 0) + "</div>" +
              "</div>" +
              "<div style='display:flex;gap:8px;flex-wrap:wrap;'>" +
                "<button class='btn btn-secondary btn-sm' type='button' data-act='editDoc' data-id='" + d.id + "'>Edit</button>" +
                "<button class='btn btn-primary btn-sm' type='button' data-act='openDoc' data-id='" + d.id + "'>View</button>" +
              "</div>" +
            "</div>" +
          "</div>"
        );
      }).join("");

      var expHTML = exps.slice(0,8).map(function(e){
        return (
          "<div class='card' style='margin-top:10px;background:#fafafa;'>" +
            "<div style='display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;'>" +
              "<div>" +
                "<div><strong>" + esc(e.date || "") + "</strong> - " + esc(e.category || "") + "</div>" +
                "<div class='hint'>" + esc(e.description || "") + "</div>" +
              "</div>" +
              "<div style='text-align:right;font-weight:800;'>$" + fmtMoney(e.amount || 0) + "</div>" +
            "</div>" +
          "</div>"
        );
      }).join("");

      hub.innerHTML =
        "<div style='display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start;'>" +
          "<div>" +
            "<div style='font-size:1.15rem;font-weight:800;'>" + esc(c) + "</div>" +
            "<div class='hint'>Docs: " + docs.length + " - Expenses: " + exps.length + "</div>" +
          "</div>" +
          "<div style='display:flex;gap:8px;flex-wrap:wrap;'>" +
            (latest ? "<button class='btn btn-primary btn-sm' type='button' data-act='openLatest' data-id='" + latest.id + "'>Open Latest</button>" : "") +
            "<button class='btn btn-secondary btn-sm' type='button' data-act='goExpenses'>View Expenses</button>" +
          "</div>" +
        "</div>" +
        "<div class='section-divider' style='margin:12px 0;'></div>" +
        "<div class='card' style='background:#fff;'>" +
          "<h3 style='margin:0 0 6px;'>Documents</h3>" +
          (docsHTML || "<div class='hint'>No documents yet for this client.</div>") +
        "</div>" +
        "<div class='card' style='background:#fff;'>" +
          "<h3 style='margin:0 0 6px;'>Recent Expenses</h3>" +
          (expHTML || "<div class='hint'>No expenses yet for this client.</div>") +
        "</div>";

      list.appendChild(hub);

      hub.querySelectorAll("[data-act='editDoc']").forEach(function(b){
        b.addEventListener("click", function(){
          var id = Number(b.getAttribute("data-id"));
          loadDocIntoForm(id);
          showPage("invoices");
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });

      hub.querySelectorAll("[data-act='openDoc']").forEach(function(b){
        b.addEventListener("click", function(){
          var id = Number(b.getAttribute("data-id"));
          openDrawerForDoc(id);
          showPage("invoices");
          setTimeout(function(){
            var el = document.getElementById("docCard_" + id);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        });
      });

      var goExpenses = hub.querySelector("[data-act='goExpenses']");
      if (goExpenses){
        goExpenses.addEventListener("click", function(){
          showPage("expenses");
          document.getElementById("expenseFilterClient").value = c;
          document.getElementById("expenseSearchDetails").open = true;
          renderExpensesTable();
        });
      }

      var openLatest = hub.querySelector("[data-act='openLatest']");
      if (openLatest){
        openLatest.addEventListener("click", function(){
          var id = Number(openLatest.getAttribute("data-id"));
          loadDocIntoForm(id);
          showPage("invoices");
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }
  });
}

// Wire all event listeners
function wireEvents(){
  wireNav();

  document.getElementById("docType").addEventListener("change", updateNumberLabel);
  document.getElementById("catSortMode").addEventListener("change", function(){ persistAll(); });

  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("saveInvoiceBtn").addEventListener("click", saveDoc);
  document.getElementById("legalToggle").addEventListener("change", function(){ /* no-op for persistence? */ });
  document.getElementById("newDocBtn").addEventListener("click", newDoc);

  document.getElementById("docSearch").addEventListener("input", renderDocList);

  document.getElementById("expenseForm").addEventListener("submit", addExpenseFromForm);
  document.getElementById("expenseSearch").addEventListener("input", renderExpensesTable);
  document.getElementById("expenseFilterClient").addEventListener("change", renderExpensesTable);
  document.getElementById("expenseFilterCategory").addEventListener("change", renderExpensesTable);
  document.getElementById("clearExpenseFiltersBtn").addEventListener("click", function(){
    document.getElementById("expenseSearch").value = "";
    document.getElementById("expenseFilterClient").value = "";
    document.getElementById("expenseFilterCategory").value = "";
    renderExpensesTable();
  });

  document.getElementById("receiptFileGallery").addEventListener("change", function(e){
    onReceiptChosen(e.target.files && e.target.files[0]);
  });
  document.getElementById("receiptFileCamera").addEventListener("change", function(e){
    onReceiptChosen(e.target.files && e.target.files[0]);
  });
  document.getElementById("scanReceiptBtn").addEventListener("click", scanReceiptOCR);
  document.getElementById("clearReceiptBtn").addEventListener("click", clearReceiptUI);

  document.getElementById("clientSearch").addEventListener("input", renderClientsPage);

  document.getElementById("bizRange6m").addEventListener("click", function(){ setChartRangeMonths(6); renderBusinessPage(); });
  document.getElementById("bizRange12m").addEventListener("click", function(){ setChartRangeMonths(12); renderBusinessPage(); });
  document.getElementById("bizCategory").addEventListener("change", renderBusinessDrilldown);
  document.getElementById("bizTime").addEventListener("change", renderBusinessDrilldown);
  document.getElementById("bizSearch").addEventListener("input", renderBusinessDrilldown);

  document.getElementById("monthlyProfitChart").addEventListener("click", function(){
    var months = monthlyBuckets(6);
    var vals = months.map(function(m){
      var income = invoices
        .filter(function(d){ return d.type === "invoice"; })
        .filter(function(d){
          var dd = parseISO(d.date);
          return dd && dd.getFullYear() === m.year && dd.getMonth() === m.month;
        })
        .reduce(function(s,d){ return s + Number(d.total||0); }, 0);

      var spend = expenses
        .filter(function(e){
          var dd = parseISO(e.date);
          return dd && dd.getFullYear() === m.year && dd.getMonth() === m.month;
        })
        .reduce(function(s,e){ return s + Number(e.amount||0); }, 0);

      return income - spend;
    });

    openChartModal("Monthly Profit", function(c){ drawBarChart(c, months.map(function(m){ return m.key; }), vals); });
  });

  document.getElementById("profitByClientChart").addEventListener("click", function(){
    var clients = getClientsFromData();
    var rows = clients.map(function(c){
      var lc = c.trim().toLowerCase();
      var rev = invoices
        .filter(function(d){ return d.type === "invoice" && String(d.name||"").trim().toLowerCase() === lc; })
        .reduce(function(s,d){ return s + Number(d.total||0); }, 0);
      var exp = expenses
        .filter(function(e){ return String(e.client||"").trim().toLowerCase() === lc; })
        .reduce(function(s,e){ return s + Number(e.amount||0); }, 0);
      return { client:c, profit: rev - exp };
    }).sort(function(a,b){ return b.profit - a.profit; }).slice(0,8);

    openChartModal("Profit by Client", function(c){ drawBarChart(c, rows.map(function(r){ return r.client; }), rows.map(function(r){ return r.profit; })); });
  });

  document.getElementById("expensePieChart").addEventListener("click", function(){
    var now = new Date();
    var y0 = startOfYear(now);
    var pieMap = new Map();
    expenses.forEach(function(e){
      var dd = parseISO(e.date);
      if (!dd || dd < y0) return;
      var k = e.category || "Other";
      pieMap.set(k, (pieMap.get(k) || 0) + Number(e.amount||0));
    });
    var labels = Array.from(pieMap.keys()).sort(function(a,b){ return a.localeCompare(b); });
    var values = labels.map(function(k){ return pieMap.get(k) || 0; });
    openChartModal("Expense Breakdown (YTD)", function(c){ drawPieChart(c, labels, values); });
  });

  document.getElementById("closeModalBtn").addEventListener("click", closeChartModal);
  document.getElementById("chartModal").addEventListener("click", function(e){
    if (e.target.id === "chartModal") closeChartModal();
  });
}

// Initialize app
function init(options){
  var opts = options || {};
  if (!opts.skipLoad) loadAll();

  document.getElementById("invoiceDate").value = todayISO();
  document.getElementById("expenseDate").value = todayISO();

  setItems([{ category:"", description:"", qty:1, rate:"" }]);
  updateNumberLabel();
  renderItems();
  renderDocList();

  refreshClientDropdowns();
  renderClientsPage();
  renderBusinessPage();

  wireEvents();

  var tab = localStorage.getItem(LS_DEFAULT_TAB) || "invoices";
  showPage(tab);
}

function startApp(options){
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ init(options); }, { once: true });
  } else {
    init(options);
  }
}

window.startApp = startApp;
