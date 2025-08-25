import React, { useState, useRef, useEffect } from 'react';
import { AiOutlinePaperClip } from "react-icons/ai";
import './App.css';

// --- YARDIMCI HOOK VE BİLEŞENLER ---
function useTypewriter(text, speed = 10) { const [displayText, setDisplayText] = useState(''); useEffect(() => { setDisplayText(''); if (text) { let i = 0; const typingInterval = setInterval(() => { if (i < text.length) { setDisplayText(prev => prev + text.charAt(i)); i++; } else { clearInterval(typingInterval); } }, speed); return () => clearInterval(typingInterval); } }, [text, speed]); return displayText; }
const AiMessage = ({ text }) => { const typedText = useTypewriter(text); return <div className="chat-text">{typedText}</div>; };
const LawoesLogo = ({ className }) => ( <svg className={`logo-svg ${className || ''}`} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="var(--logo-bg)"/><circle cx="14" cy="6" r="2" fill="var(--logo-fg)"/><circle cx="6" cy="14" r="2" fill="var(--logo-fg)"/><circle cx="22" cy="14" r="2" fill="var(--logo-fg)"/><circle cx="14" cy="22" r="2" fill="var(--logo-fg)"/><circle cx="9" cy="9" r="1.5" fill="var(--logo-fg)"/><circle cx="19" cy="9" r="1.5" fill="var(--logo-fg)"/><circle cx="9" cy="19" r="1.5" fill="var(--logo-fg)"/><circle cx="19" cy="19" r="1.5" fill="var(--logo-fg)"/></svg> );
const FileIcon = () => ( <svg className="file-bubble-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 11h-2v2H9v-2H7v-2h2V9h2v2h2v2zm4-6V3.5L18.5 9H13z"/></svg> );
const FileBubble = ({ file }) => ( <div className="file-bubble"> <div className="file-bubble-icon-wrapper"><FileIcon /></div> <div className="file-bubble-info"> <span className="file-bubble-name">{file.name}</span> <span className="file-bubble-type">{file.type}</span> </div> </div> );
const StagedFilePreview = ({ file, onRemove }) => ( <div className="staged-file-preview"> <div className="staged-file-info"><FileIcon /><span>{file.name}</span></div> <button onClick={onRemove} className="remove-file-btn">×</button> </div> );
const EmptyChat = () => ( <div className="empty-chat-container"> <LawoesLogo className="large-logo" /> <h1>Lawoes</h1> <p>En karmaşık davalar için en akıllı yardımcınız.</p> </div> );

// --- ANA UYGULAMA BİLEŞENİ ---
function App() {
    const [theme, setTheme] = useState('dark');
    const [message, setMessage] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState({});
    const [activeChatId, setActiveChatId] = useState(null);
    const [justFinishedLoading, setJustFinishedLoading] = useState(false);
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => { document.body.setAttribute('data-theme', theme); }, [theme]);
    useEffect(() => { if (Object.keys(conversations).length === 0) { handleNewChat(false); } }, [conversations]);
    useEffect(() => { if (chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; } }, [conversations, activeChatId]);
    useEffect(() => { setJustFinishedLoading(false); }, [activeChatId, message, uploadedFile]);

    const handleNewChat = (addToHistory = true) => { const newChatId = `chat_${Date.now()}`; if (addToHistory) { setConversations(prev => ({ ...prev, [newChatId]: { title: "New Chat", log: [] } })); } setActiveChatId(newChatId); };
    const handleSendMessage = async (e) => { e.preventDefault(); const trimmedMessage = message.trim(); if ((!trimmedMessage && !uploadedFile) || isLoading) return; setIsLoading(true); setJustFinishedLoading(false); const userMessageObject = { type: 'user', text: trimmedMessage, ...(uploadedFile && { file: { name: uploadedFile.name, type: 'PDF' } }) }; const isFirstMessage = conversations[activeChatId]?.log.length === 0; updateActiveChatLog(userMessageObject, isFirstMessage ? (trimmedMessage || uploadedFile.name) : null); setMessage(''); try { let data; if (uploadedFile) { const formData = new FormData(); formData.append('file', uploadedFile); const response = await fetch('http://localhost:8000/search_document', { method: 'POST', body: formData }); if (!response.ok) throw new Error('File upload failed'); data = await response.json(); setUploadedFile(null); } else { const response = await fetch('http://localhost:8000/search_case', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: trimmedMessage }) }); if (!response.ok) throw new Error('Search failed'); data = await response.json(); } const aiResponse = formatAIResponse(data); updateActiveChatLog({ type: 'ai', text: aiResponse }); } catch (error) { updateActiveChatLog({ type: 'ai', text: `Bir hata oluştu: ${error.message}` }); } finally { setIsLoading(false); setJustFinishedLoading(true); } };
    const updateActiveChatLog = (newEntry, newTitle = null) => { setConversations(prev => { const activeConv = prev[activeChatId] || { title: "New Chat", log: [] }; const newLog = [...activeConv.log, newEntry]; const updatedTitle = newTitle ? (newTitle.substring(0, 40) + (newTitle.length > 40 ? '...' : '')) : activeConv.title; return { ...prev, [activeChatId]: { ...activeConv, title: updatedTitle, log: newLog } }; }); };
    const formatAIResponse = (data) => { if (data.error) return data.error; if (data.results && data.results.length > 0) { return `(Benzerlik: ${Math.round(data.results[0].similarity * 100)}%)\n${data.results[0].context}`; } return 'Üzgünüm, bu konuyla ilgili bir sonuç bulamadım.'; };
    const activeConversation = conversations[activeChatId] || { title: '', log: [] };

    return (
        <div className="app-container">
            {/* --- Sol Sidebar --- */}
            <aside className="sidebar">
                 <div className="sidebar-header"><div className="logo"><LawoesLogo /><h1>Lawoes</h1></div></div>
                 <div className="search-bar"><input type="text" placeholder="Search" /><span className="shortcut">⌘K</span></div>
                 <nav className="main-nav"> <ul> <li className="active">AI Chat</li><li>Projects</li><li>Templates</li> <li>Documents <span className="plus-icon">+</span></li><li>Community <span className="new-badge">NEW</span></li> <li>History</li><li>Settings & Help</li> </ul> </nav>
                 <div className="sidebar-footer"> <div className="theme-switcher"> <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Light</button> <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Dark</button> </div> <div className="user-profile"> <img src="https://i.pravatar.cc/40?u=emilia" alt="Emilia Caitlin" /> <div className="user-info"><span className="user-name">Emilia Caitlin</span><span className="user-email">hey@unspace.agency</span></div> </div> </div>
            </aside>
            {/* --- Ana İçerik --- */}
            <main className="main-content">
                <header className="main-header"><h2>AI Chat</h2></header>
                <div className="chat-area" ref={chatContainerRef}>
                    {activeConversation.log.length === 0 ? <EmptyChat /> : activeConversation.log.map((entry, index) => {
                        const isLastMessage = index === activeConversation.log.length - 1;
                        const shouldAnimate = entry.type === 'ai' && isLastMessage && justFinishedLoading;
                        return (
                            <div key={index} className={`chat-message-group ${entry.type}`}>
                                {entry.file && <FileBubble file={entry.file} />}
                                {entry.text && ( <div className="chat-bubble"> {shouldAnimate ? <AiMessage text={entry.text} /> : <div className="chat-text">{entry.text}</div>} </div> )}
                            </div>
                        );
                    })}
                    {isLoading && <div className="chat-message-group ai"><div className="chat-bubble"><div className="loading-dots"><span>.</span><span>.</span><span>.</span></div></div></div>}
                </div>
                <div className="chat-input-area">
                    {uploadedFile && <StagedFilePreview file={uploadedFile} onRemove={() => setUploadedFile(null)} />}
                    <div className="chat-input-wrapper">
                        <input type="file" ref={fileInputRef} onChange={(e) => setUploadedFile(e.target.files[0])} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
                        <button className="attach-btn" type="button" onClick={() => fileInputRef.current.click()}>
                            <AiOutlinePaperClip />
                        </button>
                        <form onSubmit={handleSendMessage} className="chat-form">
                            <textarea placeholder="Bir dava konusu girin veya bir dosya ekleyin..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e); }} />
                            <button type="submit" className="send-btn" disabled={isLoading || (!message.trim() && !uploadedFile)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                            </button>
                        </form>
                    </div>
                </div>
                <p className="disclaimer">Lawoes, hukuki tavsiye niteliği taşımayan, yapay zeka destekli bir yardımcıdır.</p>
            </main>
             {/* --- History Paneli --- */}
             <aside className="history-panel">
                <div className="history-header"><h3>History</h3><button className="icon-btn">...</button></div>
                <div className="history-list">
                    <div className="history-item new-project" onClick={() => handleNewChat(true)}>+ New Chat</div>
                    {Object.keys(conversations).filter(chatId => conversations[chatId].log.length > 0).reverse().map(chatId => (
                        <div key={chatId} className={`history-item ${chatId === activeChatId ? 'active' : ''}`} onClick={() => setActiveChatId(chatId)}>
                            <p>{conversations[chatId].title}</p>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
}

export default App;