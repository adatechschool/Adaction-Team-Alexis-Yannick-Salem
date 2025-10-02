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

    // Example bénévoles data (to be replaced with real data)
    const benevoles = [
        { 
            username: 'jdupont',
            first_name: 'Jean',
            last_name: 'Dupont',
            name: 'Jean Dupont',
            city: 'Paris',
            points: 150 
        },
        { 
            username: 'mcurie',
            first_name: 'Marie',
            last_name: 'Curie',
            name: 'Marie Curie',
            city: 'Lyon',
            points: 200 
        },
        { 
            username: 'pmartin',
            first_name: 'Paul',
            last_name: 'Martin',
            name: 'Paul Martin',
            city: 'Marseille',
            points: 120 
        },
    ];

    // Function to populate the cards with bénévoles data
    function displayBenevoles(benevolesList) {
        const cardsContainer = document.querySelector('.benevoles-cards');
        
        // Clear existing cards
        cardsContainer.innerHTML = '';
        
        // Add each bénévole as a card
        benevolesList.forEach((benevole, index) => {
            const card = document.createElement('div');
            card.className = 'benevole-card';
            card.innerHTML = `
                <div class="benevole-info">
                    <div class="benevole-name">${benevole.name}</div>
                    <div class="benevole-city">${benevole.city}</div>
                    <div class="benevole-points">${benevole.points} points</div>
                </div>
                <div class="card-actions">
                    <button class="action-button view-btn" data-index="${index}">
                        Voir profil
                    </button>
                </div>
            `;
            card.querySelector('.view-btn').addEventListener('click', () => showProfile(benevole, index));
            cardsContainer.appendChild(card);
        });
    }

    // Initial display of bénévoles
    displayBenevoles(benevoles);

    // Handle search functionality
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBenevoles = benevoles.filter(benevole => 
            benevole.name.toLowerCase().includes(searchTerm) ||
            benevole.city.toLowerCase().includes(searchTerm)
        );
        displayBenevoles(filteredBenevoles);
    });

    // Popup management
    const popup = document.getElementById('addBenevolePopup');
    const addButton = document.querySelector('.action-btn');
    const form = document.getElementById('addBenevoleForm');

    // Show popup when clicking the add button
    addButton.addEventListener('click', () => {
        popup.style.display = 'flex';
    });

    // Close popup function (make it global for the cancel button)
    window.closePopup = function() {
        popup.style.display = 'none';
        form.reset();
    }

    // City search functionality
    const citySearch = document.getElementById('citySearch');
    const cityResults = document.getElementById('cityResults');
    const cityInput = document.getElementById('city');
    let debounceTimer;

    citySearch.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const searchTerm = e.target.value;

        if (searchTerm.length < 3) {
            cityResults.innerHTML = '';
            cityResults.classList.remove('active');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`https://geo.api.gouv.fr/communes?nom=${searchTerm}&boost=population&limit=5`);
                const cities = await response.json();
                
                cityResults.innerHTML = '';
                if (cities.length > 0) {
                    cities.forEach(city => {
                        const div = document.createElement('div');
                        div.className = 'city-option';
                        div.textContent = `${city.nom} (${city.codeDepartement})`;
                        div.addEventListener('click', () => {
                            citySearch.value = `${city.nom} (${city.codeDepartement})`;
                            cityInput.value = city.nom;
                            cityResults.classList.remove('active');
                        });
                        cityResults.appendChild(div);
                    });
                    cityResults.classList.add('active');
                } else {
                    cityResults.classList.remove('active');
                }
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        }, 300);
    });

    // Hide city results when clicking outside
    document.addEventListener('click', (e) => {
        if (!citySearch.contains(e.target) && !cityResults.contains(e.target)) {
            cityResults.classList.remove('active');
        }
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Check if a city was selected
        if (!cityInput.value) {
            alert('Veuillez sélectionner une ville dans la liste');
            return;
        }

        const newBenevole = {
            username: form.username.value,
            first_name: form.first_name.value,
            last_name: form.last_name.value,
            name: `${form.first_name.value} ${form.last_name.value}`,
            city: cityInput.value,
            points: 0,
        };

        // Add to benevoles array
        benevoles.push(newBenevole);
        
        // Update display
        displayBenevoles(benevoles);
        
        // Close popup and reset form
        closePopup();
    });

    // Profile popup elements
    const profilePopup = document.getElementById('profileBenevolePopup');
    const profileForm = document.getElementById('profileBenevoleForm');
    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const deleteBtn = document.getElementById('deleteProfileBtn');
    let currentBenevoleIndex = -1;

    // Function to show profile popup
    function showProfile(benevole, index) {
        currentBenevoleIndex = index;
        
        // Fill form with benevole data
        profileForm.elements.username.value = benevole.username;
        profileForm.elements.first_name.value = benevole.first_name;
        profileForm.elements.last_name.value = benevole.last_name;
        profileForm.elements.citySearch.value = `${benevole.city}`;
        profileForm.elements.city.value = benevole.city;
        profileForm.elements.points.value = benevole.points;

        // Set all inputs to readonly initially
        Array.from(profileForm.elements).forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                input.readOnly = true;
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
        profilePopup.style.display = 'none';
        profileForm.reset();
    }

    // Handle edit button click
    editBtn.addEventListener('click', () => {
        // Make fields editable
        Array.from(profileForm.elements).forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit' && input.name !== 'points') {
                input.readOnly = false;
            }
        });

        // Show save button, hide edit button
        editBtn.style.display = 'none';
        saveBtn.style.display = 'block';
    });

    // Handle save button click
    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (currentBenevoleIndex === -1) return;

        try {
            // 1. Gather all form data
            const updatedBenevole = {
                username: profileForm.elements.username.value,
                first_name: profileForm.elements.first_name.value,
                last_name: profileForm.elements.last_name.value,
                name: `${profileForm.elements.first_name.value} ${profileForm.elements.last_name.value}`,
                city: profileForm.elements.city.value,
                points: parseInt(profileForm.elements.points.value),
            };

            // 2. Save to database (simulated for now)
            // TODO: Replace with actual API call
            // await saveBenevoleToDatabase(updatedBenevole);
            
            // 3. Update local data
            benevoles[currentBenevoleIndex] = updatedBenevole;
            
            // 4. Lock all fields
            Array.from(profileForm.elements).forEach(input => {
                if (input.type !== 'button' && input.type !== 'submit') {
                    input.readOnly = true;
                }
            });
            
            // 5. Show edit button, hide save button
            editBtn.style.display = 'block';
            saveBtn.style.display = 'none';

            // 6. Update display
            displayBenevoles(benevoles);

        } catch (error) {
            // Handle any errors that occur during save
            console.error('Error saving benevole:', error);
            alert('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
        }
    });

    // Handle delete button click
    deleteBtn.addEventListener('click', () => {
        if (currentBenevoleIndex === -1) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer ce bénévole ?')) {
            benevoles.splice(currentBenevoleIndex, 1);
            displayBenevoles(benevoles);
            closeProfilePopup();
        }
    });
});