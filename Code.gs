var SHEET_NAME = "Main Sheet"; //메인 시트 이름
var SCRIPT_PROP = PropertiesService.getScriptProperties();
var scriptVer = 1.1; //스크립트 버전

//오류이슈로 GET 만 사용하도록 설정
function doGet(e) {
    return handleResponse(e);
}

function onOpen(e) {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    doc.getSheetByName(doc.getSheets()[0].getName()).setName("Main Sheet");

    //첫 실행시 새로운 프로젝트라면 설정
    var sheet = doc.getSheetByName(SHEET_NAME);
    if (sheet.getRange("Z1").getValue() == "") {
        sheet.getRange("B2").setValue("Total User");
        sheet.getRange("B3").setValue("Today User");
        sheet.getRange("C2").setValue(0);
        sheet.getRange("C3").setValue(0);
        sheet.getRange("Y1").setValue("Script Version");
        sheet.getRange("Z1").setValue(scriptVer);
    }

    //다른날이면 0으로 수정
    dayReset();
}

function dayReset() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName(SHEET_NAME);

    var date = new Date();
    var utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
    var KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    var krDate = new Date(utc + KR_TIME_DIFF);

    var day = "last load: " + krDate.getFullYear() + "/" + (krDate.getMonth() + 1) + "/" + krDate.getDate();
    if (sheet.getRange("C4").getValue() != day) {
        sheet.getRange("C4").setValue(day);
        sheet.getRange("C3").setValue(0);
    }
}

function handleResponse(e) {
    //LockService를 통해 동시 접근 막기
    var lock = LockService.getDocumentLock();
    lock.waitLock(30000);
    try {
        dayReset();

        var doc = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = doc.getSheetByName(SHEET_NAME);
        var totalRange = sheet.getRange("C2");
        var todayRange = sheet.getRange("C3");

        if (e.parameter["IP"] == "ReloadData") {
            return ContentService.createTextOutput(JSON.stringify({ result: "success", total: totalRange.getValue().toString(), today: todayRange.getValue().toString() })).setMimeType(
                ContentService.MimeType.JSON
            );
        }

        sheet.getRange("C2").setValue(totalRange.getValue() + 1);
        sheet.getRange("C3").setValue(todayRange.getValue() + 1);

        //log
        var doc = SpreadsheetApp.getActiveSpreadsheet();
        var sheetCount = doc.getNumSheets();
        if (sheetCount < 2) {
            //log를 저장할 곳이 없다면
            addSheet();
        } else if (doc.getSheetByName(doc.getSheets()[1].getName()).getLastRow() + 1 > 999) {
            addSheet();
        }
        var logSheet = doc.getSheetByName(doc.getSheets()[1].getName());

        var date = new Date();
        var lastRow = logSheet.getLastRow();
        logSheet.getRange(lastRow + 1, 1).setValue(date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
        logSheet.getRange(lastRow + 1, 2).setValue(e.parameter["IP"]);

        return ContentService.createTextOutput(JSON.stringify({ result: "success", total: totalRange.getValue().toString(), today: todayRange.getValue().toString() })).setMimeType(
            ContentService.MimeType.JSON
        );
    } catch (e) {
        Logger.log("Error: " + e);
        return ContentService.createTextOutput(JSON.stringify({ result: "error", msg: e })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function addSheet() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    doc.insertSheet(1);
    var sheet = doc.getSheetByName(doc.getSheets()[1].getName());
    var date = new Date();
    sheet.setName("log " + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());

    sheet.getRange("A1").setValue("Date");
    sheet.getRange("B1").setValue("IP");

    Logger.log("add log sheet");
}
