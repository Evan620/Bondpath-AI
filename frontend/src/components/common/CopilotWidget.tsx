import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    suggestedActions?: string[];
}

export const CopilotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi! I'm your Bondpath Copilot. I can help you analyze risks, explain policies, or draft emails. How can I assist you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const { userId } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Reset chat when user changes
    useEffect(() => {
        setMessages([
            {
                role: 'assistant',
                content: "Hi! I'm your Bondpath Copilot. I can help you analyze risks, explain policies, or draft emails. How can I assist you today?"
            }
        ]);
        setInput('');
    }, [userId]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Extract case ID from URL if present (e.g., /cases/123 or /advisor/cases/123)
        const pathParts = location.pathname.split('/');
        const caseIdIndex = pathParts.findIndex(p => p === 'cases');
        const caseId = caseIdIndex !== -1 && pathParts[caseIdIndex + 1] ? pathParts[caseIdIndex + 1] : null;

        try {
            const response = await apiClient.post('/chat/message', {
                message: text,
                case_id: caseId,
                page_context: location.pathname
            });

            const botMsg: Message = {
                role: 'assistant',
                content: response.data.response,
                suggestedActions: response.data.suggested_actions
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting to my brain right now. Please try again in a moment."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
        }
    };

    const clearHistory = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Hi! I'm your Bondpath Copilot. I can help you analyze risks, explain policies, or draft emails. How can I assist you today?"
            }
        ]);
    };

    // Hide on login page
    if (location.pathname === '/login') return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className={`mb-4 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col animate-slideUp origin-bottom-right transition-all duration-300 ${isFullscreen
                    ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[700px] max-w-[90vw] max-h-[90vh]'
                    : 'resize overflow-hidden min-w-[320px] min-h-[400px] max-w-[90vw] max-h-[85vh] w-[380px] h-[600px]'
                    }`}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Bondpath Copilot</h3>
                                <div className="text-slate-400 text-xs flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    Online
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearHistory}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                title="Clear History"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                            >
                                {isFullscreen ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                                        <Bot className="w-4 h-4 text-blue-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] space-y-2`}>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-tl-none'
                                        }`}>
                                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-strong:text-inherit prose-a:text-blue-500">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Suggested Actions */}
                                    {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.suggestedActions.map((action, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSendMessage(action)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                                                >
                                                    {action}
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-slate-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                                    <Bot className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about this case..."
                                disabled={loading}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                            />
                            <button
                                onClick={() => handleSendMessage(input)}
                                disabled={!input.trim() || loading}
                                className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 hover:bg-blue-700 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-slate-400">AI can make mistakes. Verify important info.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Float Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${isOpen
                    ? 'bg-slate-800 text-white rotate-90'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}

                {/* Notification Badge (Fake for now to draw attention) */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                )}
            </button>
        </div>
    );
};
