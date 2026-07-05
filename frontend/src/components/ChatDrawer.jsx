import { Bot, X } from 'lucide-react';
import { supabase } from './supabaseClient';

const {
  data: { session },
} = await supabase.auth.getSession();

const token = session?.access_token;

function ChatDrawer({ isOpen, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Slide-Out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ borderLeft: "1px solid #e2e8f0" }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Bilingual AI Career Co-Pilot</p>
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                EN / HI · Live Session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Iframe Body — replace with your actual Streamlit URL */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`https://jobseek-chatbot-45v4kguaiqkkjj6kjqty7w.streamlit.app/?embed=true&token=${encodeURIComponent(token)}`}
            title="Bilingual AI Career Co-Pilot"
            className="w-full h-full border-none"
            allow="microphone; camera"
          />
        </div>
      </div>
    </>
  );
}

export default ChatDrawer;