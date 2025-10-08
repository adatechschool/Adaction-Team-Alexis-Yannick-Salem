const API_BASE_URL = 'http://192.168.7.103:3000';
let benevoles = []; // Declare benevoles variable

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

    async function populateLocationSelect(selectElement) {
        try {
            const response = await fetch(`${API_BASE_URL}/ville`);
            if (!response.ok) {
                throw new Error('Failed to fetch villes');
            }
            const villes = await response.json();

            selectElement.innerHTML = '<option value="">Sélectionner une ville</option>';
            villes.forEach(ville => {
                const option = document.createElement('option');
                option.value = ville.id; // Use ID as value
                option.textContent = ville.name;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching villes:', error);
        }
    }

    // Function to populate the cards with bénévoles data
    async function displayBenevoles() {
        try {
            const cardsContainer = document.querySelector('.benevoles-cards');
            
            // Clear existing cards
            cardsContainer.innerHTML = '';
            
            // Fetch backend data here
            const response = await fetch(`${API_BASE_URL}/benevole/villes`);
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la récupération des bénévoles');
            }
            
            const data = await response.json();

            // Store data in benevoles array
            benevoles = data;

            // Add each bénévole as a card
            data.forEach((benevole, index) => {
                const card = document.createElement('div');
                card.className = 'benevole-card';
                
                const benevoleInfo = document.createElement('div');
                benevoleInfo.className = 'benevole-info';
                
                const benevoleName = document.createElement('div');
                benevoleName.className = 'benevole-name';
                benevoleName.textContent = `${benevole.first_name} ${benevole.last_name}`;
                
                const benevoleCity = document.createElement('div');
                benevoleCity.className = 'benevole-city';
                benevoleCity.textContent = benevole.ville_name;
                
                const benevolePoints = document.createElement('div');
                benevolePoints.className = 'benevole-points';
                benevolePoints.textContent = `${benevole.points_collectes} points`;
                
                benevoleInfo.appendChild(benevoleName);
                benevoleInfo.appendChild(benevoleCity);
                benevoleInfo.appendChild(benevolePoints);
                
                const cardActions = document.createElement('div');
                cardActions.className = 'card-actions';
                
                const viewBtn = document.createElement('button');
                viewBtn.className = 'action-button view-btn';
                viewBtn.setAttribute('data-index', index);
                viewBtn.textContent = 'Voir profil';
                viewBtn.addEventListener('click', () => showProfile(benevole, index));
                
                cardActions.appendChild(viewBtn);
                card.appendChild(benevoleInfo);
                card.appendChild(cardActions);
                cardsContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error displaying benevoles:', error);
            alert('Erreur lors du chargement des bénévoles');
        }
    }

    // Initial display of bénévoles
    displayBenevoles().catch(error => {
        console.error('Error during initial display:', error);
    });

    // Handle search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.benevole-card');
            
            cards.forEach((card, index) => {
                const benevole = benevoles[index];
                const name = `${benevole.first_name} ${benevole.last_name}`.toLowerCase();
                const city = (benevole.ville_name || '').toLowerCase();
                
                if (name.includes(searchTerm) || city.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Popup management
    const popup = document.getElementById('addBenevolePopup');
    const addButton = document.querySelector('.action-btn');
    const form = document.getElementById('addBenevoleForm');

    // Show popup when clicking the add button
    if (addButton) {
        addButton.addEventListener('click', async () => {
            popup.style.display = 'flex';
            // Populate city dropdown with all cities from API
            await populateLocationSelect(document.getElementById('benevole-city'));
        });
    }

    // Close popup function (make it global for the cancel button)
    window.closePopup = function() {
        popup.style.display = 'none';
        form.reset();
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if a city was selected
        const cityValue = document.getElementById('benevole-city').value;
        if (!cityValue) {
            alert('Veuillez sélectionner une ville dans la liste');
            return;
        }

        try {
            const resp = await fetch(`${API_BASE_URL}/benevole/signup`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: form.username.value,
                    password: form.password.value,
                    first_name: form.first_name.value,
                    last_name: form.last_name.value,
                    id_ville: Number(cityValue),
                    points_collectes: 0,
                })
            });
            
            if (!resp.ok) {
                const error = await resp.json();
                alert(error.error || 'Erreur lors de l\'ajout du bénévole');
                return;
            }

            // Update display
            await displayBenevoles();
            
            // Close popup and reset form
            closePopup();
            
            alert('Bénévole ajouté avec succès!');
        } catch (error) {
            console.error('Error adding benevole:', error);
            alert('Erreur lors de l\'ajout du bénévole');
        }
    });

    // Profile popup elements
    const profilePopup = document.getElementById('profileBenevolePopup');
    const profileForm = document.getElementById('profileBenevoleForm');
    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const deleteBtn = document.getElementById('deleteProfileBtn');
    let currentBenevoleId = -1; // Store ID instead of index

    // Check if profile elements exist
    if (!profilePopup || !profileForm || !editBtn || !saveBtn || !deleteBtn) {
        console.error('Profile popup elements not found');
        return;
    }

    // Function to show profile popup
    async function showProfile(benevole, index) {
        currentBenevoleId = benevole.id; // Store ID instead of index
        
        // Fill form with benevole data
        profileForm.elements.username.value = benevole.username;
        profileForm.elements.first_name.value = benevole.first_name;
        profileForm.elements.last_name.value = benevole.last_name;
        profileForm.elements.points.value = benevole.points_collectes;

        // Populate city dropdown
        const citySelect = profileForm.querySelector('#profile-benevole-city');
        if (citySelect) {
            await populateLocationSelect(citySelect);
            // Set selected city
            if (benevole.id_ville) {
                citySelect.value = benevole.id_ville;
            }
        }

        // Set all inputs to readonly initially
        Array.from(profileForm.elements).forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                if (input.tagName.toLowerCase() === 'select') {
                    input.disabled = true;
                } else {
                    input.readOnly = true;
                }
            }
        });

        // Show edit button, hide save button
        editBtn.style.display = 'block';
        saveBtn.style.display = 'none';

        // Show popup
        profilePopup.style.display = 'flex';
    }

    // Close profile popup function
    window.closeProfilePopup = function() {
        if (profilePopup) {
            profilePopup.style.display = 'none';
        }
        if (profileForm) {
            profileForm.reset();
        }
    }

    // Handle edit button click
    editBtn.addEventListener('click', () => {
        // Make fields editable
        Array.from(profileForm.elements).forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit' && input.name !== 'points') {
                if (input.tagName.toLowerCase() === 'select') {
                    input.disabled = false;
                } else {
                    input.readOnly = false;
                }
            }
        });

        // Show save button, hide edit button
        editBtn.style.display = 'none';
        saveBtn.style.display = 'block';
    });

    // Handle save button click
    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (currentBenevoleId === -1) return;

        try {
            // Find current benevole by ID
            const currentBenevole = benevoles.find(b => b.id === currentBenevoleId);
            if (!currentBenevole) {
                alert('Bénévole introuvable');
                return;
            }
            
            // 1. Gather all form data - only send changed fields
            const updatedBenevole = {};
            
            // Only include username if it changed
            const newUsername = profileForm.elements.username.value.trim();
            if (newUsername !== currentBenevole.username) {
                updatedBenevole.username = newUsername;
            }
            
            // Only include first_name if it changed
            const newFirstName = profileForm.elements.first_name.value.trim();
            if (newFirstName !== currentBenevole.first_name) {
                updatedBenevole.first_name = newFirstName;
            }
            
            // Only include last_name if it changed
            const newLastName = profileForm.elements.last_name.value.trim();
            if (newLastName !== currentBenevole.last_name) {
                updatedBenevole.last_name = newLastName;
            }
            
            // Only include id_ville if it changed
            const newIdVille = Number(profileForm.querySelector('#profile-benevole-city').value);
            if (newIdVille !== currentBenevole.id_ville) {
                updatedBenevole.id_ville = newIdVille;
            }
            
            // Check if there's anything to update
            if (Object.keys(updatedBenevole).length === 0) {
                alert('Aucune modification détectée');
                return;
            }

            // 2. Send PATCH request to API
            const response = await fetch(`${API_BASE_URL}/benevole/${currentBenevole.id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updatedBenevole)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update benevole');
            }
            
            // 4. Lock all fields
            Array.from(profileForm.elements).forEach(input => {
                if (input.type !== 'button' && input.type !== 'submit') {
                    if (input.tagName.toLowerCase() === 'select') {
                        input.disabled = true;
                    } else {
                        input.readOnly = true;
                    }
                }
            });
            
            // 5. Show edit button, hide save button
            editBtn.style.display = 'block';
            saveBtn.style.display = 'none';

            await closeProfilePopup();

            // 6. Update display
            await displayBenevoles();
            
            alert('Bénévole mis à jour avec succès!');

        } catch (error) {
            // Handle any errors that occur during save
            console.error('Error saving benevole:', error);
            alert('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
        }
    });

    // Handle delete button click
    deleteBtn.addEventListener('click', async () => {
        if (currentBenevoleId === -1) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer ce bénévole ?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/benevole/${currentBenevoleId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete benevole');
                }

                await displayBenevoles();
                closeProfilePopup();
                
                alert('Bénévole supprimé avec succès!');
            } catch (error) {
                console.error('Error deleting benevole:', error);
                alert('Erreur lors de la suppression du bénévole');
            }
        }
    });
});