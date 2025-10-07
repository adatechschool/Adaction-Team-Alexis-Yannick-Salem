document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://192.168.7.103:3000';

    // Section tabs management
    const sectionTabs = document.querySelectorAll('.section-tab');
    const managementSections = document.querySelectorAll('.management-section');

    sectionTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const targetSection = tab.dataset.section;
            
            // Update active states
            sectionTabs.forEach(t => t.classList.remove('active'));
            managementSections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const targetElement = document.getElementById(`${targetSection}-section`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
            // Refresh collectes when switching to collectes tab
            if (targetSection === 'collectes') {
                await displayCollectes();
            }
        });
    });

    // Fetch collectes from API
    async function fetchCollectes() {
        try {
            const response = await fetch(`${API_BASE_URL}/collectes`);
            if (!response.ok) {
                throw new Error('Failed to fetch collectes');
            }
            collectes = await response.json();
            return collectes;
        } catch (error) {
            console.error('Error fetching collectes:', error);
            return [];
        }
    }

    // Function to populate the responsable select options
    async function populateResponsableSelect(selectElement) {
        try {
            const response = await fetch(`${API_BASE_URL}/benevole`);
            if (!response.ok) {
                throw new Error('Failed to fetch benevoles');
            }
            const benevoles = await response.json();

            selectElement.innerHTML = '<option value="">Sélectionner un bénévole</option>';
            benevoles.forEach(benevole => {
                const option = document.createElement('option');
                option.value = benevole.id; // Use ID as value
                option.textContent = `${benevole.first_name} ${benevole.last_name}`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching benevoles:', error);
        }
    }

    // Function to populate the cards with collectes data
    async function displayCollectes(collectesList = null) {
        const cardsContainer = document.querySelector('.collectes-cards');
        
        // If no list provided, fetch from API
        if (!collectesList) {
            collectesList = await fetchCollectes();
        }
        
        // Clear existing cards
        cardsContainer.innerHTML = '';
        
        // Add each collecte as a card
        collectesList.forEach((collecte) => {
            const card = document.createElement('div');
            card.className = 'collecte-card';
            
            // Build collecte name from API data
            const collecteName = collecte.name || `Collecte du ${formatDateShort(collecte.date)} à ${collecte.ville}`;
            const responsableName = `${collecte.first_name || ''} ${collecte.last_name || ''}`;
            
            card.innerHTML = `
                <div class="collecte-info">
                    <div class="collecte-name">${collecteName}</div>
                    <div class="collecte-datetime">${formatDateTime(collecte.date, collecte.time)}</div>
                    <div class="collecte-location">${collecte.ville || collecte.location || ''}</div>
                    <div class="collecte-responsable">${responsableName}</div>
                    <div class="collecte-status">${collecte.status || 'À venir'}</div>
                </div>
                <div class="card-actions">
                    <button class="action-button view-btn" data-id="${collecte.id}">
                        Voir détails
                    </button>
                </div>
            `;
            card.querySelector('.view-btn').addEventListener('click', () => showCollecteProfile(collecte));
            cardsContainer.appendChild(card);
        });
    }

    // Format date and time for display
    function formatDateTime(date, time) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', options);
        return time ? `${formattedDate} à ${time}` : formattedDate;
    }

    // Format date for short display
    function formatDateShort(date) {
        const options = { month: 'short', day: 'numeric' };
        return new Date(date).toLocaleDateString('fr-FR', options);
    }

    // Initial display of collectes
    displayCollectes();

    // Handle search functionality
    const searchInput = document.querySelector('.collectes-list .search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCollectes = collectes.filter(collecte => {
            const name = collecte.name || '';
            const location = collecte.ville || collecte.location || '';
            const responsable = `${collecte.first_name || ''} ${collecte.last_name || ''}`;
            
            return name.toLowerCase().includes(searchTerm) ||
                   location.toLowerCase().includes(searchTerm) ||
                   responsable.toLowerCase().includes(searchTerm);
        });
        displayCollectes(filteredCollectes);
    });

    // Add collecte popup management
    const addCollectePopup = document.getElementById('addCollectePopup');
    const addCollecteButton = document.querySelector('.collectes-actions .action-btn');
    const addCollecteForm = document.getElementById('addCollecteForm');

    // Show popup when clicking the add button
    addCollecteButton.addEventListener('click', async () => {
        addCollectePopup.style.display = 'flex';
        // Populate responsable select
        await populateResponsableSelect(document.getElementById('collecte-responsable'));
    });

    // Close popup function
    window.closeCollectePopup = function() {
        addCollectePopup.style.display = 'none';
        addCollecteForm.reset();
    };

    // Handle add collecte form submission
    addCollecteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const newCollecte = {
                name: addCollecteForm.name.value,
                date: addCollecteForm.date.value,
                time: addCollecteForm.time.value,
                location: addCollecteForm.location.value,
                description: addCollecteForm.description.value,
                benevole_responsable: addCollecteForm.responsable.value // Use benevole ID
            };

            const response = await fetch(`${API_BASE_URL}/collectes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCollecte)
            });

            if (!response.ok) {
                throw new Error('Failed to create collecte');
            }

            const result = await response.json();
            console.log('Collecte created:', result);
            
            // Refresh display
            await displayCollectes();
            
            // Close popup and reset form
            closeCollectePopup();
            
            alert('Collecte créée avec succès!');
        } catch (error) {
            console.error('Error creating collecte:', error);
            alert('Erreur lors de la création de la collecte. Veuillez réessayer.');
        }
    });

    // Profile popup elements
    const profileCollectePopup = document.getElementById('profileCollectePopup');
    const profileCollecteForm = document.getElementById('profileCollecteForm');
    const editCollecteBtn = document.getElementById('editCollecteBtn');
    const saveCollecteBtn = document.getElementById('saveCollecteBtn');
    const deleteCollecteBtn = document.getElementById('deleteCollecteBtn');
    let currentCollecteIndex = -1;

    // Function to show collecte profile popup
    async function showCollecteProfile(collecte) {
        currentCollecteIndex = collecte.id; // Store collecte ID
        
        // Update header content
        const collecteName = collecte.name || `Collecte du ${formatDateShort(collecte.date)} à ${collecte.ville}`;
        document.getElementById('collecte-title').textContent = collecteName;
        document.getElementById('collecte-datetime').textContent = formatDateTime(collecte.date, collecte.time);
        
        // Populate and set responsable select
        const responsableSelect = document.getElementById('profile-collecte-responsable');
        await populateResponsableSelect(responsableSelect);
        
        // Set the selected benevole
        if (collecte.benevole_responsable) {
            responsableSelect.value = collecte.benevole_responsable;
        } else {
            // Try to find by name if ID not available
            const fullName = `${collecte.first_name} ${collecte.last_name}`;
            const options = Array.from(responsableSelect.options);
            const matchingOption = options.find(opt => opt.textContent === fullName);
            if (matchingOption) {
                responsableSelect.value = matchingOption.value;
            }
        }

        // Fill form with collecte data
        console.log('Collecte data:', collecte); // Debug: see all collecte data
        console.log('Date split:', collecte.date.split('T')); // Debug: see date parts
        
        const dateParts = collecte.date.split('T');
        document.getElementById('profile-collecte-date').value = dateParts[0] || '';
        
        // Extract time from the date field (format: HH:MM:SS or HH:MM:SS.sss)
        if (dateParts[1]) {
            const timePart = dateParts[1].split(':').slice(0, 2).join(':'); // Get HH:MM only
            document.getElementById('profile-collecte-time').value = timePart;
        }
        
        document.getElementById('profile-collecte-location').value = collecte.ville || '';

        // Update status information
        document.getElementById('collecte-status').textContent = collecte.status || 'À venir';

        // Show/hide and update results section based on status
        const resultsSection = document.querySelector('.collecte-results');
        if (collecte.status === 'Terminé') {
            resultsSection.style.display = 'block';
            document.getElementById('collecte-waste').value = collecte.waste || 0;
            document.getElementById('collecte-points').value = collecte.points || 0;
        } else {
            resultsSection.style.display = 'none';
        }

        // Set all inputs to readonly initially
        Array.from(profileCollecteForm.elements).forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                if (input.tagName.toLowerCase() === 'select') {
                    input.disabled = true;
                } else {
                    input.readOnly = true;
                }
            }
        });

        // Show edit button, hide save button
        editCollecteBtn.style.display = 'block';
        saveCollecteBtn.style.display = 'none';

        // Show popup
        profileCollectePopup.style.display = 'flex';
    }

    // Close profile popup function
    window.closeCollecteProfilePopup = function() {
        profileCollectePopup.style.display = 'none';
        profileCollecteForm.reset();
    };

    // Handle edit button click
    editCollecteBtn.addEventListener('click', () => {
        // Make fields editable
        Array.from(profileCollecteForm.elements).forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit' && 
                !input.classList.contains('result-input')) {
                if (input.tagName.toLowerCase() === 'select') {
                    input.disabled = false;
                } else {
                    input.readOnly = false;
                }
            }
        });

        // Show save button, hide edit button
        editCollecteBtn.style.display = 'none';
        saveCollecteBtn.style.display = 'block';
    });

    // Handle save button click
    saveCollecteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (currentCollecteIndex === -1) return;

        try {
            // 1. Gather all form data
            const updatedData = {
                name: document.getElementById('collecte-title').textContent,
                date: document.getElementById('profile-collecte-date').value,
                time: document.getElementById('profile-collecte-time').value,
                location: document.getElementById('profile-collecte-location').value,
                benevole_responsable: document.getElementById('profile-collecte-responsable').value,
                status: document.getElementById('collecte-status').textContent
            };

            // 2. Send PATCH request to API
            const response = await fetch(`${API_BASE_URL}/collectes/${currentCollecteIndex}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Failed to update collecte');
            }

            const result = await response.json();
            console.log('Collecte updated:', result);
            
            // 3. Lock all fields
            Array.from(profileCollecteForm.elements).forEach(input => {
                if (input.type !== 'button' && input.type !== 'submit') {
                    if (input.tagName.toLowerCase() === 'select') {
                        input.disabled = true;
                    } else {
                        input.readOnly = true;
                    }
                }
            });
            
            // 4. Show edit button, hide save button
            editCollecteBtn.style.display = 'block';
            saveCollecteBtn.style.display = 'none';

            // 5. Refresh display
            await displayCollectes();
            
            alert('Collecte mise à jour avec succès!');

        } catch (error) {
            // Handle any errors that occur during save
            console.error('Error saving collecte:', error);
            alert('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
        }
    });

    // Handle delete button click
    deleteCollecteBtn.addEventListener('click', async () => {
        if (currentCollecteIndex === -1) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer cette collecte ?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/collectes/${currentCollecteIndex}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete collecte');
                }

                const result = await response.json();
                console.log('Collecte deleted:', result);
                
                // Refresh display and close popup
                await displayCollectes();
                closeCollecteProfilePopup();
                
                alert('Collecte supprimée avec succès!');
            } catch (error) {
                console.error('Error deleting collecte:', error);
                alert('Erreur lors de la suppression. Veuillez réessayer.');
            }
        }
    });
});