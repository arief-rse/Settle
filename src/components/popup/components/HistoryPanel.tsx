import { useState, useEffect } from "react";
import { Clock, Trash2, X, Minimize2, AlertCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { auth } from '../../../lib/firebase';
import { getFirestore, collection, query, orderBy, getDocs, deleteDoc, where, addDoc } from 'firebase/firestore';

interface AnalysisHistory {
  id: string;
  text: string;
  response: string;
  source: string;
  imageData?: string;
  query: string;
  timestamp: string;
  userId: string;
}

// Utility function to save history
export const saveToHistory = async (data: {
  text: string;
  response: string;
  source: string;
  imageData?: string;
  query: string;
}) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in');
      return;
    }

    const db = getFirestore();
    const historyRef = collection(db, 'history');
    
    await addDoc(historyRef, {
      ...data,
      userId: user.uid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving to history:', error);
    throw error;
  }
};

interface HistoryPanelProps {
  onClose: () => void;
}

const HistoryPanel = ({ onClose }: HistoryPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const user = auth.currentUser;
      if (!user) {
        setHistory([]);
        return;
      }

      const historyRef = collection(db, 'history');
      const q = query(
        historyRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalysisHistory[];
      
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      setError(null);
      const user = auth.currentUser;
      if (!user) return;

      const historyRef = collection(db, 'history');
      const q = query(historyRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      setError('Failed to clear history. Please try again.');
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-8 left-8 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 z-[2147483647]"
      >
        <Clock className="w-6 h-6 text-indigo-600" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-white/95 shadow-lg p-4 overflow-hidden z-[2147483646]">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-indigo-600" />
            Analysis History
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-red-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchHistory}
              className="mt-4 text-indigo-600"
            >
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Clock className="h-8 w-8 mb-2 animate-spin" />
            <p>Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Clock className="h-8 w-8 mb-2" />
            <p>No analysis history yet</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearHistory} 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 mb-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {item.source}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-2">{item.query}</p>
                  <p className="text-sm text-gray-600 mb-2">{item.text}</p>
                  <p className="text-sm text-gray-800">{item.response}</p>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;