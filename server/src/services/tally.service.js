const { create } = require('xmlbuilder2');

exports.generateXML = (data) => {
  // Determine Voucher Type Logic
  const isSales = data.type === 'Sales';
  const vchType = isSales ? 'Sales' : 'Purchase';
  
  // Tally Logic:
  // Sales: Party is Debit (Yes), Income/Inventory is Credit (No)
  // Purchase: Party is Credit (No), Expense/Inventory is Debit (Yes)
  const partyDeemedPositive = isSales ? 'Yes' : 'No';
  const inventoryDeemedPositive = isSales ? 'No' : 'Yes'; // Inventory follows the opposite of party
  
  // Tally often uses negative numbers for Debits or Credits depending on context, 
  // but strictly strictly respecting ISDEEMEDPOSITIVE is usually enough for imports.
  // However, specifically for Inventory Amounts, Tally XML often expects negative values 
  // if it's an "outward" or specific flow. We will stick to the visual standard: 
  // Purchase amounts often appear negative in XML exports.
  const signMultiplier = -1; // Flattening amount to match typical XML exports if needed, or keep 1.
                             // Let's use absolute values and rely on ISDEEMEDPOSITIVE for mapping.

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ENVELOPE')
      .ele('HEADER')
        .ele('TALLYREQUEST').txt('Import Data').up()
      .up()
      .ele('BODY')
        .ele('IMPORTDATA')
          .ele('REQUESTDESC')
            .ele('REPORTNAME').txt('Vouchers').up()
            .ele('STATICVARIABLES')
               .ele('SVCURRENTCOMPANY').txt(data.customer?.name || 'My Company').up()
            .up()
          .up()
          .ele('REQUESTDATA')
            .ele('TALLYMESSAGE', { 'xmlns:UDF': 'TallyUDF' })
              .ele('VOUCHER', { VCHTYPE: vchType, ACTION: 'Create', OBJVIEW: 'Invoice Voucher View' })
                
                // --- 1. Basic Header ---
                .ele('DATE').txt(data.invoice_date?.replace(/-/g, '') || '20240101').up()
                .ele('VOUCHERTYPENAME').txt(vchType).up()
                .ele('VOUCHERNUMBER').txt(data.invoice_number || '1').up()
                .ele('REFERENCE').txt(data.invoice_number || '1').up()
                .ele('PARTYLEDGERNAME').txt(data.supplier?.name || 'Cash').up()
                .ele('PERSISTEDVIEW').txt('Invoice Voucher View').up()
                
                // --- 2. Party Ledger Entry (Top Level) ---
                .ele('LEDGERENTRIES.LIST')
                  .ele('LEDGERNAME').txt(data.supplier?.name || 'Cash').up()
                  .ele('ISDEEMEDPOSITIVE').txt(partyDeemedPositive).up()
                  .ele('LEDGERFROMITEM').txt('No').up()
                  .ele('REMOVEZEROENTRIES').txt('No').up()
                  .ele('ISPARTYLEDGER').txt('Yes').up()
                  .ele('AMOUNT').txt(data.total_amount * (isSales ? -1 : 1)).up() // Party Amount
                .up();

                // --- 3. Detailed Inventory Loop ---
                data.line_items.forEach(item => {
                  const qtyString = `${item.quantity} ${item.unit || 'Nos'}`;
                  const amount = item.amount; 
                  // In Tally XML, Purchase Inventory amounts are often negative
                  const xmlAmount = isSales ? amount : -amount; 

                  const invEntry = root.ele('ALLINVENTORYENTRIES.LIST');
                  
                  // Item Basic Details
                  invEntry.ele('STOCKITEMNAME').txt(item.description).up();
                  invEntry.ele('ISDEEMEDPOSITIVE').txt(inventoryDeemedPositive).up();
                  invEntry.ele('ISLASTDEEMEDPOSITIVE').txt(inventoryDeemedPositive).up();
                  invEntry.ele('ISAUTONEGATIVE').txt('No').up();
                  invEntry.ele('RATE').txt(`${item.rate}/${item.unit || 'Nos'}`).up();
                  invEntry.ele('ACTUALQTY').txt(qtyString).up();
                  invEntry.ele('BILLEDQTY').txt(qtyString).up();
                  invEntry.ele('AMOUNT').txt(xmlAmount).up();

                  // --- THE CRITICAL PART: ACCOUNTING ALLOCATIONS ---
                  // This maps the item to the General Ledger (e.g. Purchase @ 18%)
                  const accAlloc = invEntry.ele('ACCOUNTINGALLOCATIONS.LIST');
                  accAlloc.ele('LEDGERNAME').txt(item.tally_ledger || (isSales ? 'Sales Account' : 'Purchase Account')).up();
                  accAlloc.ele('ISDEEMEDPOSITIVE').txt(inventoryDeemedPositive).up();
                  accAlloc.ele('LEDGERFROMITEM').txt('No').up();
                  accAlloc.ele('REMOVEZEROENTRIES').txt('No').up();
                  accAlloc.ele('ISPARTYLEDGER').txt('No').up();
                  accAlloc.ele('AMOUNT').txt(xmlAmount).up(); // Matches item amount
                  accAlloc.up(); // End Allocation

                  invEntry.up(); // End Inventory Entry
                });

                // --- 4. Tax Ledger Entries (CGST/SGST/IGST) ---
                const taxes = data.tax_details || {};
                
                if (taxes.cgst > 0) addTaxEntry(root, 'CGST', taxes.cgst, inventoryDeemedPositive, isSales);
                if (taxes.sgst > 0) addTaxEntry(root, 'SGST', taxes.sgst, inventoryDeemedPositive, isSales);
                if (taxes.igst > 0) addTaxEntry(root, 'IGST', taxes.igst, inventoryDeemedPositive, isSales);

              root.up() // End VOUCHER
            .up() // End TALLYMESSAGE
          .up() // End REQUESTDATA
        .up() // End IMPORTDATA
      .up() // End BODY
    .up(); // End ENVELOPE

  return root.end({ prettyPrint: true });
};

// Helper for Tax Ledgers
function addTaxEntry(root, ledgerName, amount, isDeemedPositive, isSales) {
  // Tax entries are usually part of the Ledger Entries list, but outside inventory
  // In pure Item Invoice mode, they are separate LEDGERENTRIES.LIST
  const xmlAmount = isSales ? -amount : amount; // Credit for Sales, Debit for Purchase? 
  // Actually taxes follow the same nature as the Sales/Purchase ledger usually.
  // Sales (Credit) -> Output Tax (Credit)
  // Purchase (Debit) -> Input Tax (Debit)
  
  const taxAmount = isSales ? amount : -amount; // Matching the Inventory logic

  root.ele('LEDGERENTRIES.LIST')
    .ele('LEDGERNAME').txt(ledgerName).up()
    .ele('ISDEEMEDPOSITIVE').txt(isDeemedPositive).up()
    .ele('LEDGERFROMITEM').txt('No').up()
    .ele('REMOVEZEROENTRIES').txt('No').up()
    .ele('ISPARTYLEDGER').txt('No').up()
    .ele('AMOUNT').txt(taxAmount).up()
  .up();
}