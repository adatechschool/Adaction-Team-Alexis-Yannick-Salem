document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupCity = document.getElementById('signup-city');
    const citiesList = document.getElementById('cities-list');

    // Function to clear form fields
    function clearForm(form) {
        form.reset();
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
        });
    }

    // Clear forms on page load
    clearForm(loginForm);
    clearForm(signupForm);
    citiesList.innerHTML = '';

    // Clear forms when switching tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            authForms.forEach(form => {
                clearForm(form);
            });
        });
    });

    // Clear forms before unload (page change/reload)
    window.addEventListener('beforeunload', () => {
        clearForm(loginForm);
        clearForm(signupForm);
        citiesList.innerHTML = '';
    });

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Fetch cities from API
    async function searchCities(query) {
        if (query.length < 3) return [];
        
        try {
            const response = await fetch(`https://geo.api.gouv.fr/communes?nom=${query}&limit=5`);
            const cities = await response.json();
            return cities;
        } catch (error) {
            console.error('Error fetching cities:', error);
            return [];
        }
    }

    // Update datalist options
    function updateCityOptions(cities) {
        citiesList.innerHTML = '';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = `${city.nom} (${city.codeDepartement})`;
            citiesList.appendChild(option);
        });
    }

    // Handle city search
    const handleCitySearch = debounce(async (event) => {
        const query = event.target.value.trim();
        if (query.length >= 3) {
            const cities = await searchCities(query);
            updateCityOptions(cities);
        }
    }, 300);

    // Add event listener for city search
    signupCity.addEventListener('input', handleCitySearch);

    // Handle tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and forms
            tabButtons.forEach(btn => btn.classList.remove('active'));
            authForms.forEach(form => form.classList.remove('active'));

            // Add active class to clicked button and corresponding form
            button.classList.add('active');
            const formId = `${button.dataset.tab}-form`;
            document.getElementById(formId).classList.add('active');
        });
    });

    // Mock user database (replace with actual backend authentication)
    const mockUsers = {
        associations: [
            { username: 'ecoasso', password: 'password123', name: 'EcoAssociation' }
        ],
        benevoles: [
            { username: 'benevolej', password: 'password123', name: 'Jean' }
        ]
    };

    // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Check in associations
        const associationUser = mockUsers.associations.find(user => 
            user.username === username && user.password === password
        );

        if (associationUser) {
            // Store user info if needed
            sessionStorage.setItem('userType', 'association');
            sessionStorage.setItem('username', username);
            window.location.href = '/associations/dashboard';
            return;
        }

        // Check in benevoles
        const benevoleUser = mockUsers.benevoles.find(user => 
            user.username === username && user.password === password
        );

        if (benevoleUser) {
            // Store user info if needed
            sessionStorage.setItem('userType', 'benevole');
            sessionStorage.setItem('username', username);
            window.location.href = '/benevoles/today';
            return;
        }

        // If no user found
        alert('Nom d\'utilisateur ou mot de passe incorrect');
    });

    // Handle signup type switching
    const signupTypeBtns = document.querySelectorAll('.signup-tab-btn');
    const signupSections = document.querySelectorAll('.signup-section');

    signupTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const signupType = btn.dataset.signup;
            
            // Update active states
            signupTypeBtns.forEach(b => b.classList.remove('active'));
            signupSections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${signupType}-signup`).classList.add('active');

            // Clear form fields when switching
            clearForm(signupForm);
        });
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeSection = document.querySelector('.signup-section.active');
        const formType = activeSection.querySelector('.submit-btn').dataset.type;

        if (formType === 'benevole') {
            const name = document.getElementById('signup-name').value;
            const username = document.getElementById('signup-username').value;
            const city = document.getElementById('signup-city').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas!');
                return;
            }

            // Check if username already exists
            if (mockUsers.benevoles.some(user => user.username === username) ||
                mockUsers.associations.some(user => user.username === username)) {
                alert('Ce nom d\'utilisateur est déjà pris');
                return;
            }

            // Add new user to mock database (replace with actual backend call)
            mockUsers.benevoles.push({
                username,
                password,
                name,
                city
            });

            // Store user info and redirect
            sessionStorage.setItem('userType', 'benevole');
            sessionStorage.setItem('username', username);
            window.location.href = '/benevoles/today';
        } else {
            const name = document.getElementById('signup-asso-name').value;
            const sigle = document.getElementById('signup-asso-sigle').value;
            const username = document.getElementById('signup-asso-username').value;
            const password = document.getElementById('signup-asso-password').value;
            const confirmPassword = document.getElementById('signup-asso-confirm-password').value;

            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas!');
                return;
            }

            // Check if username already exists
            if (mockUsers.benevoles.some(user => user.username === username) ||
                mockUsers.associations.some(user => user.username === username)) {
                alert('Ce nom d\'utilisateur est déjà pris');
                return;
            }

            // Add new user to mock database (replace with actual backend call)
            mockUsers.associations.push({
                username,
                password,
                name,
                sigle
            });

            // Store user info and redirect
            sessionStorage.setItem('userType', 'association');
            sessionStorage.setItem('username', username);
            window.location.href = '/associations/dashboard';
        }
    });
});