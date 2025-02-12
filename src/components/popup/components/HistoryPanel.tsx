import { useState, useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';

interface HistoryItem {
  text: string;
  response: {
    text: string;
    generatedImage?: string;
  };
  source: 'text' | 'image' | 'both';
  imageData?: string;
  query: string;
  timestamp: string;
}

interface HistoryPanelProps {
  onClose: () => void;
}

const HistoryPanel = ({ onClose }: HistoryPanelProps) => {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      setAuthError(null);
      if (currentUser) {
        const savedHistory = localStorage.getItem("analysisHistory");
        setHistory(savedHistory ? JSON.parse(savedHistory) : []);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google Sign-in Error:', error);
      setAuthError(
        error.code === 'auth/popup-blocked' 
          ? 'Please allow popups for authentication'
          : 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    localStorage.setItem("analysisHistory", "[]");
    setHistory([]);
    onClose();
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <p className="text-center mb-4">Please sign in to view your analysis history</p>
        {authError && (
          <p className="text-red-500 text-sm text-center mb-4">{authError}</p>
        )}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white text-gray-700 border hover:bg-gray-50"
        >
          <img src="/google.svg" alt="Google" className="w-4 h-4" />
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
          <Clock className="h-8 w-8 mb-2" />
          <p>No analysis history yet</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearHistory} 
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </div>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      {item.source}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-2">Q: {item.query}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">A: {item.response.text}</p>
                  {item.response.generatedImage && (
                    <img 
                      src={item.response.generatedImage} 
                      alt="Generated visualization"
                      className="mt-2 rounded-lg w-full h-auto"
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};

export default HistoryPanel;