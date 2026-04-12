(function () {
    // PunchAI Chat Widget - Premium Industrial Design

    // 1. Get Configuration & Inject Base Styles
    const script = document.currentScript;
    const scriptUrl = new URL(script.src);
    const baseUrl = script.getAttribute('data-base-url') || 'http://localhost:8000';
    const apiKey = script.getAttribute('data-api-key');

    // Create and inject the stylesheet link
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = scriptUrl.href.replace('punch-chat.js', 'style.css');
    document.head.appendChild(styleLink);

    if (!apiKey) {
        console.error('PunchAI: API Key missing. Please provide data-api-key attribute.');
        return;
    }

    // State
    let chatId = localStorage.getItem(`punch_chat_id_${apiKey}`);
    let isOpen = false;
    let botInfo = null;

    // UI Elements
    const widget = document.createElement('div');
    widget.id = 'punch-chat-widget';
    widget.innerHTML = `
        <div id="punch-chat-bubble">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div id="punch-chat-window">
            <div id="punch-chat-header">
                <h3 id="punch-bot-name">PunchAI Assistant</h3>
                <span id="punch-close" style="cursor:pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </span>
            </div>
            <div id="punch-chat-messages"></div>
            <div id="punch-chat-input-container">
                <input type="text" id="punch-chat-input" placeholder="Type your message..." autocomplete="off">
                <button id="punch-chat-send">Send</button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    const bubble = document.getElementById('punch-chat-bubble');
    const windowEl = document.getElementById('punch-chat-window');
    const messagesEl = document.getElementById('punch-chat-messages');
    const inputEl = document.getElementById('punch-chat-input');
    const sendBtn = document.getElementById('punch-chat-send');
    const closeBtn = document.getElementById('punch-close');
    const botNameEl = document.getElementById('punch-bot-name');

    // Functions
    async function fetchBotInfo() {
        try {
            const res = await fetch(`${baseUrl}/api/external/bot-info`, {
                headers: { 'X-API-Key': apiKey }
            });
            if (res.ok) {
                botInfo = await res.json();
                botNameEl.innerText = botInfo.name;

                // Inject Custom Styling if available (overrides base style.css)
                if (botInfo.customCss) {
                    const customStyleTag = document.getElementById('punch-custom-styles') || document.createElement('style');
                    customStyleTag.id = 'punch-custom-styles';
                    customStyleTag.innerHTML = botInfo.customCss;
                    if (!customStyleTag.parentNode) document.head.appendChild(customStyleTag);
                }

                addMessage('assistant', `Hello! I'm ${botInfo.name}. How can I help you today?`);
            }
        } catch (e) {
            console.error('PunchAI: Failed to fetch bot info', e);
        }
    }

    function addMessage(role, content) {
        const msg = document.createElement('div');
        msg.className = `punch-message ${role}`;
        msg.innerText = content;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async function initChat() {
        if (chatId) return;
        try {
            const res = await fetch(`${baseUrl}/api/external/chat/init`, {
                method: 'POST',
                headers: { 'X-API-Key': apiKey }
            });
            if (res.ok) {
                const data = await res.json();
                chatId = data.id;
                localStorage.setItem(`punch_chat_id_${apiKey}`, chatId);
            }
        } catch (e) {
            console.error('PunchAI: Failed to init chat', e);
        }
    }

    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        inputEl.value = '';
        addMessage('user', text);

        if (!chatId) await initChat();

        const typing = document.createElement('div');
        typing.className = 'punch-typing';
        typing.innerText = `${botInfo?.name || 'Assistant'} is typing...`;
        messagesEl.appendChild(typing);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            const res = await fetch(`${baseUrl}/api/external/chat/${chatId}/message`, {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: text })
            });

            typing.remove();

            if (res.ok) {
                const data = await res.json();
                addMessage('assistant', data.content);
            } else {
                addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            }
        } catch (e) {
            typing.remove();
            addMessage('assistant', 'Sorry, I could not connect to the server.');
        }
    }

    // Event Listeners
    bubble.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            windowEl.classList.add('active');
            if (!botInfo) fetchBotInfo();
        } else {
            windowEl.classList.remove('active');
        }
    };

    closeBtn.onclick = (e) => {
        e.stopPropagation();
        isOpen = false;
        windowEl.classList.remove('active');
    };

    sendBtn.onclick = sendMessage;
    inputEl.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

})();
