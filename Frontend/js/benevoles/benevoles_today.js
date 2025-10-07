document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000';
    
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
            

            const today = new Date().toISOString().split('T')[0];

            const activeCollectes = collectes.filter(c => {

                return c.status === 'En cours' || c.date.split("T")[0] === today
            });
            const completedCollectes = collectes.filter(c => c.status === 'Terminée');
            
            displayActiveCollectes(activeCollectes);
            displayCompletedCollectes(completedCollectes);
            
            return collectes; // Return the data for use by search
        } catch (error) {
            console.error('Error loading collectes:', error);
            alert('Erreur lors du chargement des collectes');
            return [];
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
        
        // Get benevole ID from sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const benevoleId = userData.id;
        
        if (!benevoleId) {
            alert('Erreur: ID bénévole manquant. Veuillez vous reconnecter.');
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
            // Save waste results to dechets_collectes table
            console.log('Sending results:', {
                id_collecte: collecteId,
                id_benevole: benevoleId,
                results: results
            });

            const resultsResponse = await fetch(`${API_BASE_URL}/dechets-collectes/results`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    id_collecte: collecteId,
                    id_benevole: benevoleId,
                    results: results
                })
            });

            console.log('Results response status:', resultsResponse.status);

            if (!resultsResponse.ok) {
                const errorData = await resultsResponse.json().catch(() => ({}));
                console.error('Results error:', errorData);
                throw new Error(errorData.error || 'Failed to save waste results');
            }

            // Update collecte status to completed
            const statusResponse = await fetch(`${API_BASE_URL}/collectes/${collecteId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    status: 'Terminée'
                })
            });

            if (!statusResponse.ok) {
                const errorData = await statusResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to update collecte status');
            }

            // Close popup and reload data
            closeResultsPopup();
            await loadCollectes(); // Wait for data to reload
            
            alert('Résultats enregistrés avec succès!');
        } catch (error) {
            console.error('Error saving results:', error);
            alert('Erreur lors de l\'enregistrement des résultats: ' + error.message);
        }
    });

    // Waste types data (imported from dashboard.js)
    const wasteTypes = [
        { type: 'Mégot de cigarette', icon: '🚬', quantity: 0 },
        { type: 'Emballage plastique', icon: '🥤', quantity: 0 },
        { type: 'Bouteille de verre', icon: '🍾', quantity: 0 },
        { type: 'Article de pêche', icon: '🎣', quantity: 0 },
        { type: 'Déchet métallique', icon: '🥫', quantity: 0 },
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
        
        if (!searchTerm) {
            // If search is empty, reload all collectes
            loadCollectes();
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/collectes`);
            const allCollectes = await response.json();
            const activeCollectes = allCollectes.filter(collecte => 
                (collecte.status === 'En cours' || collecte.status === 'in-progress') &&
                (collecte.ville?.toLowerCase().includes(searchTerm) ||
                 collecte.first_name?.toLowerCase().includes(searchTerm) ||
                 collecte.last_name?.toLowerCase().includes(searchTerm))
            );
            const container = document.querySelector('#today-section .collectes-cards');
            container.innerHTML = '';
            activeCollectes.forEach(collecte => {
                const card = createCollecteCard(collecte);
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Error searching collectes:', error);
        }
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

    async function openResultsDetailsPopup(collecte) {
        const popup = document.getElementById('resultsDetailsPopup');
        
        // Update popup content
        document.getElementById('results-title').textContent = `${collecte.ville} - ${collecte.first_name} ${collecte.last_name}`;
        document.getElementById('results-datetime').textContent = formatDate(collecte.date);
        document.getElementById('results-location').textContent = collecte.ville;

        // Fetch waste results from dechets_collectes table
        const wasteCardsContainer = document.getElementById('results-waste-cards');
        
        try {
            const response = await fetch(`${API_BASE_URL}/dechets-collectes/results/${collecte.id}`);
            if (response.ok) {
                const results = await response.json();
                
                if (results.length > 0) {
                    // Group results by waste type
                    const groupedResults = {};
                    results.forEach(result => {
                        if (!groupedResults[result.dechet_name]) {
                            groupedResults[result.dechet_name] = {
                                icon: result.icon,
                                quantity: 0
                            };
                        }
                        groupedResults[result.dechet_name].quantity += result.dechet_quantite || 0;
                    });
                    
                    wasteCardsContainer.innerHTML = Object.entries(groupedResults)
                        .map(([type, data]) => `
                            <div class="waste-card">
                                <span class="waste-icon">${data.icon}</span>
                                <span class="waste-type">${type}</span>
                                <span class="waste-quantity">${data.quantity}</span>
                            </div>
                        `).join('');
                } else {
                    wasteCardsContainer.innerHTML = '<p>Aucun résultat disponible</p>';
                }
            } else {
                wasteCardsContainer.innerHTML = '<p>Erreur lors du chargement des résultats</p>';
            }
        } catch (error) {
            console.error('Error loading results:', error);
            wasteCardsContainer.innerHTML = '<p>Erreur lors du chargement des résultats</p>';
        }

        // Show the popup
        popup.style.display = 'flex';
    }

    // Initialize everything
    createWasteInputCards();
    
    // Load and display collectes from backend
    loadCollectes();
});