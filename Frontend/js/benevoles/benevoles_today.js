document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const resultsPopup = document.getElementById('resultsCollectePopup');
    const resultsForm = document.getElementById('resultsCollecteForm');

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

    // Initialize section tabs
    const sectionTabs = document.querySelectorAll('.section-tab');
    sectionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sectionId = tab.dataset.section;
            
            // Update active tab
            sectionTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding section
            document.querySelectorAll('.management-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${sectionId}-section`).classList.add('active');
        });
    });

    // Mock data for testing - Replace with actual API calls
    const mockCollectes = [
        {
            id: 1,
            title: "Collecte Place du Marché",
            date: new Date().toISOString(),
            location: "Place du Marché",
            responsable: "Marie Dubois",
            status: "in-progress",
            results: null
        },
        {
            id: 2,
            title: "Collecte Parc Municipal",
            date: new Date().toISOString(),
            location: "Parc de la Ville",
            responsable: "Jean Martin",
            status: "in-progress",
            results: null
        }
    ];

    // Initialize the page
    displayActiveCollectes();
    displayCompletedCollectes();

    // Function to display active collectes
    function displayActiveCollectes() {
        const activeCollectes = mockCollectes.filter(c => c.status === 'in-progress');
        const container = document.querySelector('#today-section .collectes-cards');
        container.innerHTML = '';
        
        activeCollectes.forEach(collecte => {
            const card = createCollecteCard(collecte);
            container.appendChild(card);
        });
    }

    // Function to display completed collectes
    function displayCompletedCollectes() {
        const completedCollectes = mockCollectes.filter(c => c.status === 'completed');
        const container = document.querySelector('#results-section .collectes-cards');
        container.innerHTML = '';
        
        completedCollectes.forEach(collecte => {
            const card = createResultsCard(collecte);
            container.appendChild(card);
        });
    }

    // Create a collecte card
    function createCollecteCard(collecte) {
        const card = document.createElement('div');
        card.className = 'collecte-card';
        card.innerHTML = `
            <div class="collecte-info">
                <h3 class="collecte-name">${collecte.title}</h3>
                <span class="collecte-datetime">${formatDate(collecte.date)}</span>
                <span class="collecte-location">${collecte.location}</span>
                <span class="collecte-responsable">${collecte.responsable}</span>
            </div>
            <div class="card-actions">
                <button type="button" class="action-btn">Saisir les résultats</button>
            </div>
        `;
        card.querySelector('.action-btn').addEventListener('click', () => openResultsPopup(collecte));
        return card;
    }

    // Create a results card
    function createResultsCard(collecte) {
        const card = document.createElement('div');
        card.className = 'collecte-card';
        card.innerHTML = `
            <div class="collecte-info">
                <h3 class="collecte-name">${collecte.title}</h3>
                <span class="collecte-datetime">${formatDate(collecte.date)}</span>
                <span class="collecte-location">${collecte.location}</span>
            </div>
            <div class="card-actions">
                <button type="button" class="action-btn">Voir les résultats</button>
            </div>
        `;
        card.querySelector('.action-btn').addEventListener('click', () => openResultsDetailsPopup(collecte));
        return card;
    }

    function openResultsPopup(collecte) {
        // Update popup content
        document.getElementById('collecte-title').textContent = collecte.title;
        document.getElementById('collecte-datetime').textContent = formatDate(collecte.date);
        document.getElementById('collecte-location').value = collecte.location;
        document.getElementById('collecte-responsable').value = collecte.responsable;

        // Create waste input cards
        createWasteInputCards();

        // Show popup
        resultsPopup.style.display = 'flex';
    }

    window.closeResultsPopup = function() {
        resultsPopup.style.display = 'none';
        resultsForm.reset();
    }

    window.closeResultsDetailsPopup = function() {
        document.getElementById('resultsDetailsPopup').style.display = 'none';
    }

    // Handle form submission
    resultsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get all waste inputs and their values
        const results = {};
        wasteTypes.forEach(waste => {
            const inputId = waste.type.toLowerCase().replace(/\s+/g, '-');
            const input = document.getElementById(inputId);
            if (input) {
                const value = parseFloat(input.value) || 0;
                results[waste.type] = {value:value, icon:waste.icon};
            }
        });

        // Prepare the data to be sent
        const collecteData = {
            id: mockCollectes[0].id, // In real app, this would be the current collecte's ID
            location: document.getElementById('collecte-location').value,
            responsable: document.getElementById('collecte-responsable').value,
            wastes: results,
            date: new Date().toISOString()
        };

        // Here you would make an API call to save the results
        console.log('Submitting collecte data:', collecteData);
        
        // For demonstration: Update mock data
        mockCollectes[0].status = 'completed';
        mockCollectes[0].results = results;
        
        // Refresh displays
        displayActiveCollectes();
        displayCompletedCollectes();
        
        // Close popup
        closeResultsPopup();
    });

    // Waste types data (imported from dashboard.js)
    const wasteTypes = [
        { type: 'Mégots de cigarette', icon: '🚬', quantity: 0 },
        { type: 'Emballages plastiques', icon: '🥤', quantity: 0 },
        { type: 'Bouteilles de verre', icon: '🍾', quantity: 0 },
        { type: 'Articles de pêche dégradés', icon: '🎣', quantity: 0 },
        { type: 'Déchets métalliques', icon: '🥫', quantity: 0 },
    ];

    // Function to create waste input cards
    function createWasteInputCards() {
        const container = document.getElementById('waste-input-cards');
        container.innerHTML = '';

        wasteTypes.forEach(waste => {
            const inputId = waste.type.toLowerCase().replace(/\s+/g, '-');
            const card = document.createElement('div');
            card.className = 'waste-card';
            card.innerHTML = `
                <div class="waste-input-group">
                    <span class="waste-icon">${waste.icon}</span>
                    <button type="button" class="quantity-btn decrease" data-input="${inputId}">-</button>
                    <div class="waste-input">
                        <input type="number" id="${inputId}" name="${inputId}" min="0" step="1" value="0">
                    </div>
                    <button type="button" class="quantity-btn increase" data-input="${inputId}">+</button>
                </div>
            `;

            // Add event listeners for the buttons
            card.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const input = document.getElementById(btn.dataset.input);
                    const currentValue = parseFloat(input.value) || 0;
                    const step = parseFloat(input.step);
                    
                    if (btn.classList.contains('increase')) {
                        input.value = (currentValue + step).toFixed(0);
                    } else {
                        input.value = Math.max(0, (currentValue - step)).toFixed(0);
                    }
                });
            });

            container.appendChild(card);
        });
    }

    // Initialize search functionality
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const activeCollectes = mockCollectes.filter(collecte => 
            collecte.status === 'in-progress' &&
            (collecte.title.toLowerCase().includes(searchTerm) ||
             collecte.location.toLowerCase().includes(searchTerm))
        );
        const container = document.querySelector('#today-section .collectes-cards');
        container.innerHTML = '';
        activeCollectes.forEach(collecte => {
            const card = createCollecteCard(collecte);
            container.appendChild(card);
        });
    });

    // Close popup when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === resultsPopup) {
            closeResultsPopup();
        }
    });

    // Utility function to format dates
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function openResultsDetailsPopup(collecte) {
        const popup = document.getElementById('resultsDetailsPopup');
        
        // Update popup content
        document.getElementById('results-title').textContent = collecte.title;
        document.getElementById('results-datetime').textContent = formatDate(collecte.date);
        document.getElementById('results-location').textContent = collecte.location;

        // Update waste cards
        const wasteCardsContainer = document.getElementById('results-waste-cards');
        wasteCardsContainer.innerHTML = Object.entries(collecte.results)
            .map(([type, {value, icon}]) => `
                <div class="waste-card">
                    <span class="waste-icon">${icon}</span>
                    <span class="waste-type">${type}</span>
                    <span class="waste-quantity">${value}</span>
                </div>
            `).join('');

        // Show the popup
        popup.style.display = 'flex';
    }

    // Initialize everything
    createWasteInputCards();
    displayActiveCollectes();
    displayCompletedCollectes();
});