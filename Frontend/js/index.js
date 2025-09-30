document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupCity = document.getElementById('signup-city');
    const citiesList = document.getElementById('cities-list');

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

    // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // TODO: Add actual login logic here
        console.log('Login attempt:', { username, password });
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const username = document.getElementById('signup-username').value;
        const city = document.getElementById('signup-city').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas!');
            return;
        }

        // TODO: Add actual signup logic here
        console.log('Signup attempt:', { name, username, city, password });
    });
});