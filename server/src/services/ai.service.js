const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config/env');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

const cleanJSON = (text) => {
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose !== -1) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  return cleaned.trim();
};

exports.extractInvoiceData = async (filePath, mimeType) => {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  const promptParts = [
    {
      text: `You are an expert Tally Data Entry Operator. 
      Analyze this invoice visually. Identify the table structure, headers, and values accurately.
      
      Extract the data into this strict JSON structure.
      
      CRITICAL TALLY REQUIREMENTS:
      1. Map every line item to a specific Tally Ledger Name based on its tax rate (e.g., "Purchase @ 18%", "Sales @ 12%", "Exempt Sales").
      2. Identify the Unit of Measurement (UOM) for quantity (e.g., "Nos", "Pcs", "Kgs", "Box"). Default to "Nos" if unclear.
      
      JSON Structure:
      {
        "type": "Sales" | "Purchase" | "Credit Note" | "Debit Note",
        "invoice_number": "string",
        "invoice_date": "YYYY-MM-DD",
        "supplier": { "name": "string", "gstin": "string or null" },
        "customer": { "name": "string", "gstin": "string or null" },
        "line_items": [
          { 
            "description": "string", 
            "quantity": number, 
            "unit": "string (e.g. Nos, Pcs)", 
            "rate": number, 
            "amount": number, 
            "tally_ledger": "string (e.g. Purchase @ 18%)" 
          }
        ],
        "tax_details": { "cgst": number, "sgst": number, "igst": number, "total_tax": number },
        "total_amount": number
      }`
    },
    {
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    }
  ];

  const result = await model.generateContent(promptParts);
  const responseText = result.response.text();

  try {
    return JSON.parse(cleanJSON(responseText));
  } catch (error) {
    console.error("AI Response Text (Failed to Parse):", responseText);
    throw new Error("AI extraction failed to produce valid JSON.");
  }
};