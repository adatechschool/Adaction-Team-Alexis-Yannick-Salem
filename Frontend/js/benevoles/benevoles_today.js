document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://192.168.7.103:3000';
    
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

    // Initialize the page
    loadCollectes();

    // Function to load collectes from API
    async function loadCollectes() {
        try {
            const response = await fetch(`${API_BASE_URL}/collectes`);
            if (!response.ok) {
                throw new Error('Failed to fetch collectes');
            }
            const collectes = await response.json();
            
            // Filter by status
            const activeCollectes = collectes.filter(c => c.status === 'En cours' || c.status === 'in-progress');
            const completedCollectes = collectes.filter(c => c.status === 'Terminée' || c.status === 'completed');
            
            displayActiveCollectes(activeCollectes);
            displayCompletedCollectes(completedCollectes);
        } catch (error) {
            console.error('Error loading collectes:', error);
            alert('Erreur lors du chargement des collectes');
        }
    }

    // Function to display active collectes
    function displayActiveCollectes(activeCollectes) {
        const container = document.querySelector('#today-section .collectes-cards');
        container.innerHTML = '';
        
        activeCollectes.forEach(collecte => {
            const card = createCollecteCard(collecte);
            container.appendChild(card);
        });
    }

    // Function to display completed collectes
    function displayCompletedCollectes(completedCollectes) {
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
        // Format title from date and ville
        const title = collecte.ville ? `Collecte à ${collecte.ville}` : `Collecte #${collecte.id}`;
        const responsable = `${collecte.first_name || ''} ${collecte.last_name || ''}`.trim() || 'Non assigné';
        
        card.innerHTML = `
            <div class="collecte-info">
                <h3 class="collecte-name">${title}</h3>
                <span class="collecte-datetime">${formatDate(collecte.date)}</span>
                <span class="collecte-location">${collecte.ville || 'Lieu non spécifié'}</span>
                <span class="collecte-responsable">${responsable}</span>
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
        const title = collecte.ville ? `Collecte à ${collecte.ville}` : `Collecte #${collecte.id}`;
        
        card.innerHTML = `
            <div class="collecte-info">
                <h3 class="collecte-name">${title}</h3>
                <span class="collecte-datetime">${formatDate(collecte.date)}</span>
                <span class="collecte-location">${collecte.ville || 'Lieu non spécifié'}</span>
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
        const title = collecte.ville ? `Collecte à ${collecte.ville}` : `Collecte #${collecte.id}`;
        const responsable = `${collecte.first_name || ''} ${collecte.last_name || ''}`.trim() || 'Non assigné';
        
        document.getElementById('collecte-title').textContent = title;
        document.getElementById('collecte-datetime').textContent = formatDate(collecte.date);
        document.getElementById('collecte-location').value = collecte.ville || '';
        document.getElementById('collecte-responsable').value = responsable;
        
        // Store collecte ID for form submission
        resultsForm.dataset.collecteId = collecte.id;

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
    resultsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const collecteId = resultsForm.dataset.collecteId;
        if (!collecteId) {
            alert('Erreur: ID de collecte manquant');
            return;
        }
        
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

        try {
            // Update collecte status to completed
            const response = await fetch(`${API_BASE_URL}/collectes/${collecteId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    status: 'Terminée' // or 'completed' depending on your backend
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update collecte status');
            }

            // Here you would also save the waste results to your backend
            // For now, just log them
            console.log('Collecte results:', results);

            // Close popup and reload data
            closeResultsPopup();
            loadCollectes();
            
            alert('Résultats enregistrés avec succès!');
        } catch (error) {
            console.error('Error saving results:', error);
            alert('Erreur lors de l\'enregistrement des résultats');
        }
        
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
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const allCollectes = await loadCollectes();
        const activeCollectes = allCollectes.filter(collecte => 
            collecte.status === 'En cours' &&
            (collecte.ville.toLowerCase().includes(searchTerm) ||
             collecte.first_name.toLowerCase().includes(searchTerm) ||
             collecte.last_name.toLowerCase().includes(searchTerm))
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
        document.getElementById('results-title').textContent = `${collecte.ville} - ${collecte.first_name} ${collecte.last_name}`;
        document.getElementById('results-datetime').textContent = formatDate(collecte.date);
        document.getElementById('results-location').textContent = collecte.ville;

        // Update waste cards
        const wasteCardsContainer = document.getElementById('results-waste-cards');
        // Note: If waste results are stored in collecte.results as JSON, parse and display
        // For now, display placeholder or fetch from API if available
        if (collecte.results) {
            const results = typeof collecte.results === 'string' ? JSON.parse(collecte.results) : collecte.results;
            wasteCardsContainer.innerHTML = Object.entries(results)
                .map(([type, {value, icon}]) => `
                    <div class="waste-card">
                        <span class="waste-icon">${icon}</span>
                        <span class="waste-type">${type}</span>
                        <span class="waste-quantity">${value}</span>
                    </div>
                `).join('');
        } else {
            wasteCardsContainer.innerHTML = '<p>Aucun résultat disponible</p>';
        }

        // Show the popup
        popup.style.display = 'flex';
    }

    // Initialize everything
    createWasteInputCards();
    
    // Load and display collectes from backend
    loadCollectes().then(collectes => {
        displayActiveCollectes(collectes);
        displayCompletedCollectes(collectes);
    }).catch(error => {
        console.error('Erreur lors du chargement des collectes:', error);
    });
});