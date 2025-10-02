document.addEventListener('DOMContentLoaded', () => {
    // Example collectes data (to be replaced with real data)
    const collectes = [
        {
            id: 1,
            name: "Grand Nettoyage du Parc",
            date: "2025-10-15",
            time: "14:00",
            location: "Parc des Buttes-Chaumont",
            description: "Nettoyage collectif du parc et ses environs",
            status: "À venir",
            participants: 5,
            waste: null,
            points: null
        },
        {
            id: 2,
            name: "Collecte Plage du Matin",
            date: "2025-10-01",
            time: "09:00",
            location: "Plage de la Pointe Rouge",
            description: "Ramassage des déchets sur la plage",
            status: "Terminé",
            participants: 12,
            waste: 45,
            points: 90
        }
    ];

    // Function to populate the cards with collectes data
    function displayCollectes(collectesList) {
        const cardsContainer = document.querySelector('.collectes-cards');
        
        // Clear existing cards
        cardsContainer.innerHTML = '';
        
        // Add each collecte as a card
        collectesList.forEach((collecte, index) => {
            const card = document.createElement('div');
            card.className = 'collecte-card';
            card.innerHTML = `
                <div class="collecte-info">
                    <div class="collecte-name">${collecte.name}</div>
                    <div class="collecte-datetime">${formatDateTime(collecte.date, collecte.time)}</div>
                    <div class="collecte-location">${collecte.location}</div>
                </div>
                <div class="card-actions">
                    <button class="action-button view-btn" data-index="${index}">
                        Voir détails
                    </button>
                </div>
            `;
            card.querySelector('.view-btn').addEventListener('click', () => showCollecteProfile(collecte, index));
            cardsContainer.appendChild(card);
        });
    }

    // Format date and time for display
    function formatDateTime(date, time) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', options);
        return `${formattedDate} à ${time}`;
    }

    // Initial display of collectes
    displayCollectes(collectes);

    // Handle search functionality
    const searchInput = document.querySelector('.collectes-list .search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCollectes = collectes.filter(collecte => 
            collecte.name.toLowerCase().includes(searchTerm) ||
            collecte.location.toLowerCase().includes(searchTerm)
        );
        displayCollectes(filteredCollectes);
    });

    // Add collecte popup management
    const addCollectePopup = document.getElementById('addCollectePopup');
    const addCollecteButton = document.querySelector('.collectes-actions .action-btn');
    const addCollecteForm = document.getElementById('addCollecteForm');

    // Show popup when clicking the add button
    addCollecteButton.addEventListener('click', () => {
        addCollectePopup.style.display = 'flex';
    });

    // Close popup function
    window.closeCollectePopup = function() {
        addCollectePopup.style.display = 'none';
        addCollecteForm.reset();
    };

    // Handle add collecte form submission
    addCollecteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newCollecte = {
            id: collectes.length + 1,
            name: addCollecteForm.name.value,
            date: addCollecteForm.date.value,
            time: addCollecteForm.time.value,
            location: addCollecteForm.location.value,
            description: addCollecteForm.description.value,
            status: "À venir",
            participants: 0,
            waste: null,
            points: null
        };

        // Add to collectes array
        collectes.push(newCollecte);
        
        // Update display
        displayCollectes(collectes);
        
        // Close popup and reset form
        closeCollectePopup();
    });

    // Profile popup elements
    const profileCollectePopup = document.getElementById('profileCollectePopup');
    const profileCollecteForm = document.getElementById('profileCollecteForm');
    const editCollecteBtn = document.getElementById('editCollecteBtn');
    const saveCollecteBtn = document.getElementById('saveCollecteBtn');
    const deleteCollecteBtn = document.getElementById('deleteCollecteBtn');
    let currentCollecteIndex = -1;

    // Function to show collecte profile popup
    function showCollecteProfile(collecte, index) {
        currentCollecteIndex = index;
        
        // Update header content
        document.getElementById('collecte-title').textContent = collecte.name;
        document.getElementById('collecte-datetime').textContent = formatDateTime(collecte.date, collecte.time);
        
        // Fill form with collecte data
        profileCollecteForm.date.value = collecte.date;
        profileCollecteForm.time.value = collecte.time;
        profileCollecteForm.location.value = collecte.location;
        profileCollecteForm.description.value = collecte.description;

        // Update status information
        document.getElementById('collecte-status').textContent = collecte.status;
        document.getElementById('collecte-participants').textContent = collecte.participants;

        // Show/hide and update results section based on status
        const resultsSection = document.querySelector('.collecte-results');
        if (collecte.status === 'Terminé') {
            resultsSection.style.display = 'block';
            document.getElementById('collecte-waste').value = collecte.waste;
            document.getElementById('collecte-points').value = collecte.points;
        } else {
            resultsSection.style.display = 'none';
        }

        // Set all inputs to readonly initially
        Array.from(profileCollecteForm.elements).forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                input.readOnly = true;
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
                input.readOnly = false;
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
            const updatedCollecte = {
                ...collectes[currentCollecteIndex],
                date: profileCollecteForm.date.value,
                time: profileCollecteForm.time.value,
                location: profileCollecteForm.location.value,
                description: profileCollecteForm.description.value,
                name: document.getElementById('collecte-title').textContent,
                status: document.getElementById('collecte-status').textContent,
                participants: parseInt(document.getElementById('collecte-participants').textContent),
                waste: document.getElementById('collecte-waste').value ? parseInt(document.getElementById('collecte-waste').value) : null,
                points: document.getElementById('collecte-points').value ? parseInt(document.getElementById('collecte-points').value) : null
            };

            // 2. Save to database (simulated for now)
            // TODO: Replace with actual API call
            // await saveCollecteToDatabase(updatedCollecte);
            
            // 3. Update local data
            collectes[currentCollecteIndex] = updatedCollecte;
            
            // 4. Lock all fields
            Array.from(profileCollecteForm.elements).forEach(input => {
                if (input.type !== 'button' && input.type !== 'submit') {
                    input.readOnly = true;
                }
            });
            
            // 5. Show edit button, hide save button
            editCollecteBtn.style.display = 'block';
            saveCollecteBtn.style.display = 'none';

            // 6. Update display
            displayCollectes(collectes);

            // 7. Close popup
            closeCollecteProfilePopup();

        } catch (error) {
            // Handle any errors that occur during save
            console.error('Error saving collecte:', error);
            alert('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
        }
    });

    // Handle delete button click
    deleteCollecteBtn.addEventListener('click', () => {
        if (currentCollecteIndex === -1) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer cette collecte ?')) {
            collectes.splice(currentCollecteIndex, 1);
            displayCollectes(collectes);
            closeCollecteProfilePopup();
        }
    });

    // Section tabs management
    const sectionTabs = document.querySelectorAll('.section-tab');
    const managementSections = document.querySelectorAll('.management-section');

    sectionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.dataset.section;
            
            // Update active states
            sectionTabs.forEach(t => t.classList.remove('active'));
            managementSections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${targetSection}-section`).classList.add('active');
        });
    });
});