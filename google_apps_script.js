// Google Apps Script for Shehjaar Medicate
// Google Sheets me Extensions > Apps Script me jaakar is code ko paste karein, Save karein, aur Deploy karein.

const SHEET_NAME = "Patients"; // Apni sheet ka naam likhein

// ✅ SECURE PASSWORD — Sirf yahan change karein, browser file mein nahi!
// Existing data par koi asar nahi padega.
const SECURE_PASSWORD = "shehjaar123";

function doGet(e) {
  try {
    // ── PASSWORD VERIFICATION (login ke liye) ─────────────────────────
    // Existing data aur sheets par koi asar nahi
    const action = e && e.parameter ? (e.parameter.action || "") : "";
    if (action === "verifyPassword") {
      const enteredPwd = e.parameter.pwd || "";
      const isCorrect = enteredPwd === SECURE_PASSWORD;
      return ContentService
        .createTextOutput(JSON.stringify({ success: isCorrect }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // ─────────────────────────────────────────────────────────────────

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const result = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        let value = row[j];
        // Handle date formatting for duration/validity
        if (value instanceof Date) {
          const y = value.getFullYear();
          const m = String(value.getMonth() + 1).padStart(2, '0');
          const d = String(value.getDate()).padStart(2, '0');
          value = `${y}-${m}-${d}`;
        }
        let key = String(headers[j]).trim().toLowerCase().replace(/\s+/g, '_');
        obj[key] = value;
      }
      obj.row_index = i + 1; // Ensure row_index is always available
      result.push(obj);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Parse input data
    let params;
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else {
      params = e.parameter;
    }

    const action = params.action;
    const patient_id = String(params.patient_id);
    const checkup_id = String(params.checkup_id);
    const visit = String(params.visit);

    if (action === "delete") {
      if (params.row_index) {
        sheet.deleteRow(parseInt(params.row_index));
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Session deleted by row_index" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === patient_id && String(data[i][1]) === checkup_id && String(data[i][5]) === visit) { // Match PATIENT_ID, CHECKUP_ID, VISIT
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Session deleted" }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Session not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // For Add or Update, extract variables matching EXACTLY the 12 columns
    const today = new Date();
    const systemDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');

    const rowData = [
      params.patient_id,
      params.checkup_id,
      params.date || systemDate,
      params.name,
      params.address,
      params.visit,
      params.phone,
      params.fee,
      params.paid,
      params.balance,
      params.status,
      params.duration || params.checkup_duration_validity,
      params.token_no || "",         // Column M: Token No
      params.doctor || "",            // Column N: Doctor
      params.medicine_fee || 0,       // Column O: Medicine Fee
      params.medicine_paid || 0,      // Column P: Medicine Paid
      params.medicine_balance || 0,   // Column Q: Medicine Balance
      params.payment_by_shehjar || 0  // Column R: Payment By Shehjar
    ];

    if (action === "update") {
      // FOOLPROOF UPDATE: Use exact row_index if provided
      if (params.row_index) {
        sheet.getRange(parseInt(params.row_index), 1, 1, rowData.length).setValues([rowData]);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Updated by row index" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Fallback: search by patient_id + original_checkup_id + original_visit
      const orig_chk = String(params.original_checkup_id || checkup_id).trim();
      const orig_vis = String(params.original_visit || visit).trim().toLowerCase();
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (
          String(data[i][0]).trim() === patient_id.trim() &&
          String(data[i][1]).trim() === orig_chk &&
          String(data[i][5]).trim().toLowerCase() === orig_vis
        ) {
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Updated by search" }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      // If not found, append as new
      sheet.appendRow(rowData);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Session saved" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Sheets setup helper
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = [
    "patient_id",
    "checkup_id",
    "name",
    "phone",
    "address",
    "visit",
    "fee",
    "paid",
    "balance",
    "status",
    "checkup_duration_validity"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}
