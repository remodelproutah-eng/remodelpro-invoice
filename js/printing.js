/**
 * PDF/Print generation using locked iframe
 */

function printDocLocked(id){
  var d = invoices.find(function(x){ return x.id === id; });
  if (!d) return;
  _printDocLockedInternal(d);
}

function _printDocLockedInternal(d){
  var baseHref = document.baseURI;
  var htmlBody = buildPrintHeaderHTML() + buildDocPreviewHTML(d);

  var printCss = ""
    + "*{box-sizing:border-box;}"
    + "body{margin:0;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#222;"
    + "-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff;}"
    + "@page{size:landscape;margin:10mm;}" 
    + ".table-wrap{width:100%;overflow-x:auto;}"
    + "table{width:100%;border-collapse:collapse;margin-top:10px;font-size:0.9rem;min-width:0;}"
    + "th{background:#eeeeee;color:#111827;font-weight:750;padding:10px 8px;text-align:left;border-bottom:2px solid #ff9a00;}"
    + "td{padding:8px;border-bottom:1px solid #eee;vertical-align:top;}"
    + ".right{text-align:right;}"
    + ".muted{opacity:0.75;}"
    + ".card{background:#fafafa;border:1px solid #eee;padding:12px;border-radius:14px;margin-top:10px;}"
    + ".doc-wrapper{background:#fff;}"
    + ".sig-grid{display:grid;grid-template-columns:1.4fr 0.8fr;gap:14px;margin-top:12px;}"
    + ".sig-line{border-bottom:1px solid #111;height:28px;margin-top:8px;}"
    + ".sig-label{font-size:0.82rem;color:#111;font-weight:700;}"
    + ".table-watermark-wrapper:before{display:none !important;}"
    + "@media print{body{padding:0;}table,thead,tbody,tr,td,th{page-break-inside:avoid;}}";

  var iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  var win = iframe.contentWindow;
  var doc = win.document;

  doc.open();
  doc.close();

  var head = doc.head;

  var meta1 = doc.createElement("meta");
  meta1.setAttribute("charset", "UTF-8");
  head.appendChild(meta1);

  var meta2 = doc.createElement("meta");
  meta2.setAttribute("name", "viewport");
  meta2.setAttribute("content", "width=device-width, initial-scale=1");
  head.appendChild(meta2);

  var base = doc.createElement("base");
  base.setAttribute("href", baseHref);
  head.appendChild(base);

  var link1 = doc.createElement("link");
  link1.setAttribute("rel", "preconnect");
  link1.setAttribute("href", "https://fonts.googleapis.com");
  head.appendChild(link1);

  var link2 = doc.createElement("link");
  link2.setAttribute("rel", "preconnect");
  link2.setAttribute("href", "https://fonts.gstatic.com");
  link2.setAttribute("crossorigin", "");
  head.appendChild(link2);

  var font = doc.createElement("link");
  font.setAttribute("rel", "stylesheet");
  font.setAttribute("href", "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap");
  head.appendChild(font);

  var style = doc.createElement("style");
  style.textContent = printCss;
  head.appendChild(style);

  doc.body.innerHTML = htmlBody;

  function cleanup(){
    try { document.body.removeChild(iframe); } catch(e) {}
  }

  function doPrint(){
    try{
      win.focus();
      win.print();
    } finally {
      setTimeout(cleanup, 1500);
    }
  }

  var imgs = doc.images ? Array.prototype.slice.call(doc.images) : [];
  if (imgs.length){
    var done = 0;
    function finish(){
      done++;
      if (done >= imgs.length) setTimeout(doPrint, 150);
    }
    imgs.forEach(function(img){
      if (img.complete) finish();
      else { img.onload = finish; img.onerror = finish; }
    });
  } else {
    setTimeout(doPrint, 250);
  }
}

try{
  Object.defineProperty(window, "printDocLocked", {
    value: printDocLocked, writable: false, configurable: false
  });
}catch(e){}
