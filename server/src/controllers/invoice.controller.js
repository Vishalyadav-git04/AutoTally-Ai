const fs = require('fs');
const aiService = require('../services/ai.service');
const tallyService = require('../services/tally.service');
const { z } = require('zod');

// Schema for basic validation
const InvoiceSchema = z.object({
  invoice_number: z.string().nullable(),
  total_amount: z.number().nullable(),
});

exports.processInvoice = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // 1. Visual Extraction (Base64 -> Gemini)
    const extractedData = await aiService.extractInvoiceData(req.file.path, req.file.mimetype);

    // 2. Validation
    const validation = InvoiceSchema.safeParse(extractedData);

    // 3. Generate Tally XML
    const xmlData = tallyService.generateXML(extractedData);

    // 4. Cleanup
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    // 5. Response with BOTH JSON and XML
    res.json({
      success: true,
      data: extractedData,        // <--- The JSON Object
      tally_xml: xmlData,         // <--- The XML String
      validation_errors: validation.success ? [] : validation.error.issues
    });

  } catch (error) {
    console.error("Error:", error);
    if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ error: error.message });
  }
};