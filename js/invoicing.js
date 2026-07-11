/**
 * Invoice/Estimate document management and rendering
 */

let items = [];
let currentId = null;

function setItems(newItems) { items = newItems; }
function getItems() { return items; }
function setCurrentId(id) { currentId = id; }

function updateNumberLabel(){
  var type = document.getElementById("docType").value;
  document.getElementById("numberLabel").textContent = (type === "estimate") ? "Estimate #" : "Invoice #";
  if (!currentId){
    document.getElementById("invoiceNumber").placeholder = (type === "estimate") ? "EST-001" : "INV-001";
  }
  var due = document.getElementById("dueDate");
  if (type === "estimate"){
    due.disabled = true;
    due.style.opacity = 0.6;
    due.value = "";
  } else {
    due.disabled = false;
    due.style.opacity = 1;
  }
}

function nextNumber(type){
  var key = (type === "estimate") ? "next_est" : "next_inv";
  var n = parseInt(localStorage.getItem(key) || "1", 10);
  localStorage.setItem(key, String(n + 1));
  return (type === "estimate" ? "EST-" : "INV-") + String(n).padStart(3, "0");
}

function addItem(){
  items.push({ category:"", description:"", qty:1, rate:"" });
  renderItems();
}

function renderItems(){
  var body = document.getElementById("itemsBody");
  body.innerHTML = "";

  items.forEach(function(it, i){
    var tr = document.createElement("tr");

    var options = "<option value=''></option>" +
      CATEGORIES.map(function(cat){
        return "<option value='" + cat + "'" + (it.category === cat ? " selected" : "") + ">" + cat + "</option>";
      }).join("");

    var qtyVal = (it.qty === "" || it.qty === null || it.qty === undefined) ? 1 : it.qty;

    tr.innerHTML =
      "<td><select>" + options + "</select></td>" +
      "<td><input spellcheck='true' value='" + esc(it.description || "") + "'></td>" +
      "<td class='right'><input style='max-width:90px' type='number' step='1' min='0' value='" + esc(qtyVal) + "'></td>" +
      "<td class='right'><input inputmode='decimal' type='number' step='0.01' value='" + esc(it.rate == null ? "" : it.rate) + "'></td>" +
      "<td class='right' data-line='1'>TBD</td>" +
      "<td><button type='button' class='btn btn-danger btn-sm'>X</button></td>";

    var sel = tr.children[0].querySelector("select");
    var descInput = tr.children[1].querySelector("input");
    var qtyInput = tr.children[2].querySelector("input");
    var rateInput = tr.children[3].querySelector("input");
    var lineTd = tr.querySelector("[data-line]");

    function updateLineAndTotal(){
      var qn = Math.max(0, parseFloat(items[i].qty || 0) || 0);
      var rn = parseNum(items[i].rate);
      var line = (rn === null) ? null : (qn * rn);
      if (line !== null && isDiscount(items[i].category)) line = -Math.abs(line);
      lineTd.textContent = (line === null) ? "TBD" : ("$" + fmtMoney(line));
      recalc();
    }

    sel.addEventListener("change", function(e){
      items[i].category = e.target.value;
      updateLineAndTotal();
    });

    descInput.addEventListener("input", function(e){
      items[i].description = e.target.value;
    });
    descInput.addEventListener("blur", function(e){
      e.target.value = capitalizeWords(e.target.value);
      items[i].description = e.target.value;
    });

    qtyInput.addEventListener("input", function(e){
      items[i].qty = e.target.value;
      updateLineAndTotal();
    });

    rateInput.addEventListener("input", function(e){
      items[i].rate = e.target.value;
      updateLineAndTotal();
    });

    tr.children[5].querySelector("button").addEventListener("click", function(){
      items.splice(i, 1);
      if (items.length === 0) items.push({ category:"", description:"", qty:1, rate:"" });
      renderItems();
    });

    body.appendChild(tr);
    updateLineAndTotal();
  });

  recalc();
}

function recalc(){
  var t = computeTotals(items).total;
  document.getElementById("invoiceTotal").textContent = fmtMoney(t);
}

function saveDoc(){
  var type = document.getElementById("docType").value;
  var name = document.getElementById("clientName").value.trim();
  var num = document.getElementById("invoiceNumber").value.trim();
  var phone = document.getElementById("clientPhone").value.trim();
  var email = document.getElementById("clientEmail").value.trim();
  name = capitalizeWords(name);
  var date = document.getElementById("invoiceDate").value;
  var due = document.getElementById("dueDate").value;
  var legal = document.getElementById("legalToggle").checked;

  if (!name) return alert("Client name required.");

  if (!num){
    num = nextNumber(type);
    document.getElementById("invoiceNumber").value = num;
  }

  var total = computeTotals(items).total;
  var existing = currentId ? invoices.find(function(d){ return d.id === currentId; }) : null;
  var createdAt = existing && existing.createdAt ? existing.createdAt : Date.now();

  var data = {
    id: currentId || Date.now(),
    createdAt: createdAt,
    updatedAt: Date.now(),
    type: type,
    name: name,
    phone: phone || "",
    email: email || "",
    num: num,
    date: date,
    due: (type === "invoice" ? (due || "") : ""),
    legal: legal || false,
    total: total,
    items: items.map(function(it){
      return {
        category: it.category || "",
        description: capitalizeWords(it.description || ""),
        qty: (it.qty == null ? 1 : it.qty),
        rate: (it.rate == null ? "" : it.rate)
      };
    })
  };

  if (currentId){
    var idx = invoices.findIndex(function(d){ return d.id === currentId; });
    if (idx !== -1) invoices[idx] = data;
  } else {
    invoices.push(data);
  }

  currentId = data.id;

  localStorage.setItem(LS_LAST_CLIENT, name);
  persistAll();
  renderDocList();
}

function loadDocIntoForm(id){
  var d = invoices.find(function(x){ return x.id === id; });
  if (!d) return;

  currentId = d.id;

  document.getElementById("docType").value = d.type;
  document.getElementById("clientName").value = d.name || "";
  document.getElementById("clientName").value = capitalizeWords(document.getElementById("clientName").value);
  document.getElementById("clientName").addEventListener("blur", function(e){
    e.target.value = capitalizeWords(e.target.value);
  });
  document.getElementById("clientPhone").value = d.phone || "";
  document.getElementById("clientEmail").value = d.email || "";
  document.getElementById("invoiceNumber").value = d.num || "";
  document.getElementById("invoiceDate").value = d.date || "";
  document.getElementById("dueDate").value = d.due || "";
  document.getElementById("legalToggle").checked = !!d.legal;

  items = (d.items || []).map(function(it){
    return {
      category: it.category || "",
      description: it.description || "",
      qty: (it.qty !== undefined && it.qty !== null) ? it.qty : 1,
      rate: (it.rate !== undefined && it.rate !== null) ? it.rate : (it.amount != null ? it.amount : "")
    };
  });
  if (items.length === 0) items.push({ category:"", description:"", qty:1, rate:"" });

  updateNumberLabel();
  renderItems();
}

function newDoc(){
  currentId = null;
  document.getElementById("docType").value = "estimate";
  document.getElementById("clientName").value = "";
  document.getElementById("clientName").addEventListener("blur", function(e){
    e.target.value = capitalizeWords(e.target.value);
  });
  document.getElementById("clientPhone").value = "";
  document.getElementById("clientEmail").value = "";
  document.getElementById("invoiceNumber").value = "";
  document.getElementById("invoiceDate").value = todayISO();
  document.getElementById("dueDate").value = "";
  document.getElementById("legalToggle").checked = false;

  items = [{ category:"", description:"", qty:1, rate:"" }];
  updateNumberLabel();
  renderItems();
}

function getCategoryOrder(keys){
  var sortMode = document.getElementById("catSortMode").value || "construction";
  var hasDiscount = keys.some(function(k){ return isDiscount(k); });
  var nonDiscount = keys.filter(function(k){ return !isDiscount(k); });

  if (sortMode === "alpha"){
    nonDiscount.sort(function(a,b){ return String(a||"").localeCompare(String(b||"")); });
  } else {
    var idx = new Map(CONSTRUCTION_ORDER.map(function(c,i){ return [c.toLowerCase(), i]; }));
    nonDiscount.sort(function(a,b){
      var ia = idx.has(String(a||"").toLowerCase()) ? idx.get(String(a||"").toLowerCase()) : 999;
      var ib = idx.has(String(b||"").toLowerCase()) ? idx.get(String(b||"").toLowerCase()) : 999;
      if (ia !== ib) return ia - ib;
      return String(a||"").localeCompare(String(b||""));
    });
  }
  if (hasDiscount){
    var disc = keys.find(function(k){ return isDiscount(k); });
    nonDiscount.push(disc);
  }
  return nonDiscount;
}

function buildPrintHeaderHTML(){
  return ""
    + "<header style='display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 8px 0;'>"
    +   "<div style='display:flex;flex-direction:column;gap:4px;min-width:220px;'>"
    +     "<div style=\"font-family:'Montserrat',system-ui,sans-serif;font-size:1.7rem;font-weight:100;letter-spacing:0.02em;line-height:1.7rem;\">"
    +       "Remodel<span style='color:#ff9a00;font-weight:800;letter-spacing:0.08em;'>PRO</span>"
    +       "<div style='font-size:1.05rem;font-weight:500;margin-top:2px;letter-spacing:0.02em;color:#444;line-height:1.2rem;'>Home Remodeling</div>"
    +     "</div>"
    +     "<div style='font-size:0.9rem;line-height:1.3;'>"
    +       "<strong>Seth Riddle - Owner / Operator</strong><br>"
    +       "Phone: (801) 864-4341<br>"
    +       "Email: RemodelProUtah@gmail.com"
    +     "</div>"
    +   "</div>"
    +   "<img src='assets/logo.png' alt='Logo' style='width:2.5in;height:auto;object-fit:contain;'>"
    + "</header>"
    + "<div style='height:2px;background:#ff9a00;margin:10px 0 16px;border-radius:999px;'></div>";
}

function buildDocPreviewHTML(d){
  var typeName = (d.type === "estimate") ? "Estimate" : "Invoice";

  var srcItems = (d.items || []).map(function(it){
    return {
      category: (it.category || "").trim(),
      description: it.description || "",
      qty: (it.qty !== undefined && it.qty !== null) ? it.qty : 1,
      rate: (it.rate !== undefined && it.rate !== null) ? it.rate : (it.amount != null ? it.amount : "")
    };
  });

  var groups = new Map();
  var seen = [];
  srcItems.forEach(function(it){
    var cat = it.category || "";
    if (!groups.has(cat)){ groups.set(cat, []); seen.push(cat); }
    groups.get(cat).push(it);
  });

  var cats = getCategoryOrder(seen);
  var totals = computeTotals(srcItems);
  var total = totals.total;
  var perCat = totals.perCat;

  var rows = "";
  cats.forEach(function(cat){
    var arr = groups.get(cat) || [];
    if (cat){
      rows += "<tr><td colspan='5' style='background:#eeeeee;font-weight:800;'>" + esc(cat) + "</td></tr>";
    }

    arr.forEach(function(it){
      var qty = Math.max(0, parseFloat(it.qty || 0) || 0);
      var rate = parseNum(it.rate);
      var line = (rate === null) ? null : (qty * rate);
      if (line !== null && isDiscount(cat)) line = -Math.abs(line);

      rows += ""
        + "<tr>"
        +   "<td style='width:22%;'>" + esc(cat || "") + "</td>"
        +   "<td>" + esc(it.description || "") + "</td>"
        +   "<td class='right' style='width:10%;'>" + esc(qty) + "</td>"
        +   "<td class='right' style='width:16%;'>" + (rate === null ? "TBD" : ("$" + fmtMoney(rate))) + "</td>"
        +   "<td class='right' style='width:18%;'>" + (line === null ? "TBD" : ("$" + fmtMoney(line))) + "</td>"
        + "</tr>";
    });

    if (cat && arr.length > 1){
      var sub = perCat.get(cat || "") || 0;
      rows += ""
        + "<tr>"
        +   "<td colspan='3' style='background:#f7f7f7;'></td>"
        +   "<td class='right' style='font-weight:700;background:#f7f7f7;white-space:nowrap;'>" + esc(cat) + " Subtotal</td>"
        +   "<td class='right' style='font-weight:700;background:#f7f7f7;'>$" + fmtMoney(sub) + "</td>"
        + "</tr>";
    }
  });

  var estimateExtra = "";
  if (d.type === "estimate"){
    var presentCats = cats.filter(function(c){ return c && String(c).trim(); });
    var qualityBullets = presentCats
      .filter(function(c){ return !!CATEGORY_NOTES[c]; })
      .map(function(c){
        return "<li><strong>" + esc(c) + ":</strong> " + esc(CATEGORY_NOTES[c]) + "</li>";
      }).join("");

    estimateExtra = ""
      + "<div class='card' style='background:#fff; margin-top:12px;'>"
      +   "<h3 style='margin:0 0 6px;'>Scope of Work</h3>"
      +   "<div class='hint' style='margin-top:0;'>All labor, materials, and details are described in the line items above. Any additional work not listed may be treated as a change order.</div>"
      +   (qualityBullets
            ? ("<div style='margin-top:10px;'><div style='font-weight:800; margin-bottom:6px;'>Quality Notes by Trade</div><ul style='margin:0; padding-left:18px; line-height:1.35;'>" + qualityBullets + "</ul></div>")
            : "")
      +   "<div style='margin-top:12px; padding:10px; border:1px solid #eee; border-radius:12px; background:#fafafa;'>"
      +     "<div style='font-weight:800; margin-bottom:6px;'>Important</div>"
      +     "<div class='hint' style='margin-top:0;'>" + esc(ESTIMATE_DISCLAIMER) + "</div>"
      +     "<div class='hint' style='margin-top:8px;'>" + esc(ESTIMATE_PAYMENT_TERMS) + "</div>"
      +   "</div>"
      + "</div>";
  }

  var legalExtra = "";
  if (d.type === "estimate" && d.legal){
    legalExtra = "" 
      + "<div class='card' style='background:#fff; margin-top:12px; border:1px solid #f00;'>" 
      +   "<h3 style='margin:0 0 6px;color:#b00;'>Additional Terms</h3>" 
      +   "<div class='hint' style='margin-top:0; color:#444;'>" + esc(ESTIMATE_LEGAL_TEXT) + "</div>" 
      + "</div>";
  }

  var invoiceExtra = "";
  if (d.type === "invoice"){
    invoiceExtra = ""
      + "<div class='card' style='background:#fff; margin-top:12px;'>"
      +   "<h3 style='margin:0 0 6px;'>Thank you</h3>"
      +   "<div class='hint' style='margin-top:0;'>" + esc(INVOICE_THANK_YOU) + "</div>"
      +   "<div class='hint' style='margin-top:8px;'>" + esc(INVOICE_PAYMENT_DUE) + "</div>"
      + "</div>";
  }

  var bottomTotal = ""
    + "<div class='card' style='background:#fff; margin-top:12px;'>"
    +   "<div style='display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;'>"
    +     "<div style='font-weight:800;'>Total</div>"
    +     "<div style='font-size:1.25rem;font-weight:900;'>$" + fmtMoney(total) + "</div>"
    +   "</div>"
    +   "<div class='hint' style='margin-top:6px;'>" + esc(PAYMENT_METHODS) + "</div>"
    + "</div>";

  var signatures = ""
    + "<div class='card' style='background:#fff; margin-top:12px;'>"
    +   "<div style='font-weight:900;margin-bottom:6px;'>Client Authorization</div>"
    +   "<div class='hint' style='margin-top:0;'>By signing below, client acknowledges and accepts this " + esc(typeName.toLowerCase()) + " and its terms.</div>"
    +   "<div class='sig-grid'>"
    +     "<div>"
    +       "<div class='sig-label'>Client Signature</div>"
    +       "<div class='sig-line'></div>"
    +     "</div>"
    +     "<div>"
    +       "<div class='sig-label'>Date</div>"
    +       "<div class='sig-line'></div>"
    +     "</div>"
    +   "</div>"
    + "</div>";

  return ""
    + "<div class='doc-wrapper'>"
    +   "<div style='display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;'>"
    +     "<div>"
    +       "<div style='font-size:1.4rem;font-weight:700;margin-bottom:4px;'>" + esc(typeName) + ": " + esc(d.num || "") + "</div>"
    +       "<div class='muted'>" + esc(d.name || "") + "</div>"
    +       "<div class='muted'>Date: " + esc(d.date || "") + "</div>"
    +       (d.type === "invoice" ? ("<div class='muted'>Due: " + esc(d.due || "") + "</div>") : "")
    +     "</div>"
    +     "<div style='text-align:right;'>"
    +       "<div style='font-size:1.25rem;font-weight:800;'>Total: $" + fmtMoney(total) + "</div>"
    +     "</div>"
    +   "</div>"
    +   "<div class='table-watermark-wrapper'>"
    +     "<div class='table-wrap'>"
    +       "<table class='preview-table' style='min-width:760px;'>"
    +         "<thead>"
    +           "<tr>"
    +             "<th style='min-width:160px;'>Category</th>"
    +             "<th>Description</th>"
    +             "<th class='right' style='min-width:84px;'>Qty</th>"
    +             "<th class='right' style='min-width:130px;'>Rate</th>"
    +             "<th class='right' style='min-width:140px;'>Line Total</th>"
    +           "</tr>"
    +         "</thead>"
    +         "<tbody>" + rows + "</tbody>"
    +       "</table>"
    +     "</div>"
    +   "</div>"
    +   (d.type === "estimate" ? estimateExtra : "")
    +   (d.type === "estimate" ? legalExtra : "")
    +   (d.type === "invoice" ? invoiceExtra : "")
    +   bottomTotal
    +   signatures
    +   "<div class='hint' style='margin-top:10px;'>Questions? Call/Text (801) 864-4341 - RemodelProUtah@gmail.com</div>"
    + "</div>";
}

function renderDocList(){
  var list = document.getElementById("invoicesList");
  var q = (document.getElementById("docSearch").value || "").trim().toLowerCase();
  list.innerHTML = "";

  var sorted = invoices
    .slice()
    .sort(function(a,b){ return b.id - a.id; })
    .filter(function(d){
      if (d.deletedAt) return false;
      if (!q) return true;
      return (
        String(d.name||"").toLowerCase().includes(q) ||
        String(d.num||"").toLowerCase().includes(q) ||
        String(d.type||"").toLowerCase().includes(q)
      );
    });

  sorted.forEach(function(d){
    var badge = (d.type === "estimate") ? "badge badge-estimate" : "badge badge-invoice";
    var label = (d.type === "estimate") ? "Estimate" : "Invoice";

    var card = document.createElement("div");
    card.className = "doc-card";
    card.id = "docCard_" + d.id;

    card.innerHTML =
      "<div class='doc-card-top'>" +
        "<div>" +
          "<div class='" + badge + "'>" + label + "</div>" +
          "<div><strong>" + esc(d.name || "") + "</strong></div>" +
          "<div>" + esc(d.num || "") + "</div>" +
          "<div class='muted'>Total: $" + fmtMoney(d.total || 0) + "</div>" +
        "</div>" +
        "<div style='display:flex; gap:8px; flex-wrap:wrap; align-items:center;'>" +
          "<button class='btn btn-secondary btn-sm' type='button' data-action='toggle' data-id='" + d.id + "'>View/Hide</button>" +
          "<button class='btn btn-secondary btn-sm' type='button' data-action='edit' data-id='" + d.id + "'>Edit</button>" +
          "<button class='btn btn-danger btn-sm' type='button' data-action='del' data-id='" + d.id + "'>Delete</button>" +
        "</div>" +
      "</div>" +
      "<div class='drawer' id='drawer_" + d.id + "'>" +
        "<div class='drawer-actions' style='display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end;margin-bottom:8px;'>" +
          "<button class='btn btn-primary btn-sm' type='button' data-action='download' data-id='" + d.id + "'>Download PDF</button>" +
          "<button class='btn btn-secondary btn-sm' type='button' data-action='email' data-id='" + d.id + "'>Email</button>" +
          "<button class='btn btn-secondary btn-sm' type='button' data-action='text' data-id='" + d.id + "'>Text</button>" +
          "<button class='btn btn-secondary btn-sm' type='button' data-action='follow' data-id='" + d.id + "'>Follow-up Text</button>" +
        "</div>" +
        "<div id='drawerPreview_" + d.id + "'></div>" +
      "</div>";

    card.querySelector("[data-action='toggle']").addEventListener("click", function(){ toggleDrawer(d.id); });

    card.querySelector("[data-action='edit']").addEventListener("click", function(){
      loadDocIntoForm(d.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    card.querySelector("[data-action='del']").addEventListener("click", function(){
      if (!confirm("Delete this document?")) return;
      var idx = invoices.findIndex(x => x.id === d.id);
      if (idx !== -1){
        if (typeof markInvoiceDeleted === "function") markInvoiceDeleted(d.id);
        invoices.splice(idx, 1);
      }
      if (currentId === d.id) currentId = null;
      persistAll();
      renderDocList();
    });

    card.querySelector("[data-action='download']").addEventListener("click", function(){ downloadDoc(d.id); });
    card.querySelector("[data-action='email']").addEventListener("click", function(){ emailDoc(d.id); });
    card.querySelector("[data-action='text']").addEventListener("click", function(){ textDoc(d.id, false); });
    card.querySelector("[data-action='follow']").addEventListener("click", function(){ textDoc(d.id, true); });

    list.appendChild(card);
  });
}

function toggleDrawer(id){
  var drawer = document.getElementById("drawer_" + id);
  var open = !drawer.classList.contains("open");
  if (open){
    document.querySelectorAll(".drawer.open").forEach(function(d){ d.classList.remove("open"); });
    drawer.classList.add("open");
    var doc = invoices.find(function(x){ return x.id === id; });
    document.getElementById("drawerPreview_" + id).innerHTML = buildDocPreviewHTML(doc);
  } else {
    drawer.classList.remove("open");
  }
}

function openDrawerForDoc(id){
  var drawer = document.getElementById("drawer_" + id);
  if (!drawer) return;
  document.querySelectorAll(".drawer.open").forEach(function(d){ d.classList.remove("open"); });
  drawer.classList.add("open");
  var doc = invoices.find(function(x){ return x.id === id; });
  document.getElementById("drawerPreview_" + id).innerHTML = buildDocPreviewHTML(doc);
}

function emailDoc(id){
  var d = invoices.find(function(x){ return x.id === id; });
  if (!d) return;

  var subject = encodeURIComponent((d.type === "estimate" ? "Estimate " : "Invoice ") + (d.num || ""));
  var body =
    "Hi " + (d.name || "") + ",\n\n" +
    "Attached is your " + (d.type === "estimate" ? "estimate" : "invoice") + " from RemodelPRO.\n\n" +
    "Thank you,\nSeth Riddle\n(801) 864-4341\nRemodelProUtah@gmail.com\n";

  var href = "mailto:" + encodeURIComponent(d.email || "") + "?subject=" + subject + "&body=" + encodeURIComponent(body);
  window.location.href = href;
}

function textDoc(id, followUp){
  var d = invoices.find(function(x){ return x.id === id; });
  if (!d) return;

  var msg = followUp
    ? ("Hi " + (d.name || "") + ", just following up on " + (d.type === "estimate" ? "the estimate" : "the invoice") + " " + (d.num || "") + ". Let me know if you have any questions. - RemodelPRO")
    : ("Hi " + (d.name || "") + ", here is your " + (d.type === "estimate" ? "estimate" : "invoice") + " " + (d.num || "") + " from RemodelPRO. - Seth");

  var phone = (d.phone || "").replace(/[^\d+]/g, "");
  var href = "sms:" + encodeURIComponent(phone) + "?body=" + encodeURIComponent(msg);
  window.location.href = href;
}

function downloadDoc(id){
  var d = invoices.find(function(x){ return x.id === id; });
  if (!d) return;
  var html = buildPrintHeaderHTML() + buildDocPreviewHTML(d);
  var opt = {
    margin: 10,
    filename: (d.num || 'invoice') + '.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };
  html2pdf().from(html).set(opt).save();
}

