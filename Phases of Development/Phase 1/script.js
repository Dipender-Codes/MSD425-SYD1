document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const peopleInput = document.getElementById('people');
    const minusPeopleBtn = document.getElementById('minus-people');
    const plusPeopleBtn = document.getElementById('plus-people');
    const checkAvailabilityBtn = document.querySelector('.check-availability-btn');
    const displayPeople = document.getElementById('display-people');
    const displayDate = document.getElementById('display-date');
    const displayTime = document.getElementById('display-time');
    const tables = document.querySelectorAll('.table');

    let selectedTable = null;

    // --- Date Picker (Basic for demonstration) ---
    // In a real application, you'd use a library like flatpickr or jQuery UI Datepicker.
    // For now, it's a simple text input with an icon.
    dateInput.addEventListener('click', () => {
        // You can open a custom date picker here or integrate a library
        alert('Date picker functionality would be here in a real app!');
    });

    // --- Time Picker (Basic for demonstration) ---
    // Similar to date, a library would be used for a robust time picker.
    timeInput.addEventListener('click', () => {
        // You can open a custom time picker here or integrate a library
        alert('Time picker functionality would be here in a real app!');
    });

    // --- People Counter ---
    minusPeopleBtn.addEventListener('click', () => {
        let currentValue = parseInt(peopleInput.value);
        if (currentValue > parseInt(peopleInput.min)) {
            peopleInput.value = currentValue - 1;
            updateAvailabilityInfo();
        }
    });

    plusPeopleBtn.addEventListener('click', () => {
        let currentValue = parseInt(peopleInput.value);
        peopleInput.value = currentValue + 1;
        updateAvailabilityInfo();
    });

    // Update display info initially and when people count changes
    function updateAvailabilityInfo() {
        displayPeople.textContent = peopleInput.value;
        displayDate.textContent = dateInput.value;
        displayTime.textContent = timeInput.value;
    }

    // Call on load
    updateAvailabilityInfo();

    // --- Check Availability Button (Frontend Simulation) ---
    checkAvailabilityBtn.addEventListener('click', () => {
        // In a real application, this would make an AJAX call to a backend
        // to fetch available tables based on the selected date, time, and people.
        // For this frontend, we'll just simulate a reset of selection.

        // Deselect any previously selected table
        if (selectedTable) {
            selectedTable.classList.remove('selected');
            selectedTable = null;
        }

        // Simulate fetching available tables (for now, we're just keeping the initial state)
        console.log(`Checking availability for ${peopleInput.value} people on ${dateInput.value} at ${timeInput.value}`);
        alert('Availability checked! (In a real app, tables would update based on backend data)');

        // Example: If table 7 becomes unavailable after checking
        // document.querySelector('[data-table-id="7"]').classList.remove('available');
        // document.querySelector('[data-table-id="7"]').classList.add('booked');
    });

    // --- Table Selection ---
    tables.forEach(table => {
        table.addEventListener('click', () => {
            if (table.classList.contains('available')) {
                // If a table is already selected, deselect it
                if (selectedTable) {
                    selectedTable.classList.remove('selected');
                }
                // Select the new table
                table.classList.add('selected');
                selectedTable = table;
                console.log(`Table ${table.dataset.tableId} selected.`);
                alert(`Table ${table.dataset.tableId} selected! (You would proceed to a confirmation step here.)`);
            } else if (table.classList.contains('booked')) {
                alert('This table is already booked. Please choose an available table.');
            }
        });
    });

    // Initial update of display info
    updateAvailabilityInfo();
});