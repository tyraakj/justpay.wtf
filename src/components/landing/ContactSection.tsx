'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';

export function ContactSection() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:support@justpay.wtf?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-24 relative z-20">
      <div className="flex flex-col gap-8 items-center text-center">
        <div className="flex flex-col gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-4xl font-extrabold text-foreground">Technical Issues?</h2>
          <p className="text-lg text-zinc-400">
            If you're experiencing issues with a payment, routing, or bridge transaction, send us a message and we'll help sort it out immediately.
          </p>
        </div>

        <form onSubmit={handleContact} className="w-full glass-card p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-left">
            <label className="form-label">Issue Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Transaction stuck on bridge" 
              className="input-field"
              required
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label className="form-label">Message Details</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please include any relevant transaction hashes or payment link IDs..." 
              className="input-field min-h-[150px] resize-y"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 text-foreground font-bold py-4 px-6 rounded-[1.5rem] transition-all shadow-[0_4px_20px_rgba(236,72,153,0.3)] mt-2"
          >
            <Send className="w-5 h-5" />
            Send to Support
          </button>
          
          <p className="text-xs text-zinc-500 mt-2 flex items-center justify-center gap-1.5">
            <Mail className="w-3 h-3" /> This will open your default email client.
          </p>
        </form>
      </div>
    </div>
  );
}
