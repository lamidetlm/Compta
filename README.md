# Compta - Receipt Management System

A web application for managing receipts and invoices with automatic OCR processing and Google Drive integration.

## Features

- Upload receipts/invoices (images and PDFs)
- Automatic data extraction using Azure Form Recognizer
- Automatic file renaming based on extracted data
- Google Drive storage with organized folder structure
- Google Sheets integration for expense tracking
- Modern UI with drag & drop functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file with:
```
VITE_AZURE_FORM_RECOGNIZER_KEY=your_key
VITE_AZURE_FORM_RECOGNIZER_ENDPOINT=your_endpoint
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key
```

3. Set up Google credentials:
- Enable Google Drive API and Google Sheets API in Google Cloud Console
- Create OAuth 2.0 credentials
- Download credentials and save as `credentials.json`

4. Run development server:
```bash
npm run dev
```

## Project Structure

```
/src
  /components     # React components
  /services      # API integration services
  /utils         # Helper functions
  /hooks         # Custom React hooks
  /styles        # CSS and Tailwind styles
```

## Technologies Used

- React 18
- Vite
- Azure Form Recognizer
- Google Drive API
- Google Sheets API
- Tailwind CSS
- React Dropzone
