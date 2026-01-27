const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config/env');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

/**
 * Robustly extracts the JSON object from potential AI chatter.
 * It looks for the first '{' and the last '}' and ignores everything outside.
 */
const cleanJSON = (text) => {
  // 1. First, strip markdown code blocks if they exist
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '');

  // 2. Locate the actual JSON object
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');

  // 3. If we found brackets, slice only that part
  if (firstOpen !== -1 && lastClose !== -1) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }

  return cleaned.trim();
};

exports.extractInvoiceData = async (filePath, mimeType) => {
  // 1. Convert File to Base64 (Universal Method for PDF & Images)
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  // 2. Prepare the Prompt with Visual Context
  const promptParts = [
    {
      text: `You are an expert Tally Data Entry Operator. 
      Analyze this invoice visually. Identify the table structure, headers, and values accurately.
      
      Extract the following fields into valid JSON.
      IMPORTANT: Return ONLY the JSON object. Do not add explanations, intro text, or markdown formatting.
      
      JSON Structure:
      {
        "type": "Sales" | "Purchase",
        "invoice_number": "string",
        "invoice_date": "YYYY-MM-DD",
        "supplier": { "name": "string", "gstin": "string or null" },
        "customer": { "name": "string", "gstin": "string or null" },
        "line_items": [
          { "description": "string", "quantity": number, "rate": number, "amount": number }
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

  // 3. Generate Content
  const result = await model.generateContent(promptParts);
  const responseText = result.response.text();

  try {
    // We use the smarter cleaner here
    const cleanedText = cleanJSON(responseText);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("AI Response Text (Failed to Parse):", responseText);
    throw new Error("AI extraction failed to produce valid JSON. Check server logs for raw output.");
  }
};