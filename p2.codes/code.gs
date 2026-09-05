function doPost(e) {

  try {

    // ======================================================
    // CONNECT TO SPREADSHEET
    // ======================================================

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var masterSheet =
      ss.getSheetByName("Master_Students");

    var logSheet =
      ss.getSheetByName("Attendance_Logs");


    // ======================================================
    // CHECK SHEETS
    // ======================================================

    if (!masterSheet || !logSheet) {

      return ContentService
        .createTextOutput("ERROR_SHEET_NOT_FOUND");
    }


    // ======================================================
    // READ REQUEST
    // ======================================================

    if (!e || !e.postData || !e.postData.contents) {

      return ContentService
        .createTextOutput("ERROR_NO_DATA");
    }


    var data =
      JSON.parse(e.postData.contents);


    var cardId =
      String(data.card_id || "").trim();

    var action =
      String(data.action || "").trim();

    var studentName =
      String(data.name || "").trim();


    // ======================================================
    // VALIDATE CARD ID
    // ======================================================

    if (cardId === "") {

      return ContentService
        .createTextOutput("ERROR_NO_CARD");
    }


    // ======================================================
    // REGISTER NEW STUDENT
    // ======================================================

    if (action === "REGISTER") {

      var masterData =
        masterSheet.getDataRange().getValues();


      // Check if card already exists

      for (
        var i = 1;
        i < masterData.length;
        i++
      ) {

        var existingCard =
          String(masterData[i][0]).trim();


        if (
          existingCard.toUpperCase() ===
          cardId.toUpperCase()
        ) {

          return ContentService
            .createTextOutput(
              "ALREADY_EXISTS"
            );
        }
      }


      // Check name

      if (studentName === "") {

        studentName = "Unknown Student";
      }


      // Add student

      masterSheet.appendRow([
        cardId,
        studentName
      ]);


      return ContentService
        .createTextOutput(
          "SUCCESS_REG"
        );
    }


    // ======================================================
    // CHECK WHETHER CARD IS REGISTERED
    // ======================================================

    if (action === "CHECK_CARD") {

      var students =
        masterSheet.getDataRange().getValues();


      for (
        var i = 1;
        i < students.length;
        i++
      ) {

        var storedCard =
          String(students[i][0]).trim();


        if (
          storedCard.toUpperCase() ===
          cardId.toUpperCase()
        ) {

          return ContentService
            .createTextOutput(
              "CARD_FOUND"
            );
        }
      }


      return ContentService
        .createTextOutput(
          "FAIL_UNKNOWN"
        );
    }


    // ======================================================
    // ATTENDANCE
    // ======================================================

    if (action === "ATTENDANCE") {

      var studentData =
        masterSheet.getDataRange().getValues();


      var foundName = "";
      var exists = false;


      // ----------------------------------------------------
      // FIND STUDENT
      // ----------------------------------------------------

      for (
        var i = 1;
        i < studentData.length;
        i++
      ) {

        var storedCard =
          String(studentData[i][0]).trim();


        if (
          storedCard.toUpperCase() ===
          cardId.toUpperCase()
        ) {

          foundName =
            String(
              studentData[i][1] || ""
            ).trim();

          exists = true;

          break;
        }
      }


      // ----------------------------------------------------
      // UNKNOWN CARD
      // ----------------------------------------------------

      if (!exists) {

        logSheet.appendRow([
          new Date(),
          cardId,
          "Unknown Card",
          "BLOCKED - NO PROFILE"
        ]);


        return ContentService
          .createTextOutput(
            "FAIL_UNKNOWN"
          );
      }


      // ====================================================
      // 50-MINUTE DUPLICATE CHECK
      // ====================================================

      var logs =
        logSheet.getDataRange().getValues();


      var now =
        new Date();


      var fiftyMinutes =
        50 * 60 * 1000;


      // Search from newest attendance
      // to oldest attendance

      for (
        var j = logs.length - 1;
        j >= 1;
        j--
      ) {

        var logTime =
          logs[j][0];

        var logCard =
          String(
            logs[j][1] || ""
          ).trim();

        var logStatus =
          String(
            logs[j][3] || ""
          ).trim();


        // Only check the same RFID

        if (
          logCard.toUpperCase() ===
          cardId.toUpperCase()
        ) {


          // Only successful attendance records

          if (
            logStatus === "Present"
          ) {

            var previousTime =
              new Date(logTime);


            var difference =
              now.getTime() -
              previousTime.getTime();


            // ------------------------------------------------
            // DUPLICATE WITHIN 50 MINUTES
            // ------------------------------------------------

            if (
              difference >= 0 &&
              difference < fiftyMinutes
            ) {

              return ContentService
                .createTextOutput(
                  "DUPLICATE_50MIN"
                );
            }


            // We found the most recent
            // successful attendance.
            break;
          }
        }
      }


      // ====================================================
      // MARK ATTENDANCE
      // ====================================================

      logSheet.appendRow([
        now,
        cardId,
        foundName,
        "Present"
      ]);


      return ContentService
        .createTextOutput(
          "SUCCESS_MATCH"
        );
    }


    // ======================================================
    // INVALID ACTION
    // ======================================================

    return ContentService
      .createTextOutput(
        "INVALID_ACTION"
      );


  } catch (error) {

    // ======================================================
    // ERROR HANDLING
    // ======================================================

    return ContentService
      .createTextOutput(
        "ERROR: " +
        error.toString()
      );
  }
}