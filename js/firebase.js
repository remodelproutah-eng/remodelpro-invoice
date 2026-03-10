/**
 * Firebase auth + sync (classic script mode)
 */
(function(){
  var authGate = document.getElementById("authGate");
  if (!authGate) return;

  var emailEl = document.getElementById("authEmail");
  var passEl = document.getElementById("authPassword");
  var signInBtn = document.getElementById("authSignInBtn");
  var createBtn = document.getElementById("authCreateBtn");
  var skipBtn = document.getElementById("authSkipBtn");
  var loadingEl = document.getElementById("authLoading");
  var loadingTextEl = document.getElementById("authLoadingText");
  var errorEl = document.getElementById("authError");
  var successEl = document.getElementById("authSuccess");

  const firebaseConfig = {
    apiKey: "AIzaSyC0f4AgX-kheklssjoYg4b9pnQTw22Vvgg",
    authDomain: "remodelpro-cae45.firebaseapp.com",
    projectId: "remodelpro-cae45",
    storageBucket: "remodelpro-cae45.firebasestorage.app",
    messagingSenderId: "18322359876",
    appId: "1:18322359876:web:8b557fc60d194ac8cd5e11"
  };

  var auth = null;
  var db = null;
  var started = false;
  var syncInProgress = false;
  var pendingSync = false;
  var syncTimer = null;

  function hideFeedback(el){
    if (!el) return;
    el.classList.remove("is-visible");
  }

  function showAuthError(msg){
    hideFeedback(successEl);
    hideFeedback(loadingEl);
    if (successEl) successEl.textContent = "";
    if (loadingTextEl) loadingTextEl.textContent = "Working...";
    errorEl.textContent = msg;
    errorEl.classList.add("is-visible");
  }

  function showAuthSuccess(msg){
    hideFeedback(errorEl);
    hideFeedback(loadingEl);
    if (errorEl) errorEl.textContent = "";
    if (loadingTextEl) loadingTextEl.textContent = "Working...";
    if (!successEl) return;
    successEl.textContent = msg;
    successEl.classList.add("is-visible");
  }

  function showAuthLoading(msg){
    hideFeedback(errorEl);
    hideFeedback(successEl);
    if (errorEl) errorEl.textContent = "";
    if (successEl) successEl.textContent = "";
    if (!loadingEl) return;
    if (loadingTextEl) loadingTextEl.textContent = msg || "Working...";
    loadingEl.classList.add("is-visible");
  }

  function clearAuthError(){
    errorEl.textContent = "";
    hideFeedback(errorEl);
  }

  function clearAuthSuccess(){
    if (!successEl) return;
    successEl.textContent = "";
    hideFeedback(successEl);
  }

  function clearAuthLoading(){
    if (loadingTextEl) loadingTextEl.textContent = "Working...";
    hideFeedback(loadingEl);
  }

  function clearAuthMessages(){
    clearAuthError();
    clearAuthSuccess();
    clearAuthLoading();
  }

  function hideAuthGate(){
    authGate.classList.add("hidden");
  }

  function setAuthPending(isPending){
    if (!authGate) return;
    if (isPending) authGate.classList.add("is-pending");
    else authGate.classList.remove("is-pending");
  }

  function hasMissingConfig(){
    return !firebaseConfig.apiKey || firebaseConfig.apiKey.indexOf("YOUR_") === 0;
  }

  function ensureFirebase(){
    if (hasMissingConfig()){
      setAuthPending(false);
      showAuthError("Firebase config is missing. Paste your config values into js/firebase.js.");
      return false;
    }
    if (!window.firebase || !firebase.initializeApp){
      setAuthPending(false);
      showAuthError("Firebase SDK failed to load. Check your script tags.");
      return false;
    }
    if (!firebase.apps.length){
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    return true;
  }

  function startLocalMode(){
    setAuthPending(false);
    hideAuthGate();
    updateUserDisplay(null);
    if (window.startApp) window.startApp();
  }

  function startFirebaseMode(){
    hideAuthGate();
    if (window.startApp) window.startApp({ skipLoad: true });
  }

  function showSignInScreen(){
    setAuthPending(false);
    clearAuthMessages();
    authGate.classList.remove("hidden");
  }

  function handleSignedIn(user){
    if (!user) return;
    updateUserDisplay(user);
    if (!started){
      started = true;
      startFirebaseMode();
      syncAll(user).catch(function(e){
        console.error("Initial sync failed:", e);
      });
    }
  }

  function updateUserDisplay(user){
    var userDisplay = document.getElementById("userDisplay");
    var userIcon = document.getElementById("userIcon");
    var logoutBtn = document.getElementById("logoutBtn");
    if (!userDisplay) return;
    
    if (user && user.email){
      userDisplay.textContent = user.email;
      if (userIcon) userIcon.style.display = "block";
      if (logoutBtn){
        logoutBtn.textContent = "Logout";
        logoutBtn.style.display = "block";
      }
    } else {
      userDisplay.textContent = "Offline Mode";
      if (userIcon) userIcon.style.display = "none";
      if (logoutBtn){
        logoutBtn.textContent = "Sign in";
        logoutBtn.style.display = "block";
      }
    }
  }

  function wireUserMenu(){
    var userBtn = document.getElementById("userBtn");
    var userMenu = document.getElementById("userMenu");
    var logoutBtn = document.getElementById("logoutBtn");

    if (userBtn){
      userBtn.addEventListener("click", function(e){
        e.stopPropagation();
        userMenu.classList.toggle("open");
      });
    }

    if (logoutBtn){
      logoutBtn.addEventListener("click", function(){
        userMenu.classList.remove("open");
        if (auth && auth.currentUser){
          auth.signOut().catch(function(e){
            console.error("Logout error:", e);
          });
          return;
        }
        showSignInScreen();
      });
    }

    document.addEventListener("click", function(e){
      if (userMenu && userBtn && !userBtn.contains(e.target) && !userMenu.contains(e.target)){
        userMenu.classList.remove("open");
      }
    });
  }

  function renderAll(){
    if (typeof renderDocList === "function") renderDocList();
    if (typeof renderExpensesTable === "function") renderExpensesTable();
    if (typeof renderClientsPage === "function") renderClientsPage();
    if (typeof renderBusinessPage === "function") renderBusinessPage();
  }

  function toMillis(val){
    if (!val) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string"){
      var num = Number(val);
      return isNaN(num) ? 0 : num;
    }
    if (val.toMillis) return val.toMillis();
    if (val.seconds) return val.seconds * 1000;
    return 0;
  }

  function normalizeRemote(id, data){
    var copy = Object.assign({}, data || {});
    if (copy.id == null){
      var num = Number(id);
      copy.id = isNaN(num) ? id : num;
    }
    copy.createdAt = toMillis(copy.createdAt) || toMillis(copy.updatedAt) || Date.now();
    copy.updatedAt = toMillis(copy.updatedAt) || copy.createdAt;
    return copy;
  }

  function serializeLocal(local){
    var copy = Object.assign({}, local);
    copy.createdAt = toMillis(copy.createdAt) || Date.now();
    copy.updatedAt = toMillis(copy.updatedAt) || copy.createdAt;
    copy.updatedAtServer = firebase.firestore.FieldValue.serverTimestamp();
    return copy;
  }

  async function syncCollection(name, localArr, uid, deletedMap){
    var col = db.collection("users").doc(uid).collection(name);
    var snap = await col.get();
    var remoteById = {};
    snap.forEach(function(doc){
      remoteById[doc.id] = doc.data();
    });

    var deleted = (deletedMap && typeof deletedMap === "object") ? deletedMap : {};
    var deletedIds = new Set(Object.keys(deleted));

    Object.keys(remoteById).forEach(function(id){
      var remote = remoteById[id];
      var remoteDeletedAt = toMillis(remote && remote.deletedAt);
      if (remoteDeletedAt){
        if (!deleted[id] || remoteDeletedAt > deleted[id]){
          deleted[id] = remoteDeletedAt;
        }
        deletedIds.add(id);
      }
    });

    for (var i = localArr.length - 1; i >= 0; i--){
      var localId = String(localArr[i].id);
      if (deletedIds.has(localId)) localArr.splice(i, 1);
    }

    var localById = {};
    localArr.forEach(function(item){
      localById[String(item.id)] = item;
    });

    var writes = [];
    Object.keys(deleted).forEach(function(id){
      var localDeletedAt = deleted[id];
      var remote = remoteById[id];
      var remoteDeletedAt = remote ? toMillis(remote.deletedAt) : 0;
      if (!remote || remoteDeletedAt < localDeletedAt){
        writes.push(col.doc(id).set({ deletedAt: localDeletedAt, updatedAt: localDeletedAt }, { merge: true }));
      }
    });
    Object.keys(localById).forEach(function(id){
      var local = localById[id];
      var remote = remoteById[id];
      if (!remote){
        writes.push(col.doc(id).set(serializeLocal(local), { merge: true }));
        return;
      }
      if (remote.deletedAt){
        if (!deleted[id] || toMillis(remote.deletedAt) > deleted[id]){
          deleted[id] = toMillis(remote.deletedAt);
        }
        return;
      }
      var localUpdated = toMillis(local.updatedAt);
      var remoteUpdated = toMillis(remote.updatedAt);
      if (localUpdated > remoteUpdated){
        writes.push(col.doc(id).set(serializeLocal(local), { merge: true }));
      } else if (remoteUpdated > localUpdated){
        var normalized = normalizeRemote(id, remote);
        var idx = localArr.findIndex(function(x){ return String(x.id) === String(id); });
        if (idx !== -1) localArr[idx] = normalized;
      }
    });

    Object.keys(remoteById).forEach(function(id){
      if (!localById[id] && !deletedIds.has(id) && !remoteById[id].deletedAt){
        localArr.push(normalizeRemote(id, remoteById[id]));
      }
    });

    if (writes.length) await Promise.all(writes);
  }

  async function syncAll(user){
    if (syncInProgress){ pendingSync = true; return; }
    if (!navigator.onLine){
      showAuthError("You appear to be offline. Firebase sync is unavailable.");
      return;
    }
    syncInProgress = true;
    try{
      loadAll();
      if (typeof ensureIdsAndTimestamps === "function") ensureIdsAndTimestamps();
      await syncCollection("invoices", invoices, user.uid, (typeof getDeletedInvoiceMap === "function") ? getDeletedInvoiceMap() : null);
      await syncCollection("expenses", expenses, user.uid, (typeof getDeletedExpenseMap === "function") ? getDeletedExpenseMap() : null);
      var wasSuppressed = window.suppressLocalSync === true;
      window.suppressLocalSync = true;
      try{
        persistAll();
        renderAll();
      } finally {
        window.suppressLocalSync = wasSuppressed;
      }
    } finally {
      syncInProgress = false;
      if (pendingSync){
        pendingSync = false;
        syncAll(user);
      }
    }
  }

  function scheduleSync(){
    if (!auth || !auth.currentUser) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function(){ syncAll(auth.currentUser); }, 800);
  }

  window.onLocalDataChanged = scheduleSync;

  function wireAuth(){
    skipBtn.addEventListener("click", function(){
      clearAuthMessages();
      startLocalMode();
    });

    var authForm = document.getElementById("authForm");
    if (authForm){
      authForm.addEventListener("submit", async function(e){
        e.preventDefault();
        clearAuthMessages();
        if (!navigator.onLine){
          return showAuthError("You appear to be offline. Connect to the internet and try again.");
        }
        var email = (emailEl.value || "").trim();
        var pass = passEl.value || "";
        if (!email || !pass) return showAuthError("Email and password are required.");
        try{
          showAuthLoading("Signing you in...");
          await auth.signInWithEmailAndPassword(email, pass);
          clearAuthMessages();
          hideAuthGate();
        }catch(e){
          showAuthError(e.message || "Sign in failed.");
        }
      });
    }

    createBtn.addEventListener("click", async function(){
      clearAuthMessages();
      if (!navigator.onLine){
        return showAuthError("You appear to be offline. Connect to the internet and try again.");
      }
      var email = (emailEl.value || "").trim();
      var pass = passEl.value || "";
      if (!email || !pass) return showAuthError("Email and password are required.");
      try{
        showAuthLoading("Creating your account...");
        await auth.createUserWithEmailAndPassword(email, pass);
        clearAuthMessages();
        hideAuthGate();
      }catch(e){
        showAuthError(e.message || "Account creation failed.");
      }
    });
  }

  function init(){
    wireUserMenu();
    if (!ensureFirebase()) {
      updateUserDisplay(null);
      // If Firebase setup failed but skip button is there, wire it for local mode
      if (skipBtn){
        skipBtn.addEventListener("click", function(){
          clearAuthMessages();
          startLocalMode();
        });
      }
      return;
    }
    wireAuth();

    auth.onAuthStateChanged(function(user){
      if (user){
        handleSignedIn(user);
      } else {
        setAuthPending(false);
        updateUserDisplay(null);
        clearAuthMessages();
        authGate.classList.remove("hidden");
      }
    });
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
