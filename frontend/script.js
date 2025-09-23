 // Application State
        const AppState = {
            currentTab: 'booking',
            currentDate: new Date(2025, 8, 22),
            selectedBooking: null,
            bookings: [],
            customers: [],
            isLoading: false
        };

        // API Configuration
        const API_BASE = 'http://localhost:3000/api';

        // Initialize Application
        document.addEventListener('DOMContentLoaded', function() {
            initializeEventListeners();
            updateDateDisplay();
            generateTimeSlots();
            loadBookings();
            updateNavButtons();
        });

        function initializeEventListeners() {
            // Modal close on outside click
            document.getElementById('modalOverlay').addEventListener('click', function(e) {
                if (e.target === this) closeModal();
            });

            // Time slot selection
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('time-slot-btn')) {
                    selectTimeSlot(e.target);
                }
            });

            // Tag button selection
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('tag-button')) {
                    toggleTag(e.target);
                }
            });

            // Booking item selection
            document.addEventListener('click', function(e) {
                if (e.target.closest('.booking-item')) {
                    selectBookingItem(e.target.closest('.booking-item'));
                }
            });

            // Customer search
            const customerInputs = ['customerPhone', 'customerFirstName', 'customerLastName', 'customerEmail', 'customerCompany'];
            customerInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.addEventListener('input', debounce(handleCustomerSearch, 300));
                }
            });

            // Service and section filters
            document.getElementById('serviceSelect').addEventListener('change', filterBookings);
            document.getElementById('sectionSelect').addEventListener('change', filterBookings);
        }

        // Modal Functions
        function openModal(bookingId = null) {
            if (bookingId) {
                loadBookingForEdit(bookingId);
                document.getElementById('modalTitle').textContent = 'Edit Booking';
            } else {
                resetForm();
                document.getElementById('modalTitle').textContent = 'New Booking';
            }
            document.getElementById('modalOverlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('modalOverlay').classList.remove('active');
            document.body.style.overflow = 'auto';
            resetForm();
            AppState.currentTab = 'booking';
            updateNavButtons();
        }

        function switchTab(tab) {
            // Update tab buttons
            document.querySelectorAll('.modal-tab').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');
            
            AppState.currentTab = tab;
            updateNavButtons();
        }

        function switchTabByName(tabName) {
            const tabButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
            if (tabButton) {
                tabButton.click();
            }
        }

        function updateNavButtons() {
            const backBtn = document.getElementById('backButton');
            const nextBtn = document.getElementById('nextButton');
            
            const tabs = ['booking', 'customer', 'tags', 'notes', 'links', 'payment'];
            const currentIndex = tabs.indexOf(AppState.currentTab);
            
            if (currentIndex === 0) {
                backBtn.textContent = '← CLOSE';
                backBtn.onclick = closeModal;
            } else {
                backBtn.textContent = `← ${tabs[currentIndex - 1].toUpperCase()}`;
                backBtn.onclick = () => switchTabByName(tabs[currentIndex - 1]);
            }
            
            if (currentIndex === tabs.length - 1) {
                nextBtn.textContent = 'SAVE BOOKING';
                nextBtn.onclick = saveBooking;
            } else {
                nextBtn.textContent = `${tabs[currentIndex + 1].toUpperCase()} →`;
                nextBtn.onclick = () => switchTabByName(tabs[currentIndex + 1]);
            }
        }

        function handleBack() {
            // This will be set dynamically by updateNavButtons()
        }

        function handleNext() {
            // This will be set dynamically by updateNavButtons()
        }

        // Date Functions
        function changeDate(direction) {
            AppState.currentDate.setDate(AppState.currentDate.getDate() + direction);
            updateDateDisplay();
            loadBookings();
        }

        function updateDateDisplay() {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const dayName = days[AppState.currentDate.getDay()];
            const day = AppState.currentDate.getDate();
            const month = months[AppState.currentDate.getMonth()];
            const year = AppState.currentDate.getFullYear();
            
            document.getElementById('currentDate').textContent = `${dayName} ${day} ${month} ${year}`;
            
            // Update date input in modal
            const dateInput = document.getElementById('bookingDate');
            if (dateInput) {
                const formattedDate = AppState.currentDate.toISOString().split('T')[0];
                dateInput.value = formattedDate;
            }
        }

        // Time Slot Functions
        function selectTimeSlot(button) {
            document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        }

        function generateTimeSlots() {
            const timeSlotsContainer = document.getElementById('timeSlots');
            const sections = ['bistro', 'central', 'main-lounge'];
            const timeSlots = [];
            
            // Generate time slots from 11:00 AM to 11:00 PM
            for (let hour = 11; hour <= 23; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    timeSlots.push(time);
                }
            }
            
            timeSlotsContainer.innerHTML = '';
            
            sections.forEach(section => {
                const columnDiv = document.createElement('div');
                columnDiv.className = 'section-column';
                
                timeSlots.forEach((time, index) => {
                    const slotDiv = document.createElement('div');
                    slotDiv.className = 'time-slot';
                    
                    if (index % 2 === 0) {
                        const timeLabel = document.createElement('div');
                        timeLabel.className = 'time-label';
                        timeLabel.textContent = formatTime12Hour(time);
                        slotDiv.appendChild(timeLabel);
                    }
                    
                    columnDiv.appendChild(slotDiv);
                });
                
                timeSlotsContainer.appendChild(columnDiv);
            });
        }

        function formatTime12Hour(time24) {
            const [hours, minutes] = time24.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        }

        // Booking Functions
        async function loadBookings() {
            try {
                showLoading();
                const dateStr = AppState.currentDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE}/bookings?date=${dateStr}`);
                
                if (response.ok) {
                    AppState.bookings = await response.json();
                    renderBookings();
                    updateStats();
                } else {
                    showError('Failed to load bookings');
                }
            } catch (error) {
                console.error('Error loading bookings:', error);
                showError('Failed to connect to server');
            } finally {
                hideLoading();
            }
        }

        function renderBookings() {
            const bookingsList = document.getElementById('bookingsList');
            if (!bookingsList) return;
            
            bookingsList.innerHTML = '<h3>Today\'s Bookings</h3>';
            
            AppState.bookings.forEach(booking => {
                const bookingDiv = document.createElement('div');
                bookingDiv.className = 'booking-item';
                bookingDiv.dataset.id = booking.id;
                
                const startTime = formatTime12Hour(booking.time);
                const endTime = new Date(new Date(`2000-01-01T${booking.time}`) + booking.duration * 60000)
                    .toTimeString().slice(0, 5);
                const formattedEndTime = formatTime12Hour(endTime);
                
                bookingDiv.innerHTML = `
                    <div class="booking-time">${startTime} - ${formattedEndTime}</div>
                    <div class="booking-details">
                        <span class="booking-status status-${booking.status}"></span>
                        <span>${booking.customer_name} • ${booking.party_size} people</span>
                    </div>
                    <div class="booking-meta">
                        <span class="booking-tag">${booking.table_number || 'No table'}</span>
                        <span class="booking-tag">${booking.section}</span>
                    </div>
                `;
                
                bookingDiv.addEventListener('click', () => openModal(booking.id));
                bookingsList.appendChild(bookingDiv);
            });
        }

        function updateStats() {
            const stats = AppState.bookings.reduce((acc, booking) => {
                acc.total++;
                if (booking.service === 'lunch') acc.lunch++;
                if (booking.service === 'dinner') acc.dinner++;
                return acc;
            }, { total: 0, lunch: 0, dinner: 0 });
            
            document.getElementById('totalCount').textContent = stats.total;
            document.getElementById('lunchCount').textContent = stats.lunch;
            document.getElementById('dinnerCount').textContent = stats.dinner;
        }

        async function saveBooking() {
            try {
                showLoading();
                const bookingData = collectBookingData();
                
                if (!validateBookingData(bookingData)) {
                    return;
                }
                
                const method = AppState.selectedBooking ? 'PUT' : 'POST';
                const url = AppState.selectedBooking 
                    ? `${API_BASE}/bookings/${AppState.selectedBooking}` 
                    : `${API_BASE}/bookings`;
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bookingData)
                });
                
                if (response.ok) {
                    showSuccess('Booking saved successfully!');
                    setTimeout(() => {
                        closeModal();
                        loadBookings();
                    }, 1500);
                } else {
                    const error = await response.json();
                    showError(error.message || 'Failed to save booking');
                }
            } catch (error) {
                console.error('Error saving booking:', error);
                showError('Failed to connect to server');
            } finally {
                hideLoading();
            }
        }

        function collectBookingData() {
            const selectedTimeSlot = document.querySelector('.time-slot-btn.selected');
            
            return {
                date: document.getElementById('bookingDate').value,
                time: selectedTimeSlot ? selectedTimeSlot.dataset.time : '',
                party_size: parseInt(document.getElementById('partySize').value),
                duration: parseInt(document.getElementById('duration').value),
                service: document.querySelector('input[name="service"]:checked').value,
                section: document.querySelector('input[name="section"]:checked').value,
                status: document.getElementById('bookingStatus').value,
                table_number: document.getElementById('tableSelect').value,
                staff_member: document.getElementById('staffSelect').value,
                customer_name: `${document.getElementById('customerFirstName').value} ${document.getElementById('customerLastName').value}`.trim(),
                customer_phone: document.getElementById('customerPhone').value,
                customer_email: document.getElementById('customerEmail').value,
                customer_company: document.getElementById('customerCompany').value,
                tags: document.getElementById('customerTags').value,
                internal_notes: document.getElementById('internalNotes').value,
                customer_notes: document.getElementById('customerNotes').value,
                special_requirements: document.getElementById('specialRequirements').value,
                website: document.getElementById('customerWebsite').value,
                social_media: document.getElementById('socialMedia').value,
                documents: document.getElementById('documents').value
            };
        }

        function validateBookingData(data) {
            const errors = [];
            
            if (!data.date) errors.push('Date is required');
            if (!data.time) errors.push('Time is required');
            if (!data.party_size) errors.push('Party size is required');
            if (!data.customer_name.trim()) errors.push('Customer name is required');
            if (!data.customer_phone.trim()) errors.push('Customer phone is required');
            
            if (errors.length > 0) {
                showError(errors.join(', '));
                return false;
            }
            
            return true;
        }

        // Customer Functions
        async function handleCustomerSearch() {
            const searchTerm = getCustomerSearchTerm();
            if (searchTerm.length < 2) {
                clearSearchResults();
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(searchTerm)}`);
                if (response.ok) {
                    const customers = await response.json();
                    renderSearchResults(customers);
                } else {
                    showError('Failed to search customers');
                }
            } catch (error) {
                console.error('Error searching customers:', error);
            }
        }

        function getCustomerSearchTerm() {
            const inputs = ['customerPhone', 'customerFirstName', 'customerLastName', 'customerEmail', 'customerCompany'];
            return inputs.map(id => document.getElementById(id).value).find(val => val.length >= 2) || '';
        }

        function renderSearchResults(customers) {
            const resultsContainer = document.getElementById('searchResults');
            
            if (customers.length === 0) {
                resultsContainer.innerHTML = '<div class="search-placeholder">No customers found</div>';
                return;
            }
            
            resultsContainer.innerHTML = '';
            customers.forEach(customer => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'customer-result';
                resultDiv.innerHTML = `
                    <span>${customer.first_name || ''}</span>
                    <span>${customer.last_name || ''}</span>
                    <span>${customer.phone || ''}</span>
                    <span>${customer.email || ''}</span>
                    <span>${customer.tags || ''}</span>
                    <span>${customer.company || ''}</span>
                `;
                
                resultDiv.addEventListener('click', () => selectCustomer(customer));
                resultsContainer.appendChild(resultDiv);
            });
        }

        function selectCustomer(customer) {
            document.getElementById('customerFirstName').value = customer.first_name || '';
            document.getElementById('customerLastName').value = customer.last_name || '';
            document.getElementById('customerPhone').value = customer.phone || '';
            document.getElementById('customerEmail').value = customer.email || '';
            document.getElementById('customerCompany').value = customer.company || '';
            document.getElementById('customerTags').value = customer.tags || '';
            
            // Highlight selected customer
            document.querySelectorAll('.customer-result').forEach(result => {
                result.classList.remove('selected');
            });
            event.target.closest('.customer-result').classList.add('selected');
        }

        function clearSearchResults() {
            document.getElementById('searchResults').innerHTML = 
                '<div class="search-placeholder">Search by phone, name, email or company</div>';
        }

        // Tag Functions
        function toggleTag(button) {
            const tag = button.dataset.tag;
            const tagInput = document.getElementById('customerTags');
            const currentTags = tagInput.value.split(',').map(t => t.trim()).filter(t => t);
            
            if (currentTags.includes(tag)) {
                // Remove tag
                const updatedTags = currentTags.filter(t => t !== tag);
                tagInput.value = updatedTags.join(', ');
                button.classList.remove('selected');
            } else {
                // Add tag
                currentTags.push(tag);
                tagInput.value = currentTags.join(', ');
                button.classList.add('selected');
            }
        }

        // Utility Functions
        function resetForm() {
            document.querySelectorAll('form').forEach(form => form.reset());
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            document.getElementById('bookingDate').value = AppState.currentDate.toISOString().split('T')[0];
            clearSearchResults();
            AppState.selectedBooking = null;
        }

        function selectBookingItem(item) {
            document.querySelectorAll('.booking-item').forEach(b => b.classList.remove('selected'));
            item.classList.add('selected');
        }

        function filterBookings() {
            // Implement filtering logic here
            console.log('Filtering bookings...');
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // UI Helper Functions
        function showLoading() {
            AppState.isLoading = true;
            // You could show a loading spinner here
        }

        function hideLoading() {
            AppState.isLoading = false;
        }

        function showSuccess(message) {
            showMessage(message, 'success');
        }

        function showError(message) {
            showMessage(message, 'error');
        }

        function showMessage(message, type) {
            const messageContainer = document.getElementById('messageContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `${type}-message`;
            messageDiv.textContent = message;
            
            messageContainer.innerHTML = '';
            messageContainer.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }

        async function loadBookingForEdit(bookingId) {
            try {
                const response = await fetch(`${API_BASE}/bookings/${bookingId}`);
                if (response.ok) {
                    const booking = await response.json();
                    populateFormWithBooking(booking);
                    AppState.selectedBooking = bookingId;
                }
            } catch (error) {
                console.error('Error loading booking for edit:', error);
            }
        }

        function populateFormWithBooking(booking) {
            document.getElementById('bookingDate').value = booking.date;
            document.getElementById('partySize').value = booking.party_size;
            document.getElementById('duration').value = booking.duration;
            document.querySelector(`input[name="service"][value="${booking.service}"]`).checked = true;
            document.querySelector(`input[name="section"][value="${booking.section}"]`).checked = true;
            document.getElementById('bookingStatus').value = booking.status;
            document.getElementById('tableSelect').value = booking.table_number || '';
            document.getElementById('staffSelect').value = booking.staff_member || '';
            
            // Customer info
            const names = booking.customer_name.split(' ');
            document.getElementById('customerFirstName').value = names[0] || '';
            document.getElementById('customerLastName').value = names.slice(1).join(' ') || '';
            document.getElementById('customerPhone').value = booking.customer_phone || '';
            document.getElementById('customerEmail').value = booking.customer_email || '';
            document.getElementById('customerCompany').value = booking.customer_company || '';
            
            // Other fields
            document.getElementById('customerTags').value = booking.tags || '';
            document.getElementById('internalNotes').value = booking.internal_notes || '';
            document.getElementById('customerNotes').value = booking.customer_notes || '';
            document.getElementById('specialRequirements').value = booking.special_requirements || '';
            document.getElementById('customerWebsite').value = booking.website || '';
            document.getElementById('socialMedia').value = booking.social_media || '';
            document.getElementById('documents').value = booking.documents || '';
            
            // Select time slot
            const timeSlot = document.querySelector(`[data-time="${booking.time}"]`);
            if (timeSlot) {
                selectTimeSlot(timeSlot);
            }
        }
        