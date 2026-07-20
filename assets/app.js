const TODAY = new Date().toISOString().split('T')[0];

// Storage Initialization containing at least 1 mock task per classification type
let tasks = JSON.parse(localStorage.getItem('alignment_tasks')) || [
    { id: 1, date: TODAY, title: "Morning Stretch & Hydration", time: "07:30", category: "routine", completed: true },
    { id: 2, date: TODAY, title: "Cardio Fitness Intervals", time: "09:00", category: "workout", completed: false },
    { id: 3, date: TODAY, title: "Client Strategy Sync", time: "11:00", category: "meeting", completed: false },
    { id: 4, date: TODAY, title: "Review Quarterly Invoices", time: "14:30", category: "business", completed: false },
    { id: 5, date: TODAY, title: "Gaming with Friends", time: "20:00", category: "freetime", completed: false }
];

let selectedDate = TODAY;
let startOffset = -1;
let activeFilter = 'all';

// Element Selectors Shortcut
const $ = id => document.getElementById(id);

// Micro Conversion Engine for 12h formatting with guaranteed AM/PM indicators
const formatTime = time24 => new Date(`2000-01-01T${time24}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

function renderCalendarUI() {
    $('calendarGrid').innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 8; i++) {
        const d = new Date(); 
        d.setDate(d.getDate() + startOffset + i);
        const dStr = d.toISOString().split('T')[0];
        
        const box = document.createElement('div');
        box.className = `cal-day ${dStr === TODAY ? 'is-today' : ''} ${dStr === selectedDate ? 'active' : ''}`;
        box.innerHTML = `${days[d.getDay()]} <span>${d.getDate()}</span>`;
        box.onclick = () => { 
            selectedDate = dStr; 
            renderCalendarUI(); 
            updateDashboard(); 
        };
        $('calendarGrid').appendChild(box);
    }
}

function updateDashboard() {
    // Chronological sort operation
    tasks.sort((a, b) => a.time.localeCompare(b.time));
    
    const filtered = tasks.filter(t => t.date === selectedDate && (activeFilter === 'all' || t.category === activeFilter));

    // Dashboard View Render Block
    $('matrixList').innerHTML = filtered.length ? filtered.map(t => `
        <li class="matrix-item">
            <div class="matrix-content">
                <span class="time-stamp">${formatTime(t.time)}</span>
                <span class="badge badge-${t.category}">${t.category}</span>
                <span class="item-text ${t.completed ? 'completed' : ''}">${t.title}</span>
            </div>
            <div class="action-btns">
                <button class="check-btn ${t.completed ? 'is-complete' : ''}" onclick="toggleTask(${t.id})">
                    ${t.completed ? 'Completed' : 'Done?'}
                </button>
                <button class="delete-btn" onclick="deleteTask(${t.id})">Delete</button>
            </div>
        </li>
    `).join('') : '<li class="empty-notice">No records logged for this targeted track.</li>';

    // Calculate Completion Metrics
    const dayTasks = tasks.filter(t => t.date === selectedDate);
    const done = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    
    $('momentumCircleProgress').style.strokeDashoffset = 100 - pct;
    $('momentumText').innerText = `${pct}%`;
    $('momentumSubtext').innerText = total ? `${pct}% executed (${done}/${total})` : "0 items scheduled for this date.";
    
    localStorage.setItem('alignment_tasks', JSON.stringify(tasks));
}

// Controls Pagination Configuration
$('prevWeekBtn').onclick = () => { startOffset--; renderCalendarUI(); };
$('nextWeekBtn').onclick = () => { startOffset++; renderCalendarUI(); };

// Append Items Actions Execution Loop
$('addElementBtn').onclick = () => {
    const title = $('elementTitle').value;
    const time = $('elementTime').value;
    
    if (!title || !time) return alert("Please fill in the Task Name and Time!");
    
    // Conflict screening condition check
    if (tasks.some(t => t.date === selectedDate && t.time === time)) {
        return alert(`Conflict Alert: An item is already logged for ${formatTime(time)}!`);
    }

    tasks.push({ 
        id: Date.now(), 
        date: selectedDate, 
        title, 
        time, 
        category: $('elementCategory').value, 
        completed: false 
    });
    
    $('elementTitle').value = ''; 
    $('elementTime').value = '';
    updateDashboard();
};

window.toggleTask = id => { 
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t); 
    updateDashboard(); 
};

window.deleteTask = id => { 
    if (confirm("Delete this element?")) { 
        tasks = tasks.filter(t => t.id !== id); 
        updateDashboard(); 
    } 
};

document.querySelectorAll('.tab-btn').forEach(b => b.onclick = e => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    activeFilter = e.target.dataset.tab;
    updateDashboard();
});

// Run Application Execution Hooks
renderCalendarUI(); 
updateDashboard();