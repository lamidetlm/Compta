import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";

const endpoint = import.meta.env.VITE_AZURE_FORM_RECOGNIZER_ENDPOINT;
const apiKey = import.meta.env.VITE_AZURE_FORM_RECOGNIZER_KEY;

const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

export const analyzeReceipt = async (fileUrl) => {
  try {
    const poller = await client.beginAnalyzeDocument("prebuilt-receipt", fileUrl);
    const { documents } = await poller.pollUntilDone();

    if (!documents || documents.length === 0) {
      throw new Error("No receipt data found");
    }

    const receipt = documents[0];
    return {
      date: receipt.fields.TransactionDate?.content,
      total: receipt.fields.Total?.content,
      merchantName: receipt.fields.MerchantName?.content,
      success: true
    };
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
