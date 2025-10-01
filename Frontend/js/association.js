document.addEventListener('DOMContentLoaded', () => {
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
    const wasteTypes = [
        { type: 'Mégots de cigarette', icon: '🚬', quantity: 0 },
        { type: 'Emballages plastiques', icon: '🥤', quantity: 0 },
        { type: 'Bouteilles de verre', icon: '🍾', quantity: 0 },
        { type: 'Articles de pêche dégradés (filets, lignes de pêche, hameçons)', icon: '🎣', quantity: 0 },
        { type: 'Déchets métalliques (canettes, conserves)', icon: '🥫', quantity: 0 },
    ];

    // Initialize waste cards
    function initializeWasteCards() {
        const wasteGrid = document.querySelector('.waste-stats-grid');
        if (!wasteGrid) return;

        wasteGrid.innerHTML = '';
        wasteTypes.forEach(waste => {
            const card = document.createElement('div');
            card.className = 'waste-card';
            card.innerHTML = `
                <div class="waste-icon">${waste.icon}</div>
                <h3 class="waste-type">${waste.type}</h3>
                <p class="waste-quantity">${waste.quantity}</p>
            `;
            wasteGrid.appendChild(card);
        });
    }

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

    // Initialize waste section
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