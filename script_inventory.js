
window.normalizeExpiry = function (exp) {
  if (!exp) return "";
  let str = String(exp).trim();

  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(str);
    if (!isNaN(d)) {
      let m = (d.getMonth() + 1).toString().padStart(2, '0');
      let y = d.getFullYear().toString().slice(-2);
      return `${m}/${y}`;
    }
  }

  if (str.match(/^\d{2}-\d{2}$/)) {
    return str.replace('-', '/');
  }

  if (str.match(/^\d{2}\/\d{2}$/)) {
    return str;
  }

  if (str.match(/^\d{2}\/\d{4}$/)) {
    let parts = str.split('/');
    return `${parts[0]}/${parts[1].slice(-2)}`;
  }

  return str.replace(/-/g, '/');
};

window.isMedicineExpired = function (item) {
  const today = new Date();
  const normalizedExp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || item.Expiry || '');
  if (normalizedExp && normalizedExp.includes('/')) {
    const parts = normalizedExp.split('/');
    if (parts.length === 2) {
      let month = parseInt(parts[0]);
      let year = parseInt(parts[1]);
      if (year < 100) year += 2000;
      const expDate = new Date(year, month, 0);
      expDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
      return daysLeft < 0;
    }
  }
  return false;
};
// CONFIGURATION
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx_hHKIJdfhjmBXERsOylpnZhh2dSrmUF7N8hzS6Obq1C-gaIaUT-odEEvXWg28-KJ_/exec";
// NOTE: Password is verified server-side only — never stored in this file.

// Simple brute-force protection (client-side aid)
let _loginAttempts = 0;
let _loginLockedUntil = 0;

let allPatients = [];
let indexMappings = [];
let soldOutData = [];
let salesReturnData = [];
let allDistributors = [];
let buyersList = [];
let paymentData = [];
let isPreviewMode = true; // true = Patient ID field shows next auto-generated preview ID

// Override Native Alert with Custom Sweet Popup
window.alert = function (message) {
  document.getElementById('customAlertMessage').innerText = message;
  const modal = document.getElementById('customAlertModal');
  const box = document.getElementById('customAlertBox');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
    box.style.transform = 'scale(1)';
  }, 10);
};

function closeCustomAlert() {
  const modal = document.getElementById('customAlertModal');
  const box = document.getElementById('customAlertBox');
  modal.style.opacity = '0';
  box.style.transform = 'scale(0.9)';
  setTimeout(() => {
    modal.style.display = 'none';
  }, 200);
}

// Override Native Confirm with Custom Sweet Popup (Async)
window.customConfirmAsync = function (message) {
  return new Promise((resolve) => {
    document.getElementById('customConfirmMessage').innerText = message;
    const modal = document.getElementById('customConfirmModal');
    const box = document.getElementById('customConfirmBox');

    const btnCancel = document.getElementById('btnCustomConfirmCancel');
    const btnOk = document.getElementById('btnCustomConfirmOk');

    const cleanup = () => {
      btnCancel.onclick = null;
      btnOk.onclick = null;
      modal.style.opacity = '0';
      box.style.transform = 'scale(0.9)';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    };

    btnCancel.onclick = () => {
      cleanup();
      resolve(false);
    };

    btnOk.onclick = () => {
      cleanup();
      resolve(true);
    };

    modal.style.display = 'flex';
    setTimeout(() => {
      modal.style.opacity = '1';
      box.style.transform = 'scale(1)';
    }, 10);
  });
};

// Custom Prompt Popup (Async)
window.customPromptAsync = function (message) {
  return new Promise((resolve) => {
    document.getElementById('customPromptMessage').innerText = message;
    const modal = document.getElementById('customPromptModal');
    const box = document.getElementById('customPromptBox');
    const input = document.getElementById('customPromptInput');

    input.value = '';

    const btnCancel = document.getElementById('btnCustomPromptCancel');
    const btnOk = document.getElementById('btnCustomPromptOk');

    const cleanup = () => {
      btnCancel.onclick = null;
      btnOk.onclick = null;
      input.onkeydown = null;
      modal.style.opacity = '0';
      box.style.transform = 'scale(0.9)';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    };

    btnCancel.onclick = () => {
      cleanup();
      resolve(null);
    };

    btnOk.onclick = () => {
      cleanup();
      resolve(input.value);
    };

    modal.style.display = 'flex';
    setTimeout(() => {
      modal.style.opacity = '1';
      box.style.transform = 'scale(1)';
      input.focus();
    }, 10);

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        btnOk.click();
      }
    };
  });
};

// Custom Behavior Prompt Popup (Async)
window.behaviorPromptAsync = function (message) {
  return new Promise((resolve) => {
    document.getElementById('behaviorPromptMessage').innerText = message;
    const modal = document.getElementById('behaviorPromptModal');
    const box = document.getElementById('behaviorPromptBox');
    const input = document.getElementById('behaviorPromptInput');

    input.value = '';

    const btnCancel = document.getElementById('btnBehaviorPromptCancel');
    const btnOk = document.getElementById('btnBehaviorPromptOk');

    const cleanup = () => {
      btnCancel.onclick = null;
      btnOk.onclick = null;
      input.onkeydown = null;
      modal.style.opacity = '0';
      box.style.transform = 'scale(0.9)';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    };

    btnCancel.onclick = () => {
      cleanup();
      resolve(null);
    };

    btnOk.onclick = () => {
      cleanup();
      resolve(input.value);
    };

    modal.style.display = 'flex';
    setTimeout(() => {
      modal.style.opacity = '1';
      box.style.transform = 'scale(1)';
      input.focus();
    }, 10);

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        btnOk.click();
      }
    };
  });
};

// Pagination State
let currentPage = 1;
const rowsPerPage = 100;
let currentDataset = [];

// Date Helpers
function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`; // YYYY-MM-DD Format for consistency
}

function calculateExpiryDate(days) {
  let d = new Date();
  d.setDate(d.getDate() + parseInt(days));
  return formatDate(d);
}

// Flatpickr Calendar Variables
let dateEntryCounts = {};
let obsFlatpickrInstance = null;

function updateDateEntryCounts(data) {
  dateEntryCounts = {};
  data.forEach(p => {
    // Ignore empty/invalid rows
    if (!p.patient_id && !p.checkup_id && parseFloat(p.payment_by_shehjar || 0) <= 0) return;

    // Ignore Doctor Settlements (as they are not patient entries)
    const isSettlement = parseFloat(p.payment_by_shehjar || 0) > 0 && (!p.patient_id || String(p.patient_id).trim() === "");
    if (isSettlement) return;

    const isPharmacy = String(p.status || "").includes("Pharmacy / Payment") || String(p.visit || "").includes("Pharmacy / Payment");

    let pDateStr = p.date;
    if (p.date) {
      const parsedDate = new Date(p.date);
      if (!isNaN(parsedDate)) {
        pDateStr = formatDate(parsedDate);
      }
    }

    if (pDateStr) {
      if (!dateEntryCounts[pDateStr]) {
        dateEntryCounts[pDateStr] = { total: 0, checkups: 0, pharmacy: 0 };
      }
      dateEntryCounts[pDateStr].total++;
      if (isPharmacy) {
        dateEntryCounts[pDateStr].pharmacy++;
      } else {
        dateEntryCounts[pDateStr].checkups++;
      }
    }
  });

  // Re-draw flatpickr to show badges if instance exists
  if (obsFlatpickrInstance) {
    obsFlatpickrInstance.redraw();
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  showApp();

  const defaultFee = localStorage.getItem("defaultFee") || "300";
  const validityDays = localStorage.getItem("validityDays") || "15";

  if (document.getElementById("defaultFee")) document.getElementById("defaultFee").value = defaultFee;
  if (document.getElementById("validityDays")) document.getElementById("validityDays").value = validityDays;

  // Initialize Flatpickr for Date Filter
  obsFlatpickrInstance = flatpickr("#obsDateFilter", {
    dateFormat: "Y-m-d",
    defaultDate: "today",
    onReady: function (selectedDates, dateStr, instance) {
      // Replicate native Chrome "Clear" and "Today" footer buttons
      const footer = document.createElement("div");
      footer.style.display = "flex";
      footer.style.justifyContent = "space-between";
      footer.style.padding = "8px 12px";
      footer.style.borderTop = "1px solid #e2e8f0";
      footer.style.background = "#f8fafc";
      footer.style.borderBottomLeftRadius = "5px";
      footer.style.borderBottomRightRadius = "5px";

      const btnClear = document.createElement("button");
      btnClear.textContent = "Clear";
      btnClear.type = "button";
      btnClear.style.color = "#0ea5e9";
      btnClear.style.background = "transparent";
      btnClear.style.border = "none";
      btnClear.style.cursor = "pointer";
      btnClear.style.fontWeight = "bold";
      btnClear.style.fontSize = "13px";
      btnClear.onclick = function () {
        instance.clear();
        instance.close();
      };

      const btnToday = document.createElement("button");
      btnToday.textContent = "Today";
      btnToday.type = "button";
      btnToday.style.color = "#0ea5e9";
      btnToday.style.background = "transparent";
      btnToday.style.border = "none";
      btnToday.style.cursor = "pointer";
      btnToday.style.fontWeight = "bold";
      btnToday.style.fontSize = "13px";
      btnToday.onclick = function () {
        instance.setDate(new Date(), true); // true triggers onChange
        instance.close();
      };

      footer.appendChild(btnClear);
      footer.appendChild(btnToday);
      instance.calendarContainer.appendChild(footer);
    },
    onChange: function (selectedDates, dateStr, instance) {
      renderObservationList(allPatients);
    },
    onDayCreate: function (dObj, dStr, fp, dayElem) {
      if (dayElem.dateObj) {
        const dateStrFormat = formatDate(dayElem.dateObj);
        const counts = dateEntryCounts[dateStrFormat];
        if (counts && counts.total > 0) {
          // Highlight day base styles
          dayElem.style.position = 'relative';
          dayElem.style.fontWeight = 'bold';
          dayElem.style.color = '#fff';
          dayElem.style.border = 'none';
          dayElem.style.transform = 'scale(0.85)';

          // Let Flatpickr keep its default circular border-radius
          dayElem.style.borderRadius = '50%';

          // Assign Colors based on Entry Types
          if (counts.checkups > 0 && counts.pharmacy > 0) {
            // Both checkups and pharmacy
            dayElem.style.background = 'linear-gradient(135deg, #14b8a6 50%, #8b5cf6 50%)'; // Teal & Purple Split
          } else if (counts.checkups > 0) {
            // Only Checkups
            dayElem.style.backgroundColor = '#14b8a6'; // Teal
          } else {
            // Only Pharmacy/Payment
            dayElem.style.backgroundColor = '#8b5cf6'; // Purple
          }

          // Add Count Badge
          const badge = document.createElement('span');
          badge.innerHTML = counts.total;
          badge.style.position = 'absolute';
          badge.style.top = '-2px';
          badge.style.right = '-2px';
          badge.style.width = '14px';
          badge.style.height = '14px';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.background = '#f59e0b'; // Amber badge
          badge.style.color = 'white';
          badge.style.borderRadius = '50%';
          badge.style.fontSize = '9px';
          badge.style.fontWeight = 'bold';
          badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
          badge.style.pointerEvents = 'none'; // Prevents badge from messing up hover/click events
          dayElem.appendChild(badge);
        }
      }
    }
  });

  // Smart Align Inputs UX (Left default, Right on active/typing)
  document.addEventListener("focusin", function (e) {
    if (e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "hidden") {
      e.target.classList.add("right-aligned");
    }
  });

  document.addEventListener("focusout", function (e) {
    if (e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "hidden") {
      if (!e.target.value || e.target.value === "0" || e.target.value == 0) {
        e.target.classList.remove("right-aligned");
      } else {
        e.target.classList.add("right-aligned");
      }
    }
  });

  document.addEventListener("input", function (e) {
    if (e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "hidden") {
      e.target.classList.add("right-aligned");
    }
  });
});

function showApp() {

  document.getElementById("mainApp").style.display = "block";

  fetchInventory();
  fetchDistributors();
  fetchIndexMappings();
  fetchSoldOutData();
  fetchSalesReturnData();
  fetchPayments();
  loadBuyers();

  const sidebar = document.getElementById("inventorySidebarOffcanvas");

  if (sidebar) sidebar.style.left = "0";
}


window.formatExpiryInput = function (event) {
  const input = event.target || event;
  let val = input.value.replace(/[^0-9]/g, '');

  if (event.inputType === 'deleteContentBackward') {
    if (val.length > 2) {
      input.value = val.substring(0, 2) + '/' + val.substring(2, 4);
    } else {
      input.value = val;
    }
    return;
  }

  if (val.length > 0) {
    let fd = parseInt(val[0]);
    if (fd > 1 && val.length === 1) val = '0' + val;
  }
  if (val.length >= 2) {
    let m = parseInt(val.substring(0, 2));
    if (m > 12) val = '12' + val.substring(2);
    if (m === 0 && val.length >= 2) val = '01' + val.substring(2);
  }

  if (val.length >= 2) {
    input.value = val.substring(0, 2) + '/' + val.substring(2, 4);
  } else {
    input.value = val;
  }
};

function calculateInvAmount() {
  const qty = parseFloat(document.getElementById("invQty").value) || 0;
  const free = parseFloat(document.getElementById("invFree").value) || 0;
  const rate = parseFloat(document.getElementById("invRate").value) || 0;
  const disPercent = parseFloat(document.getElementById("invDis").value) || 0;
  const sgstPercent = parseFloat(document.getElementById("invSGST").value) || 0;
  const cgstPercent = parseFloat(document.getElementById("invCGST").value) || 0;

  const payableQty = Math.max(0, qty - free);
  const amount = payableQty * rate;
  document.getElementById("invAmount").value = amount > 0 ? amount.toFixed(2) : "";

  const discountAmt = (amount * disPercent) / 100;
  const taxableValue = amount - discountAmt;

  document.getElementById("invDis").setAttribute("data-dis-amt", discountAmt);

  const sgstAmt = (taxableValue * sgstPercent) / 100;
  document.getElementById("invSGSTAmt").value = sgstAmt > 0 ? sgstAmt.toFixed(2) : (sgstPercent > 0 ? "0.00" : "");

  const cgstAmt = (taxableValue * cgstPercent) / 100;
  document.getElementById("invCGSTAmt").value = cgstAmt > 0 ? cgstAmt.toFixed(2) : (cgstPercent > 0 ? "0.00" : "");

  if (typeof calculateInventoryTotals === 'function') {
    calculateInventoryTotals();
  }
}

let currentEditingRow = null; // No longer used but kept for backward safety if referenced elsewhere temporarily

// Clear the item row only (keep supplier details)
function clearInventoryForm() {
  document.getElementById("invProductName").value = "";
  document.getElementById("invPack").value = "";
  document.getElementById("invHSN").value = "";
  document.getElementById("invQty").value = "";
  document.getElementById("invFree").value = "";
  document.getElementById("invMRP").value = "";
  document.getElementById("invBatch").value = "";
  document.getElementById("invExp").value = "";
  document.getElementById("invDis").value = "";
  document.getElementById("invSGST").value = "";
  document.getElementById("invSGSTAmt").value = "";
  document.getElementById("invCGST").value = "";
  document.getElementById("invCGSTAmt").value = "";
  document.getElementById("invRate").value = "";
  document.getElementById("invAmount").value = "";
  document.getElementById("invCompany").value = "";

  document.getElementById("invDis").setAttribute("data-dis-amt", "0");
  if (typeof calculateInventoryTotals === 'function') {
    calculateInventoryTotals();
  }
}
// Fetch Inventory Data
async function fetchInventory() {
  const connStatus = document.getElementById('connectionStatus');
  const splashLoader = document.getElementById('splashLoader');

  if (connStatus) connStatus.innerHTML = '<span class="dot" style="color: rgba(255,255,255,0.5);">?</span> Syncing...';

  const cached = localStorage.getItem("cachedInventory");
  if (cached) {
    try {
      inventoryData = JSON.parse(cached);
      renderInventoryTable();
      renderDashboardData();
      if (splashLoader) {
        splashLoader.style.opacity = '0';
        setTimeout(() => splashLoader.style.display = 'none', 200);
      }
    } catch (e) { }
  } else {
    if (splashLoader) {
      splashLoader.style.display = 'flex';
      splashLoader.style.opacity = '1';
    }
  }

  try {
    const response = await fetch(`${WEB_APP_URL}?action=get_inventory&_t=${new Date().getTime()}&optimized=true`);
    const data = await response.json();

    if (data.optimized) {
      inventoryData = data.rows.map((row, i) => {
        let obj = {};
        for (let j = 0; j < data.headers.length; j++) {
          obj[data.headers[j].trim()] = row[j];
        }
        obj.row_index = i + 2;
        return obj;
      });
    } else {
      inventoryData = data;
    }

    localStorage.setItem("cachedInventory", JSON.stringify(inventoryData));
    renderInventoryTable();
    renderDashboardData();
    if (connStatus) connStatus.innerHTML = '<span class="dot" style="background:#10b981; box-shadow: 0 0 8px #10b981;"></span> Connected';
    if (splashLoader) {
      splashLoader.style.opacity = '0';
      setTimeout(() => { splashLoader.style.display = 'none'; }, 500);
    }
    setTimeout(function () {
      if (typeof window.showExpiryAlertModal === 'function') window.showExpiryAlertModal();

    }, 800);
  } catch (err) {
    console.error("Error fetching inventory", err);
    if (splashLoader) {
      splashLoader.style.opacity = '0';
      setTimeout(() => { splashLoader.style.display = 'none'; }, 500);
    }
  }
}

// Fetch Sales Return Data
async function fetchSalesReturnData() {
  const cached = localStorage.getItem('cachedSalesReturn');
  if (cached) {
    try {
      salesReturnData = JSON.parse(cached);
      if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();
      if (typeof window.renderInventoryTable === 'function') window.renderInventoryTable();
      if (typeof renderDashboardData === 'function') renderDashboardData();
      if (typeof window.renderReturnedItemsTable === 'function') window.renderReturnedItemsTable();
    } catch (e) { }
  }
  try {
    const response = await fetch(`${WEB_APP_URL}?action=get_sales_returns&_t=${new Date().getTime()}`);
    const data = await response.json();
    salesReturnData = Array.isArray(data) ? data : (data.data || []);
    localStorage.setItem('cachedSalesReturn', JSON.stringify(salesReturnData));
    if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();
    if (typeof window.renderInventoryTable === 'function') window.renderInventoryTable();
    if (typeof renderDashboardData === 'function') renderDashboardData();
    if (typeof window.renderReturnedItemsTable === 'function') window.renderReturnedItemsTable();
  } catch (err) {
    console.error("Error fetching sales return data", err);
  }
}

// Fetch Sold Out Data
async function fetchSoldOutData() {
  const cached = localStorage.getItem('cachedSoldOut');
  if (cached) {
    try {
      soldOutData = JSON.parse(cached);
      if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();
      if (typeof window.renderInventoryTable === 'function') window.renderInventoryTable();
      if (typeof renderDashboardData === 'function') renderDashboardData();
    } catch (e) { }
  }
  try {
    const response = await fetch(`${WEB_APP_URL}?action=get_sold_out&_t=${new Date().getTime()}`);
    const data = await response.json();
    soldOutData = Array.isArray(data) ? data : (data.data || []);
    localStorage.setItem('cachedSoldOut', JSON.stringify(soldOutData));
    if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();
    if (typeof window.renderInventoryTable === 'function') window.renderInventoryTable();
    if (typeof renderDashboardData === 'function') renderDashboardData();
  } catch (err) {
    console.error("Error fetching sold out data", err);
  }
}

// Fetch Distributors Data
async function fetchDistributors() {
  const connStatus = document.getElementById('connectionStatus');
  if (connStatus) connStatus.innerHTML = '<span class="dot" style="color: rgba(255,255,255,0.5);">?</span> Syncing...';

  const cached = localStorage.getItem('cachedDistributors');
  if (cached) {
    try {
      allDistributors = JSON.parse(cached);
      renderDashboardData();
      const datalist = document.getElementById("invSupplierId");
      const srDatalist = document.getElementById("srSupplierId");
      const nameList = document.getElementById("distributorNameList");
      const srNameList = document.getElementById("srDistributorNameList");
      if (datalist) datalist.innerHTML = '<option value="">-- ID --</option>';
      if (srDatalist) srDatalist.innerHTML = '<option value="">-- ID --</option>';
      if (nameList) nameList.innerHTML = "";
      if (srNameList) srNameList.innerHTML = "";
      if (datalist || srDatalist) {
        allDistributors.forEach(d => {
          if (d.DistributorID) {
            const opt = `<option value="${d.DistributorID}">${d.DistributorID} - ${d.Name || ''}</option>`;
            if (datalist) datalist.innerHTML += opt;
            if (srDatalist) srDatalist.innerHTML += opt;
          }
          if (d.Name) {
            const optName = `<option value="${d.Name}">${d.DistributorID || ''}</option>`;
            if (nameList) nameList.innerHTML += optName;
            if (srNameList) srNameList.innerHTML += optName;
          }
        });
      }
    } catch (e) { }
  }

  try {
    const response = await fetch(`${WEB_APP_URL}?action=get_distributors&_t=${new Date().getTime()}`);
    const data = await response.json();
    allDistributors = data || [];
    localStorage.setItem('cachedDistributors', JSON.stringify(allDistributors));
    renderDashboardData();
    if (connStatus) connStatus.innerHTML = '<span class="dot" style="background:#10b981; box-shadow: 0 0 8px #10b981;"></span> Connected';

    const datalist = document.getElementById("invSupplierId");
    const srDatalist = document.getElementById("srSupplierId");
    const nameList = document.getElementById("distributorNameList");
    const srNameList = document.getElementById("srDistributorNameList");
    if (datalist) datalist.innerHTML = '<option value="">-- ID --</option>';
    if (srDatalist) srDatalist.innerHTML = '<option value="">-- ID --</option>';
    if (nameList) nameList.innerHTML = "";
    if (srNameList) srNameList.innerHTML = "";

    if (datalist || srDatalist) {
      allDistributors.forEach(d => {
        if (d.DistributorID) {
          const opt = `<option value="${d.DistributorID}">${d.DistributorID} - ${d.Name || ''}</option>`;
          if (datalist) datalist.innerHTML += opt;
          if (srDatalist) srDatalist.innerHTML += opt;
        }
        if (d.Name) {
          const optName = `<option value="${d.Name}">${d.DistributorID || ''}</option>`;
          if (nameList) nameList.innerHTML += optName;
          if (srNameList) srNameList.innerHTML += optName;
        }
      });
    }
  } catch (err) {
    console.error("Error fetching distributors", err);
  }
}

// Fetch Payments Data
async function fetchPayments() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=get_payments&_t=${new Date().getTime()}`);
    const data = await response.json();
    paymentData = data || [];
  } catch (error) {
    console.error("Error fetching payments:", error);
  }
}

// Handle Distributor Name Selection
window.handleDistributorNameSelect = function (prefix = 'inv') {
  const selectedName = document.getElementById(`${prefix}Supplier`).value;
  if (!selectedName) return;

  const distributor = allDistributors.find(d => String(d.Name).trim().toLowerCase() === String(selectedName).trim().toLowerCase());
  if (distributor) {
    const elId = document.getElementById(`${prefix}SupplierId`);
    if (elId) elId.value = distributor.DistributorID || '';

    const elAdd1 = document.getElementById(`${prefix}DistAddress1`);
    if (elAdd1) elAdd1.value = distributor.AddressLine1 || '';

    const elAdd2 = document.getElementById(`${prefix}DistAddress2`);
    if (elAdd2) elAdd2.value = distributor.AddressLine2 || '';

    const elPhone = document.getElementById(`${prefix}DistPhone`);
    if (elPhone) elPhone.value = distributor.Phone || '';

    const elEmail = document.getElementById(`${prefix}DistEmail`);
    if (elEmail) elEmail.value = distributor.Email || '';

    const elGSTIN = document.getElementById(`${prefix}DistGSTIN`);
    if (elGSTIN) elGSTIN.value = distributor.GSTIN || '';

    const elFSSI = document.getElementById(`${prefix}DistFSSI`);
    if (elFSSI) elFSSI.value = distributor.FSSILicense || '';

    const elDL = document.getElementById(`${prefix}DistDL`);
    if (elDL) elDL.value = distributor.DrugLicense || '';
  }
};

// Handle Distributor Selection by Name
window.handleDistributorSelectByName = function (prefix = 'inv') {
  const selectedName = document.getElementById(`${prefix}Supplier`).value;
  const elSupplierId = document.getElementById(`${prefix}SupplierId`);

  if (!selectedName) {
    if (elSupplierId) elSupplierId.value = '';
    return;
  }

  const distributor = allDistributors.find(d => (d.Name || "").trim().toLowerCase() === selectedName.trim().toLowerCase());

  if (distributor && elSupplierId) {
    elSupplierId.value = distributor.DistributorID || '';
    if (typeof handleDistributorSelect === 'function') {
      handleDistributorSelect(prefix);
    }
  } else if (elSupplierId) {
    elSupplierId.value = '';
  }
};

function handleDistributorSelect(prefix = 'inv') {
  const selectedId = document.getElementById(`${prefix}SupplierId`).value;
  if (!selectedId) return;

  const distributor = allDistributors.find(d => d.DistributorID === selectedId);
  if (distributor) {
    const elSupplier = document.getElementById(`${prefix}Supplier`);
    if (elSupplier) elSupplier.value = distributor.Name || '';

    const elAdd1 = document.getElementById(`${prefix}DistAddress1`);
    if (elAdd1) elAdd1.value = distributor.AddressLine1 || '';

    const elAdd2 = document.getElementById(`${prefix}DistAddress2`);
    if (elAdd2) elAdd2.value = distributor.AddressLine2 || '';

    const elPhone = document.getElementById(`${prefix}DistPhone`);
    if (elPhone) elPhone.value = distributor.Phone || '';

    const elEmail = document.getElementById(`${prefix}DistEmail`);
    if (elEmail) elEmail.value = distributor.Email || '';

    const elGSTIN = document.getElementById(`${prefix}DistGSTIN`);
    if (elGSTIN) elGSTIN.value = distributor.GSTIN || '';

    const elDrugLic = document.getElementById(`${prefix}DistDrugLic`);
    if (elDrugLic) elDrugLic.value = distributor.DrugLicense || '';

    const elFSSI = document.getElementById(`${prefix}DistFSSILic`);
    if (elFSSI) elFSSI.value = distributor.FSSILicense || '';

    // Calculate and set Last Balance
    let totalInvoiced = 0;
    if (typeof inventoryData !== 'undefined' && Array.isArray(inventoryData)) {
      inventoryData.forEach(item => {
        const name = String(item.Supplier || item.supplier || item.Distributor || item.Company || "").trim();
        if (name.toLowerCase() === (distributor.Name || "").trim().toLowerCase()) {
          const itemInvNo = String(item.InvoiceNo || item.invoiceNo || "").trim();
          const currentInvNo = window.currentUpdatingInvoiceNo ? String(window.currentUpdatingInvoiceNo).trim() : null;

          if (!currentInvNo || itemInvNo !== currentInvNo) {
            totalInvoiced += parseFloat(item.Amount || item.amount || 0);
          }
        }
      });
    }

    let totalReturned = 0;
    if (typeof salesReturnData !== 'undefined' && Array.isArray(salesReturnData)) {
      salesReturnData.forEach(item => {
        const name = String(item['Distributor Name'] || item.DistributorName || item.Supplier || item.Distributor || "").trim();
        if (name.toLowerCase() === (distributor.Name || "").trim().toLowerCase()) {
          const itemInvNo = String(item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo || "").trim().replace(/^SR-/, '');
          const currentSrInvNo = window.currentUpdatingSrInvoiceNo ? String(window.currentUpdatingSrInvoiceNo).trim().replace(/^SR-/, '') : null;

          if (!currentSrInvNo || itemInvNo !== currentSrInvNo) {
            const retQty = parseFloat(item['Return Qty'] || item.ReturnQty || item.ReturnedQty || item.Qty || 0);
            const rate = parseFloat(item.Rate || item.rate || item.MRP || item.mrp || 0);
            const amount = parseFloat(item.Amount || item.ReturnAmount || item.Total || (retQty * rate)) || 0;
            totalReturned += amount;
          }
        }
      });
    }

    let totalPaid = 0;
    if (typeof paymentData !== 'undefined' && Array.isArray(paymentData)) {
      paymentData.forEach(p => {
        if (String(p.DistributorName || "").trim().toLowerCase() === (distributor.Name || "").trim().toLowerCase()) {
          totalPaid += parseFloat(p.AmountPaid || 0);
        }
      });
    }

    const lastBal = totalInvoiced - totalReturned - totalPaid;

    const lastBalId = prefix === 'inv' ? "lastBalInput" : "lastBalInputSr";
    const lastBalInputEl = document.getElementById(lastBalId);
    if (lastBalInputEl) {
      lastBalInputEl.value = lastBal.toFixed(2);
      if (prefix === 'inv' && typeof calculateInventoryTotals === 'function') {
        calculateInventoryTotals();
      } else if (prefix === 'sr' && typeof calculateSrTotals === 'function') {
        calculateSrTotals();
      }
    }
  }
}

// Render Table and Alerts
function renderInventoryTable() {
  const tbody = document.getElementById("inventoryTableBody");
  const countEl = document.getElementById("invCount");

  const searchEl = document.getElementById("invSearchInput");
  const search = searchEl ? searchEl.value.toLowerCase().trim() : "";

  const filterBillNoEl = document.getElementById("filterBillNo");
  const filterBillNo = filterBillNoEl ? filterBillNoEl.value.toLowerCase().trim() : "";

  const filterDistributorEl = document.getElementById("filterDistributor");
  const filterDistributor = filterDistributorEl ? filterDistributorEl.value.toLowerCase().trim() : "";

  const filterDateEl = document.getElementById("filterDate");
  const filterDate = filterDateEl ? filterDateEl.value.trim() : "";

  const filterExpiryEl = document.getElementById("filterExpiry");
  const filterExpiry = filterExpiryEl ? filterExpiryEl.value.toLowerCase().trim() : "";

  const alertsList = document.getElementById("expiryAlertsList");
  const alertsContainer = document.getElementById("expiryAlertsContainer");

  if (!tbody) return;

  tbody.innerHTML = "";
  if (alertsList) alertsList.innerHTML = "";
  let alertsCount = 0;

  const today = new Date();

  // 1. Filter by all fields
  let searchFiltered = inventoryData.filter(item => {
    let match = true;

    if (search) {
      const pMatch = item.ProductDescription && String(item.ProductDescription).toLowerCase().includes(search);
      const bMatch = item.Batch && String(item.Batch).toLowerCase().includes(search);
      if (!pMatch && !bMatch) match = false;
    }

    if (filterBillNo && match) {
      if (!item.InvoiceNo || !String(item.InvoiceNo).toLowerCase().includes(filterBillNo)) match = false;
    }

    if (filterDistributor && match) {
      const distName = String(item.Supplier || item.supplier || item.Distributor || item.Company || "").toLowerCase();
      const distId = String(item.SupplierID || item.supplierId || item.DistributorID || item.DIstributor_ID || item.Distributor_ID || "").toLowerCase();
      if (!distName.includes(filterDistributor) && !distId.includes(filterDistributor)) {
        match = false;
      }
    }

    if (filterDate && match) {
      if (!item.Date || !String(item.Date).includes(filterDate)) match = false;
    }

    if (filterExpiry && match) {
      if (!item.Exp || !String(item.Exp).toLowerCase().includes(filterExpiry)) match = false;
    }

    return match;
  });

  // 2. Generate Alerts based on searchFiltered
  searchFiltered.forEach(item => {
    const normalizedExp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || '');
    if (normalizedExp && normalizedExp.includes('/')) {
      const parts = normalizedExp.split('/');
      if (parts.length === 2) {
        let month = parseInt(parts[0]);
        let year = parseInt(parts[1]);
        if (year < 100) year += 2000;
        const expDate = new Date(year, month, 0);
        expDate.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
          alertsCount++;
          if (alertsList) alertsList.innerHTML += `<div style="color: #9f1239; font-size: 13px; font-weight: 700;">🚨 EXPIRED: <span style="color:#e11d48">${item.ProductDescription || item.ProductName}</span> (Batch: ${item.Batch}) expired on ${normalizedExp}. <span style="font-size:11px; font-weight:600; color:#475569;">Stock: ${item.Qty}</span></div>`;
        } else if (daysLeft >= 0 && daysLeft <= 15) {
          alertsCount++;
          if (alertsList) alertsList.innerHTML += `<div style="color: #9a3412; font-size: 13px; font-weight: 700;">⚠️ EXPIRING SOON: <span style="color:#ea580c">${item.ProductDescription || item.ProductName}</span> (Batch: ${item.Batch}) expires in ${daysLeft} days! <span style="font-size:11px; font-weight:600; color:#475569;">Stock: ${item.Qty}</span></div>`;
        }
      }
    }
  });

  let filtered = searchFiltered.sort((a, b) => {
    const invA = parseInt(String(a.InvoiceNo || a.invoiceNo || '0').replace(/\\D/g, '')) || 0;
    const invB = parseInt(String(b.InvoiceNo || b.invoiceNo || '0').replace(/\\D/g, '')) || 0;
    if (invA < invB) return -1;
    if (invA > invB) return 1; if (!a.Exp) return 1;
    if (!b.Exp) return -1;
    const aParts = String(a.Exp).split('/');
    const bParts = String(b.Exp).split('/');
    if (aParts.length !== 2 || bParts.length !== 2) return 0;
    // Year comparison
    if (aParts[1] !== bParts[1]) return parseInt(aParts[1]) - parseInt(bParts[1]);
    // Month comparison
    return parseInt(aParts[0]) - parseInt(bParts[0]);
  });

  if (countEl) countEl.innerText = filtered.length;

  let groups = {};
  filtered.forEach(item => {
    const inv = item.InvoiceNo || item.invoiceNo || "N/A";
    if (!groups[inv]) groups[inv] = [];
    groups[inv].push(item);
  });

  Object.keys(groups).forEach(invNo => {
    const groupItems = groups[invNo];

    groupItems.forEach((item, groupIndex) => {
      // Expiry Check Logic (Format MM/YY)
      let isExpired = false;
      let isExpiringSoon = false;
      const normalizedExp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || '');
      if (normalizedExp && normalizedExp.includes('/')) {
        const parts = normalizedExp.split('/');
        if (parts.length === 2) {
          let month = parseInt(parts[0]);
          let year = parseInt(parts[1]);
          if (year < 100) year += 2000;

          // Expiry is end of the month
          const expDate = new Date(year, month, 0); // last day of month
          expDate.setHours(0, 0, 0, 0);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));

          if (daysLeft < 0) {
            isExpired = true;
          }

          if (daysLeft >= 0 && daysLeft <= 15) {
            isExpiringSoon = true;
          }
        }
      }

      let trStyle = "";
      if (isExpired) trStyle = "background-color: #fee2e2;"; // red
      else if (isExpiringSoon) trStyle = "background-color: #ffedd5;"; // orange

      const isFirst = groupIndex === 0;

      let row = `<tr style="${trStyle}">`;

      if (isFirst) {
        row += `<td rowspan="${groupItems.length}" style="font-size: 11px; font-weight: 800; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #cbd5e1; vertical-align: middle; text-align: center; background: #f8fafc;">${invNo}</td>`;
      }

      row += `
        <td style="font-weight: 700; color: #1e293b;">${item.ProductDescription || item.ProductName || item.productName || '-'}</td>
        <td style="font-size: 11px; text-align: center;">${item.DistributorID || item.DistributorId || item.supplierId || item.DIstributor_ID || '-'}</td>
        <td style="font-family: monospace; font-weight: 800; color: #475569;">${item.Batch || '-'}</td>
        <td style="font-weight: 700; color: ${isExpired ? '#e11d48' : '#0f766e'};">${normalizedExp || '-'}</td>
        <td style="font-weight: 800;">${item.Qty || '0'}</td>
        <td style="font-size: 11px;">${item.Supplier || item.supplier || item.Distributor || '-'}</td>
        <td style="font-size: 11px;">${item.Date || item.date || '-'}</td>
      `;

      if (isFirst) {
        const isSR = String(invNo).toUpperCase().startsWith('SR-');
        const editBtnHtml = isSR ? '' : `
          <button type="button" class="btn" style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 11px; margin-bottom: 4px; display: block; width: 100%; text-align: center;" title="Edit Bill" onclick="editInventoryStockItem('${invNo}')">
            <i class="fas fa-edit"></i> Edit Bill
          </button>`;

        row += `<td rowspan="${groupItems.length}" style="border-bottom: 2px solid #cbd5e1; border-left: 1px solid #cbd5e1; vertical-align: middle; padding: 10px 5px; background: #f8fafc;">
          ${editBtnHtml}
          <button type="button" class="btn" style="background: #fee2e2; color: #e11d48; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 11px; display: block; width: 100%; text-align: center;" title="Delete Bill" onclick="deleteInventoryStockItem('${invNo}', this)">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>`;
      }

      row += `</tr>`;
      tbody.innerHTML += row;
    });
  });

  if (alertsContainer) {
    if (alertsCount > 0) {
      alertsContainer.style.display = "block";
    } else {
      alertsContainer.style.display = "none";
    }
  }
}

window.editInventoryStockItem = async function (invoiceNo) {
  const items = inventoryData.filter(i => (i.InvoiceNo || i.invoiceNo || "N/A") === invoiceNo);
  if (!items || items.length === 0) return;

  const proceed = await customConfirmAsync("If you edit this bill, the existing record will be updated when saved. Do you want to proceed?");
  if (!proceed) return;

  // Clear current table
  await clearEntireBill(true);

  // Set this BEFORE calculating distributor balances so the current invoice is excluded from last balance!
  window.currentUpdatingInvoiceNo = invoiceNo;

  const firstItem = items[0];

  // Fill global bill form headers:
  document.getElementById("invSupplier").value = firstItem.Supplier || firstItem.supplier || firstItem.Distributor || firstItem.Company || "";
  document.getElementById("invSupplierId").value = firstItem.DIstributor_ID || firstItem.Distributor_ID || firstItem.DistributorID || firstItem.SupplierId || firstItem.supplierId || "";
  handleDistributorSelect();

  const buyerNameInput = document.getElementById("invBuyerName");
  if (buyerNameInput) {
    buyerNameInput.value = firstItem.BuyerName || firstItem.buyerName || "";
    const buyerId = firstItem.BuyerID || firstItem.buyerId || firstItem.BuyerId || "";
    if (typeof handleBuyerSelect === 'function') handleBuyerSelect(buyerId);
  }

  const invoiceNoInput = document.getElementById("invInvoiceNo");
  if (invoiceNoInput) invoiceNoInput.value = firstItem.InvoiceNo || firstItem.invoiceNo || "";

  const entryDateInput = document.getElementById("invEntryDate");
  if (entryDateInput) entryDateInput.value = firstItem.Date || firstItem.date || "";

  // Add all items dynamically as added rows
  const tbody = document.getElementById("billTableBody");
  const inputRow = document.getElementById("inputRow");

  items.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className = "added-row";
    tr.style.height = "25px";
    tr.style.verticalAlign = "top";
    tr.style.borderBottom = "1px solid #cbd5e1";

    const rowAmount = parseFloat(item.Amount || item.amount) || 0;
    const disPercent = parseFloat(item.DisPercent || item.Dis || item.dis) || 0;
    const rowDisAmt = (rowAmount * disPercent) / 100;
    const sgstPercent = parseFloat(item.SGSTPercent || item.SGST || item.sgst) || 0;
    const cgstPercent = parseFloat(item.CGSTPercent || item.CGST || item.cgst) || 0;

    const taxableAmt = rowAmount - rowDisAmt;
    const sgstAmt = (taxableAmt * sgstPercent) / 100;
    const cgstAmt = (taxableAmt * cgstPercent) / 100;

    const formattedExp = normalizeExpiry(item.Exp || item.exp);
    tr.innerHTML = `
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-product" value="${item.ProductDescription || item.ProductName || item.productName || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; min-width: 140px; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-pack" value="${item.Pack || item.pack || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-hsn" value="${item.HSN || item.hsn || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-qty" value="${item.Qty || item.qty || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-free" value="${item.Free || item.free || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-mrp" value="${item.MRP || item.mrp || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-batch" value="${item.Batch || item.batch || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-exp" value="${formattedExp}" oninput="if(typeof formatExpiryInput === 'function') formatExpiryInput(event); calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-dis" value="${disPercent || ''}" data-dis-amt="${rowDisAmt.toFixed(2)}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst" value="${sgstPercent || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst-amt" value="${sgstAmt.toFixed(2)}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst" value="${cgstPercent || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst-amt" value="${cgstAmt.toFixed(2)}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-rate" value="${item.Rate || item.rate || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-amount" value="${rowAmount.toFixed(2)}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right; font-weight: bold;"></td>
      <td style="padding: 4px;"><input type="text" class="col-company" value="${item.Company || item.company || ''}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left; text-transform: uppercase;"></td>
    `;

    tbody.insertBefore(tr, inputRow);
  });

  if (typeof calculateInventoryTotals === 'function') {
    calculateInventoryTotals();
  }

  window.currentUpdatingInvoiceNo = invoiceNo;
  const saveBtn = document.getElementById("btnSaveInventory");
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Bill <div class="loader" id="invBtnLoader" style="display: none; border-color: white; border-top-color: transparent; width: 14px; height: 14px; margin-left: 5px;"></div>';
    saveBtn.style.background = '#f59e0b'; // orange
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteInventoryStockItem = async function (invoiceNo, btnElement) {
  const isConfirmed = await customConfirmAsync(`Are you sure you want to delete the ENTIRE BILL: ${invoiceNo}?`);
  if (!isConfirmed) return;

  // Optimistic Delete
  const originalInventory = [...inventoryData];
  inventoryData = inventoryData.filter(i => (i.InvoiceNo || i.invoiceNo || "N/A") !== invoiceNo);
  localStorage.setItem("cachedInventory", JSON.stringify(inventoryData));
  renderInventoryTable();
  if (typeof renderDashboardData === 'function') renderDashboardData();
  if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();

  const payload = {
    action: "delete_invoice",
    invoiceNo: invoiceNo
  };

  fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(res => res.json()).then(result => {
    if (!result.success) {
      alert("❌ Error deleting item: " + (result.message || ""));
      inventoryData = originalInventory;
      localStorage.setItem("cachedInventory", JSON.stringify(inventoryData));
      renderInventoryTable();
      renderDashboardData();
    } else {
      fetchInventory();
    }
  }).catch(err => {
    alert("❌ Network error while deleting item. Please check your backend code.");
    inventoryData = originalInventory;
    localStorage.setItem("cachedInventory", JSON.stringify(inventoryData));
    renderInventoryTable();
    renderDashboardData();
  });
};

// Add Item
async function addInventoryItem() {
  const btn = document.getElementById("btnSaveInventory");
  const loader = document.getElementById("invBtnLoader");

  const payload = {
    action: "add_inventory",
    supplier: document.getElementById("invSupplier").value,
    supplierId: document.getElementById("invSupplierId") ? document.getElementById("invSupplierId").value : "",
    invoiceNo: document.getElementById("invInvoiceNo").value,
    date: document.getElementById("invEntryDate").value,
    productName: document.getElementById("invProductName").value,
    pack: document.getElementById("invPack").value,
    hsn: document.getElementById("invHSN").value,
    qty: document.getElementById("invQty").value,
    free: document.getElementById("invFree").value,
    mrp: document.getElementById("invMRP").value,
    batch: document.getElementById("invBatch").value,
    exp: document.getElementById("invExp").value,
    dis: document.getElementById("invDis").value,
    sgst: document.getElementById("invSGST").value,
    cgst: document.getElementById("invCGST").value,
    rate: document.getElementById("invRate").value,
    amount: document.getElementById("invAmount").value,
    company: document.getElementById("invCompany").value
  };

  btn.disabled = true;
  loader.style.display = "inline-block";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.success) {
      clearInventoryForm();
      fetchInventory();
      alert("✅ Item added to inventory successfully!");
    } else {
      alert("❌ Error saving to inventory");
    }
  } catch (err) {
    alert("❌ Network Error while saving");
  } finally {
    btn.disabled = false;
    loader.style.display = "none";
  }
}

// Dynamic Invoice Row Addition
function addInventoryRow() {
  const fields = ['invProductName', 'invPack', 'invHSN', 'invQty', 'invFree', 'invMRP', 'invBatch', 'invExp', 'invDis', 'invSGST', 'invSGSTAmt', 'invCGST', 'invCGSTAmt', 'invRate', 'invAmount', 'invCompany'];

  const vals = {};
  fields.forEach(f => vals[f] = document.getElementById(f).value);

  const supplierName = document.getElementById("invSupplier").value.trim();
  const buyerName = document.getElementById("invBuyerName").value.trim();

  if (!supplierName) {
    alert("Please select a Distributor first!");
    return;
  }

  if (!buyerName) {
    alert("Please select a Buyer first!");
    return;
  }

  if (!vals.invProductName || !vals.invQty) {
    alert("Please enter Product Name and Qty!");
    return;
  }

  const tr = document.createElement("tr");
  tr.className = "added-row";
  tr.style.height = "25px";
  tr.style.verticalAlign = "top";
  tr.style.borderBottom = "1px solid #cbd5e1";

  const rowAmount = parseFloat(vals.invAmount) || 0;
  const disPercent = parseFloat(vals.invDis) || 0;
  const rowDisAmt = (rowAmount * disPercent) / 100;

  tr.innerHTML = `
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-product" value="${vals.invProductName}" oninput="calculateAddedRowAmount(this)" style="width: 100%; min-width: 140px; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-pack" value="${vals.invPack}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-hsn" value="${vals.invHSN}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-qty" value="${vals.invQty}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-free" value="${vals.invFree}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-mrp" value="${vals.invMRP}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-batch" value="${vals.invBatch}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-exp" value="${vals.invExp}" oninput="if(typeof formatExpiryInput === 'function') formatExpiryInput(event); calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-dis" value="${vals.invDis}" data-dis-amt="${rowDisAmt}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst" value="${vals.invSGST}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst-amt" value="${vals.invSGSTAmt}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst" value="${vals.invCGST}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst-amt" value="${vals.invCGSTAmt}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-rate" value="${vals.invRate}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-amount" value="${vals.invAmount}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right; font-weight: bold;"></td>
    <td style="padding: 4px;"><input type="text" class="col-company" value="${vals.invCompany}" oninput="calculateAddedRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left; text-transform: uppercase;"></td>
  `;

  document.getElementById("billTableBody").insertBefore(tr, document.getElementById("inputRow"));

  clearInventoryForm();
  calculateInventoryTotals();
}

window.calculateAddedRowAmount = function (element) {
  const tr = element.closest('tr');
  const qty = parseFloat(tr.querySelector('.col-qty').value) || 0;
  const free = parseFloat(tr.querySelector('.col-free').value) || 0;
  const rate = parseFloat(tr.querySelector('.col-rate').value) || 0;
  const disPercent = parseFloat(tr.querySelector('.col-dis').value) || 0;
  const sgstPercent = parseFloat(tr.querySelector('.col-sgst').value) || 0;
  const cgstPercent = parseFloat(tr.querySelector('.col-cgst').value) || 0;

  const payableQty = Math.max(0, qty - free);
  const amount = payableQty * rate;
  tr.querySelector('.col-amount').value = amount > 0 ? amount.toFixed(2) : "";

  const discountAmt = (amount * disPercent) / 100;
  const taxableValue = amount - discountAmt;

  tr.querySelector('.col-dis').setAttribute("data-dis-amt", discountAmt);

  const sgstAmt = (taxableValue * sgstPercent) / 100;
  tr.querySelector('.col-sgst-amt').value = sgstAmt > 0 ? sgstAmt.toFixed(2) : (sgstPercent > 0 ? "0.00" : "");

  const cgstAmt = (taxableValue * cgstPercent) / 100;
  tr.querySelector('.col-cgst-amt').value = cgstAmt > 0 ? cgstAmt.toFixed(2) : (cgstPercent > 0 ? "0.00" : "");

  calculateInventoryTotals();
};

function calculateInventoryTotals() {
  const rows = document.querySelectorAll("#billTableBody tr.added-row");

  let totalQty = 0;
  let totalItems = 0;
  let subTotal = 0;
  let discountTotal = 0;
  let sgstTotal = 0;
  let cgstTotal = 0;

  rows.forEach(tr => {
    const productName = tr.querySelector('.col-product').value.trim();
    if (!productName) return; // skip deleted/empty rows

    totalItems++;
    totalQty += parseFloat(tr.querySelector(".col-qty").value) || 0;
    subTotal += parseFloat(tr.querySelector(".col-amount").value) || 0;
    discountTotal += parseFloat(tr.querySelector(".col-dis").getAttribute("data-dis-amt")) || 0;
    sgstTotal += parseFloat(tr.querySelector(".col-sgst-amt").value) || 0;
    cgstTotal += parseFloat(tr.querySelector(".col-cgst-amt").value) || 0;
  });

  // Include inputRow for LIVE updating
  const inputProductName = document.getElementById("invProductName") ? document.getElementById("invProductName").value.trim() : "";
  if (inputProductName) {
    totalItems++;
    totalQty += parseFloat(document.getElementById("invQty").value) || 0;
    subTotal += parseFloat(document.getElementById("invAmount").value) || 0;
    discountTotal += parseFloat(document.getElementById("invDis").getAttribute("data-dis-amt")) || 0;
    sgstTotal += parseFloat(document.getElementById("invSGSTAmt").value) || 0;
    cgstTotal += parseFloat(document.getElementById("invCGSTAmt").value) || 0;
  }

  document.getElementById("totalQtyInput").innerText = totalQty > 0 ? totalQty : "0";
  document.getElementById("totalItemsInput").innerText = totalItems > 0 ? totalItems : "0";

  document.getElementById("subTotalInput").innerText = subTotal > 0 ? subTotal.toFixed(2) : "0.00";
  document.getElementById("discountTotalInput").innerText = discountTotal > 0 ? discountTotal.toFixed(2) : "0.00";
  document.getElementById("sgstTotalInput").innerText = sgstTotal > 0 ? sgstTotal.toFixed(2) : "0.00";
  document.getElementById("cgstTotalInput").innerText = cgstTotal > 0 ? cgstTotal.toFixed(2) : "0.00";

  const invoiceAmtExact = subTotal - discountTotal + sgstTotal + cgstTotal;
  const grandTotalRounded = Math.round(invoiceAmtExact);
  const roundOffAmount = grandTotalRounded - invoiceAmtExact;

  document.getElementById("invoiceAmtInput").innerText = invoiceAmtExact > 0 ? invoiceAmtExact.toFixed(2) : "0.00";
  document.getElementById("roundOffInput").innerText = invoiceAmtExact !== 0 ? roundOffAmount.toFixed(2) : "0.00";
  document.getElementById("grandTotalInput").innerText = grandTotalRounded > 0 ? grandTotalRounded.toFixed(2) : "0.00";

  const lastBal = parseFloat(document.getElementById("lastBalInput").value) || 0;
  const thisBill = grandTotalRounded;

  document.getElementById("thisBillInput").innerText = thisBill > 0 ? thisBill.toFixed(2) : "0.00";

  const netBal = lastBal + thisBill;
  document.getElementById("netBalInput").innerText = netBal !== 0 ? netBal.toFixed(2) : "0.00";
}

window.printInvoiceBill = function () {
  const formArea = document.getElementById("inventoryForm");

  if (!formArea) return;

  const clonedForm = formArea.cloneNode(true);

  const originalInputsList = Array.from(formArea.querySelectorAll("input, select, textarea"));
  const clonedInputsList = Array.from(clonedForm.querySelectorAll("input, select, textarea"));

  clonedInputsList.forEach((clonedInput, index) => {
    const orig = originalInputsList[index];
    if (!orig) return;

    if (clonedInput.type === 'hidden' || clonedInput.type === 'button' || clonedInput.type === 'submit') {
      clonedInput.style.display = 'none';
      return;
    }

    let val = "";
    if (orig.tagName === "SELECT") {
      const selected = orig.options[orig.selectedIndex];
      val = selected ? selected.text : "";
    } else {
      val = orig.value;
    }

    const span = document.createElement("span");
    span.textContent = val;
    span.style.cssText = orig.style.cssText;
    span.style.display = orig.style.display || "inline-block";
    span.style.border = "none";
    span.style.background = "transparent";
    span.style.minWidth = "0";

    if (clonedInput.parentNode) {
      clonedInput.parentNode.replaceChild(span, clonedInput);
    }
  });

  // Hide bottom action buttons ("Add Row", "Clear Entry", "Save Bill")
  const saveBtn = clonedForm.querySelector("#btnSaveInventory");
  if (saveBtn && saveBtn.parentElement) saveBtn.parentElement.style.display = 'none';

  const addRowBtn = clonedForm.querySelector("#btnAddInventoryRow");
  if (addRowBtn && addRowBtn.parentElement) addRowBtn.parentElement.style.display = 'none';

  const styleHref = new URL('style.css', window.location.href).href;

  const printWindow = window.open('', '', 'height=700,width=900');
  if (!printWindow) {
    alert("Please allow popups to print invoices.");
    return;
  }

  printWindow.document.write('<html><head><title>Print Invoice</title>');
  printWindow.document.write('<link rel="stylesheet" href="' + styleHref + '">');
  printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">');
  printWindow.document.write('<style>');
  printWindow.document.write(`
    @page { size: landscape; margin: 5mm; }
    body { background: white !important; margin: 0; padding: 10px; font-family: "Outfit", sans-serif; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    #inventoryForm { display: block !important; margin: 0 auto; max-width: 100%; border: none; }
    
    /* Remove gray shading on rows and cells */
    tbody tr, tbody td, table tr:nth-child(even), table tr:nth-child(odd) {
        background: transparent !important;
        background-color: transparent !important;
    }

    /* Allow browser native print scaling by removing fixed min-widths and overflow clips */
    div, table, tbody, thead, tr, th, td, section { 
        min-width: 0 !important; 
        overflow: visible !important; 
        overflow-x: visible !important;
    }
    
    /* Force table to fit within the page and align with the header box */
    table { width: 100% !important; max-width: 100% !important; table-layout: auto !important; }
    th, td { font-size: 8px !important; padding: 2px !important; word-wrap: break-word !important; white-space: normal !important; }
    span { font-size: 8px !important; word-wrap: break-word !important; white-space: normal !important; }
  `);
  printWindow.document.write('</style>');
  printWindow.document.write('</head><body>');

  // Add Big Title for Invoice
  printWindow.document.write('<div style="text-align: center; margin-bottom: 10px;"><h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #000; text-decoration: underline; text-transform: uppercase;">INVOICE BILL</h1></div>');

  printWindow.document.write(clonedForm.outerHTML);
  printWindow.document.write('</body></html>');

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

window.printSalesReturnBill = function () {
  const formArea = document.getElementById("srentoryForm");

  if (!formArea) return;

  const clonedForm = formArea.cloneNode(true);

  const originalInputsList = Array.from(formArea.querySelectorAll("input, select, textarea"));
  const clonedInputsList = Array.from(clonedForm.querySelectorAll("input, select, textarea"));

  clonedInputsList.forEach((clonedInput, index) => {
    const orig = originalInputsList[index];
    if (!orig) return;

    if (clonedInput.type === 'hidden' || clonedInput.type === 'button' || clonedInput.type === 'submit') {
      clonedInput.style.display = 'none';
      return;
    }

    let val = "";
    if (orig.tagName === "SELECT") {
      const selected = orig.options[orig.selectedIndex];
      val = selected ? selected.text : "";
    } else {
      val = orig.value;
    }

    const span = document.createElement("span");
    span.textContent = val;
    span.style.cssText = orig.style.cssText;
    span.style.display = orig.style.display || "inline-block";
    span.style.border = "none";
    span.style.background = "transparent";
    span.style.minWidth = "0";

    if (clonedInput.parentNode) {
      clonedInput.parentNode.replaceChild(span, clonedInput);
    }
  });

  // Hide bottom action buttons
  const saveBtn = clonedForm.querySelector("#btnSaveSr");
  if (saveBtn && saveBtn.parentElement) saveBtn.parentElement.style.display = 'none';

  const addRowBtn = clonedForm.querySelector("#btnAddSrRow");
  if (addRowBtn && addRowBtn.parentElement) addRowBtn.parentElement.style.display = 'none';

  const styleHref = new URL('style.css', window.location.href).href;

  const printWindow = window.open('', '', 'height=700,width=900');
  if (!printWindow) {
    alert("Please allow popups to print invoices.");
    return;
  }

  printWindow.document.write('<html><head><title>Print Sales Return</title>');
  printWindow.document.write('<link rel="stylesheet" href="' + styleHref + '">');
  printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">');
  printWindow.document.write('<style>');
  printWindow.document.write(`
    @page { size: landscape; margin: 5mm; }
    body { background: white !important; margin: 0; padding: 10px; font-family: "Outfit", sans-serif; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    #srentoryForm { display: block !important; margin: 0 auto; max-width: 100%; border: none; }
    
    /* Remove gray shading on rows and cells */
    tbody tr, tbody td, table tr:nth-child(even), table tr:nth-child(odd) {
        background: transparent !important;
        background-color: transparent !important;
    }

    /* Allow browser native print scaling by removing fixed min-widths and overflow clips */
    div, table, tbody, thead, tr, th, td, section { 
        min-width: 0 !important; 
        overflow: visible !important; 
        overflow-x: visible !important;
    }
    
    /* Force table to fit within the page and align with the header box */
    table { width: 100% !important; max-width: 100% !important; table-layout: auto !important; }
    th, td { font-size: 8px !important; padding: 2px !important; word-wrap: break-word !important; white-space: normal !important; }
    span { font-size: 8px !important; word-wrap: break-word !important; white-space: normal !important; }
  `);
  printWindow.document.write('</style>');
  printWindow.document.write('</head><body>');

  // Add Big Title for Sales Return
  printWindow.document.write('<div style="text-align: center; margin-bottom: 10px;"><h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #000; text-decoration: underline; text-transform: uppercase;">SALES RETURN BILL</h1></div>');

  printWindow.document.write(clonedForm.outerHTML);
  printWindow.document.write('</body></html>');

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};
window.clearEntireBill = async function (force = false) {
  if (!force) {
    const isConfirmed = await customConfirmAsync("Are you sure you want to clear the entire bill?");
    if (!isConfirmed) return;
  }

  // Clear Distributor
  document.getElementById("invSupplier").value = "";
  document.getElementById("invSupplierId").value = "";
  document.getElementById("invDistAddress1").value = "";
  document.getElementById("invDistAddress2").value = "";
  document.getElementById("invDistPhone").value = "";
  document.getElementById("invDistEmail").value = "";
  document.getElementById("invDistGSTIN").value = "";
  document.getElementById("invDistDrugLic").value = "";
  document.getElementById("invDistFSSILic").value = "";

  // Clear Buyer
  document.getElementById("invBuyerName").value = "";
  document.getElementById("invBuyerAddress").value = "";
  document.getElementById("invBuyerGST").value = "";
  document.getElementById("invBuyerPAN").value = "";
  document.getElementById("invBuyerPhone").value = "";
  document.getElementById("invBuyerDrugLic").value = "";
  document.getElementById("invBuyerSalesMan").value = "";
  document.getElementById("invBuyerRoute").value = "";

  // Clear Invoice
  document.getElementById("invInvoiceNo").value = "";
  document.getElementById("invEntryDate").value = "";

  // Remove all added rows
  const rows = document.querySelectorAll("#billTableBody tr.added-row");
  rows.forEach(r => r.remove());

  // Clear input row
  clearInventoryForm();

  // Recalculate totals
  calculateInventoryTotals();

  window.currentUpdatingInvoiceNo = null;
  const saveBtn = document.getElementById("btnSaveInventory");
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Save Bill Item <div class="loader" id="invBtnLoader" style="display: none; border-color: white; border-top-color: transparent; width: 14px; height: 14px; margin-left: 5px;"></div>';
    saveBtn.style.background = '#000';
  }
}

window.saveBillItem = async function () {
  const btn = document.getElementById("btnSaveInventory");
  const loader = document.getElementById("invBtnLoader");

  const supplierName = document.getElementById("invSupplier").value.trim();
  const supplierId = document.getElementById("invSupplierId").value.trim();
  const buyerName = document.getElementById("invBuyerName").value.trim();
  const invoiceNo = document.getElementById("invInvoiceNo").value.trim();
  const date = document.getElementById("invEntryDate").value;

  if (!invoiceNo || !date) {
    alert("Please enter Invoice No. and Date before saving!");
    return;
  }

  if (!supplierName) {
    alert("Please select a Distributor before saving!");
    return;
  }

  if (!buyerName) {
    alert("Please enter or select a Buyer before saving!");
    return;
  }

  const inputProductName = document.getElementById("invProductName") ? document.getElementById("invProductName").value.trim() : "";
  const inputQty = document.getElementById("invQty") ? document.getElementById("invQty").value.trim() : "";

  if (inputProductName && inputQty) {
    if (typeof addInventoryRow === 'function') {
      addInventoryRow();
    }
  }

  const rows = document.querySelectorAll("#billTableBody tr.added-row");
  if (rows.length === 0) {
    alert("Please add at least one item to the bill before saving!");
    return;
  }

  if (window.currentUpdatingInvoiceNo) {
    const isConfirmed = await customConfirmAsync("You are updating an existing bill. This will override the old bill data with the current items. Do you want to proceed?");
    if (!isConfirmed) return;
  }

  const items = [];
  rows.forEach(tr => {
    const productName = tr.querySelector(".col-product").value.trim();
    if (!productName) return; // Skip empty rows (considered deleted)

    const buyerObj = buyersList.find(b => b.name.toLowerCase() === buyerName.toLowerCase());
    const buyerId = buyerObj ? buyerObj.buyerId : "";

    items.push({
      supplier: supplierName,
      supplierId: supplierId,
      BuyerName: buyerName,
      BuyerID: buyerId,
      invoiceNo: invoiceNo,
      date: date,
      productName: productName,
      pack: tr.querySelector(".col-pack").value,
      hsn: tr.querySelector(".col-hsn").value,
      qty: tr.querySelector(".col-qty").value,
      free: tr.querySelector(".col-free").value,
      mrp: tr.querySelector(".col-mrp").value,
      batch: "'" + tr.querySelector(".col-batch").value,
      exp: "'" + tr.querySelector(".col-exp").value,
      dis: tr.querySelector(".col-dis").value,
      sgst: tr.querySelector(".col-sgst").value,
      cgst: tr.querySelector(".col-cgst").value,
      rate: tr.querySelector(".col-rate").value,
      amount: tr.querySelector(".col-amount").value,
      company: tr.querySelector(".col-company").value
    });
  });

  btn.disabled = true;
  if (loader) loader.style.display = "inline-block";
  const overlay = document.getElementById("saveLoaderModal");
  if (overlay) {
    overlay.style.display = "flex";
    setTimeout(() => { overlay.style.opacity = "1"; }, 10);
  }

  try {
    const updatingInvoice = window.currentUpdatingInvoiceNo;

    // Optimistic UI Update
    const originalInventory = [...inventoryData];
    if (updatingInvoice) {
      inventoryData = inventoryData.filter(i => (i.InvoiceNo || i.invoiceNo || "N/A") !== updatingInvoice);
    }
    const tempItems = items.map(item => ({
      InvoiceNo: item.invoiceNo,
      Date: item.date,
      Supplier: item.supplier,
      DistributorID: item.supplierId,
      BuyerName: item.BuyerName,
      BuyerID: item.BuyerID,
      ProductDescription: item.productName,
      Batch: item.batch.replace(/'/g, ''),
      Exp: item.exp.replace(/'/g, ''),
      Qty: item.qty,
      Amount: item.amount
    }));
    inventoryData.push(...tempItems);
    localStorage.setItem("cachedInventory", JSON.stringify(inventoryData));
    renderInventoryTable();
    if (typeof renderDashboardData === 'function') renderDashboardData();
    if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();

    await clearEntireBill(true);

    btn.disabled = false;
    if (loader) loader.style.display = "none";
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => { overlay.style.display = "none"; }, 200);
    }

    // Fire and forget background sync
    (async () => {
      try {
        if (updatingInvoice) {
          const delPayload = {
            action: "delete_invoice",
            invoiceNo: updatingInvoice
          };
          const delRes = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(delPayload)
          });
          const delData = await delRes.json();
          if (!delData.success) {
            throw new Error("Failed to clear old invoice: " + (delData.message || ""));
          }
        }

        const promises = items.map(item => {
          item.action = "add_inventory";
          return fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(item)
          }).then(res => res.json());
        });

        const results = await Promise.all(promises);
        const failed = results.find(r => !r.success);

        if (failed) {
          throw new Error(failed.message || "Action not recognized or save failed.");
        }

        fetchInventory();
      } catch (err) {
        alert("❌ Error syncing bill to cloud: " + err.message);
        inventoryData = originalInventory;
        localStorage.setItem("cachedInventory", JSON.stringify(inventoryData));
        renderInventoryTable();
        renderDashboardData();
      }
    })();

  } catch (err) {
    alert("❌ Local error saving bill: " + err.message);
    btn.disabled = false;
    if (loader) loader.style.display = "none";
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => { overlay.style.display = "none"; }, 200);
    }
  }
}

// ==========================================
// NEW DISTRIBUTOR MODAL LOGIC
// ==========================================
let editingDistributorId = null;

window.openNewDistributorModal = async function () {
  const modal = document.getElementById("newDistributorModal");
  const modalBox = document.getElementById("newDistributorBox");
  const idInput = document.getElementById("ndId");
  if (!modal || !modalBox || !idInput) return;

  editingDistributorId = null;
  document.getElementById("btnSaveNd").innerHTML = `<i class="fas fa-save"></i> Save Distributor <span id="ndLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>`;

  // Make sure we have latest distributors to get correct sequence
  if (allDistributors.length === 0) {
    await fetchDistributors();
  }

  // Generate sequential ID based on number of distributors
  const nextIdNum = allDistributors.length + 1;
  const sequentialId = "DIST-" + String(nextIdNum).padStart(4, '0');

  // Clear other fields
  document.getElementById("newDistributorForm").reset();
  idInput.value = sequentialId;

  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    modalBox.style.transform = "scale(1)";
  }, 10);
};

window.closeNewDistributorModal = function () {
  const modal = document.getElementById("newDistributorModal");
  const modalBox = document.getElementById("newDistributorBox");
  if (!modal) return;

  modal.style.opacity = "0";
  modalBox.style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
  }, 200);
};

window.saveNewDistributor = async function () {
  const btn = document.getElementById("btnSaveNd");
  const loader = document.getElementById("ndLoader");

  const payload = {
    action: editingDistributorId ? "edit_distributor" : "add_distributor",
    distributorId: document.getElementById("ndId").value,
    name: document.getElementById("ndName").value,
    address1: document.getElementById("ndAddress1").value,
    address2: document.getElementById("ndAddress2").value,
    phone: document.getElementById("ndPhone").value,
    email: document.getElementById("ndEmail").value,
    gstin: document.getElementById("ndGstin").value,
    drugLic: document.getElementById("ndDrugLic").value,
    fssiLic: document.getElementById("ndFssiLic").value,
    dateAdded: formatDate(new Date())
  };

  btn.disabled = true;
  loader.style.display = "inline-block";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // We expect a JSON response from Apps Script
    const result = await response.json();

    if (result.success) {
      if (editingDistributorId) {
        alert("✅ Distributor updated successfully!");
        const index = allDistributors.findIndex(d => d.DistributorID === payload.distributorId);
        if (index !== -1) {
          allDistributors[index] = {
            DistributorID: payload.distributorId,
            Name: payload.name,
            AddressLine1: payload.address1,
            AddressLine2: payload.address2,
            Phone: payload.phone,
            Email: payload.email,
            GSTIN: payload.gstin,
            DrugLicense: payload.drugLic,
            FSSILicense: payload.fssiLic,
            DateAdded: payload.dateAdded
          };
        }
      } else {
        alert("✅ Distributor added successfully!");
        const invSupplier = document.getElementById("invSupplier");
        const invSupplierId = document.getElementById("invSupplierId");
        if (invSupplier && !invSupplier.value) invSupplier.value = payload.name;
        if (invSupplierId && !invSupplierId.value) invSupplierId.value = payload.distributorId;

        allDistributors.push({
          DistributorID: payload.distributorId,
          Name: payload.name,
          AddressLine1: payload.address1,
          AddressLine2: payload.address2,
          Phone: payload.phone,
          Email: payload.email,
          GSTIN: payload.gstin,
          DrugLicense: payload.drugLic,
          FSSILicense: payload.fssiLic,
          DateAdded: payload.dateAdded
        });
      }

      fetchDistributors(); // refresh datalist
      if (document.getElementById("allDistributorsModal").style.display === "flex") {
        openAllDistributorsModal(); // refresh directory if open
      }
      closeNewDistributorModal();
    } else {
      alert("❌ Error saving distributor: " + (result.message || result.error || "Unknown error"));
    }
  } catch (err) {
    // If it's a CORS issue or network error
    console.error(err);
    alert("❌ Network Error while saving the distributor. Please ensure you have updated the Google Apps Script.");
  } finally {
    btn.disabled = false;
    loader.style.display = "none";
  }
};

// ==========================================
// ALL DISTRIBUTORS MODAL LOGIC
// ==========================================
window.openAllDistributorsModal = async function () {
  const modal = document.getElementById("allDistributorsModal");
  const modalBox = document.getElementById("allDistributorsBox");
  const tbody = document.getElementById("allDistributorsTbody");

  if (!modal || !modalBox || !tbody) return;

  // Make sure we have latest distributors
  if (allDistributors.length === 0) {
    await fetchDistributors();
  }

  tbody.innerHTML = "";
  if (allDistributors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="padding: 15px; text-align: center; color: #64748b;">No distributors found. Add one first.</td></tr>`;
  } else {
    allDistributors.forEach(d => {
      tbody.innerHTML += `
        <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
          <td style="padding: 10px; font-weight: 700; color: #0f766e; white-space: nowrap;">${d.DistributorID || '-'}</td>
          <td style="padding: 10px; font-weight: 600; color: #1e293b; min-width: 120px;">${d.Name || '-'}</td>
          <td style="padding: 10px; color: #475569; white-space: nowrap;">${d.Phone || '-'}</td>
          <td style="padding: 10px; color: #475569;">${d.Email || '-'}</td>
          <td style="padding: 10px; color: #475569; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${d.AddressLine1 || ''}">${d.AddressLine1 || '-'}</td>
          <td style="padding: 10px; color: #475569; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${d.AddressLine2 || ''}">${d.AddressLine2 || '-'}</td>
          <td style="padding: 10px; color: #475569; font-family: monospace;">${d.GSTIN || '-'}</td>
          <td style="padding: 10px; color: #475569; white-space: nowrap;">${d.DrugLicense || '-'}</td>
          <td style="padding: 10px; color: #475569; white-space: nowrap;">${d.FSSILicense || '-'}</td>
          <td style="padding: 10px; color: #475569; font-size: 10px; white-space: nowrap;">${d.DateAdded || '-'}</td>
          <td style="padding: 10px; white-space: nowrap;">
            <button class="btn" style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 11px; margin-right: 4px;" title="Edit" onclick="editDistributor('${d.DistributorID}')"><i class="fas fa-edit"></i></button>
            <button class="btn" style="background: #fee2e2; color: #e11d48; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 11px;" title="Delete" onclick="deleteDistributor('${d.DistributorID}')"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    });
  }

  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    modalBox.style.transform = "scale(1)";
  }, 10);
};

window.closeAllDistributorsModal = function () {
  const modal = document.getElementById("allDistributorsModal");
  const modalBox = document.getElementById("allDistributorsBox");
  if (!modal) return;

  modal.style.opacity = "0";
  modalBox.style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
  }, 200);
};

window.editDistributor = function (id) {
  const distributor = allDistributors.find(d => d.DistributorID === id);
  if (!distributor) return;

  editingDistributorId = id;

  document.getElementById("ndId").value = distributor.DistributorID || '';
  document.getElementById("ndName").value = distributor.Name || '';
  document.getElementById("ndAddress1").value = distributor.AddressLine1 || '';
  document.getElementById("ndAddress2").value = distributor.AddressLine2 || '';
  document.getElementById("ndPhone").value = distributor.Phone || '';
  document.getElementById("ndEmail").value = distributor.Email || '';
  document.getElementById("ndGstin").value = distributor.GSTIN || '';
  document.getElementById("ndDrugLic").value = distributor.DrugLicense || '';
  document.getElementById("ndFssiLic").value = distributor.FSSILicense || '';

  document.getElementById("btnSaveNd").innerHTML = `<i class="fas fa-save"></i> Update Distributor <span id="ndLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>`;

  const modal = document.getElementById("newDistributorModal");
  const modalBox = document.getElementById("newDistributorBox");
  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    modalBox.style.transform = "scale(1)";
  }, 10);
};

window.deleteDistributor = async function (id) {
  if (!confirm("Are you sure you want to delete this distributor?")) return;

  const btn = event.currentTarget;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
  btn.disabled = true;

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "delete_distributor", distributorId: id })
    });
    const result = await response.json();
    if (result.success) {
      alert("✅ Distributor deleted successfully!");
      allDistributors = allDistributors.filter(d => d.DistributorID !== id);
      openAllDistributorsModal(); // re-render table
      fetchDistributors(); // refresh datalist
    } else {
      alert("❌ Error deleting distributor: " + (result.message || result.error || "Unknown error"));
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    alert("❌ Network Error while deleting. Please try again.");
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
};

// ==========================================
// BUYER DETAILS MODAL LOGIC (Local Storage)
// ==========================================
buyersList = [];

async function loadBuyers() {
  const cached = localStorage.getItem('cachedBuyers');
  if (cached) {
    try {
      buyersList = JSON.parse(cached);
      const datalist = document.getElementById("buyerNameList");
      const srDatalist = document.getElementById("srBuyerNameList");
      if (datalist) datalist.innerHTML = "";
      if (srDatalist) srDatalist.innerHTML = "";
      if (datalist || srDatalist) {
        buyersList.forEach(b => {
          if (b.name) {
            const opt = `<option value="${b.name}">${b.name}</option>`;
            if (datalist) datalist.innerHTML += opt;
            if (srDatalist) srDatalist.innerHTML += opt;
          }
        });
      }
      renderBuyersList();
    } catch (e) { }
  }

  try {
    const response = await fetch(`${WEB_APP_URL}?action=get_buyers&_t=${new Date().getTime()}`);
    let data = await response.json();

    buyersList = data.map(b => ({
      buyerId: b.BuyerID || b.buyerid || b.buyerId,
      name: b.Name || b.name,
      address: b.Address || b.address,
      gst: b.GST || b.gst,
      pan: b.PAN || b.pan,
      phone: b.Phone || b.phone,
      drugLic: b.DrugLic || b.druglic || b.drugLic,
      salesman: b.SalesMan || b.salesman || b.Salesman,
      route: b.Route || b.route
    }));

    const datalist = document.getElementById("buyerNameList");
    const srDatalist = document.getElementById("srBuyerNameList");
    if (datalist) datalist.innerHTML = "";
    if (srDatalist) srDatalist.innerHTML = "";

    if (datalist || srDatalist) {
      buyersList.forEach(b => {
        if (b.name) {
          const opt = `<option value="${b.name}">${b.name}</option>`;
          if (datalist) datalist.innerHTML += opt;
          if (srDatalist) srDatalist.innerHTML += opt;
        }
      });
    }
    localStorage.setItem('cachedBuyers', JSON.stringify(buyersList));
  } catch (e) {
    console.error("Failed to load buyers:", e);
    buyersList = [];
  }
  renderBuyersList();
}

let editingBuyerId = null;

window.openBuyerDetailsModal = function () {
  const modal = document.getElementById("buyerDetailsModal");
  const modalBox = document.getElementById("buyerDetailsBox");
  if (!modal) return;

  editingBuyerId = null;
  const btn = document.getElementById("btnSaveBuyer");
  if (btn) btn.innerHTML = `<i class="fas fa-save"></i> Save Buyer <span id="buyerLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>`;

  document.getElementById("newBuyerName").value = "";
  document.getElementById("newBuyerAddress").value = "";
  document.getElementById("newBuyerGST").value = "";
  document.getElementById("newBuyerPAN").value = "";
  document.getElementById("newBuyerPhone").value = "";
  document.getElementById("newBuyerDrugLic").value = "";
  document.getElementById("newBuyerSalesMan").value = "";
  document.getElementById("newBuyerRoute").value = "";

  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    modalBox.style.transform = "scale(1)";
  }, 10);
};

window.closeBuyerDetailsModal = function () {
  const modal = document.getElementById("buyerDetailsModal");
  const modalBox = document.getElementById("buyerDetailsBox");
  if (!modal) return;

  modal.style.opacity = "0";
  modalBox.style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
  }, 200);
};

window.saveNewBuyer = async function () {
  const name = document.getElementById("newBuyerName").value.trim();
  if (!name) {
    alert("Buyer Name is required!");
    return;
  }

  const address = document.getElementById("newBuyerAddress").value.trim();
  const gst = document.getElementById("newBuyerGST").value.trim();
  const pan = document.getElementById("newBuyerPAN").value.trim();
  const phone = document.getElementById("newBuyerPhone").value.trim();
  const drugLic = document.getElementById("newBuyerDrugLic").value.trim();
  const salesman = document.getElementById("newBuyerSalesMan").value.trim();
  const route = document.getElementById("newBuyerRoute").value.trim();

  // Find existing by name to update, otherwise add
  let buyerId = editingBuyerId;
  if (!buyerId) {
    const existingBuyer = buyersList.find(b => b.name.toLowerCase() === name.toLowerCase());
    buyerId = existingBuyer ? existingBuyer.buyerId : "";
  }

  const payload = {
    action: "add_buyer",
    BuyerID: buyerId,
    Name: name,
    Address: address,
    GST: gst,
    PAN: pan,
    Phone: phone,
    DrugLic: drugLic,
    SalesMan: salesman,
    Route: route
  };

  const btn = document.getElementById("btnSaveBuyer");
  const loader = document.getElementById("buyerLoader");
  if (btn) btn.disabled = true;
  if (loader) loader.style.display = "inline-block";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      alert("✅ Buyer saved successfully!");

      // Clear form
      document.getElementById("newBuyerName").value = "";
      document.getElementById("newBuyerAddress").value = "";
      document.getElementById("newBuyerGST").value = "";
      document.getElementById("newBuyerPAN").value = "";
      document.getElementById("newBuyerPhone").value = "";
      document.getElementById("newBuyerDrugLic").value = "";
      document.getElementById("newBuyerSalesMan").value = "";
      document.getElementById("newBuyerRoute").value = "";

      editingBuyerId = null;
      if (btn) btn.innerHTML = `<i class="fas fa-save"></i> Save Buyer <span id="buyerLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>`;

      await loadBuyers();
    } else {
      alert("Failed to save buyer: " + result.message);
    }
  } catch (e) {
    alert("Error saving buyer: " + e.message);
  } finally {
    if (btn) btn.disabled = false;
    if (loader) loader.style.display = "none";
  }
};

window.editBuyer = function (buyerId) {
  const buyer = buyersList.find(b => b.buyerId === buyerId);
  if (!buyer) return;

  document.getElementById("newBuyerName").value = buyer.name || "";
  document.getElementById("newBuyerAddress").value = buyer.address || "";
  document.getElementById("newBuyerGST").value = buyer.gst || "";
  document.getElementById("newBuyerPAN").value = buyer.pan || "";
  document.getElementById("newBuyerPhone").value = buyer.phone || "";
  document.getElementById("newBuyerDrugLic").value = buyer.drugLic || "";
  document.getElementById("newBuyerSalesMan").value = buyer.salesman || "";
  document.getElementById("newBuyerRoute").value = buyer.route || "";

  editingBuyerId = buyerId;
  const btn = document.getElementById("btnSaveBuyer");
  if (btn) btn.innerHTML = `<i class="fas fa-save"></i> Update Buyer <span id="buyerLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>`;
};

window.deleteBuyer = async function (buyerId, name) {
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;

  const payload = {
    action: "delete_buyer",
    BuyerID: buyerId,
    Name: name
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      await loadBuyers();
    } else {
      alert("Failed to delete buyer: " + result.message);
    }
  } catch (e) {
    alert("Error deleting buyer: " + e.message);
  }
};

function renderBuyersList() {
  const tbody = document.getElementById("buyersListTbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (buyersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">No buyers found. Add one above.</td></tr>`;
    return;
  }

  buyersList.forEach(b => {
    tbody.innerHTML += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-family: monospace; color: #0284c7; font-weight: bold;">${b.buyerId || '-'}</td>
        <td style="padding: 8px; font-weight: bold; color: #0f766e;">${b.name || '-'}</td>
        <td style="padding: 8px; color: #475569;">${b.address || '-'}</td>
        <td style="padding: 8px; color: #475569;">${b.phone || '-'}</td>
        <td style="padding: 8px;">
          <button onclick="editBuyer('${b.buyerId}')" style="background: #e0f2fe; color: #0284c7; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 5px;" title="Edit Buyer"><i class="fas fa-edit"></i></button>
          <button onclick="deleteBuyer('${b.buyerId}', '${b.name}')" style="background: #fee2e2; color: #e11d48; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;" title="Delete Buyer"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

window.handleBuyerSelect = function (buyerIdOverride, prefix = 'inv') {
  let buyer;

  if (buyerIdOverride) {
    buyer = buyersList.find(b => b.buyerId === buyerIdOverride);
  } else {
    const inputNameEl = document.getElementById(`${prefix}BuyerName`);
    const inputName = inputNameEl ? inputNameEl.value.trim() : "";
    if (!inputName) return;
    buyer = buyersList.find(b => b.name.toLowerCase() === inputName.toLowerCase());
  }

  if (buyer) {
    const elName = document.getElementById(`${prefix}BuyerName`);
    if (elName) elName.value = buyer.name || "";

    const elAdd = document.getElementById(`${prefix}BuyerAddress`);
    if (elAdd) elAdd.value = buyer.address || "";

    const elGST = document.getElementById(`${prefix}BuyerGST`);
    if (elGST) elGST.value = buyer.gst || "";

    const elPAN = document.getElementById(`${prefix}BuyerPAN`);
    if (elPAN) elPAN.value = buyer.pan || "";

    const elPhone = document.getElementById(`${prefix}BuyerPhone`);
    if (elPhone) elPhone.value = buyer.phone || "";

    const elDrugLic = document.getElementById(`${prefix}BuyerDrugLic`);
    if (elDrugLic) elDrugLic.value = buyer.drugLic || "";

    const elSalesMan = document.getElementById(`${prefix}BuyerSalesMan`);
    if (elSalesMan) elSalesMan.value = buyer.salesman || "";

    const elRoute = document.getElementById(`${prefix}BuyerRoute`);
    if (elRoute) elRoute.value = buyer.route || "";
  }
};

// Initialize buyer logic
loadBuyers();

// ====== EXPIRY MODULE MODAL LOGIC ======
window.expiryAlertPopupTimeout = null;

window.showExpiryAlertModal = function () {
  const modal = document.getElementById('expiryAlertModalPopup');
  if (!modal) return;

  if (!inventoryData || !Array.isArray(inventoryData)) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiredCount = 0;
  let expiringSoonCount = 0;
  let lowStockCount = 0;

  inventoryData.forEach(item => {
    const normalizedExp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || '');
    if (normalizedExp && normalizedExp.includes('/')) {
      const parts = normalizedExp.split('/');
      if (parts.length === 2) {
        let month = parseInt(parts[0]);
        let year = parseInt(parts[1]);
        if (year < 100) year += 2000;

        const expDate = new Date(year, month, 0);
        expDate.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
          expiredCount++;
        } else if (daysLeft >= 0 && daysLeft <= 15) { // 15 days default
          expiringSoonCount++;
        }
      }
    }

    const qty = parseInt(item.Qty);
    if (!isNaN(qty) && qty > 0 && qty <= 10) { // Default 10 for low stock
      lowStockCount++;
    }
  });

  document.getElementById('popupExpiredCount').innerText = expiredCount;
  document.getElementById('popupExpiringSoonCount').innerText = expiringSoonCount;
  document.getElementById('popupLowStockCount').innerText = lowStockCount;

  modal.style.display = 'flex';

  if (window.expiryAlertPopupTimeout) {
    clearTimeout(window.expiryAlertPopupTimeout);
  }

  window.expiryAlertPopupTimeout = setTimeout(() => {
    modal.style.display = 'none';
  }, 10000);
};

window.openSidebarModal = function (modalName) {
  const dashView = document.getElementById('inventoryDashboardView');
  if (dashView && dashView.style.display === 'none') {
    document.getElementById('inventorySidebarOffcanvas').style.left = '-300px';
    document.getElementById('inventorySidebarBackdrop').style.display = 'none';
  }
  if (modalName === 'expiry') openExpiryModuleModal();
  if (modalName === 'indexMapping') openIndexMappingModal();
  if (modalName === 'newDistributor') openNewDistributorModal();
  if (modalName === 'allDistributors') openAllDistributorsModal();
  if (modalName === 'totalMedicines') openTotalMedicinesModal();
  if (modalName === 'payments') openPaymentsModal();
}

// EXPIRY MODULE LOGIC
window.openExpiryModuleModal = function (skipAlert = false) {
  const modal = document.getElementById("expiryModuleModal");
  if (!modal) return;

  // Populate datalists dynamically
  const searchList = document.getElementById("expirySearchList");
  const supplierList = document.getElementById("expirySupplierList");

  if (inventoryData && Array.isArray(inventoryData)) {
    const products = new Set();
    const suppliers = new Set();

    inventoryData.forEach(item => {
      const pName = item.ProductDescription || item.ProductName || item.productName || "";
      const supp = item.Supplier || item.supplier || item.Distributor || "";
      if (pName) products.add(pName.trim());
      if (supp) suppliers.add(supp.trim());
    });

    if (searchList) {
      searchList.innerHTML = Array.from(products).sort().map(p => `<option value="${p}">`).join("");
    }
    if (supplierList) {
      supplierList.innerHTML = Array.from(suppliers).sort().map(s => `<option value="${s}">`).join("");
    }
  }

  if (typeof window.renderExpiryModule === 'function') {
    window.renderExpiryModule();
  }

  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    document.getElementById("expiryModalContent").style.transform = "scale(1)";
  }, 10);

  // Expiry popup should not show when opening the Expiry Module
};

window.closeExpiryModuleModal = function () {
  const modal = document.getElementById("expiryModuleModal");
  if (!modal) return;
  modal.style.opacity = "0";
  document.getElementById("expiryModalContent").style.transform = "scale(0.98)";
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
};

window.switchExpiryTab = function (tabName) {
  const btnExpiringSoon = document.getElementById("tabExpiringSoonBtn");
  const btnLowStock = document.getElementById("tabLowStockBtn");
  const btnExpired = document.getElementById("tabExpiredBtn");

  const contentExpiringSoon = document.getElementById("expiringSoonTabContent");
  const contentLowStock = document.getElementById("lowStockTabContent");
  const contentExpired = document.getElementById("expiredTabContent");

  // Reset all
  [btnExpiringSoon, btnLowStock, btnExpired].forEach(btn => {
    if (!btn) return;
    btn.classList.remove("active");
    btn.style.background = "transparent";
    btn.style.color = "#64748b";
    btn.style.borderBottom = "3px solid transparent";
  });

  if (contentExpiringSoon) contentExpiringSoon.style.display = "none";
  if (contentLowStock) contentLowStock.style.display = "none";
  if (contentExpired) contentExpired.style.display = "none";

  if (tabName === 'expiring_soon') {
    if (btnExpiringSoon) {
      btnExpiringSoon.classList.add("active");
      btnExpiringSoon.style.background = "#fffbeb";
      btnExpiringSoon.style.color = "#d97706";
      btnExpiringSoon.style.borderBottom = "3px solid #d97706";
    }
    if (contentExpiringSoon) contentExpiringSoon.style.display = "flex";
  } else if (tabName === 'lowstock') {
    if (btnLowStock) {
      btnLowStock.classList.add("active");
      btnLowStock.style.background = "#eff6ff";
      btnLowStock.style.color = "#2563eb";
      btnLowStock.style.borderBottom = "3px solid #2563eb";
    }
    if (contentLowStock) contentLowStock.style.display = "flex";
  } else if (tabName === 'expired') {
    if (btnExpired) {
      btnExpired.classList.add("active");
      btnExpired.style.background = "#fff1f2";
      btnExpired.style.color = "#e11d48";
      btnExpired.style.borderBottom = "3px solid #e11d48";
    }
    if (contentExpired) contentExpired.style.display = "flex";
  }
};

window.renderExpiryModule = function (triggerId) {
  // Clear local filters if triggered by global search/supplier
  if (triggerId === 'expirySearch' || triggerId === 'expirySupplierFilter') {
    const expiringSoonDaysInput = document.getElementById("expiringSoonDays");
    if (expiringSoonDaysInput) expiringSoonDaysInput.value = "";

    const expiringSoonDateInput = document.getElementById("expiringSoonDate");
    if (expiringSoonDateInput) expiringSoonDateInput.value = "";

    const lowStockQtyInput = document.getElementById("lowStockQty");
    if (lowStockQtyInput) lowStockQtyInput.value = "";
  }

  const searchInput = document.getElementById("expirySearch");
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const supplierInput = document.getElementById("expirySupplierFilter");
  const supplierFilter = supplierInput ? supplierInput.value.toLowerCase().trim() : "";

  const expiringSoonDaysInput = document.getElementById("expiringSoonDays");
  let daysLimit = Infinity;
  if (expiringSoonDaysInput && expiringSoonDaysInput.value !== "") {
    daysLimit = parseInt(expiringSoonDaysInput.value);
  } else if (!searchTerm && !supplierFilter) {
    // Default to 10 days
    daysLimit = 10;
  }

  const expiringSoonDateInput = document.getElementById("expiringSoonDate");
  const dateLimitStr = expiringSoonDateInput ? expiringSoonDateInput.value : "";
  let dateLimit = null;
  if (dateLimitStr) {
    const parts = dateLimitStr.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      dateLimit = new Date(year, month, 0); // Last day of the selected month
      dateLimit.setHours(23, 59, 59, 999);
    }
  }

  const lowStockQtyInput = document.getElementById("lowStockQty");
  let qtyLimit = Infinity;
  if (lowStockQtyInput && lowStockQtyInput.value !== "") {
    qtyLimit = parseFloat(lowStockQtyInput.value);
  } else if (!searchTerm && !supplierFilter) {
    // Default to 5 qty if nothing is searched
    qtyLimit = 5;
  }

  const expiringSoonList = [];
  const lowStockList = [];
  const expiredList = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!inventoryData || !Array.isArray(inventoryData)) return;

  inventoryData.forEach(item => {
    // 1. Global Filters
    const pName = String(item.ProductDescription || item.ProductName || item.productName || '').toLowerCase();
    const batch = String(item.Batch || '').toLowerCase();
    const supplier = String(item.Supplier || item.supplier || item.Distributor || '').toLowerCase();

    if (searchTerm) {
      if (!pName.includes(searchTerm) && !batch.includes(searchTerm)) return;
    }
    if (supplierFilter) {
      if (!supplier.includes(supplierFilter)) return;
    }

    // 2. Expiry Logic
    let isExpired = false;
    let isExpiringSoon = false;
    let daysLeft = null;
    let daysLeftDisplay = '-';

    const normalizedExp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || '');
    if (normalizedExp && normalizedExp.includes('/')) {
      const parts = normalizedExp.split('/');
      if (parts.length === 2) {
        let month = parseInt(parts[0]);
        let year = parseInt(parts[1]);
        if (year < 100) year += 2000;

        const expDate = new Date(year, month, 0); // Last day of the month
        expDate.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));

        if (expDate < today) {
          isExpired = true;
          daysLeftDisplay = `<span style="color:#e11d48; font-weight:800;">Expired (${Math.abs(daysLeft)}d ago)</span>`;
          expiredList.push({ ...item, daysLeft, daysLeftDisplay });
        } else {
          daysLeftDisplay = `<span style="color:#0f766e; font-weight:800;">${daysLeft} days</span>`;
          if (daysLeft <= 30) {
            daysLeftDisplay = `<span style="color:#d97706; font-weight:800;">${daysLeft} days</span>`;
          }

          // Check if it fits the expiring soon criteria
          if (dateLimit) {
            if (expDate <= dateLimit) {
              isExpiringSoon = true;
              expiringSoonList.push({ ...item, daysLeft, daysLeftDisplay });
            }
          } else {
            if (daysLeft >= 0 && daysLeft <= daysLimit) {
              isExpiringSoon = true;
              expiringSoonList.push({ ...item, daysLeft, daysLeftDisplay });
            }
          }
        }
      }
    } else {
      if (isExpired) {
        expiredList.push({ ...item, daysLeft, daysLeftDisplay });
      } else {
        // Just generic default values if Expiry is missing
      }
    }

    // 3. Low Stock Logic
    const origQtyForLowStock = parseFloat(item.Qty) || 0;
    const pNameForLowStock = item.ProductDescription || item.ProductName || item.productName || '';
    const batchForLowStock = item.Batch || '';
    const billNoForLowStock = item.InvoiceNo || item.invoiceNo || '';
    const soldForLowStock = window.getSoldQty ? window.getSoldQty(billNoForLowStock, batchForLowStock, pNameForLowStock) : 0;
    const currentAvailableQty = origQtyForLowStock - soldForLowStock;

    if (!isNaN(currentAvailableQty) && currentAvailableQty <= qtyLimit) {
      lowStockList.push({ ...item, daysLeftDisplay: daysLeftDisplay || '-' });
    }
  });

  // Sort Expiring Soon by closest expiry
  expiringSoonList.sort((a, b) => a.daysLeft - b.daysLeft);
  expiredList.sort((a, b) => a.daysLeft - b.daysLeft);

  // Generate HTML
  const buildRow = (item, isExpired = false, isLowStock = false, isExpiringSoon = false) => {
    const pName = item.ProductDescription || item.ProductName || item.productName || '-';
    const batch = item.Batch || '-';
    const exp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || '-');
    const origQty = item.Qty !== undefined && item.Qty !== null ? parseFloat(item.Qty) : 0;
    const company = item.Company || item.Mfg || '-';
    const supplier = item.Supplier || item.supplier || item.Distributor || '-';
    const billNo = item.InvoiceNo || item.invoiceNo || '-';
    const soldQty = window.getSoldQty ? window.getSoldQty(billNo, batch, pName) : 0;
    const returnedQty = window.getReturnedQty ? window.getReturnedQty(billNo, batch, pName) : 0;
    const availableQty = origQty - soldQty - returnedQty;

    let trStyle = "";
    if (isExpired) trStyle = "background-color: #fee2e2;";
    else if (isExpiringSoon) trStyle = "background-color: #ffedd5;";
    else if (isLowStock) trStyle = "background-color: #eff6ff;";

    let expColor = "#0f766e";
    if (isExpired) expColor = "#e11d48";
    if (isExpiringSoon) expColor = "#d97706";

    return `<tr style="${trStyle}">
      <td>${item.daysLeftDisplay || '-'}</td>
      <td style="font-weight: 700; color: #1e293b;">${pName}</td>
      <td style="font-family: monospace; font-weight: 800; color: #475569;">${batch}</td>
      <td style="font-weight: 700; color: ${expColor};">${exp}</td>
      <td style="font-weight: 800; color: #64748b; text-align: center;">${origQty}</td>
      <td style="font-weight: 800; color: #ef4444; text-align: center;">${soldQty}</td>
      <td style="font-weight: 800; color: #ea580c; text-align: center;">${returnedQty}</td>
      <td style="font-weight: 800; color: ${isLowStock ? '#2563eb' : (availableQty <= 0 ? '#dc2626' : '#10b981')}; text-align: center;">${availableQty}</td>
      <td style="font-size: 11px; color: #475569;">${company}</td>
      <td style="font-size: 11px;">${supplier}</td>
      <td style="font-size: 11px; font-weight: 800;">${billNo}</td>
    </tr>`;
  };

  const tbodyExpiring = document.getElementById("expiringSoonTableBody");
  if (tbodyExpiring) {
    if (expiringSoonList.length === 0) {
      const msg = dateLimitStr ? `No items expiring before ${dateLimitStr}` : (daysLimit === Infinity ? `No matching items found` : `No items expiring within ${daysLimit} days`);
      tbodyExpiring.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#64748b;">${msg}</td></tr>`;
    } else {
      tbodyExpiring.innerHTML = expiringSoonList.map(i => buildRow(i, false, false, true)).join("");
    }
  }

  const tbodyLowStock = document.getElementById("lowStockTableBody");
  if (tbodyLowStock) {
    if (lowStockList.length === 0) {
      const msg = qtyLimit === Infinity ? `No matching items found` : `No items with Quantity &le; ${qtyLimit}`;
      tbodyLowStock.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#64748b;">${msg}</td></tr>`;
    } else {
      tbodyLowStock.innerHTML = lowStockList.map(i => buildRow(i, false, true, false)).join("");
    }
  }

  const tbodyExpired = document.getElementById("expiredTableBody");
  if (tbodyExpired) {
    if (expiredList.length === 0) {
      tbodyExpired.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#64748b;">No expired items found</td></tr>`;
    } else {
      tbodyExpired.innerHTML = expiredList.map(i => buildRow(i, true, false, false)).join("");
    }
  }
};

function renderDashboardData() {
  if (document.getElementById('inventoryDashboardView').style.display === 'none') return;

  // 1. KPI Cards
  document.getElementById('dashTotalDistributors').innerText = allDistributors.length;

  let uniqueBatches = new Set();
  let uniqueMedicines = new Set();
  let lowStockCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;

  const today = new Date();

  inventoryData.forEach(item => {
    let isExpired = false;
    const normalizedExp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || '');
    if (normalizedExp && normalizedExp.includes('/')) {
      const parts = normalizedExp.split('/');
      if (parts.length === 2) {
        let month = parseInt(parts[0]);
        let year = parseInt(parts[1]);
        if (year < 100) year += 2000;
        const expDate = new Date(year, month, 0);
        expDate.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((expDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
          expiredCount++;
          isExpired = true;
        } else if (daysLeft >= 0 && daysLeft <= 15) { // 15 days as requested
          expiringSoonCount++;
        }
      }
    }

    if (isExpired) return;

    if (item.Batch) uniqueBatches.add(item.Batch);
    const medName = item.ProductDescription || item.ProductName || item.productName || '';
    if (medName) uniqueMedicines.add(medName);

    const origQty = parseFloat(item.Qty || 0);
    const batch = item.Batch || '';
    const invoiceNo = item.InvoiceNo || item.invoiceNo || '';
    const soldQty = window.getSoldQty ? window.getSoldQty(invoiceNo, batch, medName) : 0;
    const availableQty = origQty - soldQty;

    if (availableQty <= 5) lowStockCount++;
  });

  if (document.getElementById('dashTotalBatches')) document.getElementById('dashTotalBatches').innerText = uniqueBatches.size;
  if (document.getElementById('dashLowStock')) document.getElementById('dashLowStock').innerText = lowStockCount;
  if (document.getElementById('dashExpiringSoon')) document.getElementById('dashExpiringSoon').innerText = expiringSoonCount;
  if (document.getElementById('dashExpired')) document.getElementById('dashExpired').innerText = expiredCount;

  // 2. Accounting Table
  const tbody = document.getElementById('dashAccountingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const selectedDistributor = document.getElementById('dashDistributorSelect').value.toLowerCase();

  let grandTotalOrigQty = 0;
  let grandTotalOrigAmt = 0;
  let grandTotalSoldQty = 0;
  let grandTotalSoldAmt = 0;
  let grandTotalReturnQty = 0;
  let grandTotalReturnAmt = 0;
  let grandTotalAvailQty = 0;
  let grandTotalAvailAmt = 0;

  inventoryData.forEach(item => {
    if (window.isMedicineExpired(item)) return;
    const supplier = (item.Supplier || item.supplier || item.Distributor || '').toLowerCase();
    if (selectedDistributor && supplier !== selectedDistributor && selectedDistributor !== '') return;

    const medName = item.ProductDescription || item.ProductName || item.productName || '-';
    const batch = item.Batch || '-';
    const exp = item.Exp || item.exp || item.Expiry || '-';
    const invoiceNo = item.InvoiceNo || item.invoiceNo || '';

    const origQty = parseFloat(item.Qty || 0);
    const rate = parseFloat(item.Rate || item.rate || 0);
    const origAmt = origQty * rate;

    const soldQty = window.getSoldQty ? window.getSoldQty(invoiceNo, batch, medName) : 0;
    const soldAmt = soldQty * rate;

    const returnedQty = window.getReturnedQty ? window.getReturnedQty(invoiceNo, batch, medName) : 0;
    const returnedAmt = returnedQty * rate;

    const availQty = origQty - soldQty - returnedQty;
    const availAmt = availQty * rate;

    grandTotalOrigQty += origQty;
    grandTotalOrigAmt += origAmt;
    grandTotalSoldQty += soldQty;
    grandTotalSoldAmt += soldAmt;
    grandTotalReturnQty += returnedQty;
    grandTotalReturnAmt += returnedAmt;
    grandTotalAvailQty += availQty;
    grandTotalAvailAmt += availAmt;

    tbody.innerHTML += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 10px; font-size: 12px; color: #1e293b; font-weight: 600;">${medName}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${batch}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${exp}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #475569; text-align: right;">${rate.toFixed(2)}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #1e293b; font-weight: 600; text-align: right;">${origQty}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #1e293b; font-weight: 600; text-align: right;">${origAmt.toFixed(2)}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #ef4444; font-weight: 700; text-align: right;">${soldQty}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #ef4444; font-weight: 700; text-align: right;">${soldAmt.toFixed(2)}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #ea580c; font-weight: 700; text-align: right;">${returnedQty}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #ea580c; font-weight: 700; text-align: right;">${returnedAmt.toFixed(2)}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #10b981; font-weight: 700; text-align: right;">${availQty}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #10b981; font-weight: 700; text-align: right;">${availAmt.toFixed(2)}</td>
      </tr>
    `;
  });

  if (document.getElementById('dashTotalOrigQty')) document.getElementById('dashTotalOrigQty').innerText = grandTotalOrigQty;
  if (document.getElementById('dashTotalOrigAmt')) document.getElementById('dashTotalOrigAmt').innerText = grandTotalOrigAmt.toFixed(2);
  if (document.getElementById('dashTotalSoldQty')) document.getElementById('dashTotalSoldQty').innerText = grandTotalSoldQty;
  if (document.getElementById('dashTotalSoldAmt')) document.getElementById('dashTotalSoldAmt').innerText = grandTotalSoldAmt.toFixed(2);
  if (document.getElementById('dashTotalReturnQty')) document.getElementById('dashTotalReturnQty').innerText = grandTotalReturnQty;
  if (document.getElementById('dashTotalReturnAmt')) document.getElementById('dashTotalReturnAmt').innerText = grandTotalReturnAmt.toFixed(2);
  if (document.getElementById('dashTotalAvailQty')) document.getElementById('dashTotalAvailQty').innerText = grandTotalAvailQty;
  if (document.getElementById('dashTotalAvailAmt')) document.getElementById('dashTotalAvailAmt').innerText = grandTotalAvailAmt.toFixed(2);

  if (document.getElementById('dashTotalStockValue')) document.getElementById('dashTotalStockValue').innerText = grandTotalAvailAmt.toFixed(2);

  const donutEl = document.getElementById('dashKPIStockDonut');
  if (donutEl) {
    let percentage = 0;
    if (grandTotalOrigAmt > 0) {
      percentage = (grandTotalAvailAmt / grandTotalOrigAmt) * 100;
    }
    donutEl.style.background = `conic-gradient(#0ea5e9 ${percentage}%, #e2e8f0 0)`;
  }

  const ratioEl = document.getElementById('dashKPIStockRatio');
  if (ratioEl) {
    ratioEl.innerHTML = `${grandTotalAvailAmt.toFixed(0)}<br><span style="color: #94a3b8; font-size: 11px;">/ ${grandTotalOrigAmt.toFixed(0)}</span>`;
  }

  // 3. Populate dropdown if not already populated
  const dd = document.getElementById('dashDistributorSelect');
  if (dd && dd.options.length <= 1 && allDistributors.length > 0) {
    allDistributors.forEach(d => {
      if (d.Name || d.Supplier || d.Distributor) {
        const name = d.Name || d.Supplier || d.Distributor;
        dd.innerHTML += `<option value="${name}">${name}</option>`;
      }
    });
  }

  // Ensure the persistent total medicines table is updated
  if (typeof window.renderTotalMedicinesTable === 'function') {
    window.renderTotalMedicinesTable();
  }
}

// Accounting Overview Modal
window.openAccountingOverviewModal = function () {
  const modal = document.getElementById("accountingOverviewModal");
  if (!modal) return;
  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    document.getElementById("accountingOverviewBox").style.transform = "scale(1)";
  }, 10);
};

window.closeAccountingOverviewModal = function () {
  const modal = document.getElementById("accountingOverviewModal");
  if (!modal) return;
  modal.style.opacity = "0";
  document.getElementById("accountingOverviewBox").style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
  }, 200);
};


window.openTotalMedicinesModal = function () {
  const modal = document.getElementById("totalMedicinesModal");
  if (!modal) return;

  document.getElementById("totalMedicinesSearch").value = "";
  window.renderTotalMedicinesTable();

  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    document.getElementById("totalMedicinesBox").style.transform = "scale(1)";
  }, 10);
};

window.closeTotalMedicinesModal = function () {
  const modal = document.getElementById("totalMedicinesModal");
  if (!modal) return;

  modal.style.opacity = "0";
  document.getElementById("totalMedicinesBox").style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
  }, 200);
};

window.totalMedicinesViewMode = 'consolidated'; // default

window.setTotalMedicinesView = function (mode, searchQuery = '') {
  window.totalMedicinesViewMode = mode;

  if (searchQuery !== undefined && searchQuery !== null) {
    const searchInput = document.getElementById("totalMedicinesSearch");
    if (searchInput) searchInput.value = searchQuery;
  }

  const btnConsolidated = document.getElementById('btnViewConsolidated');
  const btnSeparated = document.getElementById('btnViewSeparated');

  if (btnConsolidated && btnSeparated) {
    if (mode === 'consolidated') {
      btnConsolidated.style.background = 'white';
      btnConsolidated.style.color = '#0f172a';
      btnConsolidated.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';

      btnSeparated.style.background = 'transparent';
      btnSeparated.style.color = '#64748b';
      btnSeparated.style.boxShadow = 'none';
    } else {
      btnSeparated.style.background = 'white';
      btnSeparated.style.color = '#0f172a';
      btnSeparated.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';

      btnConsolidated.style.background = 'transparent';
      btnConsolidated.style.color = '#64748b';
      btnConsolidated.style.boxShadow = 'none';
    }
  }

  if (typeof window.renderTotalMedicinesTable === 'function') {
    window.renderTotalMedicinesTable();
  }
};

window.resetTotalMedicinesFilter = function () {
  const searchInput = document.getElementById("totalMedicinesSearch");
  if (searchInput) searchInput.value = '';
  if (window.setTotalMedicinesView) window.setTotalMedicinesView('consolidated', '');
};

window.getSoldQty = function (invoiceNo, batch, medicineName) {
  let totalSold = 0;
  if (!soldOutData || !soldOutData.length) return 0;
  soldOutData.forEach(s => {
    if (String(s.InvoiceNo).trim() === String(invoiceNo).trim() &&
      String(s.Batch).trim() === String(batch).trim() &&
      String(s.MedicineName).trim() === String(medicineName).trim()) {
      totalSold += parseFloat(s.SoldQty || 0);
    }
  });
  return totalSold;
};

window.getReturnedQty = function (invoiceNo, batch, productName) {
  let returnedQty = 0;
  if (typeof salesReturnData !== 'undefined' && salesReturnData && salesReturnData.length > 0) {
    salesReturnData.forEach(item => {
      const isSameBatchAndProduct = String(item.Batch || '').trim() === String(batch).trim() &&
        (String(item.ProductName || item.MedicineName || item.ProductDescription || item.productName || '').trim().toLowerCase() === String(productName).trim().toLowerCase());

      if (isSameBatchAndProduct && String(item.OrigInvoiceNo || item.InvoiceNo || '').trim() === String(invoiceNo).trim()) {
        returnedQty += Math.abs(parseFloat(item['Return Qty'] || item.ReturnedQty || item.Qty || 0));
      }
    });
  }
  return returnedQty;
};

window.getAvailQty = function (invoiceNo, batch, productName) {
  let origQty = 0;

  if (typeof inventoryData !== 'undefined' && inventoryData && inventoryData.length > 0) {
    inventoryData.forEach(item => {
      const isSameBatchAndProduct = String(item.Batch || '').trim() === String(batch).trim() &&
        (String(item.ProductDescription || item.ProductName || item.productName || '').trim().toLowerCase() === String(productName).trim().toLowerCase());

      if (isSameBatchAndProduct) {
        const itemInvNo = String(item.InvoiceNo || item.invoiceNo || '').trim();
        if (itemInvNo === String(invoiceNo).trim()) {
          origQty += parseFloat(item.Qty || item.qty || 0);
        }
      }
    });
  }

  const returnedQty = window.getReturnedQty(invoiceNo, batch, productName);
  const soldQty = window.getSoldQty(invoiceNo, batch, productName);
  return (origQty - soldQty - returnedQty);
};

window.switchToSalesReturnView = function () {
  document.getElementById('inventorySidebarOffcanvas').style.left = '-300px';
  document.getElementById('inventorySidebarBackdrop').style.display = 'none';
  document.getElementById('inventoryDashboardView').style.display = 'none';
  document.getElementById('inventoryInvoiceView').style.display = 'none';
  document.getElementById('inventorySalesReturnView').style.display = 'block';
  document.getElementById('inventorySidebarCloseBtn').style.display = 'block';
  document.getElementById('inventoryGlobalFooter').style.display = 'block';
  document.getElementById('newDistributorModal').style.display = 'none';
  document.getElementById('allDistributorsModal').style.display = 'none';
  document.getElementById('expiryModuleModal').style.display = 'none';
  if (document.getElementById('inventoryBillManagementTableContainer')) document.getElementById('inventoryBillManagementTableContainer').style.display = 'none';
  if (document.getElementById('inventoryStockManagementTableContainer')) document.getElementById('inventoryStockManagementTableContainer').style.display = 'block';
};

window.returnItemToSalesReturn = function (itemJsonStr, availQty, btnElement) {
  if (parseFloat(availQty) <= 0) {
    alert("Cannot return this item. Available quantity is 0.");
    return;
  }

  const originalItem = JSON.parse(decodeURIComponent(itemJsonStr));

  // Create a case-insensitive map of keys
  const item = {};
  for (const key in originalItem) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    item[normalizedKey] = originalItem[key];
  }

  const newDistId = item.distributorid || item.supplierid || "";

  // Check distributor integrity
  const tbody = document.getElementById("srTableBody");
  if (tbody && tbody.querySelectorAll('tr.added-row').length > 0) {
    const currentDistId = document.getElementById("srSupplierId").value;
    if (currentDistId && newDistId && currentDistId.trim().toLowerCase() !== newDistId.trim().toLowerCase()) {
      alert("⚠ Cannot add this item! It belongs to a different distributor. Please create a separate Sales Return bill for different distributors.");
      return;
    }
  }

  window.switchToSalesReturnView();

  // Apply grey shade to clicked row
  if (btnElement) {
    const tr = btnElement.closest('tr');
    if (tr) {
      tr.style.backgroundColor = '#d1d5db'; // a slightly darker grey to make it visible
    }
  }

  // Try to set Distributor
  const distIdEl = document.getElementById("srSupplierId");
  if (distIdEl) {
    distIdEl.value = newDistId;
    if (typeof handleDistributorSelect === 'function') handleDistributorSelect('sr');
  }

  // Set original invoice no and buyer id for the table row
  if (document.getElementById("srOrigInvoiceNo")) {
    document.getElementById("srOrigInvoiceNo").value = item.invoiceno || item.invoicenumber || item.invoice_no || "";
  }
  if (document.getElementById("srOrigBuyerId")) {
    document.getElementById("srOrigBuyerId").value = item.buyerid || item.buyer_id || item.buyername || "";
  }

  // Populate entry fields
  if (document.getElementById("srProductName")) document.getElementById("srProductName").value = item.productdescription || item.productname || item.name || "";
  if (document.getElementById("srPack")) document.getElementById("srPack").value = item.pack || "";
  if (document.getElementById("srHSN")) document.getElementById("srHSN").value = item.hsn || item.hsncode || "";
  if (document.getElementById("srQty")) document.getElementById("srQty").value = availQty;
  if (document.getElementById("srFree")) document.getElementById("srFree").value = item.free || item.freeqty || "";
  if (document.getElementById("srMRP")) document.getElementById("srMRP").value = item.mrp || "";
  if (document.getElementById("srBatch")) document.getElementById("srBatch").value = item.batch || item.batchno || "";
  if (document.getElementById("srExp")) document.getElementById("srExp").value = item.exp || item.expiry || item.expirydate || "";
  if (document.getElementById("srDis")) document.getElementById("srDis").value = item.dispercent || item.dis || item.discount || "";
  if (document.getElementById("srSGST")) document.getElementById("srSGST").value = item.sgstpercent || item.sgst || "";
  if (document.getElementById("srCGST")) document.getElementById("srCGST").value = item.cgstpercent || item.cgst || "";
  if (document.getElementById("srRate")) document.getElementById("srRate").value = item.rate || item.price || "";
  if (document.getElementById("srCompany")) document.getElementById("srCompany").value = item.company || item.brand || item.manufacturer || "";

  // Calculate amounts
  if (typeof calculateSrAmount === 'function') calculateSrAmount();

  // Automatically add the row to the table
  if (typeof addSrRow === 'function') addSrRow();
};

window.saveSoldOutRecord = async function (invoiceNo, batch, medicineName, expiry, distributor, origQty, index, availableQty, company, mrp) {
  const inputEl = document.getElementById(`sell_input_${index}`);
  const detailsEl = document.getElementById(`sell_details_${index}`);
  if (!inputEl) return;

  const soldQty = parseFloat(inputEl.value);
  const buyerDetails = detailsEl ? detailsEl.value.trim() : "";

  if (!soldQty || soldQty <= 0) {
    if (window.alert) window.alert("Please enter a valid quantity to sell.");
    return;
  }

  if (soldQty > availableQty) {
    if (window.alert) {
      window.alert(`Only ${availableQty} strips of this medicine are left in stock. You have entered ${soldQty - availableQty} extra strips. This action cannot be completed. Please verify the quantity and try again.`);
    }
    return;
  }

  const btn = inputEl.nextElementSibling;
  const oldText = btn.innerText;
  btn.innerText = "Saving...";
  btn.disabled = true;

  try {
    const payload = {
      action: "add_sold_out",
      InvoiceNo: invoiceNo,
      Batch: batch,
      MedicineName: medicineName,
      Expiry: expiry,
      Distributor: distributor,
      OriginalQty: origQty,
      SoldQty: soldQty,
      BuyerDetails: buyerDetails,
      Company: company,
      MRP: mrp
    };

    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.success) {
      soldOutData.push({
        DateSold: new Date().toISOString().split('T')[0],
        InvoiceNo: invoiceNo,
        Batch: batch,
        MedicineName: medicineName,
        Expiry: expiry,
        Distributor: distributor,
        OriginalQty: origQty,
        SoldQty: soldQty,
        BuyerDetails: buyerDetails,
        Company: company,
        MRP: mrp
      });
      if (typeof window.renderTotalMedicinesTable === 'function') {
        window.renderTotalMedicinesTable();
      }
    } else {
      if (window.alert) window.alert("Failed to save: " + result.message);
      btn.innerText = oldText;
      btn.disabled = false;
    }
  } catch (e) {
    console.error(e);
    if (window.alert) window.alert("Error saving record.");
    btn.innerText = oldText;
    btn.disabled = false;
  }
};

window.renderTotalMedicinesTable = function () {
  const tbody = document.getElementById("totalMedicinesTableBody");
  const thead = document.getElementById("totalMedicinesTableHead");
  const countEl = document.getElementById("totalMedicinesCount");
  if (!tbody || !thead) return;

  const searchStr = document.getElementById("totalMedicinesSearch").value.toLowerCase();
  tbody.innerHTML = '';
  thead.innerHTML = '';

  let count = 0;

  const mappingDict = {};
  if (typeof indexMappings !== 'undefined') {
    indexMappings.forEach(item => {
      if (item.MedicineName) {
        const key = String(item.MedicineName).trim().toLowerCase();
        mappingDict[key] = item.LocationIndex || '';
      }
    });
  }

  // Filter unexpired matching search
  let validItems = [];
  inventoryData.forEach(item => {
    if (window.isMedicineExpired(item)) return;
    const name = item.ProductDescription || item.ProductName || item.productName || "";
    const company = item.Company || item.Mfg || "";
    const searchTarget = (name + " " + company).toLowerCase();

    if (searchStr && !searchTarget.includes(searchStr)) return;

    let originalQty = parseFloat(item.Qty || 0);
    let soldQty = window.getSoldQty ? window.getSoldQty(item.InvoiceNo, item.Batch, name) : 0;
    let returnedQty = window.getReturnedQty ? window.getReturnedQty(item.InvoiceNo, item.Batch, name) : 0;
    let availableQty = originalQty - soldQty - returnedQty;

    if (availableQty <= 0) return;

    let itemCopy = Object.assign({}, item);
    itemCopy.AvailableQty = availableQty;
    itemCopy.OriginalQty = originalQty;

    validItems.push(itemCopy);
  });

  const mode = window.totalMedicinesViewMode || 'consolidated';

  if (mode === 'consolidated') {
    // Render Consolidated Header
    thead.innerHTML = `
      <tr style="border-bottom: 2px solid #1d4ed8;">
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Medicine Name</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Location Index</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Batches</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">MRP (Rs.)</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Available Strips</th>
      </tr>
    `;

    // Grouping
    const grouped = {};
    validItems.forEach(item => {
      const name = item.ProductDescription || item.ProductName || item.productName || "";
      const key = String(name).trim().toLowerCase();

      const qty = parseFloat(item.AvailableQty || 0);
      const mrp = parseFloat(item.MRP || 0);
      const batch = item.Batch || "N/A";
      const locIndex = mappingDict[key] || "-";

      if (!grouped[key]) {
        grouped[key] = {
          name: name,
          locIndexes: new Set(),
          batches: new Set(),
          qty: 0,
          mrps: new Set()
        };
      }

      grouped[key].locIndexes.add(locIndex);
      grouped[key].batches.add(batch);
      grouped[key].qty += qty;
      if (mrp > 0) grouped[key].mrps.add(mrp);
    });

    Object.values(grouped).forEach(group => {
      count++;

      let mrpStr = "-";
      if (group.mrps.size > 0) {
        const mrpArray = Array.from(group.mrps).sort((a, b) => a - b);
        if (mrpArray.length === 1) {
          mrpStr = mrpArray[0].toFixed(2);
        } else {
          mrpStr = `${mrpArray[0].toFixed(2)} - ${mrpArray[mrpArray.length - 1].toFixed(2)}`;
        }
      }

      const locIndexesStr = Array.from(group.locIndexes).filter(i => i !== "-").join(", ") || "-";

      tbody.innerHTML += `
        <tr onclick="if(window.setTotalMedicinesView) window.setTotalMedicinesView('separated', '${group.name.replace(/'/g, "\\'")}')" style="cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <td style="padding: 10px; font-weight: 600; color: #0f172a;">${group.name}</td>
          <td style="padding: 10px; font-weight: 700; color: #8b5cf6;">${locIndexesStr}</td>
          <td style="padding: 10px; font-weight: 600; color: #475569;">${group.batches.size}</td>
          <td style="padding: 10px; color: #475569;">${mrpStr}</td>
          <td style="padding: 10px; font-weight: 700; color: #0ea5e9;">${group.qty}</td>
        </tr>
      `;
    });
  } else {
    // Render Separated Header
    thead.innerHTML = `
      <tr style="border-bottom: 2px solid #1d4ed8;">
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Medicine Name</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Location Index</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Batch</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Expiry Date</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">MRP (Rs.)</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Available Strips</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Company</th>
        <th style="padding: 10px; font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Sell Stock</th>
      </tr>
    `;

    validItems.forEach((item, index) => {
      count++;
      const name = item.ProductDescription || item.ProductName || item.productName || "";
      const searchKey = String(name).trim().toLowerCase();
      const locIndex = mappingDict[searchKey] || "-";
      const exp = window.normalizeExpiry ? window.normalizeExpiry(item.Exp) : (item.Exp || item.Expiry || "");
      const mrp = parseFloat(item.MRP || 0).toFixed(2);
      const qty = parseFloat(item.AvailableQty || 0);
      const company = item.Company || item.Mfg || "";
      const batch = item.Batch || "-";
      const invoiceNo = item.InvoiceNo || "";
      const distributor = item.Distributor || item.Supplier || item.supplier || "";
      const origQty = item.OriginalQty || 0;

      tbody.innerHTML += `
        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <td style="padding: 10px; font-weight: 600; color: #0f172a;">${name}</td>
          <td style="padding: 10px; font-weight: 700; color: #8b5cf6;">${locIndex}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: 800; color: #475569;">${batch}</td>
          <td style="padding: 10px; color: #475569;">${exp}</td>
          <td style="padding: 10px; color: #475569;">${mrp}</td>
          <td style="padding: 10px; font-weight: 700; color: #0ea5e9;">${qty}</td>
          <td style="padding: 10px; color: #475569;">${company}</td>
          <td style="padding: 10px;">
            <div style="display: flex; gap: 5px; flex-direction: column;">
              <div style="display: flex; gap: 5px;">
                <input type="number" id="sell_input_${index}" min="1" max="${qty}" placeholder="Qty" style="width: 50px; padding: 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;">
                <button onclick="if(window.saveSoldOutRecord) window.saveSoldOutRecord('${invoiceNo.replace(/'/g, "\\'")}', '${batch.replace(/'/g, "\\'")}', '${name.replace(/'/g, "\\'")}', '${exp.replace(/'/g, "\\'")}', '${distributor.replace(/'/g, "\\'")}', ${origQty}, ${index}, ${qty}, '${company.replace(/'/g, "\\'")}', ${mrp})" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">Save</button>
              </div>
              <input type="text" id="sell_details_${index}" placeholder="Buyer Name/Details (Optional)" style="width: 100%; padding: 4px; font-size: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
            </div>
          </td>
        </tr>
      `;
    });
  }

  if (countEl) countEl.innerText = count;
};

// Restored settings functions
function toggleSettings() {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    modal.style.display = modal.style.display === "none" ? "flex" : "none";
  }
}

function saveSettings() {
  toggleSettings();
}

function openBuyerDetailsModal() {
  const modal = document.getElementById('buyerDetailsModal');
  const box = document.getElementById('buyerDetailsBox');
  if (modal && box) {
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.style.opacity = '1';
      box.style.transform = 'scale(1)';
    }, 10);
    if (typeof renderBuyersList === 'function') renderBuyersList();
  }
}

function closeBuyerDetailsModal() {
  const modal = document.getElementById('buyerDetailsModal');
  const box = document.getElementById('buyerDetailsBox');
  if (modal && box) {
    modal.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 200);
  }
}


// ==========================================
// SALES RETURN LOGIC
// ==========================================
window.addSrRow = function () {
  const fields = ['srProductName', 'srPack', 'srHSN', 'srQty', 'srFree', 'srMRP', 'srBatch', 'srExp', 'srDis', 'srSGST', 'srSGSTAmt', 'srCGST', 'srCGSTAmt', 'srRate', 'srAmount', 'srCompany', 'srOrigInvoiceNo', 'srOrigBuyerId'];
  const vals = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    vals[f] = el ? el.value : '';
  });
  if (!vals.srProductName || !vals.srQty) {
    alert("⚠ Product Name and Qty are mandatory for Sales Return.");
    return;
  }
  const tbody = document.getElementById("srTableBody");
  if (!tbody) return;
  const tr = document.createElement("tr");
  tr.className = "added-row";
  tr.style.height = "25px";
  tr.style.verticalAlign = "top";
  tr.style.borderBottom = "1px solid #cbd5e1";
  const formattedExp = window.normalizeExpiry ? window.normalizeExpiry(vals.srExp) : vals.srExp;
  const disAmt = document.getElementById('srDis') ? (document.getElementById('srDis').getAttribute('data-dis-amt') || 0) : 0;

  tr.innerHTML = `
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-product" value="${vals.srProductName}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; min-width: 140px; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-pack" value="${vals.srPack}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-hsn" value="${vals.srHSN}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-qty" value="${vals.srQty}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-free" value="${vals.srFree}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-mrp" value="${vals.srMRP}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-batch" value="${vals.srBatch}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-exp" value="${formattedExp}" oninput="if(typeof formatExpiryInput === 'function') formatExpiryInput(event); calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-dis" value="${vals.srDis}" data-dis-amt="${parseFloat(disAmt).toFixed(2)}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst" value="${vals.srSGST}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst-amt" value="${vals.srSGSTAmt}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst" value="${vals.srCGST}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst-amt" value="${vals.srCGSTAmt}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-rate" value="${vals.srRate}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-amount" value="${vals.srAmount}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right; font-weight: bold;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-company" value="${vals.srCompany}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left; text-transform: uppercase;"></td>
    <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-orig-invoice-no" value="${vals.srOrigInvoiceNo}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
    <td style="padding: 4px;"><input type="text" class="col-orig-buyer-id" value="${vals.srOrigBuyerId}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
  `;
  const inputRow = document.getElementById("srInputRow");
  if (inputRow) tbody.insertBefore(tr, inputRow);
  window.clearSrForm();
  window.calculateSrTotals();
};

window.calculateSrAmount = function () {
  const qty = parseFloat(document.getElementById('srQty').value) || 0;
  const rate = parseFloat(document.getElementById('srRate').value) || 0;
  let amount = qty * rate;
  const disPercent = parseFloat(document.getElementById('srDis').value) || 0;
  const disAmt = (amount * disPercent) / 100;
  document.getElementById('srDis').setAttribute('data-dis-amt', disAmt.toFixed(2));
  amount -= disAmt;
  const sgst = parseFloat(document.getElementById('srSGST').value) || 0;
  const cgst = parseFloat(document.getElementById('srCGST').value) || 0;
  const sgstAmt = (amount * sgst) / 100;
  const cgstAmt = (amount * cgst) / 100;
  document.getElementById('srSGSTAmt').value = sgstAmt.toFixed(2);
  document.getElementById('srCGSTAmt').value = cgstAmt.toFixed(2);
  amount += sgstAmt + cgstAmt;
  document.getElementById('srAmount').value = amount.toFixed(2);
};

window.calculateAddedSrRowAmount = function (inputElem) {
  const tr = inputElem.closest('tr');
  const qty = parseFloat(tr.querySelector('.col-qty').value) || 0;
  const rate = parseFloat(tr.querySelector('.col-rate').value) || 0;
  let amount = qty * rate;
  const disPercent = parseFloat(tr.querySelector('.col-dis').value) || 0;
  const disAmt = (amount * disPercent) / 100;
  tr.querySelector('.col-dis').setAttribute('data-dis-amt', disAmt.toFixed(2));
  amount -= disAmt;
  const sgst = parseFloat(tr.querySelector('.col-sgst').value) || 0;
  const cgst = parseFloat(tr.querySelector('.col-cgst').value) || 0;
  const sgstAmt = (amount * sgst) / 100;
  const cgstAmt = (amount * cgst) / 100;
  tr.querySelector('.col-sgst-amt').value = sgstAmt.toFixed(2);
  tr.querySelector('.col-cgst-amt').value = cgstAmt.toFixed(2);
  amount += sgstAmt + cgstAmt;
  tr.querySelector('.col-amount').value = amount.toFixed(2);
  window.calculateSrTotals();
};

window.calculateSrTotals = function () {
  let subTotal = 0, totalDis = 0, totalSgst = 0, totalCgst = 0, totalQty = 0;
  document.querySelectorAll('#srTableBody tr.added-row').forEach(tr => {
    const qty = parseFloat(tr.querySelector('.col-qty').value) || 0;
    const rate = parseFloat(tr.querySelector('.col-rate').value) || 0;
    const gross = qty * rate;
    const disAmt = parseFloat(tr.querySelector('.col-dis').getAttribute('data-dis-amt')) || 0;
    const sgstAmt = parseFloat(tr.querySelector('.col-sgst-amt').value) || 0;
    const cgstAmt = parseFloat(tr.querySelector('.col-cgst-amt').value) || 0;
    subTotal += gross;
    totalDis += disAmt;
    totalSgst += sgstAmt;
    totalCgst += cgstAmt;
    totalQty += qty;
  });

  if (document.getElementById('subTotalInputSr')) document.getElementById('subTotalInputSr').innerText = subTotal.toFixed(2);
  if (document.getElementById('discountTotalInputSr')) document.getElementById('discountTotalInputSr').innerText = totalDis.toFixed(2);
  if (document.getElementById('sgstTotalInputSr')) document.getElementById('sgstTotalInputSr').innerText = totalSgst.toFixed(2);
  if (document.getElementById('cgstTotalInputSr')) document.getElementById('cgstTotalInputSr').innerText = totalCgst.toFixed(2);
  if (document.getElementById('totalQtyInputSr')) document.getElementById('totalQtyInputSr').innerText = totalQty;
  if (document.getElementById('totalItemsInputSr')) document.getElementById('totalItemsInputSr').innerText = document.querySelectorAll('#srTableBody tr.added-row').length;

  let grandTotal = subTotal - totalDis + totalSgst + totalCgst;
  let roundOff = Math.round(grandTotal) - grandTotal;
  let invoiceAmt = Math.round(grandTotal);

  if (document.getElementById('roundOffInputSr')) document.getElementById('roundOffInputSr').innerText = roundOff.toFixed(2);
  if (document.getElementById('grandTotalInputSr')) document.getElementById('grandTotalInputSr').innerText = grandTotal.toFixed(2);
  if (document.getElementById('sroiceAmtInput')) document.getElementById('sroiceAmtInput').innerText = invoiceAmt.toFixed(2);

  const lastBal = parseFloat(document.getElementById('lastBalInputSr') ? document.getElementById('lastBalInputSr').value : 0) || 0;
  if (document.getElementById('thisBillInputSr')) document.getElementById('thisBillInputSr').innerText = invoiceAmt.toFixed(2);
  if (document.getElementById('netBalInputSr')) document.getElementById('netBalInputSr').innerText = (lastBal - invoiceAmt).toFixed(2);

  if (typeof numberToWords === 'function') {
    const inWords = numberToWords(invoiceAmt);
    if (document.getElementById('srRsInWords')) document.getElementById('srRsInWords').innerText = inWords + " ONLY";
  }
};

window.clearSrForm = function () {
  const fields = ['srProductName', 'srPack', 'srHSN', 'srQty', 'srFree', 'srMRP', 'srBatch', 'srExp', 'srDis', 'srSGST', 'srSGSTAmt', 'srCGST', 'srCGSTAmt', 'srRate', 'srAmount', 'srCompany', 'srOrigInvoiceNo', 'srOrigBuyerId'];
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = '';
  });
  if (document.getElementById('srProductName')) document.getElementById('srProductName').focus();
};

window.clearEntireSrBill = async function (skipConfirm = false) {
  if (!skipConfirm) {
    if (typeof window.customConfirmAsync === 'function') {
      const isConfirmed = await window.customConfirmAsync("Are you sure you want to clear the entire sales return bill?");
      if (!isConfirmed) return;
    } else {
      if (!confirm("Are you sure you want to clear the entire sales return bill?")) return;
    }
  }

  document.querySelectorAll('#srTableBody tr.added-row').forEach(tr => tr.remove());
  window.clearSrForm();
  window.calculateSrTotals();

  const hFields = [
    'srSupplier', 'srSupplierId', 'srInvoiceNo', 'srEntryDate',
    'srDistAddress1', 'srDistAddress2', 'srDistPhone', 'srDistEmail',
    'srDistGSTIN', 'srDistDrugLic', 'srDistFSSILic',
    'srBuyerName', 'srBuyerAddress', 'srBuyerGST', 'srBuyerPAN',
    'srBuyerPhone', 'srBuyerDrugLic', 'srBuyerSalesMan', 'srBuyerRoute',
    'lastBalInputSr'
  ];
  hFields.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = '';
  });

  window.currentUpdatingSrInvoiceNo = null;
  const saveBtn = document.getElementById("btnSaveSr");
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Save Return <span id="srBtnLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>';
    saveBtn.style.background = '#000';
  }
};

window.saveSrItem = async function () {
  const btn = document.getElementById("btnSaveSr");
  const loader = document.getElementById("srBtnLoader");
  const tbody = document.getElementById("srTableBody");

  if (!tbody) return;

  let supplierName = document.getElementById("srSupplier") ? document.getElementById("srSupplier").value.trim() : "";
  let supplierId = document.getElementById("srSupplierId") ? document.getElementById("srSupplierId").value.trim() : "";
  let invoiceNo = document.getElementById("srInvoiceNo") ? document.getElementById("srInvoiceNo").value.trim() : "";
  let date = document.getElementById("srEntryDate") ? document.getElementById("srEntryDate").value : "";
  let buyerName = document.getElementById("srBuyerName") ? document.getElementById("srBuyerName").value.trim() : "";

  if (!supplierName || !invoiceNo || !date || !buyerName) {
    alert("⚠ Distributor Name, Vendor Details, Sales Return Number, and Date are mandatory!");
    return;
  }

  const inputProductName = document.getElementById("srProductName") ? document.getElementById("srProductName").value.trim() : "";
  const inputQty = document.getElementById("srQty") ? document.getElementById("srQty").value.trim() : "";

  if (inputProductName && inputQty) {
    if (typeof addSrRow === 'function') {
      addSrRow();
    }
  }

  const rows = tbody.querySelectorAll("tr.added-row");
  if (rows.length === 0) {
    alert("⚠ Please add at least one item to the bill before saving.");
    return;
  }

  if (btn) btn.disabled = true;
  const overlay = document.getElementById("saveLoaderModal");
  if (overlay) {
    overlay.style.display = "flex";
    setTimeout(() => { overlay.style.opacity = "1"; }, 10);
  }

  if (window.currentUpdatingSrInvoiceNo) {
    const success = await window.deleteSalesReturnBill(window.currentUpdatingSrInvoiceNo);
    if (!success) {
      alert("Failed to update existing Sales Return (error deleting old items). Please try again.");
      if (btn) btn.disabled = false;
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => { overlay.style.display = "none"; }, 200);
      }
      return;
    }
  }

  const buyerObj = buyersList.find(b => b.name.toLowerCase() === buyerName.toLowerCase());
  const buyerId = buyerObj ? buyerObj.buyerId : "";

  const payload = {
    action: "add_sales_return",
    isSalesReturn: "true",
    Supplier: supplierName,
    Distributor_ID: supplierId,
    InvoiceNo: "SR-" + invoiceNo,
    Date: date,
    BuyerName: buyerName,
    BuyerID: buyerId,
    items: []
  };

  rows.forEach(tr => {
    payload.items.push({
      ProductName: tr.querySelector(".col-product").value,
      Pack: tr.querySelector(".col-pack").value,
      HSN: tr.querySelector(".col-hsn").value,
      Qty: parseFloat(tr.querySelector(".col-qty").value) || 0,
      Free: tr.querySelector(".col-free").value,
      MRP: tr.querySelector(".col-mrp").value,
      Batch: "'" + tr.querySelector(".col-batch").value,
      Exp: "'" + tr.querySelector(".col-exp").value,
      Dis: tr.querySelector(".col-dis").value,
      SGST: tr.querySelector(".col-sgst").value,
      CGST: tr.querySelector(".col-cgst").value,
      Rate: tr.querySelector(".col-rate").value,
      Amount: tr.querySelector(".col-amount").value,
      Company: tr.querySelector(".col-company").value,
      OrigInvoiceNo: tr.querySelector(".col-orig-invoice-no") ? tr.querySelector(".col-orig-invoice-no").value : "",
      OrigBuyerId: tr.querySelector(".col-orig-buyer-id") ? tr.querySelector(".col-orig-buyer-id").value : ""
    });
  });

  try {
    const updatingInvoice = window.currentUpdatingSrInvoiceNo;

    // Optimistic UI Update for Sales Return
    if (updatingInvoice) {
      salesReturnData = salesReturnData.filter(item => {
        const inv = item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo || '';
        return String(inv).trim().replace(/^SR-/, '') !== String(updatingInvoice).trim().replace(/^SR-/, '');
      });
    }

    const tempSrItems = payload.items.map(item => ({
      "Sales Return No": payload.InvoiceNo,
      "Date": payload.Date,
      "Distributor Name": payload.Supplier,
      "Vendor Name": payload.BuyerName,
      "Return Qty": item.Qty,
      "Amount": item.Amount,
      "Product Name": item.ProductName,
      "Pack": item.Pack,
      "HSN": item.HSN,
      "Free": item.Free,
      "MRP": item.MRP,
      "Batch": item.Batch.replace(/'/g, ''),
      "Exp": item.Exp.replace(/'/g, ''),
      "Dis": item.Dis,
      "SGST": item.SGST,
      "CGST": item.CGST,
      "Rate": item.Rate,
      "Company": item.Company,
      "Original Invoice No": item.OrigInvoiceNo,
      "Original Buyer ID": item.OrigBuyerId
    }));

    salesReturnData.push(...tempSrItems);
    localStorage.setItem("cachedSalesReturn", JSON.stringify(salesReturnData));
    if (typeof window.renderReturnedItemsTable === 'function') window.renderReturnedItemsTable();
    if (typeof renderDashboardData === 'function') renderDashboardData();
    if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();

    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success || result.status === "success" || result.result === "success") {
      if (typeof fetchInventory === 'function') fetchInventory();
      alert("✅ Sales Return saved successfully!");

      // Prevent duplicates if user clicks save again without refreshing
      window.currentUpdatingSrInvoiceNo = invoiceNo;
      if (btn) {
        btn.innerHTML = '<i class="fas fa-save"></i> Update Return <span id="srBtnLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>';
        btn.style.background = '#f59e0b'; // orange
      }
      // window.clearEntireSrBill(true); // Intentionally removed so user can print after saving
    } else {
      alert("? Error saving Sales Return");
    }
  } catch (err) {
    alert("? Network Error while saving Sales Return.");
  } finally {
    if (btn) btn.disabled = false;
    const overlay = document.getElementById("saveLoaderModal");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => { overlay.style.display = "none"; }, 200);
    }
  }
};

window.deleteSalesReturnBill = async function (invoiceNo) {
  const itemsToDelete = salesReturnData.filter(item => {
    const inv = item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo || '';
    return String(inv).trim().replace(/^SR-/, '') === String(invoiceNo).trim().replace(/^SR-/, '');
  });

  if (itemsToDelete.length === 0) return true;

  for (const item of itemsToDelete) {
    const productName = item.ProductName || item['Product Name'] || item.MedicineName || item.productName || '';
    try {
      // The invoice number sent to the backend includes "SR-" if that's how it's saved.
      const invToDel = item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo;
      const response = await fetch(`${WEB_APP_URL}?action=delete_sales_return&invoiceNo=${encodeURIComponent(invToDel)}&productName=${encodeURIComponent(productName)}`, {
        method: "POST"
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Unknown error");
      }
    } catch (err) {
      console.error("Failed to delete item:", productName, err);
      return false; // Stop on first failure
    }
  }
  return true;
};

// --- Index Mapping Module Logic ---

async function fetchIndexMappings() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=get_index_mapping&_t=${new Date().getTime()}`);
    const data = await response.json();
    indexMappings = data;
    if (typeof window.renderTotalMedicinesTable === 'function') {
      window.renderTotalMedicinesTable();
    }
  } catch (err) {
    console.error("Error fetching index mappings", err);
  }
}

function openIndexMappingModal() {
  document.getElementById('indexMappingModal').style.display = 'block';
  document.getElementById('indexMappingSearch').value = '';
  document.getElementById('indexMappingStatus').innerText = '';
  renderIndexMappingTable();
}

function renderIndexMappingTable(filterText = '') {
  const tbody = document.getElementById('indexMappingTableBody');
  tbody.innerHTML = '';

  const uniqueMedicines = new Set();
  inventoryData.forEach(item => {
    const name = item.ProductName || item.ProductDescription || item.MedicineName;
    if (name) uniqueMedicines.add(name.trim());
  });

  indexMappings.forEach(item => {
    if (item.MedicineName) uniqueMedicines.add(item.MedicineName.trim());
  });

  let allMeds = Array.from(uniqueMedicines).sort((a, b) => a.localeCompare(b));

  if (filterText) {
    allMeds = allMeds.filter(m => m.toLowerCase().includes(filterText.toLowerCase()));
  }

  const mappingDict = {};
  indexMappings.forEach(item => {
    mappingDict[item.MedicineName] = item.LocationIndex || '';
  });

  allMeds.forEach(med => {
    const indexVal = mappingDict[med] || '';
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e2e8f0';
    tr.innerHTML = `
      <td style="padding: 10px; font-size: 13px; font-weight: 600; color: #1e293b;">${med}</td>
      <td style="padding: 10px;">
        <input type="text" class="mapping-input" data-med="${med}" value="${indexVal}" placeholder="e.g. Shelf A-1" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-weight: bold; color: #0f9b8e;">
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterIndexMappingTable() {
  const text = document.getElementById('indexMappingSearch').value;
  renderIndexMappingTable(text);
}

function addCustomMapping() {
  const name = document.getElementById('customMappingName').value.trim();
  const index = document.getElementById('customMappingIndex').value.trim();

  if (!name) {
    alert("Please enter a medicine name.");
    return;
  }

  const existing = indexMappings.find(m => m.MedicineName && m.MedicineName.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.LocationIndex = index;
  } else {
    indexMappings.push({ MedicineName: name, LocationIndex: index });
  }

  document.getElementById('customMappingName').value = '';
  document.getElementById('customMappingIndex').value = '';

  document.getElementById('indexMappingSearch').value = name;
  renderIndexMappingTable(name);
}

window.saveIndexMappings = async function () {
  const inputs = document.querySelectorAll('.mapping-input');

  inputs.forEach(input => {
    const med = input.getAttribute('data-med');
    const val = input.value.trim();

    let existing = indexMappings.find(m => m.MedicineName === med);
    if (existing) {
      existing.LocationIndex = val;
    } else if (val !== '') {
      indexMappings.push({ MedicineName: med, LocationIndex: val });
    }
  });

  const statusEl = document.getElementById('indexMappingStatus');
  statusEl.innerText = "Saving mappings... Please wait.";

  const payload = {
    action: "save_index_mapping",
    items: indexMappings
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      statusEl.style.color = "#10b981";
      statusEl.innerText = "Mappings saved successfully!";
      setTimeout(() => { statusEl.innerText = ""; }, 3000);
    } else {
      statusEl.style.color = "#e11d48";
      statusEl.innerText = "Error saving mappings.";
    }
  } catch (err) {
    console.error(err);
    statusEl.style.color = "#e11d48";
    statusEl.innerText = "Network error while saving.";
  }
};

window.openSoldOutHistoryModal = function () {
  const modal = document.getElementById("soldOutHistoryModal");
  const box = document.getElementById("soldOutHistoryBox");
  if (!modal || !box) return;

  window.renderSoldOutHistory();

  modal.style.display = "flex";
  setTimeout(() => {
    modal.style.opacity = "1";
    box.style.transform = "scale(1)";
  }, 10);
};

window.closeSoldOutHistoryModal = function () {
  const modal = document.getElementById("soldOutHistoryModal");
  const box = document.getElementById("soldOutHistoryBox");
  if (!modal || !box) return;

  modal.style.opacity = "0";
  box.style.transform = "scale(0.9)";
  setTimeout(() => {
    modal.style.display = "none";
  }, 200);
};

window.renderSoldOutHistory = function () {
  const tbody = document.getElementById("soldOutHistoryTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!soldOutData || soldOutData.length === 0) {
    tbody.innerHTML = "<tr><td colspan='10' style='padding:15px; text-align:center;'>No sales records found.</td></tr>";
    return;
  }

  for (let i = soldOutData.length - 1; i >= 0; i--) {
    const item = soldOutData[i];

    let displayDate = item.DateSold || item.datesold || "";
    if (displayDate) {
      const d = new Date(displayDate);
      if (!isNaN(d)) {
        displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    tbody.innerHTML += `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <td style="padding: 10px;">${displayDate}</td>
        <td style="padding: 10px; font-weight: 600; color: #3b82f6;">${item.InvoiceNo || item.invoiceno || ""}</td>
        <td style="padding: 10px; font-family: monospace;">${item.Batch || item.batch || ""}</td>
        <td style="padding: 10px; font-weight: bold;">${item.MedicineName || item.medicinename || ""}</td>
        <td style="padding: 10px; color: #475569;">${item.Company || item.company || ""}</td>
        <td style="padding: 10px; color: #475569;">${item.Distributor || item.distributor || ""}</td>
        <td style="padding: 10px; text-align: center;">${item.OriginalQty || item.originalqty || 0}</td>
        <td style="padding: 10px; text-align: center; font-weight: 800; color: #ef4444;">${item.SoldQty || item.soldqty || 0}</td>
        <td style="padding: 10px; text-align: center; color: #10b981; font-weight: 600;">${item.MRP || item.mrp || ""}</td>
        <td style="padding: 10px; color: #475569;">${item.BuyerDetails || item.buyerdetails || ""}</td>
      </tr>
    `;
  }
};

// -------------------------------------------------------------------------
// DISTRIBUTOR PAYMENTS MODULE
// -------------------------------------------------------------------------

window.openPaymentsModal = function () {
  const modal = document.getElementById("paymentsModal");
  if (!modal) return;
  modal.style.display = "flex";
  // Add animation
  setTimeout(() => { modal.style.opacity = "1"; }, 10);

  // Reset form fields
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentReceiptNoInput").value = "";
  document.getElementById("paymentRefNo").value = "";
  document.getElementById("paymentRemarks").value = "";

  // Populate distributors
  populatePaymentDistributors();

  // Trigger balance update to clear lingering numbers
  calculateDistributorBalance();

  // Switch to new payment tab by default
  switchPaymentsTab('new');
};

window.closePaymentsModal = function () {
  const modal = document.getElementById("paymentsModal");
  if (!modal) return;
  modal.style.opacity = "0";
  setTimeout(() => { modal.style.display = "none"; }, 200);
};

window.switchPaymentsTab = function (tabName) {
  const newView = document.getElementById("paymentsNewView");
  const historyView = document.getElementById("paymentsHistoryView");
  const tabNew = document.getElementById("tabNewPayment");
  const tabHist = document.getElementById("tabPaymentHistory");

  if (tabName === 'new') {
    newView.style.display = "block";
    historyView.style.display = "none";
    tabNew.style.borderBottomColor = "#10b981";
    tabNew.style.color = "#10b981";
    tabHist.style.borderBottomColor = "transparent";
    tabHist.style.color = "#64748b";
  } else {
    newView.style.display = "none";
    historyView.style.display = "block";
    tabNew.style.borderBottomColor = "transparent";
    tabNew.style.color = "#64748b";
    tabHist.style.borderBottomColor = "#10b981";
    tabHist.style.color = "#10b981";
    renderPaymentHistory();
  }
};

window.populatePaymentDistributors = function () {
  const select = document.getElementById("paymentDistributorSelect");
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Distributor --</option>';

  // Get unique distributors from inventory data and allDistributors
  const distSet = new Set();
  const distOptions = [];

  if (allDistributors && Array.isArray(allDistributors)) {
    allDistributors.forEach(d => {
      const name = String(d.Name || "").trim();
      if (name && !distSet.has(name.toLowerCase())) {
        distSet.add(name.toLowerCase());
        distOptions.push({ id: d.DistributorID, name: name });
      }
    });
  }

  if (inventoryData && Array.isArray(inventoryData)) {
    inventoryData.forEach(item => {
      const name = String(item.Supplier || item.supplier || item.Distributor || item.Company || "").trim();
      if (name && !distSet.has(name.toLowerCase())) {
        distSet.add(name.toLowerCase());
        distOptions.push({ id: item.SupplierID || item.supplierId || "", name: name });
      }
    });
  }

  // Sort alphabetically
  distOptions.sort((a, b) => a.name.localeCompare(b.name));

  distOptions.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.name;
    opt.dataset.id = d.id;
    opt.textContent = d.name;
    select.appendChild(opt);
  });
};

window.calculateDistributorBalance = function () {
  const select = document.getElementById("paymentDistributorSelect");
  const distName = select.value;
  const owedEl = document.getElementById("paymentTotalOwed");
  const remBalEl = document.getElementById("paymentRemainingBalance");
  const amtInput = document.getElementById("paymentAmount");

  if (!distName) {
    owedEl.textContent = "-";
    owedEl.style.color = "#94a3b8";
    remBalEl.textContent = "₹0.00";
    owedEl.dataset.value = "0";
    return;
  }

  let totalInvoiced = 0;
  if (inventoryData && Array.isArray(inventoryData)) {
    inventoryData.forEach(item => {
      const name = String(item.Supplier || item.supplier || item.Distributor || item.Company || "").trim();
      if (name.toLowerCase() === distName.toLowerCase()) {
        totalInvoiced += parseFloat(item.Amount || item.amount || 0);
      }
    });
  }

  let totalReturned = 0;
  if (typeof salesReturnData !== 'undefined' && Array.isArray(salesReturnData)) {
    salesReturnData.forEach(item => {
      const name = String(item['Distributor Name'] || item.DistributorName || item.Supplier || item.Distributor || "").trim();
      if (name.toLowerCase() === distName.toLowerCase()) {
        const retQty = parseFloat(item['Return Qty'] || item.ReturnQty || item.ReturnedQty || item.Qty || 0);
        const rate = parseFloat(item.Rate || item.rate || item.MRP || item.mrp || 0);
        const amount = parseFloat(item.Amount || item.ReturnAmount || item.Total || (retQty * rate)) || 0;
        totalReturned += amount;
      }
    });
  }

  let totalPaid = 0;
  if (paymentData && Array.isArray(paymentData)) {
    paymentData.forEach(p => {
      if (String(p.DistributorName || "").trim().toLowerCase() === distName.toLowerCase()) {
        totalPaid += parseFloat(p.AmountPaid || 0);
      }
    });
  }

  const currentOwed = totalInvoiced - totalReturned - totalPaid;
  owedEl.dataset.value = currentOwed;
  owedEl.textContent = `₹${currentOwed.toFixed(2)}`;
  owedEl.style.color = "#ef4444";

  updateRemainingBalance();
};

window.updateRemainingBalance = function () {
  const owedEl = document.getElementById("paymentTotalOwed");
  const amtInput = document.getElementById("paymentAmount");
  const remBalEl = document.getElementById("paymentRemainingBalance");

  const owed = parseFloat(owedEl.dataset.value || 0);
  const paying = parseFloat(amtInput.value || 0);

  const remaining = owed - paying;
  remBalEl.textContent = `₹${remaining.toFixed(2)}`;

  if (remaining < 0) {
    remBalEl.style.color = "#ef4444"; // Red for overpayment
  } else {
    remBalEl.style.color = "#334155";
  }
};

window.recordPayment = async function () {
  const select = document.getElementById("paymentDistributorSelect");
  const distName = select.value;
  const distId = select.options[select.selectedIndex]?.dataset.id || "";
  const amt = document.getElementById("paymentAmount").value;
  const mode = document.getElementById("paymentMode").value;
  const refNo = document.getElementById("paymentRefNo").value;
  const remarks = document.getElementById("paymentRemarks").value;

  if (!distName) {
    alert("Please select a distributor first.");
    return;
  }
  if (!amt || parseFloat(amt) <= 0) {
    alert("Please enter a valid amount to pay.");
    return;
  }

  const owedEl = document.getElementById("paymentTotalOwed");
  const owedBefore = parseFloat(owedEl.dataset.value || 0);
  const remaining = owedBefore - parseFloat(amt);

  const receiptNoInput = document.getElementById("paymentReceiptNoInput").value.trim();
  if (!receiptNoInput) {
    alert("Please enter the Receipt Number.");
    return;
  }
  const receiptNo = receiptNoInput;
  const dateStr = new Date().toISOString().split('T')[0];

  const payload = {
    action: "add_payment",
    ReceiptNo: receiptNo,
    Date: dateStr,
    DistributorID: distId,
    DistributorName: distName,
    TotalOwedBefore: owedBefore,
    AmountPaid: parseFloat(amt),
    PaymentMode: mode,
    ReferenceNo: refNo,
    Remarks: remarks,
    RemainingBalance: remaining
  };

  const btn = document.getElementById("btnRecordPayment");
  const oldText = btn.innerHTML;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;
  btn.disabled = true;

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    btn.innerHTML = oldText;
    btn.disabled = false;

    if (result.success) {
      alert("Payment recorded successfully!");

      // Update local payment data
      paymentData.push(payload);

      // Reset form
      document.getElementById("paymentAmount").value = "";
      document.getElementById("paymentReceiptNoInput").value = "";
      document.getElementById("paymentRefNo").value = "";
      document.getElementById("paymentRemarks").value = "";
      calculateDistributorBalance();
    } else {
      alert("Failed to record payment: " + result.message);
    }
  } catch (error) {
    btn.innerHTML = oldText;
    btn.disabled = false;
    alert("Error recording payment.");
    console.error(error);
  }
};

window.renderPaymentHistory = function () {
  const tbody = document.getElementById("paymentHistoryTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!paymentData || paymentData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="padding: 15px; text-align: center; color: #64748b;">No payments recorded yet.</td></tr>';
    return;
  }

  // Sort descending by date/time (timestamp is generally last or receipt no implies order)
  const sortedPayments = [...paymentData].reverse();

  sortedPayments.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #f1f5f9";

    // Convert stringified payload back if needed
    const amtStr = parseFloat(p.AmountPaid || 0).toFixed(2);

    tr.innerHTML = `
      <td style="padding: 12px 10px; font-size: 13px; color: #334155;">${p.Date || ''}</td>
      <td style="padding: 12px 10px; font-size: 13px; font-weight: 600; color: #0ea5e9;">${p.ReceiptNo || ''}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #0f172a;">${p.DistributorName || ''}</td>
      <td style="padding: 12px 10px; font-size: 13px; font-weight: 700; color: #10b981; text-align: right;">₹${amtStr}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #475569;">
        <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${p.PaymentMode || 'Cash'}</span>
      </td>
      <td style="padding: 12px 10px; text-align: right;">
        <button onclick='printReceiptByReceiptNo("${p.ReceiptNo}")' style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          <i class="fas fa-print"></i> Print
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

window.printReceiptByReceiptNo = function (receiptNo) {
  const p = paymentData.find(x => x.ReceiptNo === receiptNo);
  if (p) printReceipt(p);
};

window.printReceipt = function (paymentObj) {
  // Populate hidden print area
  document.getElementById("printReceiptNo").textContent = paymentObj.ReceiptNo;
  document.getElementById("printReceiptDate").textContent = paymentObj.Date;
  document.getElementById("printPaymentMode").textContent = paymentObj.PaymentMode;
  document.getElementById("printPaymentRef").textContent = paymentObj.ReferenceNo || "N/A";
  document.getElementById("printDistributorName").textContent = paymentObj.DistributorName;
  document.getElementById("printRemarks").textContent = paymentObj.Remarks || "Payment towards account";

  const amt = parseFloat(paymentObj.AmountPaid || 0);
  const prev = parseFloat(paymentObj.TotalOwedBefore || 0);
  const rem = parseFloat(paymentObj.RemainingBalance || 0);

  document.getElementById("printAmountWords").textContent = numberToWords(amt) + " Only";
  document.getElementById("printPrevBalance").textContent = "₹" + prev.toFixed(2);
  document.getElementById("printAmountPaid").textContent = "₹" + amt.toFixed(2);
  document.getElementById("printRemainingBalance").textContent = "₹" + rem.toFixed(2);

  // Trigger Print
  const printContent = document.getElementById('paymentReceiptPrintArea').innerHTML;
  const printWindow = window.open('', '', 'height=600,width=800');

  printWindow.document.write('<html><head><title>Payment Receipt</title>');
  printWindow.document.write('<style>body { font-family: "Times New Roman", serif; margin: 0; padding: 20px; }</style>');
  printWindow.document.write('</head><body >');
  printWindow.document.write(printContent);
  printWindow.document.write('</body></html>');

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

// Utility to convert numbers to words (Indian Rupee format)
function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() ? str.trim() : "Zero";
}

window.formatExpiryFilter = function (input) { let val = input.value.replace(/\D/g, ''); if (val.length >= 3) { val = val.substring(0, 2) + '/' + val.substring(2, 4); } input.value = val; renderInventoryTable(); }; window.resetInventoryFilters = function () { const ids = ['invSearchInput', 'filterBillNo', 'filterDistributor', 'filterDate', 'filterExpiry']; ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); renderInventoryTable(); };
window.resetStockManagementFilters = function () {
  if (document.getElementById('srTotalMedicinesSearch')) document.getElementById('srTotalMedicinesSearch').value = '';
  if (document.getElementById('srFilterBillNo')) document.getElementById('srFilterBillNo').value = '';
  if (document.getElementById('srFilterDistributor')) document.getElementById('srFilterDistributor').value = '';
  if (document.getElementById('srFilterDate')) document.getElementById('srFilterDate').value = '';
  if (document.getElementById('srFilterExpiry')) document.getElementById('srFilterExpiry').value = '';
  window.renderStockManagementTable();
};

window.renderStockManagementTable = function () {
  const tbody = document.getElementById("stockManagementTableBody");
  if (!tbody) return;

  const searchTerm = (document.getElementById("srTotalMedicinesSearch")?.value || "").toLowerCase();
  const billFilter = (document.getElementById("srFilterBillNo")?.value || "").toLowerCase();
  const distFilter = (document.getElementById("srFilterDistributor")?.value || "").toLowerCase();
  const dateFilter = (document.getElementById("srFilterDate")?.value || "");
  const expFilter = (document.getElementById("srFilterExpiry")?.value || "");

  tbody.innerHTML = "";

  if (!inventoryData || inventoryData.length === 0) {
    tbody.innerHTML = "<tr><td colspan='11' style='text-align:center; padding: 20px;'>No data available.</td></tr>";
    return;
  }

  // Filter bills
  const groupedData = {};
  inventoryData.forEach(item => {
    const invNo = item.InvoiceNo || item.invoiceNo || '-';
    // Don't show SR bills in stock management for return (since you can't return a return)
    if (String(invNo).toUpperCase().startsWith('SR-')) return;

    if (!groupedData[invNo]) groupedData[invNo] = [];
    groupedData[invNo].push(item);
  });

  const searchFiltered = [];
  Object.keys(groupedData).forEach(invNo => {
    const groupItems = groupedData[invNo];
    const matchBill = String(invNo).toLowerCase().includes(billFilter);
    const matchDate = !dateFilter || groupItems.some(i => (i.Date || i.date || '').includes(dateFilter));
    const matchDist = !distFilter || groupItems.some(i => {
      return (String(i.DistributorID || i.supplierId || i.DistributorId || '').toLowerCase().includes(distFilter) ||
        String(i.Supplier || i.supplier || i.Distributor || '').toLowerCase().includes(distFilter));
    });

    if (matchBill && matchDate && matchDist) {
      groupItems.forEach(item => {
        const prodName = String(item.ProductDescription || item.ProductName || item.productName || '').toLowerCase();
        const batch = String(item.Batch || '').toLowerCase();
        const exp = String(item.Exp || item.exp || '');

        if (prodName.includes(searchTerm) || batch.includes(searchTerm)) {
          if (!expFilter || exp.includes(expFilter)) {
            searchFiltered.push(item);
          }
        }
      });
    }
  });

  const sortedData = searchFiltered.sort((a, b) => {
    const invA = parseInt(String(a.InvoiceNo || a.invoiceNo || '0').replace(/\D/g, '')) || 0;
    const invB = parseInt(String(b.InvoiceNo || b.invoiceNo || '0').replace(/\D/g, '')) || 0;
    return invB - invA; // latest first
  });

  if (sortedData.length === 0) {
    tbody.innerHTML = "<tr><td colspan='11' style='text-align:center; padding: 20px;'>No matching stock found.</td></tr>";
    return;
  }

  let html = "";
  sortedData.forEach(item => {
    const invNo = item.InvoiceNo || item.invoiceNo || '-';
    const prodName = item.ProductDescription || item.ProductName || item.productName;
    const batch = item.Batch || '-';
    const soldQty = window.getSoldQty(invNo, batch, prodName) || 0;
    const returnedQty = window.getReturnedQty(invNo, batch, prodName) || 0;
    const availQty = window.getAvailQty(invNo, batch, prodName) || 0;

    let trStyle = "";
    let isExpired = window.isMedicineExpired && window.isMedicineExpired(item);

    if (availQty <= 0) {
      trStyle = "background-color: #f1f5f9; opacity: 0.7;";
      if (isExpired) trStyle += " color: #dc2626;";
    } else if (isExpired) {
      trStyle = "background-color: #fee2e2; color: #dc2626;";
    }

    let expColor = isExpired ? "#dc2626" : "#0f766e";
    let prodColor = isExpired ? "#dc2626" : "#1e293b";

    html += "<tr style='" + trStyle + "'>";
    html += "<td style='font-size: 11px; font-weight: 800; text-align: center; background: " + (isExpired ? "transparent" : "#f8fafc") + ";'>" + invNo + "</td>";
    html += "<td style='font-weight: 700; color: " + prodColor + ";'>" + (prodName || '-') + "</td>";
    html += "<td style='font-size: 11px; text-align: center;'>" + (item.DistributorID || item.DistributorId || item.supplierId || item.DIstributor_ID || '-') + "</td>";
    html += "<td style='font-family: monospace; font-weight: 800; color: #475569;'>" + batch + "</td>";
    html += "<td style='font-weight: 700; color: " + expColor + ";'>" + (item.Exp || item.exp || '-') + "</td>";
    html += "<td style='font-weight: 800;'>" + (item.Qty || '0') + "</td>";
    html += "<td style='font-weight: 800; color: #b91c1c;'>" + soldQty + "</td>";
    html += "<td style='font-weight: 800; color: #ea580c;'>" + returnedQty + "</td>";
    html += "<td style='font-weight: 900; color: #15803d;'>" + availQty + "</td>";
    html += "<td style='font-size: 11px;'>" + (item.Supplier || item.supplier || item.Distributor || '-') + "</td>";
    html += "<td style='font-size: 11px;'>" + (item.Date || item.date || '-') + "</td>";

    html += "<td style='text-align: center;'>";
    if (availQty > 0) {
      html += "<button type='button' class='btn' style='background: #fef08a; color: #854d0e; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 10px; font-weight: bold; width: 100%;' title='Return this item' onclick='window.returnItemToSalesReturn(\"" + encodeURIComponent(JSON.stringify(item)) + "\", " + availQty + ", this)'><i class='fas fa-undo'></i> Return</button>";
    } else {
      html += "<span style='font-size: 10px; color: #94a3b8; font-weight: bold;'>Returned</span>";
    }
    html += "</td>";
    html += "</tr>";
  });

  tbody.innerHTML = html;
};

// Add call to renderStockManagementTable when inventory is fetched
const oldFetchInventoryCb = window.renderInventoryTable;
window.renderInventoryTable = function () {
  if (oldFetchInventoryCb) oldFetchInventoryCb();
  if (window.renderStockManagementTable) window.renderStockManagementTable();
};

// Filter out 0 availability items from Stock and Expiry
const _origRenderStock = window.renderStockManagementTable;
window.renderStockManagementTable = function () {
  if (!inventoryData) return _origRenderStock && _origRenderStock();
  const oldData = inventoryData;
  inventoryData = oldData.filter(item => {
    const invNo = item.InvoiceNo || item.invoiceNo || '0';
    const prod = item.ProductName || item.ProductDescription || '';
    return window.getAvailQty(invNo, item.Batch || '', prod) > 0;
  });
  if (_origRenderStock) _origRenderStock();
  inventoryData = oldData;
};

const _origRenderExpiry = window.renderExpiryModule;
if (_origRenderExpiry) {
  window.renderExpiryModule = function (triggerId) {
    if (!inventoryData) return _origRenderExpiry(triggerId);
    const oldData = inventoryData;
    inventoryData = oldData.filter(item => {
      const invNo = item.InvoiceNo || item.invoiceNo || '0';
      const prod = item.ProductName || item.ProductDescription || '';
      return window.getAvailQty(invNo, item.Batch || '', prod) > 0;
    });
    _origRenderExpiry(triggerId);
    inventoryData = oldData;
  };
}

const _origRenderDashboard = window.renderDashboardData;
if (_origRenderDashboard) {
  window.renderDashboardData = function () {
    if (!inventoryData) return _origRenderDashboard();
    const oldData = inventoryData;
    inventoryData = oldData.filter(item => {
      const invNo = item.InvoiceNo || item.invoiceNo || '0';
      const prod = item.ProductName || item.ProductDescription || '';
      return window.getAvailQty(invNo, item.Batch || '', prod) > 0;
    });
    _origRenderDashboard();
    inventoryData = oldData;
  };
}

window.openReturnedItemsView = function () {
  document.getElementById('accessKeyInput').value = '';
  document.getElementById('accessKeyError').style.display = 'none';

  const modal = document.getElementById('accessKeyModal');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
    document.getElementById('accessKeyInput').focus();
  }, 10);
};

window.closeAccessKeyModal = function () {
  const modal = document.getElementById('accessKeyModal');
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.style.display = 'none';
  }, 200);
};

window.submitAccessKey = function () {
  const key = document.getElementById('accessKeyInput').value;
  if (key !== "Muzamil") {
    document.getElementById('accessKeyError').style.display = 'block';
    return;
  }

  // Hide modal
  window.closeAccessKeyModal();

  // Hide all other main views
  document.getElementById('inventoryDashboardView').style.display = 'none';
  document.getElementById('inventoryInvoiceView').style.display = 'none';
  document.getElementById('inventorySalesReturnView').style.display = 'none';
  if (document.getElementById('inventoryBillManagementTableContainer')) document.getElementById('inventoryBillManagementTableContainer').style.display = 'none';
  if (document.getElementById('inventoryStockManagementTableContainer')) document.getElementById('inventoryStockManagementTableContainer').style.display = 'none';

  // Show our new view
  document.getElementById('inventorySidebarOffcanvas').style.left = '-300px';
  document.getElementById('inventorySidebarBackdrop').style.display = 'none';
  document.getElementById('inventorySidebarCloseBtn').style.display = 'block';
  document.getElementById('inventoryGlobalFooter').style.display = 'none';

  const returnView = document.getElementById('inventoryReturnedItemsView');
  if (returnView) returnView.style.display = 'block';

  window.renderReturnedItemsTable();
};

window.renderReturnedItemsTable = function () {
  const tbody = document.getElementById('returnedItemsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!salesReturnData || salesReturnData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">No returned items found.</td></tr>';
    return;
  }

  // Group items by Invoice Number
  const groupedData = {};

  salesReturnData.forEach(item => {
    const invoiceNo = String(item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo || '').trim();
    if (!invoiceNo) return; // Skip if no invoice no

    if (!groupedData[invoiceNo]) {
      groupedData[invoiceNo] = {
        invoiceNo: invoiceNo,
        date: item.Date || '-',
        dist: item['Distributor Name'] || item.DistributorName || item.Supplier || item.Distributor || '-',
        vendor: item['Vendor Name'] || item.VendorName || item.BuyerName || item.vendor || '-',
        itemsCount: 0,
        totalAmount: 0,
        items: []
      };
    }

    groupedData[invoiceNo].items.push(item);
    groupedData[invoiceNo].itemsCount++;

    const retQty = parseFloat(item['Return Qty'] || item.ReturnQty || item.ReturnedQty || item.Qty || 0);
    const rate = parseFloat(item.Rate || item.rate || item.MRP || item.mrp || 0);
    const amt = parseFloat(item.Amount || item.ReturnAmount || item.Total || (retQty * rate)) || 0;
    groupedData[invoiceNo].totalAmount += amt;
  });

  const sortedGroups = Object.values(groupedData).sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  sortedGroups.forEach(group => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e2e8f0';

    let dateStr = group.date;
    try {
      if (group.date && group.date !== '-') {
        const d = new Date(group.date);
        if (!isNaN(d)) dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) { }

    tr.innerHTML = `
      <td style="padding: 8px 10px; color: #334155;">${dateStr}</td>
      <td style="padding: 8px 10px; color: #3b82f6; font-weight: 600;">${group.invoiceNo} <span style="font-size: 9px; color: #64748b; margin-left: 5px;">(${group.itemsCount} items)</span></td>
      <td style="padding: 8px 10px; color: #0f172a;">${group.dist}</td>
      <td style="padding: 8px 10px; color: #0f172a;">${group.vendor}</td>
      <td style="padding: 8px 10px; color: #10b981; font-weight: bold; text-align: right;">₹${group.totalAmount.toFixed(2)}</td>
      <td style="padding: 8px 10px; text-align: center; display: flex; justify-content: center; gap: 8px;">
        <button onclick="editSalesReturnItem('${group.invoiceNo.replace(/'/g, "\\'")}')" style="background: #e0f2fe; border: none; color: #0284c7; cursor: pointer; font-size: 11px; padding: 4px 8px; border-radius: 4px;" title="Edit Bill">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button onclick="deleteSalesReturnBillBtn('${group.invoiceNo.replace(/'/g, "\\'")}')" style="background: #fee2e2; border: none; color: #ef4444; cursor: pointer; font-size: 11px; padding: 4px 8px; border-radius: 4px;" title="Delete Bill">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

window.deleteSalesReturnBillBtn = async function (invoiceNo) {
  const isConfirmed = await customConfirmAsync(`Are you sure you want to delete the ENTIRE Sales Return Bill: ${invoiceNo}?`);
  if (!isConfirmed) return;

  const overlay = document.getElementById("saveLoaderModal");
  if (overlay) {
    overlay.style.display = "flex";
    setTimeout(() => { overlay.style.opacity = "1"; }, 10);
  }

  const success = await window.deleteSalesReturnBill(invoiceNo);

  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => { overlay.style.display = "none"; }, 200);
  }

  if (success) {
    alert("✅ Sales Return Bill deleted successfully.");
    salesReturnData = salesReturnData.filter(item => {
      const inv = item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo || '';
      return String(inv).trim().replace(/^SR-/, '') !== String(invoiceNo).trim().replace(/^SR-/, '');
    });
    window.renderReturnedItemsTable();
    if (typeof renderDashboardData === 'function') renderDashboardData();
    if (typeof window.renderTotalMedicinesTable === 'function') window.renderTotalMedicinesTable();
  } else {
    alert("❌ Failed to delete some items in the Sales Return Bill. Please refresh and try again.");
  }
};

window.editSalesReturnItem = async function (invoiceNo) {
  const items = salesReturnData.filter(item => {
    const inv = item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo || '';
    return String(inv).trim().replace(/^SR-/, '') === String(invoiceNo).trim().replace(/^SR-/, '');
  });

  if (items.length === 0) return;

  const proceed = await customConfirmAsync("If you edit this bill, the existing record will be updated when saved. Do you want to proceed?");
  if (!proceed) return;

  // Navigate to Sales Return view (or just scroll to top if already there)
  if (document.getElementById('inventoryReturnedItemsView')) {
    document.getElementById('inventoryReturnedItemsView').style.display = 'none';
  }
  document.getElementById('inventorySalesReturnView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Clear existing items in the sales return form
  window.clearEntireSrBill(true);

  // Set the updating invoice number BEFORE selecting the distributor (so it ignores the current return amount!)
  window.currentUpdatingSrInvoiceNo = invoiceNo;

  const firstItem = items[0];

  // Populate headers
  const invNoWithoutSR = invoiceNo.replace(/^SR-/, '');
  if (document.getElementById("srInvoiceNo")) document.getElementById("srInvoiceNo").value = invNoWithoutSR;
  if (document.getElementById("srEntryDate")) document.getElementById("srEntryDate").value = firstItem.Date || "";

  if (document.getElementById("srSupplier")) document.getElementById("srSupplier").value = firstItem['Distributor Name'] || firstItem.DistributorName || firstItem.Supplier || firstItem.Distributor || "";

  // Try to set Supplier ID based on name if not present in item
  let distId = firstItem.DIstributor_ID || firstItem.Distributor_ID || firstItem.DistributorID || firstItem.SupplierId || firstItem.supplierId || "";
  if (!distId && typeof allDistributors !== 'undefined') {
    const d = allDistributors.find(d => String(d.Name).trim().toLowerCase() === String(document.getElementById("srSupplier").value).trim().toLowerCase());
    if (d) distId = d.DistributorID;
  }
  if (document.getElementById("srSupplierId")) document.getElementById("srSupplierId").value = distId;

  if (typeof handleDistributorSelect === 'function') handleDistributorSelect('sr');

  if (document.getElementById("srBuyerName")) document.getElementById("srBuyerName").value = firstItem['Vendor Name'] || firstItem.VendorName || firstItem.BuyerName || firstItem.vendor || "";

  // Add rows back
  const tbody = document.getElementById("srTableBody");
  const inputRow = document.getElementById("srInputRow");

  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "added-row";
    tr.style.height = "25px";
    tr.style.verticalAlign = "top";
    tr.style.borderBottom = "1px solid #cbd5e1";

    const formattedExp = (typeof normalizeExpiry === 'function') ? normalizeExpiry(item.Exp || item.Expiry || item.expirydate || item.expiry) : (item.Exp || item.Expiry || item.expirydate || item.expiry || "");

    const prodName = item.ProductName || item['Product Name'] || item.MedicineName || item.productName || "";
    const pack = item.Pack || item.pack || "";
    const hsn = item.HSN || item.hsncode || item.hsn || "";
    const qty = parseFloat(item['Return Qty'] || item.ReturnQty || item.ReturnedQty || item.Qty || 0);
    const free = item.Free || item.freeqty || item.free || "";
    const mrp = item.MRP || item.mrp || "";
    const batch = (item.Batch || item.batchno || item.batch || "").replace(/^'/, '');
    const dis = item.DisPercent || item.dispercent || item.Dis || item.discount || item.dis || "";
    const sgst = item.SGSTPercent || item.sgstpercent || item.SGST || item.sgst || "";
    const cgst = item.CGSTPercent || item.cgstpercent || item.CGST || item.cgst || "";
    const rate = item.Rate || item.rate || item.price || "";
    const amount = item.Amount || item.ReturnAmount || item.Total || (qty * parseFloat(rate || 0)) || "";
    const company = item.Company || item.brand || item.manufacturer || item.company || "";
    const origInvoiceNo = item.invoiceno || item.invoicenumber || item.invoice_no || "";
    const origBuyerId = item.buyerid || item.buyer_id || item.buyername || "";

    const disAmt = ((parseFloat(qty || 0) * parseFloat(rate || 0)) * parseFloat(dis || 0)) / 100;
    const taxableAmt = (parseFloat(qty || 0) * parseFloat(rate || 0)) - disAmt;
    const sgstAmt = (taxableAmt * parseFloat(sgst || 0)) / 100;
    const cgstAmt = (taxableAmt * parseFloat(cgst || 0)) / 100;

    tr.innerHTML = `
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-product" value="${prodName}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; min-width: 140px; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-pack" value="${pack}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-hsn" value="${hsn}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-qty" value="${qty}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-free" value="${free}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-mrp" value="${mrp}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-batch" value="${batch}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-exp" value="${formattedExp}" oninput="if(typeof formatExpiryInput === 'function') formatExpiryInput(event); calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: center;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-dis" value="${dis}" data-dis-amt="${disAmt.toFixed(2)}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst" value="${sgst}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-sgst-amt" value="${sgstAmt.toFixed(2)}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst" value="${cgst}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-cgst-amt" value="${cgstAmt.toFixed(2)}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-rate" value="${rate}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="number" step="any" class="col-amount" value="${amount}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: right; font-weight: bold;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-company" value="${company}" oninput="calculateAddedSrRowAmount(this)" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left; text-transform: uppercase;"></td>
      <td style="border-right: 1px solid #000; padding: 4px;"><input type="text" class="col-orig-invoice-no" value="${origInvoiceNo}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
      <td style="padding: 4px;"><input type="text" class="col-orig-buyer-id" value="${origBuyerId}" readonly tabindex="-1" style="width: 100%; border: none; background: transparent; outline: none; font-size: 11px; text-align: left;"></td>
    `;
    if (inputRow && tbody) tbody.insertBefore(tr, inputRow);
  });

  if (typeof window.calculateSrTotals === 'function') window.calculateSrTotals();

  const saveBtn = document.getElementById("btnSaveSr");
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Return <span id="srBtnLoader" style="display:none; margin-left: 5px;"><i class="fas fa-spinner fa-spin"></i></span>';
    saveBtn.style.background = '#f59e0b';
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


window.deleteSalesReturn = async function (btn, invoiceNo, productName) {
  const confirmResult = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete the returned item '${productName}' from sales return '${invoiceNo}'?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Yes, delete it!'
  });

  if (!confirmResult.isConfirmed) return;

  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  btn.disabled = true;

  try {
    const response = await fetch(`${WEB_APP_URL}?action=delete_sales_return&invoiceNo=${encodeURIComponent(invoiceNo)}&productName=${encodeURIComponent(productName)}`, {
      method: "POST"
    });
    const result = await response.json();
    if (result.success) {
      salesReturnData = salesReturnData.filter(item => {
        const itemInvoice = String(item['Sales Return No'] || item.SalesReturnNo || item.InvoiceNo || item.invoiceNo || '').trim();
        const itemProdName = String(item.ProductName || item['Product Name'] || item.MedicineName || item.productName || '').trim();
        return !(itemInvoice === String(invoiceNo).trim() && itemProdName === String(productName).trim());
      });
      window.renderReturnedItemsTable();
      Swal.fire('Deleted!', 'The returned item has been deleted.', 'success');
    } else {
      Swal.fire('Error!', result.message, 'error');
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  } catch (error) {
    console.error("Delete error:", error);
    Swal.fire('Error!', 'Failed to delete the item.', 'error');
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
};

