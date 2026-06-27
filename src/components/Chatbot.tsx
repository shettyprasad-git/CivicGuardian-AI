import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const Chatbot = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hi! I am CivicGuardian AI. How can I help you track issues or understand civic responsibilities today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create chat history format for Gemini
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Sorry, I am having trouble connecting to the server. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[calc(100vh-6rem)] bg-white border-4 border-[#000000] rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 overflow-hidden"
    >
      <div className="bg-[#4D96FF] border-b-4 border-[#000000] p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-white">
          <Bot size={24} />
          <h3 className="font-black text-lg text-[#000000]">CivicGuardian Chat</h3>
        </div>
        <button onClick={onClose} className="text-[#000000] hover:scale-110 transition-transform bg-white border-2 border-[#000000] rounded-full p-1">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#000000] flex items-center justify-center ${msg.role === 'user' ? 'bg-[#FFD93D]' : 'bg-white'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 border-2 border-[#000000] rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-white rounded-tr-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-[#E2E8F0] rounded-tl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#000000] flex items-center justify-center bg-white">
                <Bot size={16} />
              </div>
              <div className="p-3 border-2 border-[#000000] rounded-xl text-sm bg-[#E2E8F0] rounded-tl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex space-x-1">
                <div className="w-2 h-2 bg-[#000000] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#000000] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[#000000] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t-4 border-[#000000] bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about a civic issue..."
            className="flex-1 p-3 border-2 border-[#000000] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D96FF] bg-[#F8FAFC]"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-[#6BCB77] text-[#000000] border-2 border-[#000000] rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
