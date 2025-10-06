document.addEventListener('DOMContentLoaded', async () => {

     // Handle dashboard tab switching
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.dataset.tab;

            // Update active states
            dashboardTabs.forEach(t => t.classList.remove('active'));
            dashboardSections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetSection}-section`).classList.add('active');
        });
    });

    // Update active nav link based on current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Waste types data
    const wasteResponse = await fetch('http://192.168.7.103:3000/dechets/')
    const wasteTypes = await wasteResponse.json();
    
    // Get unique cities for dropdown and populate the select
    const uniqueCities = [...new Set(wasteTypes.map(waste => waste.ville_name))].sort();
    const citySelect = document.getElementById('city-filter');
    uniqueCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });

    const uniqueWasteTypes = [...new Set(wasteTypes.map(waste => waste.dechet_name))].sort();
    const wasteSelect = document.getElementById('waste-name-filter');
    uniqueWasteTypes.forEach(waste => {
        const option = document.createElement('option');
        option.value = waste;
        option.textContent = waste;
        wasteSelect.appendChild(option);
    });

    // Add event listeners for filter changes
    function setupFilterListeners() {
        document.getElementById('waste-name-filter').addEventListener('change', applyFilters);
        document.getElementById('city-filter').addEventListener('change', applyFilters);
        document.getElementById('date-start').addEventListener('change', applyFilters);
        document.getElementById('date-end').addEventListener('change', applyFilters);
    }

    function applyFilters() {
        const nameFilter = document.getElementById('waste-name-filter').value;
        const cityFilter = document.getElementById('city-filter').value;
        const dateStart = document.getElementById('date-start').value;
        const dateEnd = document.getElementById('date-end').value;

        const filteredWastes = wasteTypes.filter(waste => {
            const matchesName = !nameFilter || waste.dechet_name.toLowerCase() === nameFilter.toLowerCase();
            const matchesCity = !cityFilter || waste.ville_name === cityFilter;
            const wasteDate = new Date(waste.date).setHours(0,0,0,0);
            const matchesDateRange = (!dateStart || wasteDate >= new Date(dateStart).setHours(0,0,0,0)) &&
                                   (!dateEnd || wasteDate <= new Date(dateEnd).setHours(0,0,0,0));

            return matchesName && matchesCity && matchesDateRange;
        });

        initializeWasteCards(filteredWastes);
    }

    // Format date function
    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: "short",
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    // Initialize waste cards
    function initializeWasteCards(wastesToDisplay = wasteTypes) {
        const wasteGrid = document.querySelector('.waste-stats-grid');
        if (!wasteGrid) return;

        wasteGrid.innerHTML = '';
        wastesToDisplay.forEach(waste => {
            const formattedDate = formatDate(waste.date);
            const card = document.createElement('div');
            card.className = 'waste-card';
            card.innerHTML = `
                <div class="waste-icon">${waste.icon}</div>
                <h3 class="waste-type">${waste.dechet_name}</h3>
                <p class="waste-date">📅 ${formattedDate}</p>
                <p class="waste-location">📍 ${waste.ville_name}</p>
                <p class="waste-quantity">${waste.total_dechet}</p>
            `;
            wasteGrid.appendChild(card);
        });
    }

    // Initialize filters and waste section
    setupFilterListeners();
    initializeWasteCards();

    // Example function to update waste quantities
    window.updateWasteQuantity = function(type, quantity) {
        const wasteType = wasteTypes.find(w => w.type.toLowerCase() === type.toLowerCase());
        if (wasteType) {
            wasteType.quantity = quantity;
            initializeWasteCards(); // Refresh display
        }
    };
});