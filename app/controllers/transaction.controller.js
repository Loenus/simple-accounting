const db = require("../models");
const Transaction = db.transaction;

const ExcelJS = require('exceljs');
const busboy = require('busboy');
const fs = require('fs');
const templatePath = 'template.xlsx';
const outputPath = 'output.xlsx';


// Retrieve all Transactions from the database.
exports.findAll = (req, res) => {
  const user = req.query.user;
  var condition = user ? { user: { $regex: new RegExp(user), $options: "i" } } : {};

  Transaction.find(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transactions."
      });
    });
};

// Delete all Transactions from the database.
exports.deleteAll = (req, res) => {
  Transaction.deleteMany({})
    .then(data => {
      res.send({
        message: `${data.deletedCount} Transaction were deleted successfully!`
      });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all transactions."
      });
    });
};



// Upload Excel
exports.upload = (req, res) => {
  const bb = busboy({ headers: req.headers });
  let fileData = [];

  bb.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    if (typeof filename === 'undefined'){
      return res.status(400).send({
        message: `No File Selected!`
      });
    }

    console.log(
      `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
      filename,
      encoding,
      mimeType
    );
    file.on('data', (data) => {
      console.log(`File [${name}] got ${data.length} bytes`);
      fileData.push(data);
    }).on('close', () => {
      console.log(`File [${name}] done`);
      const concatenatedBuffer = Buffer.concat(fileData);
      const startRow = 20;
      const workbook = new ExcelJS.Workbook();
      workbook.xlsx.load(concatenatedBuffer).then(async () => {
        const worksheet = workbook.getWorksheet(1);
        const excelData = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber < startRow) return;
          const rowData = row.values;
          const cleanedRowData = rowData.filter(cellValue => cellValue !== undefined);
          excelData.push(cleanedRowData);
        });
    
        //console.log('Dati del file Excel:', excelData);
        for (const row of excelData) {
          const transaction = new db.transaction({
            Data: dateFormat(row[0]),
            Operazione: row[1],
            Dettagli: row[2],
            ContoOrCarta: row[3],
            Contabilizzazione: row[4],
            Categoria: row[5],
            Valuta: row[6],
            Importo: row[7]
          });
          await saveOrUpdateDocument(transaction);
        };
        
      });
    });
  });

  bb.on('field', (name, val, info) => {
    console.log(`Field [${name}]: value: %j`, val);
  });
  bb.on('close', () => {
    console.log('Done parsing form!');
    res.writeHead(303, { Connection: 'close', Location: '/' });
    res.end();
  });
  req.pipe(bb);

  //res.send('File caricato con successo!');
};

const saveOrUpdateDocument = async (data) => {
  const query = {
    $and: [
      { Data: { $eq: data.Data } },
      { Operazione: { $eq: data.Operazione } },
      { Dettagli: { $eq: data.Dettagli } }
    ]
  };

  const documentExists = await db.transaction.exists(query);
  if (!documentExists) {
    data.save(data)
    .then(data => {
      console.log(data);
    })
    .catch(err => {
      console.log(err.message || "Some error occurred while creating the Fountain.");
    });
  } else {
    console.log("già presente!")
  }
};

const dateFormat = (dateString) => {
  const dateParts = dateString.split('.');
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const year = parseInt(dateParts[2], 10);
  const dateObject = new Date(year, month, day);
}



// Download Excel
exports.download = (req, res) => {
  Transaction.find()
  .then(data => {
    if (data.length == 0) {
      res.status(404).send({
        message: `No transactions Found!`
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.xlsx.readFile(templatePath, { stream: true })
      .then(() => {
        const worksheet = workbook.getWorksheet(1);

        const fieldsToExtract = ['ContoOrCarta', 'Data', 'Operazione', 'Categoria', 'Importo'];
        var result = [];
        data.forEach((transaction) => {
          //result.push(Object.keys(transaction._doc).map(key => transaction._doc[key]))
          // Creare un array di valori dalle proprietà fieldsToExtract dell'oggetto, e lo inserisce nell'array result
          const extractedFields = fieldsToExtract.map(field => transaction[field]);
          result.push(extractedFields);
        })
        console.log(data[0])
        console.log("Da inserire nella tabella: size " + result.length)
        console.log(result[0])

        // https://github.com/exceljs/exceljs#tables
        worksheet.addTable({
          name: 'MyTable',
          ref: 'A1',
          headerRow: true,
          totalsRow: true,
          style: {
            showFirstColumn: true
          },
          columns: [
            {name: 'ContoOrCarta', type: 'string', key: 'contoorcarta', totalsRowLabel: 'Totals:', filterButton: true},
            {name: 'Date', type: 'date', key: 'date', filterButton: true},
            {name: 'Operazione', type: 'string', key: "operazione", filterButton: true},
            {name: 'Categoria', type: 'string', key: "categoria", filterButton: true},
            {name: 'Amount', type: 'number', totalsRowFunction: 'sum', filterButton: false, style: { numFmt: '"€"#,##0.00;[Red]\-"€"#,##0.00' }},
          ],
          rows: result,
        });
        console.log("ho creato la table")
    
        // fit column width
        worksheet.columns.forEach(function (column, i) {
          //console.log("\n----------------------------------------------------------------\n")
          if ( i !== 2 && i !== 3 ) {
            //console.log("non è nei valori accettati")
            return;
          }
          let maxLength = 0;
          column["eachCell"]({ includeEmpty: true }, function (cell) {
              //console.log("mamaxLength: " + maxLength)
              var columnLength = cell.value ? cell.value.toString().trim().length : 10;
              if (columnLength > maxLength ) {
                  //console.log("new maxLength: " + columnLength)
                  maxLength = columnLength;
              }
          });
          column.width = maxLength < 10 ? 10 : maxLength;
          //console.log("e quindiiiii ===> " + column.width)
        });

        //return workbook.xlsx.write(fs.createWriteStream(outputPath)); // sovrascrive
        return workbook.xlsx.writeFile(outputPath); //crea nuovo file
      })
      .then(() => {
        console.log('Data written to the Excel file successfully.');

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );  
        res.setHeader("Content-Disposition", "attachment; filename=Report.xlsx");
        res.download(outputPath, (err) => {
          if (err) {
            console.error('Errore nel download del file:', err);
            res.status(500).send('Errore nel download del file');
          }
          fs.unlink(outputPath, function(err) {
            if (err)
                throw(err)
            console.log("File deleted...");
          });
        })
      })
      .catch((error) => {
        console.error('Error:', error.message);
      });
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving transactions."
    });
  });
}
