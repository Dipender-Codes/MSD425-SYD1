 let currentTab = 'booking';
        let currentDate = new Date(2025, 8, 22); // Sep 22, 2025

        function openModal() {
            document.getElementById('modalOverlay').classList.add('active');
        }

        function closeModal() {
            document.getElementById('modalOverlay').classList.remove('active');
        }

        function switchTab(tab) {
            // Update tab buttons
            document.querySelectorAll('.modal-tab').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');
            
            currentTab = tab;
            updateNavButtons();
        }

        function updateNavButtons() {
            const backBtn = document.querySelector('.nav-button.back');
            const nextBtn = document.querySelector('.nav-button.next');
            
            const tabs = ['booking', 'customer', 'tags', 'notes', 'links', 'payment'];
            const currentIndex = tabs.indexOf(currentTab);
            
            if (currentIndex === 0) {
                backBtn.textContent = '← BOOKING';
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

        function switchTabByName(tabName) {
            document.querySelectorAll('.modal-tab').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');
            
            currentTab = tabName;
            updateNavButtons();
        }

        function nextStep() {
            const tabs = ['booking', 'customer', 'tags', 'notes', 'links', 'payment'];
            const currentIndex = tabs.indexOf(currentTab);
            
            if (currentIndex < tabs.length - 1) {
                switchTabByName(tabs[currentIndex + 1]);
            }
        }

        function saveBooking() {
            alert('Booking saved successfully!');
            closeModal();
        }

        function changeDate(direction) {
            currentDate.setDate(currentDate.getDate() + direction);
            updateDateDisplay();
        }

        function updateDateDisplay() {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const dayName = days[currentDate.getDay()];
            const day = currentDate.getDate();
            const month = months[currentDate.getMonth()];
            const year = currentDate.getFullYear();
            
            document.querySelector('.current-date').textContent = `${dayName} ${day} ${month} ${year}`;
        }

        // Time slot selection
        document.addEventListener('DOMContentLoaded', function() {
            const timeSlots = document.querySelectorAll('.time-slot-btn');
            timeSlots.forEach(slot => {
                slot.addEventListener('click', function() {
                    timeSlots.forEach(s => s.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });

            // Close modal when clicking outside
            document.getElementById('modalOverlay').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });

            // Service and section filters
            document.getElementById('serviceSelect').addEventListener('change', function() {
                filterBookings();
            });

            document.getElementById('sectionSelect').addEventListener('change', function() {
                filterBookings();
            });

            updateNavButtons();
        });

        function filterBookings() {
            // Add filtering logic here
            console.log('Filtering bookings...');
        }

        // Booking item click handlers
        document.addEventListener('DOMContentLoaded', function() {
            const bookingItems = document.querySelectorAll('.booking-item');
            bookingItems.forEach(item => {
                item.addEventListener('click', function() {
                    bookingItems.forEach(b => b.style.background = '');
                    this.style.background = '#3a3a3a';
                });
            });
        });

        // Popular tags functionality
        document.addEventListener('DOMContentLoaded', function() {
            const tagButtons = document.querySelectorAll('#tagsTab button');
            const tagInput = document.querySelector('#tagsTab input');
            
            tagButtons.forEach(button => {
                if (button.textContent !== 'Configure Payment') {
                    button.addEventListener('click', function() {
                        const tag = this.textContent;
                        const currentTags = tagInput.value;
                        
                        if (currentTags) {
                            tagInput.value = currentTags + ', ' + tag;
                        } else {
                            tagInput.value = tag;
                        }
                    });
                }
            });
        });

        // Customer search functionality
        document.addEventListener('DOMContentLoaded', function() {
            const customerInputs = document.querySelectorAll('#customerTab input');
            
            customerInputs.forEach(input => {
                input.addEventListener('input', function() {
                    if (this.value.length > 2) {
                        // Simulate search results
                        updateSearchResults(this.value);
                    } else {
                        clearSearchResults();
                    }
                });
            });
        });

        function updateSearchResults(query) {
            const placeholder = document.querySelector('.search-placeholder');
            placeholder.innerHTML = `<div style="padding: 20px;">Searching for "${query}"...</div>`;
        }

        function clearSearchResults() {
            const placeholder = document.querySelector('.search-placeholder');
            placeholder.innerHTML = 'Search by Phone, First Name,<br>Surname, Email or Company';
        }