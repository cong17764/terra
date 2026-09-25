/**
 * doGet() handles HTTP GET request.
 * 
 * Expected optional parameters:
 * x - Google Spreadsheet ID
 * l - location index (zero-based sheet index)
 * a - accommodation index (zero-based row index)
 * s - status (value for 2nd column)
 * n - note (staus cell note)
 */
function doGet(e) {
  const response = { };

  const sheetId = e?.parameter?.x;
  if (sheetId) {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheets = spreadsheet.getSheets();

    const getAccommodationData = (values, notes) => {
      const data = { no: values[0] };

      if (values[1]) {
        data.status = values[1];

        if (notes[1])
          data.note = notes[1];
      }
      return data;
    };

    const getLocationData = (sheet) => {
      const data = { name: sheet.getName(), accommodations: [] };

      const range = sheet.getRange(1, 1, sheet.getLastRow(), 2);
      const rules = range.getDataValidations();
      const notes = range.getNotes();
      const values = range.getDisplayValues();

      for (let i = 0; i < values.length; ++i) {
        data.accommodations.push(getAccommodationData(values[i], notes[i]))

        if (!data.statuses) {
          const rule = rules[i][1];
          if (rule && rule.getCriteriaType() == SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST)
            data.statuses = rule.getCriteriaValues()[0];
        }
      }
      return data;
    };

    const sheetIndex = e.parameter.l;
    if (sheetIndex !== undefined) {
      const sheet = sheets[+sheetIndex];

      const rowIndex = e.parameter.a;
      if (rowIndex !== undefined) {
        if (e.parameter.s !== undefined || e.parameter.n !== undefined) {
          const range = sheet.getRange(+rowIndex + 1, 2);

          if (e.parameter.s !== undefined)
            range.setValue(e.parameter.s);

          if (e.parameter.n !== undefined)
            range.setNote(e.parameter.n || null);
        }

        const range = sheet.getRange(+rowIndex + 1, 1, 1, 2);
        const notes = range.getNotes();
        const values = range.getDisplayValues();

        Object.assign(response, getAccommodationData(values[0], notes[0]));
      }
      else
        Object.assign(response, getLocationData(sheet));
    }
    else {
      Object.assign(response, { name: spreadsheet.getName(), locations: [] });
      for (const sheet of sheets)
        response.locations.push(getLocationData(sheet));
    }
  }

  //Logger.log(response);

  return ContentService.createTextOutput()
    .setMimeType(MimeType.JSON)
    .setContent(JSON.stringify(response));
}

function test() {
  doGet({
    parameter: {
      x: '1D0RcPMdFOBB0U_KVWNbxtxJMlPSS53WgfdzvAgrwFuc',
      l: 0,
      a: 0,
      s: '',
      n: ''
    }
  });
}
