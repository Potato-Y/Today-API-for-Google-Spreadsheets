var SHEET_NAME = "Main Sheet"; //메인 시트 이름
var SCRIPT_PROP = PropertiesService.getScriptProperties();
var scriptVer = 1.0; //스크립트 버전

function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet(); //권한 얻기
  SCRIPT_PROP.setProperty("key", doc.getId());
}

//오류이슈로 GET 만 사용하도록 설정
function doGet(e) {
  return handleResponse(e);
}

function opOpen(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  doc.getSheetByName(doc.getSheets()[0].getName()).setName("Main Sheet");
}

function handleResponse(e) {
  //LockService를 통해 동시 접근 막기
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME);

    var totalRange = sheet.getRange("C2");
    var todayRange = sheet.getRange("C3");

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

    var data = new Date();
    var lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow + 1, 1).setValue(data.getFullYear() + "/" + data.getMonth() + "/" + data.getDay() + "/" + data.getHours() + ":" + data.getMinutes() + ":" + data.getSeconds());
    logSheet.getRange(lastRow + 1, 2).setValue(e.parameter["IP"]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success", total: totalRange.getValue(), today: todayRange.getValue() })).setMimeType(ContentService.MimeType.JSON);
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
  var data = new Date();
  sheet.setName("log " + data.getFullYear() + "/" + data.getMonth() + "/" + data.getDay() + "/" + data.getHours() + ":" + data.getMinutes() + ":" + data.getSeconds());

  sheet.getRange("A1").setValue("Date");
  sheet.getRange("B1").setValue("IP");

  Logger.log("add log sheet");
}
