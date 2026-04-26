import React, { useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { askGenie } from '../api/caremapApi';

const prompts = [
  'Which states have the most high-risk medical desert regions?',
  'Show districts with no trusted dialysis facilities.',
  'Which facilities have high trust scores and trauma care?',
  'Which columns have the worst data quality?',
];

function extractAttachmentText(attachments = []) {
  return attachments
    .map(attachment => attachment.text?.content || attachment.text || attachment.content || '')
    .filter(Boolean)
    .join('\n\n');
}

export default function GenieCopilot() {
  const [question, setQuestion] = useState(prompts[0]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (nextQuestion = question) => {
    setQuestion(nextQuestion);
    setLoading(true);
    setError('');
    setMessages(previous => [...previous, { role: 'user', content: nextQuestion }]);
    try {
      const response = await askGenie(nextQuestion, conversationId);
      setConversationId(response.conversation_id);
      const text = extractAttachmentText(response.attachments) || response.content || 'Genie returned a response without display text.';
      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          content: text,
          status: response.status,
          attachments: response.attachments || [],
          queryResults: response.query_results || [],
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 112px)', padding: 24 }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
        <main className="card" style={{ minHeight: 620, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 18, borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--brand-teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot color="var(--brand-teal)" />
            </div>
            <div>
              <div className="section-label">Genie Analytics Copilot</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Ask questions over governed Databricks tables</h1>
            </div>
          </div>

          <div style={{ flex: 1, padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Ask Genie about facility capabilities, medical deserts, trust scores, contradiction flags, and data quality.
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  background: message.role === 'user' ? 'var(--brand-teal)' : 'var(--bg-primary)',
                  color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                  border: message.role === 'user' ? 'none' : '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 12,
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {message.content}
                {message.attachments?.some(attachment => attachment.query) && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Generated SQL</summary>
                    {message.attachments.filter(attachment => attachment.query).map((attachment, i) => (
                      <pre key={i} style={{ marginTop: 8, overflowX: 'auto', fontSize: 11 }}>
                        {attachment.query?.query || JSON.stringify(attachment.query, null, 2)}
                      </pre>
                    ))}
                  </details>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <input
              value={question}
              onChange={event => setQuestion(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && submit()}
              placeholder="Ask Genie about healthcare access gaps..."
              style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 13px', outline: 'none' }}
            />
            <button className="btn-primary" onClick={() => submit()} disabled={loading}>
              {loading ? <Loader2 size={16} /> : <Send size={16} />}
              Ask
            </button>
          </div>
          {error && <div style={{ padding: '0 14px 14px', color: 'var(--critical)', fontSize: 12 }}>{error}</div>}
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <Sparkles size={22} color="var(--brand-teal)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginTop: 10 }}>Suggested Questions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {prompts.map(prompt => (
                <button key={prompt} className="btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: 12 }} onClick={() => submit(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 16, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Genie uses your configured Databricks Genie Space. It is best for SQL-style analytics, not emergency triage.
          </div>
        </aside>
      </div>
    </div>
  );
}
