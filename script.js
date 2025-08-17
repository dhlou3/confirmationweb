document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginPage = document.getElementById('login-page');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const messageList = document.getElementById('message-list');
    const messageView = document.getElementById('message-view');
    const backBtn = document.getElementById('back-btn');
    const refreshBtn = document.querySelector('.refresh-btn');
    const deleteBtn = document.querySelector('.delete-btn');
    const selectAll = document.getElementById('select-all');
    const inboxCount = document.getElementById('inbox-count');
    const messageCount = document.querySelector('.message-count');

    // Valid credentials
    const validUsername = 'belhadj';
    const validPassword = 'amin00';

    // Load messages from localStorage or initialize empty array
    let messages = JSON.parse(localStorage.getItem('messages')) || [];

    // GitHub Gist configuration
    const GIST_ID = "9f0a9efd9da972f3fd7fac3379de6bf6";
    
    // Sound notification function
    function playSound() {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play();
    }

    // Check GitHub Gist for recent logins
    async function checkLogin() {
        try {
            const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
            const data = await response.json();
            const lastLogin = JSON.parse(data.files["tictaac-logs.json"].content).lastLogin;
            
            if (lastLogin && (new Date() - new Date(lastLogin) < 10000)) { // 10-second window
                showNotification(`TicTaac login at ${new Date(lastLogin).toLocaleString()}`);
                playSound();
            }
        } catch (error) {
            console.error("Error checking Gist:", error);
        }
    }

    // Show notification
    function showNotification(msg) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            animation: fadeIn 0.3s;
        `;
        notif.textContent = msg;
        document.body.appendChild(notif);

        setTimeout(() => notif.remove(), 5000);
    }

    // Start checking for logins every 5 seconds
    setInterval(checkLogin, 5000);

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === validUsername && password === validPassword) {
            // Successful login
            loginPage.style.display = 'none';
            dashboard.style.display = 'flex';
            initDashboard();
            
            // Store login time in localStorage
            localStorage.setItem('lastTicTaacLogin', new Date().toISOString());
        } else {
            // Failed login
            loginError.textContent = 'Invalid username or password';
        }
    });

    // Rest of your existing code...
    // Initialize the dashboard
    function initDashboard() {
        renderMessageList();
        updateCounters();
    }

    // Save messages to localStorage
    function saveMessages() {
        localStorage.setItem('messages', JSON.stringify(messages));
    }

    // Render the message list
    function renderMessageList() {
        messageList.innerHTML = '';
        
        const filteredMessages = messages.filter(msg => msg.folder === 'inbox');
        
        if (filteredMessages.length === 0) {
            messageList.innerHTML = '<div class="empty-state">No messages in inbox</div>';
            updateMessageCount(0);
            return;
        }
        
        filteredMessages.forEach(message => {
            const messageEl = document.createElement('div');
            messageEl.className = `message-item ${!message.read ? 'unread' : ''}`;
            messageEl.dataset.id = message.id;
            
            const date = new Date(message.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            messageEl.innerHTML = `
                <input type="checkbox" class="message-checkbox">
                <div class="message-sender">${message.sender}</div>
                <div class="message-subject">${message.subject}</div>
                <div class="message-preview">${message.body.substring(0, 50)}...</div>
                <div class="message-date">${formattedDate}</div>
            `;
            
            messageEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('message-checkbox')) {
                    viewMessage(message.id);
                }
            });
            
            messageList.appendChild(messageEl);
        });
        
        updateMessageCount(filteredMessages.length);
    }

    // View a single message
    function viewMessage(id) {
        const message = messages.find(msg => msg.id === id);
        
        if (!message) return;
        
        // Mark as read
        if (!message.read) {
            message.read = true;
            saveMessages();
            updateCounters();
            renderMessageList();
        }
        
        const date = new Date(message.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        document.getElementById('message-subject').textContent = message.subject;
        document.getElementById('message-sender').textContent = message.sender;
        document.getElementById('message-date').textContent = formattedDate;
        document.getElementById('message-body').textContent = message.body;
        
        messageList.style.display = 'none';
        messageView.style.display = 'block';
    }

    // Update counters
    function updateCounters() {
        const unreadCount = messages.filter(msg => !msg.read && msg.folder === 'inbox').length;
        inboxCount.textContent = unreadCount;
    }

    // Update message count display
    function updateMessageCount(count) {
        messageCount.textContent = `${count} message${count !== 1 ? 's' : ''}`;
    }

    // Back to message list
    backBtn.addEventListener('click', () => {
        messageView.style.display = 'none';
        messageList.style.display = 'block';
    });

    // Refresh messages
    refreshBtn.addEventListener('click', () => {
        renderMessageList();
    });

    // Delete selected messages
    deleteBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.message-checkbox:checked');
        checkboxes.forEach(checkbox => {
            const messageId = parseInt(checkbox.closest('.message-item').dataset.id);
            const messageIndex = messages.findIndex(msg => msg.id === messageId);
            if (messageIndex !== -1) {
                messages[messageIndex].folder = 'trash';
            }
        });
        saveMessages();
        renderMessageList();
        updateCounters();
        selectAll.checked = false;
    });

    // Select all messages
    selectAll.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.message-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    });
});