import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatGemini } from '../lib/gemini';
import { useStore } from '../lib/store';
import { Send, FileText, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import FileUploadModal from './FileUploadModal';

export default function AITutor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello. I am your AI Tutor. Ask me anything, or upload a document to base my answers on specific material.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState('');
  const [contextName, setContextName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const addAiTutorSession = useStore(state => state.addAiTutorSession);
  const [sessionStarted, setSessionStarted] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!sessionStarted) {
      addAiTutorSession(contextName || 'General Help');
      setSessionStarted(true);
    }

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const history = messages.slice(1).map(m => ({
      role: m.role,
      content: m.content
    }));

    const responseText = await chatGemini(userMessage.content, history, context);
    
    setMessages([...newMessages, { role: 'assistant', content: responseText }]);
    setIsLoading(false);
  };

  const handleContextExtracted = (text, fileName) => {
    setContext(text);
    setContextName(fileName);
    setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I have successfully processed **${fileName}**. You can now ask me questions about it.` 
    }]);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full max-h-[calc(100vh-80px)] pb-4">
      <div className="flex justify-between items-end mb-8 border-b border-bg-tertiary pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-text-primary flex items-center gap-3">
            AI Tutor 
            {context ? (
                <span className="flex items-center gap-1.5 text-success text-xs px-2.5 py-1 bg-success/10 rounded-pill font-semibold uppercase tracking-wider">
                    <FileText size={12} strokeWidth={2.5} /> {contextName}
                </span>
            ) : (
                <span className="flex items-center gap-1.5 text-text-secondary text-xs px-2.5 py-1 bg-bg-tertiary rounded-pill font-semibold uppercase tracking-wider border border-bg-tertiary">
                    <Sparkles size={12} strokeWidth={2.5} /> General Knowledge
                </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-2">Chat naturally with the tutor, or provide custom reference material.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
          <FileText size={16} className="mr-2 text-text-primary" />
          {context ? 'Change Context' : 'Set Context'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar p-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
              m.role === 'user' 
                ? 'bg-text-primary border-text-primary text-white' 
                : 'bg-bg-secondary border-bg-tertiary text-text-primary'
            }`}>
              {m.role === 'user' ? <User size={16} strokeWidth={2.5} /> : <Bot size={16} strokeWidth={2.5} />}
            </div>
            
            <div className={`max-w-[75%] px-5 py-4 shadow-sm ${
              m.role === 'user' 
                ? 'bg-text-primary text-white rounded-2xl rounded-tr-sm' 
                : 'bg-bg-secondary border border-bg-tertiary text-text-primary rounded-2xl rounded-tl-sm'
            }`}>
              <ReactMarkdown 
                className={`prose max-w-none text-sm ${m.role === 'user' ? 'text-white' : 'text-text-primary'} prose-p:leading-relaxed prose-pre:bg-bg/50 prose-pre:text-text-primary prose-pre:border prose-pre:border-bg-tertiary prose-headings:font-serif`}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 flex-row">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border bg-bg-secondary border-bg-tertiary text-text-primary">
              <Bot size={16} strokeWidth={2.5} />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-bg-secondary border border-bg-tertiary text-text-primary rounded-tl-sm flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-text-tertiary" />
              <em className="text-sm text-text-tertiary font-serif italic">Crafting response...</em>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-6 pt-4 border-t border-bg-tertiary">
        <div className="flex gap-3 relative">
          <Input 
            className="flex-1 bg-bg-secondary border-bg-tertiary pr-12 focus-visible:ring-text-primary focus-visible:ring-offset-bg shadow-sm" 
            placeholder="Type your question..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="absolute right-1 top-1 bottom-1 h-8 w-8 rounded-sm">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </div>

      <FileUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onContextExtracted={handleContextExtracted} 
      />
    </div>
  );
}
