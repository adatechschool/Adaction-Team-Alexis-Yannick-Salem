// Function declared in global scope to be accessible from HTML
function closeDetailsPopup() {
    document.getElementById('collecteDetailsPopup').style.display = 'none';
}

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


    function formatDateShort(date) {
        const options = { month: 'short', day: 'numeric' };
        return new Date(date).toLocaleDateString('fr-FR', options);
    }
    // Current user ID (mock) - Replace with actual user authentication
    const currentUserId = "user123";

    // DOM Elements
    const upcomingSection = document.getElementById('upcoming-section');
    const historySection = document.getElementById('history-section');
    const collecteDetailsPopup = document.getElementById('collecteDetailsPopup');
    const searchInputs = document.querySelectorAll('.search-input');

    // Initialize section tabs
    const tabs = document.querySelectorAll('.section-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Show corresponding section
            document.querySelectorAll('.management-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}-section`).classList.add('active');
        });
    });

    // Initial load
    loadCollectes();
    initializeSearchListeners();

// Load and display collectes
async function loadCollectes() {
    const res = await fetch('http://192.168.7.103:3000/collectes');
    const collectes = await res.json();
    const upcomingCollectes = collectes.filter(c => c.status === 'À venir');
    const pastCollectes = collectes.filter(c => c.status === 'Terminée');

    displayCollectes(upcomingCollectes, upcomingSection.querySelector('.collectes-cards'));
    displayCollectes(pastCollectes, historySection.querySelector('.collectes-cards'));
}

function displayCollectes(collectes, container) {
    container.innerHTML = '';
    collectes.forEach(collecte => {
        const card = collecte.status === 'completed' ? 
            createCompletedCollecteCard(collecte) : 
            createCollecteCard(collecte);
        container.appendChild(card);
    });
}

function createCollecteCard(collecte) {
    const card = document.createElement('div');
    const collecteName = collecte.name || `Collecte du ${formatDateShort(collecte.date)} à ${collecte.ville}`;
    card.className = 'collecte-card';
    card.innerHTML = `
        <div class="collecte-info">
            <h3 class="collecte-name">${collecteName}</h3>
            <span class="collecte-datetime">${formatDate(collecte.date)}</span>
            <span class="collecte-location">${collecte.ville}</span>
            <span class="collecte-responsable">${collecte.first_name} ${collecte.last_name}</span>
        </div>
        <div class="card-actions">
            <button type="button" class="action-btn view-btn">Voir détails</button>
        </div>
    `;
    card.querySelector('.view-btn').addEventListener('click', () => openCollecteDetails(collecte));
    return card;
}

function createCompletedCollecteCard(collecte) {
    const card = document.createElement('div');
    card.className = 'collecte-card';
    const collecteName = collecte.name || `Collecte du ${formatDateShort(collecte.date)} à ${collecte.ville}`;
    card.innerHTML = `
        <div class="collecte-info">
            <h3 class="collecte-name">${collecteName}</h3>
            <span class="collecte-datetime">${formatDate(collecte.date)}</span>
            <span class="collecte-location">${collecte.ville}</span>
        </div>
        <div class="card-actions">
            <button type="button" class="action-btn view-btn">Voir détails</button>
        </div>
    `;
    card.querySelector('.view-btn').addEventListener('click', () => openCollecteDetails(collecte));
    return card;
}

// Search functionality
function initializeSearchListeners() {
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const section = e.target.closest('.collectes-section');
            const cards = section.querySelectorAll('.collecte-card');

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    });
}

// Collecte details popup
async function openCollecteDetails(collecte) {
    const popup = document.getElementById('collecteDetailsPopup');
    
    // Get current benevole ID from sessionStorage
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const benevoleId = userData.id;
    
    if (!benevoleId) {
        console.error('No benevole ID found in session');
        alert('Erreur: Veuillez vous reconnecter');
        return;
    }

    // Check if benevole is registered for this collecte
    let isParticipating = false;
    try {
        const checkResponse = await fetch(`http://192.168.7.103:3000/dechets-collectes/check-registration/${collecte.id}/${benevoleId}`);
        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            isParticipating = checkData.isRegistered;
        }
    } catch (error) {
        console.error('Error checking registration:', error);
    }

    const collecteName = collecte.name || `Collecte du ${formatDateShort(collecte.date)} à ${collecte.ville}`;

    // Update popup content
    document.getElementById('collecte-title').textContent = collecteName;
    document.getElementById('collecte-datetime').textContent = formatDate(collecte.date);
    document.getElementById('details-location').value = collecte.ville;
    document.getElementById('details-responsable').value = `${collecte.first_name} ${collecte.last_name}`;

    // Update participation status
    const statusDiv = document.getElementById('participation-status');
    if (collecte.status === 'Terminée') {
        statusDiv.className = 'status-info completed';
        statusDiv.textContent = 'Collecte terminée';
        document.getElementById('participateBtn').style.display = 'none';
    } else {
        statusDiv.className = `status-info ${isParticipating ? 'participating' : 'not-participating'}`;
        statusDiv.textContent = isParticipating ? 'Vous participez à cette collecte' : 'Vous ne participez pas encore à cette collecte';
        const participateBtn = document.getElementById('participateBtn');
        participateBtn.style.display = '';
        participateBtn.textContent = isParticipating ? 'Se désinscrire' : 'Participer à la collecte';
        participateBtn.onclick = () => toggleParticipation(collecte.id, isParticipating, benevoleId);
    }

    // Show/hide waste results
    const wasteResults = document.getElementById('waste-results');
    if (collecte.status === 'Terminée' && collecte.results) {
        wasteResults.style.display = 'block';
        const wasteCards = wasteResults.querySelector('.waste-cards');
        const results = typeof collecte.results === 'string' ? JSON.parse(collecte.results) : collecte.results;
        wasteCards.innerHTML = Object.entries(results)
            .map(([type, {value, icon}]) => `
                <div class="waste-card">
                    <span class="waste-icon">${icon}</span>
                    <span class="waste-type">${type}</span>
                    <span class="waste-quantity">${value}</span>
                </div>
            `).join('');
    } else {
        wasteResults.style.display = 'none';
    }

    popup.style.display = 'flex';
}

function closeDetailsPopup() {
    const popup = document.getElementById('collecteDetailsPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Toggle participation in a collecte
async function toggleParticipation(collecteId, currentlyParticipating, benevoleId) {
    try {
        if (currentlyParticipating) {
            // Unregister from collecte
            const response = await fetch(`http://192.168.7.103:3000/dechets-collectes/unregister/${collecteId}/${benevoleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la désinscription');
            }

            const data = await response.json();
            console.log('Désinscription réussie:', data.message);
            alert('Vous avez été désinscrit de cette collecte');
            
        } else {
            // Register for collecte
            const response = await fetch('http://192.168.7.103:3000/dechets-collectes/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_collecte: collecteId,
                    id_benevole: benevoleId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'inscription');
            }

            const data = await response.json();
            console.log('Inscription réussie:', data.message);
            alert('Vous avez été inscrit à cette collecte');
        }

        // Close popup and reload collectes to reflect changes
        closeDetailsPopup();
        await loadCollectes();

    } catch (error) {
        console.error('Error toggling participation:', error);
        alert(`Erreur: ${error.message}`);
    }
}

// Utility functions
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

    // Close popup when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === collecteDetailsPopup) {
            closeDetailsPopup();
        }
    });
});