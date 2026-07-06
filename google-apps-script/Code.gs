function doGet(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");

    if (!sheet) {
      return ContentService.createTextOutput("Sheet not found");
    }

    // Read parameters
    var name = String(e.parameter.name || "").trim();
    var reg = String(e.parameter.regno || "").trim();
    var uid = normalizeUID(e.parameter.uid || "");
    var dept = String(e.parameter.dept || "").trim();
    var status = String(e.parameter.status || "Present").trim();

    if (uid === "") {
      return ContentService.createTextOutput("UID Missing");
    }

    var now = new Date();

    // Store date as yyyy-MM-dd
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

    // Check duplicate
    if (isAlreadyMarked(sheet, uid, today)) {
      return ContentService.createTextOutput("Already Marked");
    }

    // Save attendance
    sheet.appendRow([
      today,
      time,
      name,
      reg,
      uid,
      dept,
      status
    ]);

    return ContentService.createTextOutput("Attendance Recorded");

  } catch (err) {

    Logger.log(err);

    return ContentService.createTextOutput(
      "Error : " + err.message
    );

  } finally {

    try {
      lock.releaseLock();
    } catch(err){}

  }
}


//----------------------------------------------------
// Duplicate Check
//----------------------------------------------------

function isAlreadyMarked(sheet, uid, today) {

  var lastRow = sheet.getLastRow();

  if (lastRow < 2)
    return false;

  var values = sheet
      .getRange(2,1,lastRow-1,5)
      .getValues();

  for(var i=0;i<values.length;i++){

      var rowDate = values[i][0];
      var rowUID = normalizeUID(values[i][4]);

      if(rowDate instanceof Date){

          rowDate = Utilities.formatDate(
              rowDate,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd"
          );

      }else{

          rowDate = String(rowDate).trim();

      }

      if(rowUID === uid && rowDate === today){

          return true;

      }

  }

  return false;

}


//----------------------------------------------------
// Normalize UID
//----------------------------------------------------

function normalizeUID(uid){

  return String(uid)
      .replace(/[^A-Fa-f0-9]/g,"")
      .toUpperCase();

}