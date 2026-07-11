// Google Apps Script for Shehjaar Medicate
// Google Sheets me Extensions > Apps Script me jaakar is code ko paste karein, Save karein, aur Deploy karein.

function doGet(e) {
  try {
    const action = e && e.parameter ? (e.parameter.action || "") : "";
    
    if (action === "get_inventory") {
      let invSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
      if (!invSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const invData = invSheet.getDataRange().getValues();
      if (invData.length <= 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      if (e.parameter.optimized === "true") {
        const formattedData = invData.map(row => 
          row.map(val => {
            if (val instanceof Date) {
              const y = val.getFullYear();
              const m = String(val.getMonth() + 1).padStart(2, '0');
              const d = String(val.getDate()).padStart(2, '0');
              return `${y}-${m}-${d}`;
            }
            return val;
          })
        );
        const invHeaders = formattedData[0];
        const rows = formattedData.slice(1);
        return ContentService.createTextOutput(JSON.stringify({ optimized: true, headers: invHeaders, rows: rows })).setMimeType(ContentService.MimeType.JSON);
      }

      const invHeaders = invData[0];
      const invResult = [];
      for (let i = 1; i < invData.length; i++) {
        const row = invData[i];
        const obj = {};
        for (let j = 0; j < invHeaders.length; j++) {
          let key = String(invHeaders[j]).trim();
          // Fix date objects
          let value = row[j];
          if (value instanceof Date) {
            const y = value.getFullYear();
            const m = String(value.getMonth() + 1).padStart(2, '0');
            const d = String(value.getDate()).padStart(2, '0');
            value = `${y}-${m}-${d}`;
          }
          obj[key] = value;
        }
        obj.row_index = i + 1;
        invResult.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify(invResult)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_distributors") {
      let distSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Distributors");
      if (!distSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const distData = distSheet.getDataRange().getValues();
      if (distData.length <= 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const distHeaders = distData[0];
      const distResult = [];
      for (let i = 1; i < distData.length; i++) {
        const row = distData[i];
        const obj = {};
        for (let j = 0; j < distHeaders.length; j++) {
          let key = String(distHeaders[j]).trim();
          let value = row[j];
          if (value instanceof Date) {
            const y = value.getFullYear();
            const m = String(value.getMonth() + 1).padStart(2, '0');
            const d = String(value.getDate()).padStart(2, '0');
            value = `${y}-${m}-${d}`;
          }
          obj[key] = value;
        }
        obj.row_index = i + 1;
        distResult.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify(distResult)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_buyers") {
      let buyerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Buyers");
      if (!buyerSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const buyerData = buyerSheet.getDataRange().getValues();
      if (buyerData.length <= 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const buyerHeaders = buyerData[0];
      const buyerResult = [];
      for (let i = 1; i < buyerData.length; i++) {
        const row = buyerData[i];
        const obj = {};
        for (let j = 0; j < buyerHeaders.length; j++) {
          let key = String(buyerHeaders[j]).trim();
          let value = row[j];
          if (value instanceof Date) {
            const y = value.getFullYear();
            const m = String(value.getMonth() + 1).padStart(2, '0');
            const d = String(value.getDate()).padStart(2, '0');
            value = `${y}-${m}-${d}`;
          }
          obj[key] = value;
        }
        obj.row_index = i + 1;
        buyerResult.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify(buyerResult)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_index_mapping") {
      let mappingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("IndexMapping");
      if (!mappingSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const mappingData = mappingSheet.getDataRange().getValues();
      if (mappingData.length <= 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const mappingHeaders = mappingData[0];
      const mappingResult = [];
      for (let i = 1; i < mappingData.length; i++) {
        const row = mappingData[i];
        const obj = {};
        for (let j = 0; j < mappingHeaders.length; j++) {
          obj[String(mappingHeaders[j]).trim()] = row[j];
        }
        mappingResult.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify(mappingResult)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_sold_out") {
      let soSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SoldOut");
      if (!soSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const soData = soSheet.getDataRange().getValues();
      if (soData.length <= 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const soHeaders = soData[0];
      const soResult = [];
      for (let i = 1; i < soData.length; i++) {
        const row = soData[i];
        const obj = {};
        for (let j = 0; j < soHeaders.length; j++) {
          obj[String(soHeaders[j]).trim()] = row[j];
        }
        obj.rowIndex = i + 1; // Store Google Sheet row number (1-based index, headers are row 1)
        soResult.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify(soResult)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_payments") {
      let paySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payments");
      if (!paySheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const payData = paySheet.getDataRange().getValues();
      if (payData.length <= 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const payHeaders = payData[0];
      const payResult = [];
      for (let i = 1; i < payData.length; i++) {
        const row = payData[i];
        const obj = {};
        for (let j = 0; j < payHeaders.length; j++) {
          obj[String(payHeaders[j]).trim()] = row[j];
        }
        payResult.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify(payResult)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_sales_returns") {
      let srSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sales Returns");
      if (!srSheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const srData = srSheet.getDataRange().getValues();
      if (srData.length <= 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
      
      const srHeaders = srData[0];
      const srResult = [];
      for (let i = 1; i < srData.length; i++) {
        const row = srData[i];
        const obj = {};
        for (let j = 0; j < srHeaders.length; j++) {
          obj[String(srHeaders[j]).trim()] = row[j];
        }
        srResult.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify(srResult)).setMimeType(ContentService.MimeType.JSON);
    }
    // ─────────────────────────────────────────────────────────────────

    return ContentService.createTextOutput(JSON.stringify({ error: "Invalid GET action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // Parse input data
    let params;
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else {
      params = e.parameter;
    }

    const action = params.action;
    
    if (action === "add_inventory") {
      let invSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
      if (!invSheet) {
        invSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Inventory");
        invSheet.appendRow(["Distributor", "InvoiceNo", "Date", "ProductDescription", "Pack", "HSN", "Qty", "Free", "MRP", "Batch", "Exp", "DisPercent", "SGSTPercent", "CGSTPercent", "Rate", "Amount", "Company", "DistributorID", "BuyerName", "BuyerID", "LotRate"]);
      } else {
        const headers = invSheet.getRange(1, 1, 1, invSheet.getLastColumn()).getValues()[0];
        if (!headers.includes("BuyerName")) invSheet.getRange(1, headers.length + 1).setValue("BuyerName");
        const headers2 = invSheet.getRange(1, 1, 1, invSheet.getLastColumn()).getValues()[0];
        if (!headers2.includes("BuyerID")) invSheet.getRange(1, headers2.length + 1).setValue("BuyerID");
        const headers3 = invSheet.getRange(1, 1, 1, invSheet.getLastColumn()).getValues()[0];
        if (!headers3.includes("LotRate")) invSheet.getRange(1, headers3.length + 1).setValue("LotRate");
      }
      
      const buyerNameVal = params.BuyerName || params.buyerName || "";
      const buyerIdVal = params.BuyerID || params.buyerId || "";
      const lotRateVal = params.lotRate || params.LotRate || "";
      
      invSheet.appendRow([
        params.supplier || "", params.invoiceNo || "", params.date || "", params.productName || "", params.pack || "", params.hsn || "", 
        params.qty || "", params.free || "", params.mrp || "", params.batch || "", params.exp || "", params.dis || "", params.sgst || "", params.cgst || "", params.rate || "", params.amount || "", params.company || "", params.supplierId || "", buyerNameVal, buyerIdVal, lotRateVal
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Inventory saved" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "bulk_save_inventory") {
      let invSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
      if (!invSheet) {
        invSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Inventory");
        const headers = ["Supplier", "InvoiceNo", "Date", "ProductName", "Pack", "HSN", "Qty", "Free", "MRP", "Batch", "Exp", "Dis", "SGST", "CGST", "Rate", "Amount", "Company", "SupplierID", "BuyerName", "BuyerID", "LotRate"];
        invSheet.appendRow(headers);
      } else {
        const headers = invSheet.getRange(1, 1, 1, invSheet.getLastColumn()).getValues()[0];
        if (!headers.includes("BuyerName")) invSheet.getRange(1, headers.length + 1).setValue("BuyerName");
        const headers2 = invSheet.getRange(1, 1, 1, invSheet.getLastColumn()).getValues()[0];
        if (!headers2.includes("BuyerID")) invSheet.getRange(1, headers2.length + 1).setValue("BuyerID");
        const headers3 = invSheet.getRange(1, 1, 1, invSheet.getLastColumn()).getValues()[0];
        if (!headers3.includes("LotRate")) invSheet.getRange(1, headers3.length + 1).setValue("LotRate");
      }
      
      const items = params.items || [];
      const rowsToAppend = [];
      
      items.forEach(item => {
        const buyerNameVal = item.BuyerName || item.buyerName || "";
        const buyerIdVal = item.BuyerID || item.buyerId || "";
        const lotRateVal = item.lotRate || item.LotRate || "";
        rowsToAppend.push([
          item.supplier || "", item.invoiceNo || "", item.date || "", item.productName || "", item.pack || "", item.hsn || "", 
          item.qty || "", item.free || "", item.mrp || "", item.batch || "", item.exp || "", item.dis || "", item.sgst || "", item.cgst || "", item.rate || "", item.amount || "", item.company || "", item.supplierId || "", buyerNameVal, buyerIdVal, lotRateVal
        ]);
      });
      
      if (rowsToAppend.length > 0) {
        invSheet.getRange(invSheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Inventory bulk saved" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "add_sales_return") {
      // 1. Append to Sales Returns sheet
      let srSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sales Returns");
      if (!srSheet) {
        srSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Sales Returns");
        const headers = ["Date", "Sales Return No", "Distributor ID", "Distributor Name", "Vendor ID", "Vendor Name", "ProductName", "Pack", "HSN", "Return Qty", "Free", "MRP", "Batch", "Exp", "Dis", "SGST", "CGST", "Rate", "Amount", "Company", "OrigInvoiceNo"];
        srSheet.appendRow(headers);
      }
      
      const items = params.items || [];
      const rowsToAppendSR = [];
      const rowsToAppendInv = [];
      
      const buyerNameVal = params.BuyerName || "";
      const buyerIdVal = params.BuyerID || "";
      const supplierName = params.Supplier || "";
      const supplierId = params.Distributor_ID || "";
      const invoiceNo = params.InvoiceNo || "";
      const date = params.Date || "";
      
      items.forEach(item => {
        rowsToAppendSR.push([
          date, invoiceNo, supplierId, supplierName, buyerIdVal, buyerNameVal,
          item.ProductName || "", item.Pack || "", item.HSN || "", item.Qty || "", item.Free || "", item.MRP || "",
          item.Batch || "", item.Exp || "", item.Dis || "", item.SGST || "", item.CGST || "", item.Rate || "", item.Amount || "", item.Company || "", item.OrigInvoiceNo || ""
        ]);
      });
      
      if (rowsToAppendSR.length > 0) {
        srSheet.getRange(srSheet.getLastRow() + 1, 1, rowsToAppendSR.length, rowsToAppendSR[0].length).setValues(rowsToAppendSR);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sales Return saved successfully" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "save_index_mapping") {
      let mappingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("IndexMapping");
      if (!mappingSheet) {
        mappingSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("IndexMapping");
        mappingSheet.appendRow(["MedicineName", "LocationIndex"]);
      }
      
      mappingSheet.clearContents();
      mappingSheet.appendRow(["MedicineName", "LocationIndex"]);
      
      const items = params.items || [];
      if (items.length > 0) {
        const rowsToAppend = items.map(item => [item.MedicineName || "", item.LocationIndex || ""]);
        mappingSheet.getRange(2, 1, rowsToAppend.length, 2).setValues(rowsToAppend);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Index Mappings saved successfully" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "add_sold_out") {
      let soSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SoldOut");
      if (!soSheet) {
        soSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("SoldOut");
        soSheet.appendRow(["DateSold", "InvoiceNo", "Batch", "MedicineName", "Expiry", "Distributor", "OriginalQty", "SoldQty", "BuyerDetails", "Company", "MRP"]);
      } else {
        const headers = soSheet.getRange(1, 1, 1, soSheet.getLastColumn()).getValues()[0];
        if (!headers.includes("BuyerDetails")) soSheet.getRange(1, headers.length + 1).setValue("BuyerDetails");
        
        const headers2 = soSheet.getRange(1, 1, 1, soSheet.getLastColumn()).getValues()[0];
        if (!headers2.includes("Company")) soSheet.getRange(1, headers2.length + 1).setValue("Company");
        
        const headers3 = soSheet.getRange(1, 1, 1, soSheet.getLastColumn()).getValues()[0];
        if (!headers3.includes("MRP")) soSheet.getRange(1, headers3.length + 1).setValue("MRP");
      }
      
      const dateSold = new Date().toISOString().split('T')[0];
      soSheet.appendRow([
        dateSold, 
        params.InvoiceNo || "", 
        params.Batch || "", 
        params.MedicineName || "", 
        params.Expiry || "", 
        params.Distributor || "", 
        params.OriginalQty || "", 
        params.SoldQty || "",
        params.BuyerDetails || "",
        params.Company || "",
        params.MRP || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sold out record saved" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "update_invoice") {
      let invSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
      if (!invSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Inventory sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const oldInvoiceNo = String(params.oldInvoiceNo || "").trim();
      
      // Step 1: Delete all existing rows for this invoice
      const data = invSheet.getDataRange().getValues();
      // Loop backwards to delete safely
      for (let i = data.length - 1; i >= 1; i--) {
        const rowInvoiceNo = String(data[i][1]).trim(); // InvoiceNo is at index 1 based on add_inventory
        if (rowInvoiceNo === oldInvoiceNo) {
          invSheet.deleteRow(i + 1);
        }
      }
      
      // Step 2: Append all new items
      const items = params.items || [];
      const rowsToAppend = [];
      
      items.forEach(item => {
        const buyerNameVal = item.BuyerName || item.buyerName || "";
        const buyerIdVal = item.BuyerID || item.buyerId || "";
        const lotRateVal = item.lotRate || item.LotRate || "";
        rowsToAppend.push([
          item.supplier || "", item.invoiceNo || "", item.date || "", item.productName || "", item.pack || "", item.hsn || "", 
          item.qty || "", item.free || "", item.mrp || "", item.batch || "", item.exp || "", item.dis || "", item.sgst || "", item.cgst || "", item.rate || "", item.amount || "", item.company || "", item.supplierId || "", buyerNameVal, buyerIdVal, lotRateVal
        ]);
      });
      
      if (rowsToAppend.length > 0) {
        invSheet.getRange(invSheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Invoice updated successfully" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "delete_invoice") {
      let invSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
      if (!invSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Inventory sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const invoiceNo = String(params.invoiceNo || "").trim();
      
      const data = invSheet.getDataRange().getValues();
      let deletedCount = 0;
      for (let i = data.length - 1; i >= 1; i--) {
        const rowInvoiceNo = String(data[i][1]).trim(); // InvoiceNo
        if (rowInvoiceNo === invoiceNo) {
          invSheet.deleteRow(i + 1);
          deletedCount++;
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: deletedCount > 0 ? `Deleted ${deletedCount} items` : "No items found for this invoice" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "delete_sales_return") {
      let srSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sales Returns");
      if (!srSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Sales Returns sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const invoiceNo = String(params.invoiceNo || "").trim();
      const productName = String(params.productName || "").trim();
      
      const data = srSheet.getDataRange().getValues();
      let deletedCount = 0;
      for (let i = data.length - 1; i >= 1; i--) {
        const rowInvoiceNo = String(data[i][1]).trim();
        const rowProductName = String(data[i][6]).trim();
        
        if (rowInvoiceNo === invoiceNo && rowProductName === productName) {
          srSheet.deleteRow(i + 1);
          deletedCount++;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, deletedCount: deletedCount })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete_sold_out") {
      let soSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SoldOut");
      if (!soSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "SoldOut sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const rowIndex = parseInt(params.rowIndex);
      
      if (isNaN(rowIndex) || rowIndex <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid row index provided for deletion" })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const maxRows = soSheet.getMaxRows();
      if (rowIndex > maxRows) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Row index out of bounds" })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Optionally, verify it's the correct row (extra safety)
      const rowInvoice = String(soSheet.getRange(rowIndex, 2).getValue()).trim().toLowerCase().replace(/\s+/g, '');
      const paramInvoice = String(params.InvoiceNo || "").trim().toLowerCase().replace(/\s+/g, '');
      
      if (paramInvoice && rowInvoice !== paramInvoice) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Safety check failed: Row data does not match the item you clicked." })).setMimeType(ContentService.MimeType.JSON);
      }

      soSheet.deleteRow(rowIndex);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Item deleted successfully" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    
    if (action === "add_buyer") {
      let buyerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Buyers");
      if (!buyerSheet) {
        buyerSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Buyers");
        buyerSheet.appendRow(["BuyerID", "Name", "Address", "GST", "PAN", "Phone", "DrugLic", "SalesMan", "Route"]);
      }
      
      const buyerId = params.BuyerID || ("BUYER-" + new Date().getTime().toString().slice(-6));
      
      // Update if exists
      const data = buyerSheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === buyerId || (data[i][1] && String(data[i][1]).trim().toLowerCase() === String(params.Name).trim().toLowerCase())) {
          buyerSheet.getRange(i + 1, 1, 1, 9).setValues([[
            buyerId, params.Name || "", params.Address || "", params.GST || "", params.PAN || "", 
            params.Phone || "", params.DrugLic || "", params.SalesMan || "", params.Route || ""
          ]]);
          found = true;
          break;
        }
      }
      
      if (!found) {
        buyerSheet.appendRow([
          buyerId, params.Name || "", params.Address || "", params.GST || "", params.PAN || "", 
          params.Phone || "", params.DrugLic || "", params.SalesMan || "", params.Route || ""
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Buyer saved successfully", BuyerID: buyerId })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "delete_buyer") {
      let buyerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Buyers");
      if (!buyerSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Buyers sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const buyerId = String(params.BuyerID || "").trim();
      const name = String(params.Name || "").trim();
      
      const data = buyerSheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if ((buyerId && String(data[i][0]).trim() === buyerId) || (name && String(data[i][1]).trim() === name)) {
          buyerSheet.deleteRow(i + 1);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Buyer deleted" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "add_distributor") {
      let distSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Distributors");
      if (!distSheet) {
        distSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Distributors");
        distSheet.appendRow(["DistributorID", "Name", "AddressLine1", "AddressLine2", "Phone", "Email", "GSTIN", "DrugLicense", "FSSILicense", "DateAdded"]);
      }
      distSheet.appendRow([
        params.distributorId || "", params.name || "", params.address1 || "", params.address2 || "", 
        params.phone || "", params.email || "", params.gstin || "", params.drugLic || "", 
        params.fssiLic || "", params.dateAdded || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Distributor saved" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "edit_distributor") {
      let distSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Distributors");
      if (!distSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Distributors sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const data = distSheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === params.distributorId) {
          rowIndex = i + 1; // 1-indexed for sheets
          break;
        }
      }
      if (rowIndex !== -1) {
        distSheet.getRange(rowIndex, 1, 1, 10).setValues([[
          params.distributorId || "", params.name || "", params.address1 || "", params.address2 || "", 
          params.phone || "", params.email || "", params.gstin || "", params.drugLic || "", 
          params.fssiLic || "", params.dateAdded || ""
        ]]);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Distributor updated" })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Distributor not found" })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    if (action === "delete_distributor") {
      let distSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Distributors");
      if (!distSheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Distributors sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const data = distSheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === params.distributorId) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex !== -1) {
        distSheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Distributor deleted" })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Distributor not found" })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === "add_payment") {
      let paySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payments");
      if (!paySheet) {
        paySheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Payments");
        paySheet.appendRow(["ReceiptNo", "Date", "DistributorID", "DistributorName", "TotalOwedBefore", "AmountPaid", "PaymentMode", "ReferenceNo", "Remarks", "RemainingBalance", "Timestamp"]);
      }
      
      const timestamp = new Date().toISOString();
      paySheet.appendRow([
        params.ReceiptNo || "", 
        params.Date || "", 
        params.DistributorID || "", 
        params.DistributorName || "", 
        params.TotalOwedBefore || "", 
        params.AmountPaid || "", 
        params.PaymentMode || "", 
        params.ReferenceNo || "", 
        params.Remarks || "", 
        params.RemainingBalance || "", 
        timestamp
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Payment saved successfully" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "delete_payment") {
      let paySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Payments");
      if (!paySheet) return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Payments sheet not found" })).setMimeType(ContentService.MimeType.JSON);
      
      const receiptNo = String(params.ReceiptNo || "").trim();
      const distributorName = String(params.DistributorName || "").trim();
      
      const data = paySheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = data.length - 1; i >= 1; i--) {
        const rowReceiptNo = String(data[i][0]).trim();
        const rowDistName = String(data[i][3]).trim();
        if (rowReceiptNo === receiptNo && rowDistName === distributorName) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex !== -1) {
        paySheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Payment deleted" })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Payment not found" })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Action not recognized" })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

