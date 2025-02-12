import { useState, useEffect } from "react";
import { X, MessageCircle, Image as ImageIcon, Send } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { processExtractedText } from "../../../lib/ai-processor";
import { Loader2 } from "lucide-react";
import { auth, db, UserData } from '../../../lib/firebase';
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface ResponsePanelProps {
  extractedText: string;
  onClose: () => void;
  onHistory: () => void;
  source: 'text' | 'image' | 'both';
  imageData?: string;
  userData: UserData;
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({
  extractedText,
  onClose,
  onHistory,
  source,
  imageData,
  userData
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ text: string; generatedImage?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (doc: DocumentSnapshot) => {
          const data = doc.data() as UserData;
          console.log('User data:', data);
        }, (error: Error) => {
          console.error('Error fetching user data:', error);
          setError('Error fetching user data. Please try signing in again.');
        });
        return () => unsubscribeDoc();
      } else {
        console.log('No user authenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError('Please enter a question about the selected content');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found. Please set VITE_ANTHROPIC_API_KEY in your environment.');
      }
      
      const result = await processExtractedText({ 
        text: extractedText, 
        source,
        imageData,
        query: query.trim()
      }, apiKey, userData);
      setResponse(result);

      // Save to history
      const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
      history.unshift({
        text: extractedText,
        response: result,
        source,
        imageData,
        query: query.trim(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("analysisHistory", JSON.stringify(history.slice(0, 50))); // Keep last 50 items
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze content");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-8 right-8 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 z-[2147483647]"
      >
        <MessageCircle className="w-6 h-6 text-indigo-600" />
      </button>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          {source === 'image' || source === 'both' ? (
            <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <MessageCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
          <h3 className="text-lg font-semibold dark:text-gray-100">AI Analysis</h3>
         
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
           
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {(source === 'image' || source === 'both') && imageData && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600">Selected Image</h4>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-50">
              <img 
                src={imageData} 
                alt="Selected content"
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        )}

        {extractedText && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600">
              {source === 'image' ? 'OCR Text' : source === 'both' ? 'Combined Text' : 'Selected Text'}
            </h4>
            <div className="min-h-[100px] p-4 bg-white border rounded-lg text-sm text-gray-700 shadow-inner">
              {extractedText}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Ask a Question</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Ask anything about the selected content..."
              className="flex-1 px-4 py-2 border dark:border-gray-800 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {response && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Analysis</h4>
              <Button variant="ghost" size="sm" onClick={onHistory}>
                View History
              </Button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white whitespace-pre-wrap shadow-sm">
                {response.text}
              </div>
              {response.generatedImage && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Generated Visualization</h4>
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <img 
                      src={response.generatedImage} 
                      alt="AI-generated visualization"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsePanel;