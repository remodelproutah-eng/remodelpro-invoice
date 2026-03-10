/**
 * Business analytics and charting
 */

let chartRangeMonths = 6;
let modalDrawFn = null;

function setChartRangeMonths(months) { chartRangeMonths = months; }
function getChartRangeMonths() { return chartRangeMonths; }

function drawBarChart(canvas, labels, values){
  var ctx = canvas.getContext("2d");
  var w = canvas.width = canvas.clientWidth;
  var h = canvas.height;
  ctx.clearRect(0,0,w,h);

  var padL = 40, padR = 16, padB = 46, padT = 18;
  var maxV = Math.max.apply(null, [1].concat(values.map(function(v){ return Math.abs(v); })));
  var barW = (w - padL - padR) / Math.max(1, values.length);
  var baseY = h - padB;

  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(padL, baseY);
  ctx.lineTo(w - padR, baseY);
  ctx.strokeStyle = "#111827";
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "#111827";

  values.forEach(function(v,i){
    var x = padL + i*barW + 6;
    var bw = Math.max(8, barW - 12);
    var bh = (Math.abs(v)/maxV) * (h - padT - padB - 18);
    var y = baseY - bh;

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#111827";
    ctx.fillRect(x, y, bw, bh);
    ctx.globalAlpha = 1;

    var valText = moneyLabel(v);
    var tw = ctx.measureText(valText).width;
    ctx.fillStyle = "#111827";
    ctx.fillText(valText, x + (bw - tw)/2, y - 6);

    ctx.save();
    ctx.translate(x + bw/2, baseY + 14);
    ctx.rotate(-0.35);
    ctx.textAlign = "center";
    ctx.fillStyle = "#111827";
    var lab = String(labels[i]||"");
    var shortLab = lab.length > 12 ? lab.slice(0,12) + "..." : lab;
    ctx.fillText(shortLab, 0, 0);
    ctx.restore();
  });
}

function drawPieChart(canvas, labels, values){
  var ctx = canvas.getContext("2d");
  var w = canvas.width = canvas.clientWidth;
  var h = canvas.height;
  ctx.clearRect(0,0,w,h);

  var total = values.reduce(function(s,v){ return s + Math.max(0,Number(v||0)); }, 0) || 1;

  var cx = Math.floor(w/2);
  var cy = Math.floor(h/2);
  var r = Math.floor(Math.min(w,h) * 0.34);

  var shades = ["#111827","#374151","#4b5563","#6b7280","#9ca3af","#d1d5db"];

  var a0 = -Math.PI/2;
  for (var i=0;i<labels.length;i++){
    var v = Math.max(0,Number(values[i]||0));
    var a1 = a0 + (v/total) * Math.PI*2;

    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,a0,a1);
    ctx.closePath();
    ctx.fillStyle = shades[i % shades.length];
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    a0 = a1;
  }

  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "#111827";
  var y = 16;
  var x = 16;
  for (var j=0;j<labels.length;j++){
    var vv = Number(values[j]||0);
    if (vv <= 0) continue;
    ctx.fillStyle = shades[j % shades.length];
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y-10, 10, 10);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#111827";
    ctx.fillText(String(labels[j]) + " - $" + fmtMoney(vv), x + 16, y);
    y += 18;
  }
}

function monthlyBuckets(monthsBack){
  var now = new Date();
  var buckets = [];
  for (var i=monthsBack-1; i>=0; i--){
    var d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    buckets.push({
      key: String(d.getMonth()+1).padStart(2,"0") + "/" + String(d.getFullYear()).slice(-2),
      year: d.getFullYear(),
      month: d.getMonth()
    });
  }
  return buckets;
}

function renderBusinessPage(){
  var now = new Date();
  var y0 = startOfYear(now);

  var ytdRevenue = invoices
    .filter(function(d){ return d.type === "invoice"; })
    .filter(function(d){
      var dd = parseISO(d.date);
      return dd && dd >= y0;
    })
    .reduce(function(s,d){ return s + Number(d.total||0); }, 0);

  var ytdExpenses = expenses
    .filter(function(e){
      var dd = parseISO(e.date);
      return dd && dd >= y0;
    })
    .reduce(function(s,e){ return s + Number(e.amount||0); }, 0);

  var ytdProfit = ytdRevenue - ytdExpenses;
  var avgPct = (ytdRevenue > 0) ? ((ytdProfit / ytdRevenue) * 100).toFixed(1) + "%" : "-";

  document.getElementById("bizYtdRevenue").textContent = "$" + fmtMoney(ytdRevenue);
  document.getElementById("bizYtdExpenses").textContent = "$" + fmtMoney(ytdExpenses);
  document.getElementById("bizYtdProfit").textContent = "$" + fmtMoney(ytdProfit);
  document.getElementById("bizAvgProfitPct").textContent = avgPct;

  var months = monthlyBuckets(chartRangeMonths);
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

  drawBarChart(document.getElementById("monthlyProfitChart"), months.map(function(m){ return m.key; }), vals);

  var pieMap = new Map();
  expenses.forEach(function(e){
    var dd = parseISO(e.date);
    if (!dd || dd < y0) return;
    var k = e.category || "Other";
    pieMap.set(k, (pieMap.get(k) || 0) + Number(e.amount||0));
  });
  var pieLabels = Array.from(pieMap.keys()).sort(function(a,b){ return a.localeCompare(b); });
  var pieValues = pieLabels.map(function(k){ return pieMap.get(k) || 0; });
  drawPieChart(document.getElementById("expensePieChart"), pieLabels, pieValues);

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

  drawBarChart(document.getElementById("profitByClientChart"), rows.map(function(r){ return r.client; }), rows.map(function(r){ return r.profit; }));

  renderBusinessDrilldown();
}

function renderBusinessDrilldown(){
  var cat = document.getElementById("bizCategory").value || "";
  var time = document.getElementById("bizTime").value || "ytd";
  var q = (document.getElementById("bizSearch").value || "").trim().toLowerCase();

  var now = new Date();
  var minDate = null;
  if (time === "ytd") minDate = startOfYear(now);
  if (time === "mtd") minDate = startOfMonth(now);
  if (time === "qtd") minDate = startOfQuarter(now);

  var rows = expenses.slice().filter(function(e){
    if (cat && String(e.category) !== String(cat)) return false;
    var d = parseISO(e.date);
    if (minDate && (!d || d < minDate)) return false;
    if (q && !String(e.description||"").toLowerCase().includes(q)) return false;
    return true;
  });

  rows.sort(function(a,b){
    var ta = parseISO(a.date) ? parseISO(a.date).getTime() : 0;
    var tb = parseISO(b.date) ? parseISO(b.date).getTime() : 0;
    return (tb - ta) || (b.id - a.id);
  });

  var body = document.getElementById("bizListBody");
  body.innerHTML = "";
  rows.forEach(function(e){
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + esc(e.date || "") + "</td>" +
      "<td>" + esc(e.client || "") + "</td>" +
      "<td>" + esc(e.category || "") + "</td>" +
      "<td>" + esc(e.description || "") + "</td>" +
      "<td class='right'>$" + fmtMoney(e.amount || 0) + "</td>";
    body.appendChild(tr);
  });

  var total = rows.reduce(function(s,e){ return s + Number(e.amount||0); }, 0);
  document.getElementById("bizListHint").textContent = rows.length + " item(s). Total: $" + fmtMoney(total) + ".";
}

function openChartModal(title, drawFn){
  document.getElementById("modalTitle").textContent = title;
  modalDrawFn = drawFn;
  document.getElementById("chartModal").classList.add("open");
  setTimeout(function(){
    if (modalDrawFn) modalDrawFn(document.getElementById("modalCanvas"));
  }, 0);
}

function closeChartModal(){
  document.getElementById("chartModal").classList.remove("open");
  var c = document.getElementById("modalCanvas");
  var ctx = c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  modalDrawFn = null;
}
