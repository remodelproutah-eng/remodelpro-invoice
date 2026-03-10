/**
 * String escaping and formatting utilities
 */

function esc(str){
  return String(str == null ? "" : str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function fmtMoney(v){
  return Number(v || 0).toFixed(2);
}

function capitalizeWords(str){
  return String(str || "").replace(/\b\w/g, function(c){ return c.toUpperCase(); });
}

function isBlank(v){
  return v === "" || v === null || v === undefined;
}

function isDiscount(cat){
  return String(cat || "").trim().toLowerCase() === "discount";
}

function parseNum(v){
  if (isBlank(v)) return null;
  var n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/**
 * Date utilities
 */

function todayISO(){
  var d = new Date();
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth()+1).padStart(2,"0");
  var dd = String(d.getDate()).padStart(2,"0");
  return yyyy + "-" + mm + "-" + dd;
}

function parseISO(s){
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function startOfYear(d){
  d = d || new Date();
  return new Date(d.getFullYear(),0,1);
}

function startOfMonth(d){
  d = d || new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfQuarter(d){
  d = d || new Date();
  var q = Math.floor(d.getMonth()/3);
  return new Date(d.getFullYear(), q*3, 1);
}

/**
 * Total computation for line items
 */

function computeTotals(itemsArr){
  var total = 0;
  var perCat = new Map();

  for (var i=0; i<(itemsArr || []).length; i++){
    var it = itemsArr[i];
    var cat = (it.category || "").trim();
    var qty = Math.max(0, parseFloat(it.qty || 0) || 0);
    var rate = parseNum(it.rate);
    if (rate === null) continue;

    var line = qty * rate;
    if (isDiscount(cat)) line = -Math.abs(line);

    total += line;
    var key = cat || "";
    perCat.set(key, (perCat.get(key) || 0) + line);
  }
  return { total: total, perCat: perCat };
}

/**
 * Chart labeling helper
 */

function moneyLabel(v){
  var n = Number(v||0);
  var sign = n < 0 ? "-" : "";
  var abs = Math.abs(n);
  if (abs >= 1000000) return sign + "$" + (abs/1000000).toFixed(1) + "M";
  if (abs >= 1000) return sign + "$" + (abs/1000).toFixed(1) + "K";
  return sign + "$" + abs.toFixed(0);
}
