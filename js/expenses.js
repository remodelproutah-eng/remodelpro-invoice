/**
 * Expense tracking and receipt management
 */

let receiptFile = null;
let receiptThumb = "";
let receiptRawText = "";
let editingExpenseId = null;

function clearReceiptState(){
  receiptFile = null;
  receiptThumb = "";
  receiptRawText = "";
}

function readFileAsDataURL(file){
  return new Promise(function(resolve,reject){
    var r = new FileReader();
    r.onload = function(){ resolve(String(r.result || "")); };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function clearReceiptUI(){
  receiptFile = null;
  receiptThumb = "";
  receiptRawText = "";
  document.getElementById("receiptStatus").textContent = "";
  document.getElementById("receiptPreviewWrap").style.display = "none";
  document.getElementById("receiptPreview").src = "";
  document.getElementById("receiptFileGallery").value = "";
  document.getElementById("receiptFileCamera").value = "";
}

function onReceiptChosen(file){
  return (async function(){
    if (!file) return;
    receiptFile = file;
    document.getElementById("receiptStatus").textContent = "Receipt loaded: " + file.name;
    var dataUrl = await readFileAsDataURL(file);
    receiptThumb = dataUrl;
    document.getElementById("receiptPreview").src = dataUrl;
    document.getElementById("receiptPreviewWrap").style.display = "block";
  })();
}

function scanReceiptOCR(){
  return (async function(){
    if (!receiptFile || !receiptThumb) return alert("Add a receipt image first.");
    document.getElementById("receiptStatus").textContent = "Scanning...";
    try{
      var res = await Tesseract.recognize(receiptThumb, "eng");
      receiptRawText = (res.data && res.data.text) ? res.data.text : "";
      document.getElementById("receiptStatus").textContent = "Scan complete. (You can still edit fields before saving.)";
      if (!document.getElementById("expenseDescription").value.trim()){
        var firstLine = receiptRawText.split("\n").map(function(s){ return s.trim(); }).find(Boolean) || "Receipt";
        document.getElementById("expenseDescription").value = firstLine;
      }
    } catch(e){
      console.error(e);
      document.getElementById("receiptStatus").textContent = "Scan failed. You can still save manually.";
    }
  })();
}

function refreshClientDropdowns(){
  var clients = getClientsFromData();
  var expenseClient = document.getElementById("expenseClient");
  var filterClient = document.getElementById("expenseFilterClient");
  var last = localStorage.getItem(LS_LAST_CLIENT) || "";
  var opts = clients.map(function(c){ return "<option value='" + esc(c) + "'>" + esc(c) + "</option>"; }).join("");

  expenseClient.innerHTML = "<option value=''>Select client...</option>" + opts;
  if (last && clients.includes(last)) expenseClient.value = last;

  var cur = filterClient.value || "";
  filterClient.innerHTML = "<option value=''>All clients</option>" + opts;
  filterClient.value = cur || "";
}

function addExpenseFromForm(e){
  e.preventDefault();

  var client = document.getElementById("expenseClient").value;
  var date = document.getElementById("expenseDate").value || todayISO();
  var cat = document.getElementById("expenseCategory").value;
  var amt = Number(document.getElementById("expenseAmount").value || 0);
  var desc = document.getElementById("expenseDescription").value.trim();
  desc = capitalizeWords(desc);

  if (!client) return alert("Select a client for this expense.");
  if (!desc) return alert("Vendor/Description required.");
  if (!amt || amt <= 0) return alert("Enter a valid amount.");

  expenses.push({
    id: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    client: String(client),
    date: date,
    category: cat,
    amount: amt,
    description: desc,
    receiptThumb: receiptThumb || "",
    receiptText: receiptRawText || ""
  });

  persistAll();
  clearReceiptUI();
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseDescription").value = "";
  document.getElementById("expenseDescription").addEventListener("blur", function(e){
    e.target.value = capitalizeWords(e.target.value);
  });
  editingExpenseId = null;

  renderExpensesTable();
}

function expenseCategoriesOptions(selected){
  var cats = ["Materials","Labor","Subcontractor","Dumpster","Permits/Fees","Fuel/Travel","Tools/Equipment","Other","Receipt"];
  return cats.map(function(c){
    return "<option value='" + c + "'" + (String(selected)===String(c) ? " selected" : "") + ">" + c + "</option>";
  }).join("");
}

function clientOptions(selectedClient){
  var clients = getClientsFromData();
  var opts = clients.map(function(c){
    var sel = (String(selectedClient)===String(c)) ? " selected" : "";
    return "<option value='" + esc(c) + "'" + sel + ">" + esc(c) + "</option>";
  }).join("");
  return "<option value=''>Select...</option>" + opts;
}

function renderExpensesTable(){
  var body = document.getElementById("expensesTableBody");
  var q = (document.getElementById("expenseSearch").value || "").trim().toLowerCase();
  var filterClient = document.getElementById("expenseFilterClient").value || "";
  var filterCat = document.getElementById("expenseFilterCategory").value || "";

  var rows = expenses
    .slice()
    .sort(function(a,b){
      var ta = parseISO(a.date) ? parseISO(a.date).getTime() : 0;
      var tb = parseISO(b.date) ? parseISO(b.date).getTime() : 0;
      return (tb - ta) || (b.id - a.id);
    })
    .filter(function(x){
      if (x.deletedAt) return false;
      if (filterClient && String(x.client) !== String(filterClient)) return false;
      if (filterCat && String(x.category) !== String(filterCat)) return false;
      if (q && !String(x.description||"").toLowerCase().includes(q)) return false;
      return true;
    });

  body.innerHTML = "";

  rows.forEach(function(ex){
    var tr = document.createElement("tr");

    if (editingExpenseId === ex.id){
      tr.innerHTML =
        "<td><input type='date' value='" + esc(ex.date || todayISO()) + "' data-k='date'></td>" +
        "<td><select data-k='client'>" + clientOptions(ex.client) + "</select></td>" +
        "<td><select data-k='category'>" + expenseCategoriesOptions(ex.category) + "</select></td>" +
        "<td>" +
          "<input value='" + esc(ex.description || "") + "' data-k='description'>" +
          (ex.receiptThumb ? "<div class='hint' style='margin-top:4px;'>(receipt attached)</div>" : "") +
        "</td>" +
        "<td class='right'><input type='number' step='0.01' value='" + esc(ex.amount || 0) + "' data-k='amount'></td>" +
        "<td class='right' style='white-space:nowrap;'>" +
          "<button class='btn btn-primary btn-sm' type='button' data-action='save'>Save</button> " +
          "<button class='btn btn-secondary btn-sm' type='button' data-action='cancel'>Cancel</button>" +
        "</td>";

      tr.querySelector("[data-action='cancel']").addEventListener("click", function(){
        editingExpenseId = null;
        renderExpensesTable();
      });

      tr.querySelector("[data-action='save']").addEventListener("click", function(){
        var date = tr.querySelector("[data-k='date']").value || todayISO();
        var client = tr.querySelector("[data-k='client']").value || "";
        var category = tr.querySelector("[data-k='category']").value || "Other";
        var description = tr.querySelector("[data-k='description']").value.trim();
        var amount = Number(tr.querySelector("[data-k='amount']").value || 0);

        if (!client) return alert("Pick a client.");
        if (!description) return alert("Description required.");
        if (!amount || amount <= 0) return alert("Amount must be > 0.");

        ex.date = date;
        ex.client = String(client);
        ex.category = category;
        ex.description = description;
        ex.amount = amount;
        ex.updatedAt = Date.now();
        if (!ex.createdAt) ex.createdAt = ex.updatedAt;

        persistAll();
        editingExpenseId = null;
        renderExpensesTable();
      });

    } else {
      tr.innerHTML =
        "<td>" + esc(ex.date || "") + "</td>" +
        "<td>" + esc(ex.client || "") + "</td>" +
        "<td>" + esc(ex.category || "") + "</td>" +
        "<td>" + esc(ex.description || "") + "</td>" +
        "<td class='right'>$" + fmtMoney(ex.amount || 0) + "</td>" +
        "<td class='right' style='white-space:nowrap;'>" +
          "<button class='btn btn-secondary btn-sm' type='button' data-action='edit'>Edit</button> " +
          "<button class='btn btn-danger btn-sm' type='button' data-action='del'>Delete</button>" +
        "</td>";

      tr.querySelector("[data-action='edit']").addEventListener("click", function(){
        editingExpenseId = ex.id;
        renderExpensesTable();
      });

      tr.querySelector("[data-action='del']").addEventListener("click", function(){
        if (!confirm("Delete this expense?")) return;
        var idx = expenses.findIndex(x => x.id === ex.id);
        if (idx !== -1){
          if (typeof markExpenseDeleted === "function") markExpenseDeleted(ex.id);
          expenses.splice(idx, 1);
        }
        persistAll();
        renderExpensesTable();
      });
    }

    body.appendChild(tr);
  });

  document.getElementById("expensesCount").textContent = rows.length + " expense(s) shown.";
}
