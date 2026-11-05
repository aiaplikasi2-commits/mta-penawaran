import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import type { PurchaseOrderData, PoChatMessage } from '../../types/po.ts';

interface PoAiChatProps {
  poData: Partial<PurchaseOrderData>;
}

export const PoAiChat: React.FC<PoAiChatProps> = ({ poData }) => {
  const [messages, setMessages] = useState<PoChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Halo! Saya asisten AI untuk dokumen PO ${poData.nomorPo || 'ini'}. Anda dapat bertanya mengenai nomor PO, rincian barang, total harga, termin pembayaran, atau syarat pengiriman baik melalui ketikan maupun suara.`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoVoiceReply, setAutoVoiceReply] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdown asterisks or special formatting for clean speech
      const cleanText = text.replace(/[*#_`]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith('id') || v.name.includes('Indonesia'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Perangkat atau browser ini belum mendukung input suara langsung. Silakan gunakan ketik teks.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          // Auto submit spoken question
          sendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputText).trim();
    if (!question || isLoading) return;

    setInputText('');

    const userMsg: PoChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/po/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          poData,
          chatHistory: newHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const data = await response.json();
      const replyText = data.reply || 'Maaf, saya tidak dapat menemukan informasi tersebut di dokumen PO.';

      const assistantMsg: PoChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (autoVoiceReply) {
        speakText(replyText);
      }
    } catch (err: any) {
      console.error('PO chat error:', err);
      const errorMsg: PoChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Maaf, terjadi kendala saat memproses pertanyaan Anda. Silakan coba sesaat lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Berapa total nilai PO ini?',
    'Kapan batas pengiriman barang?',
    'Apa saja item yang dipesan?',
    'Bagaimana syarat pembayarannya?',
  ];

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs">
            <Bot className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold flex items-center gap-1.5">
              <span>Asisten Tanya Jawab PO (AI)</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-yellow-400 text-blue-950 font-bold rounded">
                Suara & Teks
              </span>
            </h4>
            <p className="text-[11px] text-blue-100 line-clamp-1">
              {poData.nomorPo ? `Nomor PO: ${poData.nomorPo}` : 'Berdasarkan dokumen yang diunggah'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Audio speech toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setAutoVoiceReply(!autoVoiceReply);
            }}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
              autoVoiceReply
                ? 'bg-blue-600/80 text-white hover:bg-blue-600'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
            title={autoVoiceReply ? 'Suara AI aktif (Klik untuk mute)' : 'Aktifkan suara balasan AI'}
          >
            {autoVoiceReply ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/70">
        {messages.map((m) => {
          const isAi = m.role === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm shadow-xs ${
                  isAi
                    ? 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs'
                    : 'bg-blue-600 text-white rounded-tr-xs'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <div
                  className={`mt-1 flex items-center justify-between text-[10px] ${
                    isAi ? 'text-gray-400' : 'text-blue-200'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {isAi && (
                    <button
                      type="button"
                      onClick={() => speakText(m.text)}
                      className="ml-2 hover:text-blue-600 transition"
                      title="Dengarkan suara"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {!isAi && (
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-white border border-blue-100 p-2.5 rounded-xl w-fit shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>AI sedang membaca isi dokumen PO...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-semibold text-gray-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Saran:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage(q)}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-full whitespace-nowrap transition border border-gray-200 shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
        {/* Mic button */}
        <button
          type="button"
          onClick={handleToggleVoiceInput}
          className={`p-2.5 rounded-xl border transition active:scale-95 flex items-center justify-center ${
            isListening
              ? 'bg-red-600 text-white border-red-700 animate-pulse'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
          }`}
          title={isListening ? 'Mendengarkan... Klik untuk berhenti' : 'Bicara lewat suara'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-blue-600" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={isListening ? 'Mendengarkan suara Anda...' : 'Ketik pertanyaan atau klik mikrofon...'}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />

        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition active:scale-95"
          title="Kirim pertanyaan"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
