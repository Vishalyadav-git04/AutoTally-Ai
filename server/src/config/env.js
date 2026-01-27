require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  // Change this to the model that worked for you (e.g., 'gemini-1.5-flash' or 'gemini-pro')
  GEMINI_MODEL: 'gemini-flash-latest', 
};