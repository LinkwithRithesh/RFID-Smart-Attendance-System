/**
 * RFID Smart Attendance Management System
 * ---------------------------------------
 * Receives attendance data from ESP8266 via HTTP GET request
 * Checks for duplicate attendance
 * Stores attendance records in Google Sheets
 *
 * Author: Ritheshwaran A
 * Platform: Google Apps Script
 */
 
/*
Expected Sheet Format

| Date | Time | Name | Register No | UID | Department | Status |

*/

//--------------------------------------------------
// Main HTTP Request Handler
//--------------------------------------------------

function doGet(e) {

  var lock = LockService.getScriptLock();

  try {

    lock.waitLock(30000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");

    if (!sheet) {
      return ContentService.createTextOutput("Sheet not found");
    }

    // Read Parameters
    var name = String(e.parameter.name || "").trim();
    var reg = String(e.parameter.regno || "").trim();
    var uid = normalizeUID(e.parameter.uid || "");
    var dept = String(e.parameter.dept || "").trim();
    var status = String(e.parameter.status || "Present").trim();

    if (uid == "") {
      return ContentService.createTextOutput("UID Missing");
    }

    var now = new Date();

    var today = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );

    var time = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      "HH:mm:ss"
    );

    // Duplicate Check
    if (isAlreadyMarked(sheet, uid, today)) {
      return ContentService.createTextOutput("Already Marked");
    }

    // Append Attendance
    sheet.appendRow([
      today,
      time,
      name,
      reg,
      "'" + uid,        // Store as text (keeps leading zero)
      dept,
      status
    ]);

    SpreadsheetApp.flush();

    return ContentService.createTextOutput("Attendance Recorded");

  }
  catch(err){

    Logger.log(err);

    return ContentService.createTextOutput("Error : " + err.message);

  }
  finally{

    try{
      lock.releaseLock();
    }
    catch(err){}

  }

}



//--------------------------------------------------
// Duplicate Check
//--------------------------------------------------

function isAlreadyMarked(sheet, uid, today){

  var lastRow = sheet.getLastRow();

  if(lastRow < 2)
    return false;

  var values = sheet.getRange(2,1,lastRow-1,7).getValues();

  for(var i=0;i<values.length;i++){

    var rowDate = values[i][0];
    var rowUID = normalizeUID(values[i][4]);

    var compareDate;

    if(rowDate instanceof Date){

      compareDate = Utilities.formatDate(
        rowDate,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

    }
    else{

      compareDate = String(rowDate).trim();

    }

    if(compareDate == today && rowUID == uid){

      return true;

    }

  }

  return false;

}



//--------------------------------------------------
// UID Normalization
//--------------------------------------------------

function normalizeUID(uid){

  uid = String(uid)
          .replace(/'/g,"")
          .replace(/[^A-Fa-f0-9]/g,"")
          .toUpperCase()
          .trim();

  while(uid.length < 8){

    uid = "0" + uid;

  }

  return uid;

}
