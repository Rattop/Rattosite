let currentMonthIndex = 0;
let selectedDayElement = null;
let currentColor = '#ffffff'; // Default color
let db;

function openDB() {
    const request = indexedDB.open('calendarDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('notes')) {
            const objectStore = db.createObjectStore('notes', { keyPath: 'date' });
            objectStore.createIndex('note', 'note', { unique: false });
            objectStore.createIndex('color', 'color', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadNotes(); // Carregar as notas ao abrir o banco
    };

    request.onerror = function(event) {
        console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCarousel();
    openDB(); // Abrir o banco de dados
});

function updateCarousel() {
    const months = document.querySelector('.carousel .months');
    const totalMonths = document.querySelectorAll('.carousel .month').length;
    months.style.transform = `translateX(-${currentMonthIndex * 100}%)`;
}

function generateCalendar(month) {
    const months = ["Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const firstDay = new Date(2024, month + 7, 1).getDay();
    const daysInMonth = new Date(2024, month + 8, 0).getDate();
    
    let calendarHTML = `<h4>${months[month]} 2024</h4><table>
        <thead>
            <tr>
                <th>Dom</th>
                <th>Seg</th>
                <th>Ter</th>
                <th>Qua</th>
                <th>Qui</th>
                <th>Sex</th>
                <th>Sáb</th>
            </tr>
        </thead>
        <tbody>`;

    let day = 1;
    for (let i = 0; i < 6; i++) {
        calendarHTML += `<tr>`;
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay || day > daysInMonth) {
                calendarHTML += `<td></td>`;
            } else {
                const date = `2024-${month + 8}-${day}`;
                calendarHTML += `<td data-date="${date}" onclick="showModal(this)">${day}</td>`;
                day++;
            }
        }
        calendarHTML += `</tr>`;
    }
    
    calendarHTML += `</tbody></table>`;
    return calendarHTML;
}

function updateCalendar() {
    const months = document.querySelectorAll('.carousel .month');
    months.forEach((month, index) => {
        month.innerHTML = generateCalendar(index);
    });
}

function showModal(dayElement) {
    selectedDayElement = dayElement;
    const modal = document.getElementById("color-note-modal");
    const noteText = document.getElementById("note-text");
    
    noteText.value = dayElement.getAttribute('data-note') || '';
    
    const currentColor = dayElement.style.backgroundColor || '#ffffff';
    setColor(currentColor);

    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById("color-note-modal");
    modal.style.display = "none";
    selectedDayElement = null;
}

function setColor(color) {
    currentColor = color;
    if (selectedDayElement) {
        selectedDayElement.style.backgroundColor = color;
    }
}

function saveNote() {
    const noteText = document.getElementById("note-text").value;
    if (selectedDayElement) {
        const date = selectedDayElement.getAttribute('data-date');
        selectedDayElement.setAttribute('data-note', noteText);
        selectedDayElement.title = noteText;
        saveToDB(date, noteText, currentColor);
        closeModal();
    }
}

function saveToDB(date, note, color) {
    const transaction = db.transaction(["notes"], "readwrite");
    const objectStore = transaction.objectStore("notes");
    const request = objectStore.put({ date, note, color });

    request.onsuccess = function() {
        console.log('Nota salva com sucesso:', date);
    };

    request.onerror = function(event) {
        console.error('Erro ao salvar nota:', event.target.errorCode);
    };
}

function loadNotes() {
    const transaction = db.transaction(["notes"], "readonly");
    const objectStore = transaction.objectStore("notes");
    const request = objectStore.openCursor();

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const day = document.querySelector(`td[data-date="${cursor.value.date}"]`);
            if (day) {
                day.setAttribute('data-note', cursor.value.note);
                day.style.backgroundColor = cursor.value.color;
                day.title = cursor.value.note;
            }
            cursor.continue();
        }
    };

    request.onerror = function(event) {
        console.error('Erro ao carregar notas:', event.target.errorCode);
    };
}

function prevMonth() {
    currentMonthIndex = (currentMonthIndex > 0) ? currentMonthIndex - 1 : 4;
    updateCarousel();
}

function nextMonth() {
    currentMonthIndex = (currentMonthIndex < 4) ? currentMonthIndex + 1 : 0;
    updateCarousel();
}

function initializeCarousel() {
    const monthsContainer = document.querySelector('.carousel .months');
    const totalMonths = 5;
    monthsContainer.innerHTML = '';
    for (let i = 0; i < totalMonths; i++) {
        const month = document.createElement('div');
        month.classList.add('month');
        monthsContainer.appendChild(month);
    }
    updateCalendar();
}

