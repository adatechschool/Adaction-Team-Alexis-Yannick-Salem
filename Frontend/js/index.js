document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupCity = document.getElementById('signup-city');
    const citiesList = document.getElementById('cities-list');

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
            const response = await fetch(`http://192.168.7.103:3000/ville?nom=${query}&limit=5`);
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
            option.value = `${city.name}`;
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
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('http://192.168.7.103:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la connexion');
            }

            // Determine user type based on response data
            // If sigle exists, it's an association, otherwise it's a benevole
            const userType = data.sigle ? 'association' : 'benevole';

            // Store user info in session
            sessionStorage.setItem('userType', userType);
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('userData', JSON.stringify(data));

            // Redirect based on user type and include user ID in URL
            if (userType === 'association') {
                window.location.href = `/associations/dashboard&id=${data.id}`;
            } else {
                window.location.href = `/benevoles/today&id=${data.id}`;
            }

        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Nom d\'utilisateur ou mot de passe incorrect');
        }
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', async (e) => {
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

            try {
                const response = await fetch('http://192.168.7.103:3000/benevole/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        password,
                        first_name: name,
                        last_name: '',  // Add this field if needed
                        id_ville: city // You might need to get the actual city ID
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error during signup');
                }

                // Store user info and redirect
                sessionStorage.setItem('userType', 'benevole');
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('userData', JSON.stringify(data));
                window.location.href = `/benevoles/today&id=${data.id}`;
            } catch (error) {
                console.error('Signup error:', error);
                alert(error.message || 'Error during signup');
            }
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
            try {
                const response = await fetch('http://192.168.7.103:3000/associations/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        password,
                        name,
                        sigle
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error during signup');
                }

                // Store user info and redirect
                sessionStorage.setItem('userType', 'association');
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('userData', JSON.stringify(data));
                window.location.href = `/associations/dashboard&id=${data.id}`;
            } catch (error) {
                console.error('Signup error:', error);
                alert(error.message || 'Error during signup');
            }

            // Store user info and redirect
            sessionStorage.setItem('userType', 'association');
            sessionStorage.setItem('username', username);
            window.location.href = '/associations/dashboard';
        }
    });
});