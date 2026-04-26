import React, { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', greeting: 'Hello! I am CareBot 🙏', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', greeting: 'नमस्ते! मैं CareBot हूँ 🙏', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', greeting: 'नमस्कार! मी CareBot आहे 🙏', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', greeting: 'வணக்கம்! நான் CareBot 🙏', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', greeting: 'నమస్కారం! నేను CareBot 🙏', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', greeting: 'নমস্কার! আমি CareBot 🙏', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', greeting: 'નમસ્તે! હું CareBot છું 🙏', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ! ನಾನು CareBot 🙏', flag: '🇮🇳' },
];

const symptomFlow = {
  en: {
    welcome: "Hello! I am CareBot 🙏\n\nI'm here to help you find the right medical care. I'll ask you a few questions about your symptoms.\n\n⚠️ I do not diagnose. I help you find verified facilities.",
    askSymptom: "What is your main concern today?",
    askAge: "What is your age group?",
    askLocation: "Please share your location or PIN code so I can find nearby verified facilities.",
    askDuration: "How long have you had this symptom?",
    options: {
      symptoms: ['Stomach / Abdominal Pain', 'Chest Pain or Tightness', 'High Fever', 'Difficulty Breathing', 'Head Injury / Trauma', 'Pregnancy / Delivery', 'Child is unwell', 'Other'],
      age: ['Child (0–12)', 'Teen (13–17)', 'Adult (18–60)', 'Senior (60+)'],
      duration: ['Just started (< 1 hour)', 'Few hours (1–6 hrs)', 'Since yesterday', 'More than 2 days'],
    }
  },
  hi: {
    welcome: "नमस्ते! मैं CareBot हूँ 🙏\n\nमैं आपको सही चिकित्सा सेवा खोजने में मदद करूँगा।\n\n⚠️ मैं बीमारी का निदान नहीं करता। मैं सत्यापित अस्पताल खोजने में मदद करता हूँ।",
    askSymptom: "आज आपकी मुख्य समस्या क्या है?",
    askAge: "आपकी आयु वर्ग क्या है?",
    askLocation: "कृपया अपना स्थान या PIN कोड साझा करें।",
    askDuration: "यह लक्षण कब से है?",
    options: {
      symptoms: ['पेट दर्द', 'सीने में दर्द', 'तेज बुखार', 'सांस लेने में कठिनाई', 'सिर की चोट', 'प्रसव / डिलीवरी', 'बच्चा बीमार है', 'अन्य'],
      age: ['बच्चा (0–12)', 'किशोर (13–17)', 'वयस्क (18–60)', 'बुजुर्ग (60+)'],
      duration: ['अभी शुरू हुआ', 'कुछ घंटे', 'कल से', '2 दिन से ज्यादा'],
    }
  },
  mr: {
    welcome: "नमस्कार! मी CareBot आहे 🙏\n\nमी तुम्हाला योग्य वैद्यकीय सेवा शोधण्यास मदत करेन।\n\n⚠️ मी निदान करत नाही. मी सत्यापित रुग्णालये शोधतो.",
    askSymptom: "आज तुमची मुख्य तक्रार काय आहे?",
    askAge: "तुमचा वयोगट काय आहे?",
    askLocation: "कृपया तुमचे स्थान किंवा PIN कोड सांगा.",
    askDuration: "हे लक्षण किती दिवसांपासून आहे?",
    options: {
      symptoms: ['पोटदुखी', 'छातीत दुखणे', 'तेज ताप', 'श्वास घेण्यास त्रास', 'डोक्याला दुखापत', 'प्रसूती', 'मूल आजारी आहे', 'इतर'],
      age: ['मूल (0–12)', 'किशोर (13–17)', 'प्रौढ (18–60)', 'ज्येष्ठ (60+)'],
      duration: ['आत्ताच सुरू झाले', 'काही तास', 'काल पासून', '2 दिवसांपेक्षा जास्त'],
    }
  },
  ta: {
    welcome: "வணக்கம்! நான் CareBot 🙏\n\nசரியான மருத்துவ சேவை கண்டுபிடிக்க உதவுகிறேன்.\n\n⚠️ நான் நோய் கண்டறிவதில்லை. சரிபார்க்கப்பட்ட மருத்துவமனைகள் கண்டுபிடிக்க உதவுகிறேன்.",
    askSymptom: "இன்று உங்கள் முக்கிய பிரச்சனை என்ன?",
    askAge: "உங்கள் வயது பிரிவு என்ன?",
    askLocation: "உங்கள் இருப்பிடம் அல்லது PIN குறியீடு தயவுசெய்து பகிரவும்.",
    askDuration: "இந்த அறிகுறி எவ்வளவு காலமாக உள்ளது?",
    options: {
      symptoms: ['வயிற்று வலி', 'மார்பு வலி', 'அதிக காய்ச்சல்', 'மூச்சு விடுவதில் சிரமம்', 'தலை காயம்', 'பிரசவம்', 'குழந்தை நோய்வாய்ப்பட்டுள்ளது', 'மற்றவை'],
      age: ['குழந்தை (0–12)', 'இளைஞர் (13–17)', 'பெரியவர் (18–60)', 'முதியவர் (60+)'],
      duration: ['இப்போது தொடங்கியது', 'சில மணி நேரம்', 'நேற்று முதல்', '2 நாட்களுக்கும் மேல்'],
    }
  },
};

const urgencyMap = {
  'Chest Pain or Tightness': 'CRITICAL',
  'சீனை வலி': 'CRITICAL',
  'Difficulty Breathing': 'CRITICAL',
  'Head Injury / Trauma': 'HIGH',
  'Stomach / Abdominal Pain': 'HIGH',
  'High Fever': 'MEDIUM',
  'Pregnancy / Delivery': 'HIGH',
  'Child is unwell': 'HIGH',
  'Other': 'MEDIUM',
};

const facilitySuggestions = [
  { name: 'District Hospital Gopalganj', distance: '31km', trust: 87, status: 'verified', missing: 'Anesthesiologist' },
  { name: 'AIIMS Patna', distance: '134km', trust: 96, status: 'verified', missing: null },
  { name: 'City Care Hospital', distance: '14km', trust: 79, status: 'partial', missing: 'Neonatal Care' },
];

export default function PatientNavigator() {
  const [selectedLang, setSelectedLang] = useState(null);
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('language');
  const [userInputs, setUserInputs] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getLang = () => symptomFlow[selectedLang?.code] || symptomFlow['en'];

  const addBotMessage = (text, options = null, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'bot', text, options }]);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
  };

  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    setStep('welcome');
    const flow = symptomFlow[lang.code] || symptomFlow['en'];
    setMessages([]);
    setTimeout(() => {
      setMessages([{ type: 'bot', text: flow.welcome, options: null }]);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: flow.askSymptom,
          options: flow.options.symptoms,
        }]);
        setStep('symptom');
      }, 1200);
    }, 300);
  };

  const handleOption = (option) => {
    addUserMessage(option);
    const flow = getLang();

    if (step === 'symptom') {
      setUserInputs(prev => ({ ...prev, symptom: option }));
      setStep('age');
      addBotMessage(flow.askAge, flow.options.age);
    } else if (step === 'age') {
      setUserInputs(prev => ({ ...prev, age: option }));
      setStep('duration');
      addBotMessage(flow.askDuration, flow.options.duration);
    } else if (step === 'duration') {
      setUserInputs(prev => ({ ...prev, duration: option }));
      setStep('location');
      addBotMessage(flow.askLocation, null);
    }
  };

  const handleLocationShare = () => {
    addUserMessage('📍 Sharing my location...');
    setStep('results');

    const symptom = userInputs.symptom || '';
    const urgency = urgencyMap[symptom] || 'MEDIUM';

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: null,
        results: { urgency, symptom, facilities: facilitySuggestions },
      }]);
    }, 1200);
  };

  const urgencyColor = (u) => u === 'CRITICAL' ? '#D96C6C' : u === 'HIGH' ? '#E6A23C' : '#4F9F73';
  const urgencyBg = (u) => u === 'CRITICAL' ? '#FDF0F0' : u === 'HIGH' ? '#FEF9F0' : '#F2F9F5';

  if (step === 'language') {
    return (
      <div style={{ minHeight: 'calc(100vh - 112px)', background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🙏</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#102A43', letterSpacing: '-0.8px', marginBottom: 8 }}>
            Namaste! Welcome to CareBot
          </h1>
          <p style={{ fontSize: 14.5, color: '#5A7A94', lineHeight: 1.6, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
            I'll help you find the right medical care nearby. Please select your preferred language to continue.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {languages.map(lang => (
              <button key={lang.code} onClick={() => handleLanguageSelect(lang)} style={{
                background: 'white', border: '1.5px solid #DDE6ED',
                borderRadius: 12, padding: '16px 12px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-body)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D9C9C'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,156,156,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE6ED'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: 24 }}>{lang.flag}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#102A43' }}>{lang.name}</span>
                <span style={{ fontSize: 11, color: '#7A9BB5' }}>{lang.greeting.split('!')[0]}</span>
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: '#A0B4C4', lineHeight: 1.6 }}>
            ⚠️ CareBot helps you find verified facilities. It does not diagnose medical conditions.<br />
            Always consult a qualified doctor for medical advice.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', background: '#F7F4EE' }}>

      {/* Chat header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #DDE6ED',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #2D9C9C, #4F9F73)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 4px 12px rgba(45,156,156,0.3)',
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#102A43' }}>CareBot</div>
            <div style={{ fontSize: 11, color: '#4F9F73', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F9F73', animation: 'pulse 2s infinite' }} />
              Online · Speaking {selectedLang?.name}
            </div>
          </div>
        </div>
        <button onClick={() => { setStep('language'); setMessages([]); setSelectedLang(null); }} style={{
          background: '#F7F4EE', border: '1px solid #DDE6ED', borderRadius: 8,
          padding: '7px 14px', fontSize: 12, color: '#5A7A94', cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}>
          🌐 Change Language
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.type === 'bot' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #2D9C9C, #4F9F73)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                marginTop: 2,
              }}>🤖</div>
            )}

            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msg.text && (
                <div style={{
                  background: msg.type === 'bot' ? 'white' : '#2D9C9C',
                  color: msg.type === 'bot' ? '#102A43' : 'white',
                  borderRadius: msg.type === 'bot' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  padding: '12px 16px', fontSize: 13.5, lineHeight: 1.65,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  whiteSpace: 'pre-line',
                  border: msg.type === 'bot' ? '1px solid #E8EDF2' : 'none',
                }}>{msg.text}</div>
              )}

              {/* Option buttons */}
              {msg.options && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {msg.options.map((opt, j) => (
                    <button key={j} onClick={() => handleOption(opt)} style={{
                      background: 'white', border: '1.5px solid #DDE6ED',
                      borderRadius: 100, padding: '7px 14px',
                      fontSize: 12.5, color: '#102A43', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontWeight: 500,
                      transition: 'all 0.15s ease',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D9C9C'; e.currentTarget.style.color = '#2D9C9C'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE6ED'; e.currentTarget.style.color = '#102A43'; }}
                    >{opt}</button>
                  ))}
                </div>
              )}

              {/* Location button */}
              {step === 'location' && i === messages.length - 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={handleLocationShare} style={{
                    background: '#2D9C9C', border: 'none', borderRadius: 10,
                    padding: '10px 18px', color: 'white',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>📍 Share My Location</button>
                  <button onClick={handleLocationShare} style={{
                    background: 'white', border: '1.5px solid #DDE6ED',
                    borderRadius: 10, padding: '10px 18px',
                    color: '#5A7A94', fontSize: 13, cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}>Enter PIN Code</button>
                </div>
              )}

              {/* Results */}
              {msg.results && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
                  <div style={{
                    background: urgencyBg(msg.results.urgency),
                    border: `1.5px solid ${urgencyColor(msg.results.urgency)}40`,
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: urgencyColor(msg.results.urgency), letterSpacing: '0.5px', marginBottom: 4 }}>
                      {msg.results.urgency} URGENCY
                    </div>
                    <div style={{ fontSize: 13, color: '#102A43', fontWeight: 500 }}>
                      Based on your symptoms, please visit a verified facility soon.
                    </div>
                    <div style={{ fontSize: 11.5, color: '#D96C6C', marginTop: 6 }}>
                      ⚠️ This is NOT a diagnosis. Please consult a qualified doctor.
                    </div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#5A7A94', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Verified Facilities Near You
                  </div>

                  {msg.results.facilities.map((fac, k) => (
                    <div key={k} style={{
                      background: 'white', border: '1.5px solid #DDE6ED',
                      borderRadius: 12, padding: '14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: fac.trust >= 80 ? '#F2F9F5' : fac.trust >= 60 ? '#FEF9F0' : '#FDF0F0',
                        border: `2px solid ${fac.trust >= 80 ? '#4F9F73' : fac.trust >= 60 ? '#E6A23C' : '#D96C6C'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
                        color: fac.trust >= 80 ? '#4F9F73' : fac.trust >= 60 ? '#E6A23C' : '#D96C6C',
                      }}>{fac.trust}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#102A43' }}>{fac.name}</div>
                        <div style={{ fontSize: 11.5, color: '#7A9BB5', marginTop: 2 }}>{fac.distance} away · {fac.status === 'verified' ? '✅ Verified' : '⚠️ Partial'}</div>
                        {fac.missing && <div style={{ fontSize: 11, color: '#E6A23C', marginTop: 2 }}>⚠️ Missing: {fac.missing}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <button style={{
                          background: '#2D9C9C', border: 'none', borderRadius: 7,
                          padding: '6px 12px', color: 'white',
                          fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}>Navigate</button>
                        <button style={{
                          background: 'white', border: '1px solid #DDE6ED', borderRadius: 7,
                          padding: '5px 12px', color: '#5A7A94',
                          fontSize: 11.5, cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}>Call</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2D9C9C, #4F9F73)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>🤖</div>
            <div style={{
              background: 'white', borderRadius: '4px 14px 14px 14px',
              padding: '12px 16px', border: '1px solid #E8EDF2',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#2D9C9C',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div style={{
        background: '#FEF9F0', borderTop: '1px solid #F5DFB0',
        padding: '8px 24px', fontSize: 11.5, color: '#8B6914',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ⚠️ CareBot triages symptoms and suggests care pathways. It does not diagnose medical conditions. Always consult a qualified doctor.
      </div>
    </div>
  );
}