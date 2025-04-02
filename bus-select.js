document.addEventListener('DOMContentLoaded', () => {
    // Get all elements that need animation
    const header = document.querySelector('.fade-in');
    const locationCard = document.querySelector('.fade-in-second');
    const placeholderText = document.querySelector('.slide-up');
    const typingText = document.querySelector('.typing-text');

    // Text to be typed
    const textToType = "Please input the location you're currently at and the destination you'd like to reach to show the routes.";
    let charIndex = 0;

    // Function to add active class with delay
    const animateWithDelay = (element, delay) => {
        setTimeout(() => {
            element.classList.add('active');
        }, delay);
    };

    // Typing animation function
    const typeText = () => {
        if (charIndex < textToType.length) {
            typingText.textContent += textToType.charAt(charIndex);
            charIndex++;
            setTimeout(typeText, 15); // Adjust typing speed here (lower number = faster)
        }
    };

    // Sequence the animations
    // 1. Fade in header (BUS title and buttons)
    animateWithDelay(header, 100);

    // 2. Fade in location card (From/To container)
    animateWithDelay(locationCard, 600);

    // 3. Slide up placeholder text while location card is still fading in
    animateWithDelay(placeholderText, 800);

    // 4. Start typing animation after placeholder slides up
    setTimeout(typeText, 1600);

    // Debounce function to limit API calls
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

    // Handle search button visibility and functionality
    const searchButton = document.getElementById('search-routes');
    const searchContainer = searchButton.parentElement;
    const busInput = document.querySelector('input[placeholder="Bus Number"]');

    function updateSearchButtonState() {
        const busValue = busInput.value.trim();
        const placeholderText = document.querySelector('.placeholder-text');
        
        if (busValue) {
            // First, show the search container
            searchContainer.classList.add('active');
            
            // After a small delay, show the button and move the placeholder
            setTimeout(() => {
                searchButton.classList.add('active');
                // Move the placeholder text up
                placeholderText.classList.add('search-active');
            }, 100);
        } else {
            // First, hide the button and move the placeholder back
            searchButton.classList.remove('active');
            placeholderText.classList.remove('search-active');
            
            // After the button fades out, hide the container
            setTimeout(() => {
                searchContainer.classList.remove('active');
            }, 300);
        }
    }

    // Function to handle input text overflow
    function handleInputOverflow(input) {
        const text = input.value;
        if (text.length > 30) {  // Show ellipsis if text is too long
            input.title = text;  // Show full text on hover
        } else {
            input.title = '';
        }
    }

    // Add input handler for text overflow
    busInput.addEventListener('input', () => {
        handleInputOverflow(busInput);
        updateSearchButtonState();
    });

    // Function to format ETA time
    function formatETA(etaTime) {
        if (!etaTime) return null;
        const eta = new Date(etaTime);
        const now = new Date();
        const diffMinutes = Math.round((eta - now) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Arriving';
        return `${diffMinutes} mins`;
    }

    // Function to fetch ETA for a specific route
    async function fetchETA(route, serviceType) {
        try {
            const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-eta/${route}/${serviceType}`);
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching ETA:', error);
            return [];
        }
    }

    // Function to update ETA display
    async function updateETA(routeDiv, route, serviceType) {
        const etaContainer = routeDiv.querySelector('.eta-container');
        if (!etaContainer) return;

        const etas = await fetchETA(route, serviceType);
        etaContainer.innerHTML = '';

        if (etas.length > 0) {
            const nextThreeEtas = etas
                .map(eta => formatETA(eta.eta))
                .filter(time => time !== null)
                .slice(0, 3);

            if (nextThreeEtas.length > 0) {
                nextThreeEtas.forEach((time, index) => {
                    const etaItem = document.createElement('div');
                    etaItem.className = 'eta-item';
                    etaItem.innerHTML = `
                        <span class="eta-label">Next bus:</span>
                        <span class="eta-time">${time}</span>
                    `;
                    etaContainer.appendChild(etaItem);
                });
            } else {
                etaContainer.innerHTML = '<div class="no-eta">No estimated arrival times available</div>';
            }
        } else {
            etaContainer.innerHTML = '<div class="no-eta">No estimated arrival times available</div>';
        }
    }

    // Handle search button click
    searchButton.addEventListener('click', async () => {
        const busNumber = busInput.value.trim();
        
        if (busNumber) {
            try {
                // Update button text to "Searching..."
                searchButton.textContent = 'Searching...';
                searchButton.disabled = true;
                
                const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
                const data = await response.json();
                const routes = data.data || [];
                
                // Filter routes for the selected bus number
                const matchingRoutes = routes.filter(route => route.route === busNumber);
                
                // Display the results
                const resultsContainer = document.getElementById('route-results');
                resultsContainer.innerHTML = '';
                
                if (matchingRoutes.length > 0) {
                    const header = document.createElement('div');
                    header.className = 'route-header';
                    header.textContent = `Bus Route ${busNumber}`;
                    resultsContainer.appendChild(header);
                    
                    for (const route of matchingRoutes) {
                        const routeDiv = document.createElement('div');
                        routeDiv.className = 'route-details';
                        
                        const direction = route.bound === 'O' ? 'Outbound' : 'Inbound';
                        
                        routeDiv.innerHTML = `
                            <button class="refresh-button">
                                ↻ Refresh ETA
                            </button>
                            <div class="direction-label">${direction}</div>
                            <div class="route-path">${route.orig_en} → ${route.dest_en}</div>
                            <div class="route-path-tc">${route.orig_tc} → ${route.dest_tc}</div>
                            <div class="eta-container">
                                <div class="no-eta">Loading arrival times...</div>
                            </div>
                        `;
                        
                        resultsContainer.appendChild(routeDiv);

                        // Add click event listener to refresh button
                        const refreshButton = routeDiv.querySelector('.refresh-button');
                        refreshButton.addEventListener('click', () => {
                            updateETA(routeDiv, route.route, route.service_type);
                        });
                        
                        // Fetch initial ETA
                        updateETA(routeDiv, route.route, route.service_type);
                    }
                    
                    // Show the results container
                    resultsContainer.classList.add('active');
                    
                    // Hide the placeholder text
                    document.querySelector('.placeholder-text').style.display = 'none';

                    // Reset search button
                    searchButton.textContent = 'Search Routes';
                    searchButton.disabled = false;

                    // Hide the search container
                    searchContainer.classList.remove('active');
                } else {
                    resultsContainer.innerHTML = `
                        <div class="route-header">No routes found</div>
                        <div class="route-details">
                            <div class="route-path">No bus routes found for number ${busNumber}</div>
                        </div>
                    `;
                    resultsContainer.classList.add('active');

                    // Reset search button
                    searchButton.textContent = 'Search Routes';
                    searchButton.disabled = false;
                }
            } catch (error) {
                console.error('Error fetching route details:', error);
                const resultsContainer = document.getElementById('route-results');
                resultsContainer.innerHTML = `
                    <div class="route-header">Error</div>
                    <div class="route-details">
                        <div class="route-path">Failed to fetch route details. Please try again.</div>
                    </div>
                `;
                resultsContainer.classList.add('active');

                // Reset search button
                searchButton.textContent = 'Search Routes';
                searchButton.disabled = false;
            }
        }
    });

    // Function to fetch suggestions from KMB API
    async function fetchSuggestions(query) {
        try {
            // KMB API endpoint for all routes
            const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
            const data = await response.json();
            const routes = data.data || [];
            
            // Filter routes based on bus number
            const filteredRoutes = routes.filter(route => {
                const routeNumber = route.route.toLowerCase();
                const searchQuery = query.toLowerCase();
                
                return routeNumber.includes(searchQuery);
            });
            
            // Limit results to top 10 matches
            return filteredRoutes.slice(0, 10);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    }

    // Function to display suggestions
    function displaySuggestions(suggestions) {
        const container = document.getElementById('bus-suggestions');
        container.innerHTML = '';
        
        if (suggestions.length === 0) {
            container.classList.remove('active');
            return;
        }

        suggestions.forEach(route => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            const routeNumber = route.route;
            
            div.innerHTML = `
                <div class="location-name">Route ${routeNumber}</div>
            `;
            
            div.addEventListener('click', () => {
                busInput.value = routeNumber;
                container.classList.remove('active');
                updateSearchButtonState();
            });
            
            container.appendChild(div);
        });
        
        container.classList.add('active');
    }

    // Handle input for bus number field
    const handleBusInput = debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
            document.getElementById('bus-suggestions').classList.remove('active');
            return;
        }
        
        const suggestions = await fetchSuggestions(query);
        displaySuggestions(suggestions);
    }, 300);

    busInput.addEventListener('input', handleBusInput);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const busSuggestions = document.getElementById('bus-suggestions');
        
        if (!busInput.contains(e.target) && !busSuggestions.contains(e.target)) {
            busSuggestions.classList.remove('active');
        }
    });
}); 
