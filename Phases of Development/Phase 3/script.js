class RestaurantBooking {
            constructor() {
                this.selectedDate = null;
                this.selectedTime = null;
                this.partySize = 2;
                this.selectedTable = null;
                this.currentArea = 'bistro';
                
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.generateTimeSlots();
                this.initializeDatePicker();
                this.updateDisplay();
            }

            setupEventListeners() {
                // Date picker
                document.getElementById('date-input').addEventListener('click', () => {
                    this.toggleDatePicker();
                });

                // Time picker
                document.getElementById('time-input').addEventListener('click', () => {
                    this.toggleTimePicker();
                });

                // Party size controls
                document.getElementById('decrease-people').addEventListener('click', () => {
                    this.changePartySize(-1);
                });

                document.getElementById('increase-people').addEventListener('click', () => {
                    this.changePartySize(1);
                });

                // Check availability
                document.getElementById('check-availability').addEventListener('click', () => {
                    this.checkAvailability();
                });

                // Area tabs
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.switchArea(e.target.dataset.area);
                    });
                });

                // Table selection
                document.querySelector('.table-area').addEventListener('click', (e) => {
                    const table = e.target.closest('.table');
                    if (table && table.classList.contains('available')) {
                        this.selectTable(table);
                    }
                });

                // Modal controls
                document.getElementById('modal-close').addEventListener('click', () => {
                    this.closeModal();
                });

                document.getElementById('booking-modal').addEventListener('click', (e) => {
                    if (e.target.id === 'booking-modal') {
                        this.closeModal();
                    }
                });

                // Booking form
                document.getElementById('booking-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitBooking();
                });

                // Close dropdowns when clicking outside
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.input-wrapper')) {
                        this.closeAllDropdowns();
                    }
                });
            }

            initializeDatePicker() {
                const today = new Date();
                this.selectedDate = new Date(today);
                this.generateCalendar();
                this.updateDateInput();
            }

            generateCalendar() {
                const datePicker = document.getElementById('date-picker');
                const today = new Date();
                const currentDate = this.selectedDate || today;
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();

                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];

                datePicker.innerHTML = `
                    <div class="calendar-header">
                        <button type="button" class="calendar-nav" id="prev-month">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="calendar-month-year">${monthNames[month]} ${year}</div>
                        <button type="button" class="calendar-nav" id="next-month">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="calendar-grid">
                        <div class="calendar-day-header">Sun</div>
                        <div class="calendar-day-header">Mon</div>
                        <div class="calendar-day-header">Tue</div>
                        <div class="calendar-day-header">Wed</div>
                        <div class="calendar-day-header">Thu</div>
                        <div class="calendar-day-header">Fri</div>
                        <div class="calendar-day-header">Sat</div>
                    </div>
                `;

                const calendarGrid = datePicker.querySelector('.calendar-grid');

                // Empty cells for days before first day of month
                for (let i = 0; i < firstDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'calendar-day';
                    calendarGrid.appendChild(emptyDay);
                }

                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayElement = document.createElement('div');
                    dayElement.className = 'calendar-day';
                    dayElement.textContent = day;

                    const cellDate = new Date(year, month, day);
                    const isToday = cellDate.toDateString() === today.toDateString();
                    const isSelected = this.selectedDate && cellDate.toDateString() === this.selectedDate.toDateString();
                    const isPast = cellDate < new Date().setHours(0, 0, 0, 0);

                    if (isToday) dayElement.classList.add('today');
                    if (isSelected) dayElement.classList.add('selected');
                    if (isPast) dayElement.classList.add('inactive');

                    if (!isPast) {
                        dayElement.addEventListener('click', () => {
                            this.selectDate(new Date(year, month, day));
                        });
                    }

                    calendarGrid.appendChild(dayElement);
                }

                // Navigation event listeners - use arrow functions to preserve 'this' context
                const prevBtn = document.getElementById('prev-month');
                const nextBtn = document.getElementById('next-month');

                if (prevBtn) {
                    prevBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newDate = new Date(year, month - 1, 1);
                        this.selectedDate = newDate;
                        this.generateCalendar();
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newDate = new Date(year, month + 1, 1);
                        this.selectedDate = newDate;
                        this.generateCalendar();
                    });
                }
            }

            generateTimeSlots() {
                const timePicker = document.getElementById('time-picker');
                
                const lunchSlots = [];
                for (let h = 11; h <= 14; h++) {
                    for (let m = 0; m < 60; m += 30) {
                        if (h === 11 && m === 0) continue;
                        if (h === 14 && m === 30) continue;
                        lunchSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                    }
                }

                const dinnerSlots = [];
                for (let h = 17; h <= 21; h++) {
                    for (let m = 0; m < 60; m += 30) {
                        if (h === 21 && m === 30) continue;
                        dinnerSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                    }
                }

                timePicker.innerHTML = `
                    <div class="time-slot-group">
                        <div class="time-slot-group-title">
                            <i class="fas fa-sun"></i> Lunch Service
                        </div>
                        <div class="time-slots">
                            ${lunchSlots.map(time => `
                                <div class="time-slot" data-time="${time}">${time}</div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="time-slot-group">
                        <div class="time-slot-group-title">
                            <i class="fas fa-moon"></i> Dinner Service
                        </div>
                        <div class="time-slots">
                            ${dinnerSlots.map(time => `
                                <div class="time-slot" data-time="${time}">${time}</div>
                            `).join('')}
                        </div>
                    </div>
                `;

                // Add event listeners to time slots
                timePicker.querySelectorAll('.time-slot').forEach(slot => {
                    slot.addEventListener('click', () => {
                        this.selectTime(slot.dataset.time);
                    });
                });
            }

            selectDate(date) {
                this.selectedDate = new Date(date);
                this.generateCalendar();
                this.updateDateInput();
                this.closeDatePicker();
                this.updateDisplay();
            }

            selectTime(time) {
                this.selectedTime = time;
                document.querySelectorAll('.time-slot').forEach(slot => {
                    slot.classList.remove('selected');
                });
                document.querySelector(`[data-time="${time}"]`).classList.add('selected');
                this.updateTimeInput();
                this.closeTimePicker();
                this.updateDisplay();
            }

            changePartySize(change) {
                const newSize = this.partySize + change;
                if (newSize >= 1 && newSize <= 12) {
                    this.partySize = newSize;
                    document.getElementById('people-count').value = this.partySize;
                    this.updateDisplay();
                    this.filterTables();
                } else if (newSize > 12) {
                    this.showNotification('Maximum party size is 12 guests', 'error');
                }
            }

            switchArea(areaId) {
                this.currentArea = areaId;
                
                // Update tabs
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(`[data-area="${areaId}"]`).classList.add('active');

                // Update layouts
                document.querySelectorAll('.table-layout').forEach(layout => {
                    layout.classList.remove('active');
                });
                document.getElementById(areaId).classList.add('active');

                this.clearTableSelection();
                this.filterTables();
            }

            selectTable(table) {
                this.clearTableSelection();
                table.classList.add('selected');
                this.selectedTable = {
                    id: table.dataset.table,
                    capacity: parseInt(table.dataset.capacity),
                    area: this.currentArea
                };
                this.openModal();
            }

            filterTables() {
                const activeLayout = document.querySelector('.table-layout.active');
                const tables = activeLayout.querySelectorAll('.table:not(.booked)');
                
                tables.forEach(table => {
                    const capacity = parseInt(table.dataset.capacity);
                    if (capacity < this.partySize) {
                        table.classList.add('unavailable');
                        table.classList.remove('available');
                    } else {
                        table.classList.remove('unavailable');
                        table.classList.add('available');
                    }
                });
            }

            checkAvailability() {
                if (!this.selectedDate || !this.selectedTime) {
                    this.showNotification('Please select both date and time', 'error');
                    return;
                }

                // Add loading effect
                const btn = document.getElementById('check-availability');
                btn.classList.add('loading');
                btn.disabled = true;

                setTimeout(() => {
                    this.filterTables();
                    btn.classList.remove('loading');
                    btn.disabled = false;
                    this.showNotification('Availability updated successfully!', 'success');
                }, 1000);
            }

            openModal() {
                if (!this.selectedDate || !this.selectedTime || !this.selectedTable) {
                    this.showNotification('Please complete your selection', 'error');
                    return;
                }

                const modal = document.getElementById('booking-modal');
                const areaNames = {
                    bistro: 'Bistro',
                    sportsbar: 'Sports Bar',
                    kidsroom: 'Family Room',
                    mainlounge: 'Main Lounge'
                };

                document.getElementById('modal-date').textContent = this.formatDate(this.selectedDate);
                document.getElementById('modal-time').textContent = this.selectedTime;
                document.getElementById('modal-people').textContent = `${this.partySize} ${this.partySize === 1 ? 'guest' : 'guests'}`;
                document.getElementById('modal-table').textContent = this.selectedTable.id;
                document.getElementById('modal-area').textContent = areaNames[this.selectedTable.area];

                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            closeModal() {
                const modal = document.getElementById('booking-modal');
                modal.classList.remove('active');
                document.body.style.overflow = '';
                this.clearTableSelection();
            }

            submitBooking() {
                const name = document.getElementById('customer-name').value.trim();
                const phone = document.getElementById('customer-phone').value.trim();
                const email = document.getElementById('customer-email').value.trim();
                const requests = document.getElementById('special-requests').value.trim();

                if (!name || !phone) {
                    this.showNotification('Please fill in all required fields', 'error');
                    return;
                }

                // Simulate booking process
                const form = document.getElementById('booking-form');
                form.classList.add('loading');

                setTimeout(() => {
                    // Mark table as booked
                    const tableElement = document.querySelector(`[data-table="${this.selectedTable.id}"]`);
                    if (tableElement) {
                        tableElement.classList.remove('available', 'selected');
                        tableElement.classList.add('booked');
                    }

                    this.showNotification(`Reservation confirmed for ${name}!`, 'success');
                    this.closeModal();
                    this.resetForm();
                    form.classList.remove('loading');
                }, 1500);
            }

            // Utility methods
            toggleDatePicker() {
                const picker = document.getElementById('date-picker');
                const isActive = picker.classList.contains('active');
                this.closeAllDropdowns();
                if (!isActive) {
                    picker.classList.add('active');
                }
            }

            toggleTimePicker() {
                const picker = document.getElementById('time-picker');
                const isActive = picker.classList.contains('active');
                this.closeAllDropdowns();
                if (!isActive) {
                    picker.classList.add('active');
                }
            }

            closeAllDropdowns() {
                document.getElementById('date-picker').classList.remove('active');
                document.getElementById('time-picker').classList.remove('active');
            }

            closeDatePicker() {
                document.getElementById('date-picker').classList.remove('active');
            }

            closeTimePicker() {
                document.getElementById('time-picker').classList.remove('active');
            }

            clearTableSelection() {
                document.querySelectorAll('.table.selected').forEach(table => {
                    table.classList.remove('selected');
                });
                this.selectedTable = null;
            }

            updateDateInput() {
                const input = document.getElementById('date-input');
                input.value = this.selectedDate ? this.formatDate(this.selectedDate) : 'Select Date';
            }

            updateTimeInput() {
                const input = document.getElementById('time-input');
                input.value = this.selectedTime || 'Select Time';
            }

            updateDisplay() {
                document.getElementById('display-people').textContent = this.partySize;
                document.getElementById('display-date').textContent = 
                    this.selectedDate ? this.formatDate(this.selectedDate) : 'Select Date';
                document.getElementById('display-time').textContent = 
                    this.selectedTime || 'Select Time';
            }

            formatDate(date) {
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.innerHTML = `
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    ${message}
                `;

                document.body.appendChild(notification);
                
                setTimeout(() => notification.classList.add('show'), 100);
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => document.body.removeChild(notification), 300);
                }, 3000);
            }

            resetForm() {
                document.getElementById('booking-form').reset();
            }
        }

        // Initialize the application
        document.addEventListener('DOMContentLoaded', () => {
            new RestaurantBooking();
        });