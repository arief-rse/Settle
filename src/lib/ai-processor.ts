// Simple AI Processor Implementation using DeepSeek API

import { decrementRequestCount, getUserRequestCount, getOrCreateUserUUID, createInitialRequestCount } from "./supabase";
import { DEEPSEEK_API_URL, DEEPSEEK_API_KEY } from './api-config';

// Constants
const FREE_REQUEST_LIMIT = 5;

/**
 * Process the extracted text and return an analysis
 * @param text The text to analyze
 * @returns A promise that resolves to the analysis result
 */
export const processExtractedText = async (text: string): Promise<string> => {
  try {
    // Check if text is empty or too short
    if (!text || text.trim().length < 10) {
      return "The selected text is too short for analysis. Please select more text.";
    }

    // Get current user
    const user = await getCurrentUser();
    
    // Log the API key (first few characters) for debugging
    console.log(`Using DeepSeek API key: ${DEEPSEEK_API_KEY.substring(0, 5)}...`);
    console.log(`Using DeepSeek API URL: ${DEEPSEEK_API_URL}`);

    // Check if user has remaining requests (only if logged in)
    if (user && user.email) {
      try {
        const hasRemainingRequests = await checkRemainingRequests(user.email);
        if (!hasRemainingRequests) {
          throw new Error("You have used all your 5 free requests. Please subscribe for unlimited access.");
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("subscribe")) {
          throw error; // Re-throw subscription-related errors
        }
        console.warn("Error checking remaining requests:", error);
        // Continue with the request even if there's an error checking the count
      }
    }

    // Prepare the API request
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps analyze text. Provide a concise, helpful analysis of the user's text, including key points, tone, and suggestions for improvement. Format your response in markdown.`
          },
          {
            role: "user",
            content: `Please analyze the following text:\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} - ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${JSON.stringify(errorData)}`;
        console.error("DeepSeek API error:", errorData);
      } catch (e) {
        const errorText = await response.text();
        errorMessage += ` - ${errorText}`;
        console.error("DeepSeek API error text:", errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    // Decrement the user's request count in Supabase if logged in
    if (user && user.email) {
      try {
        await decrementRequestCount(user.email);
        console.log("User request count decremented successfully");
      } catch (error) {
        console.error("Error decrementing request count:", error);
        // Continue with the response even if decrementing fails
      }
    } else {
      console.log("User not authenticated, analysis saved only to localStorage");
    }

    return result;
  } catch (error) {
    console.error("Text processing error:", error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
  }
};

// Function to get the current user from Chrome storage
const getCurrentUser = async (): Promise<{ email: string } | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['user'], (result) => {
      if (result.user) {
        resolve(result.user);
      } else {
        resolve(null);
      }
    });
  });
};

// Check if the user has requests remaining using Supabase
export const checkRemainingRequests = async (email: string): Promise<boolean> => {
  try {
    // Get the current request count
    let count = await getUserRequestCount(email);
    
    // If no count record exists, create one with the initial free requests
    if (!count) {
      console.log('No request count record found, creating initial record');
      const userUUID = await getOrCreateUserUUID(email);
      await createInitialRequestCount(userUUID);
      return true; // Allow the first request
    }
    
    // Check if the user has remaining requests
    return count.requests_remaining > 0;
  } catch (error) {
    console.error('Error checking remaining requests:', error);
    // In case of error, allow the request to proceed
    return true;
  }
};
