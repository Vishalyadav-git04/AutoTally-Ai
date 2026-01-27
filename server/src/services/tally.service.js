const { create } = require('xmlbuilder2');

exports.generateXML = (data) => {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ENVELOPE')
      .ele('HEADER')
        .ele('TALLYREQUEST').txt('Import Data').up()
      .up()
      .ele('BODY')
        .ele('IMPORTDATA')
          .ele('REQUESTDESC')
            .ele('REPORTNAME').txt('Vouchers').up()
          .up()
          .ele('REQUESTDATA')
            .ele('TALLYMESSAGE')
              .ele('VOUCHER', { 
                VCHTYPE: data.type === 'Sales' ? 'Sales' : 'Purchase', 
                ACTION: 'Create' 
              })
                .ele('DATE').txt(data.invoice_date?.replace(/-/g, '') || '20260101').up()
                .ele('VOUCHERNUMBER').txt(data.invoice_number || 'Unknown').up()
                .ele('PARTYLEDGERNAME').txt(data.supplier?.name || 'Cash').up()
                .ele('NARRATION').txt('Imported via AutoTally AI').up()
                
                // Add Line Item Logic Here if needed for full inventory support
                
              .up() // End VOUCHER
            .up() // End TALLYMESSAGE
          .up() // End REQUESTDATA
        .up() // End IMPORTDATA
      .up() // End BODY
    .up(); // End ENVELOPE

  return root.end({ prettyPrint: true });
};