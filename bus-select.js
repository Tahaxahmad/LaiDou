document.addEventListener('DOMContentLoaded', () => {
    // Get all elements that need animation
    const header = document.querySelector('.fade-in');
    const locationCard = document.querySelector('.fade-in-second');
    const placeholderText = document.querySelector('.slide-up');
    const typingText = document.querySelector('.typing-text');

    // Text to be typed
    const textToType = "Please input a bus number to see the ETA information for all stops along that route.";
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

    // Function to make API calls with proper error handling
    async function fetchAPI(url) {
        try {
            // Try with CORS proxy if needed
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                referrerPolicy: 'no-referrer'
            }).catch(async () => {
                // If direct fetch fails, try with proxy
                console.log('Direct fetch failed, trying with proxy...');
                return await fetch(proxyUrl + url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Origin': window.location.origin
                    },
                    referrerPolicy: 'no-referrer'
                });
            });
            
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}, url: ${url}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data || !data.data) {
                console.error('Invalid API response format:', data);
                throw new Error('Invalid API response format');
            }
            return data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            throw error;
        }
    }

    // Function to fetch route stops
    async function fetchRouteStops(route, direction, serviceType) {
        try {
            // Fetch all route-stops
            const routeStopData = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route-stop');
            const allRouteStops = routeStopData.data || [];

            // Filter for our specific route
            const routeStops = allRouteStops.filter(stop => 
                stop.route === route && 
                stop.bound === direction && 
                stop.service_type === serviceType
            );

            if (routeStops.length === 0) {
                return [];
            }

            // Fetch all stops
            const stopData = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/stop');
            const allStops = stopData.data || [];

            // Map route stops to full stop details
            return routeStops
                .map(routeStop => {
                    const stopDetail = allStops.find(s => s.stop === routeStop.stop);
                    if (!stopDetail) return null;
                    return {
                        stop: routeStop.stop,
                        name_en: stopDetail.name_en,
                        name_tc: stopDetail.name_tc,
                        seq: routeStop.seq
                    };
                })
                .filter(stop => stop !== null)
                .sort((a, b) => a.seq - b.seq);
        } catch (error) {
            console.error('Error fetching route stops:', error);
            throw error;
        }
    }

    // Function to fetch ETA for a specific stop
    async function fetchStopETA(stopId, route, serviceType) {
        try {
            const data = await fetchAPI(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${serviceType}`);
            return data.data || [];
        } catch (error) {
            console.error('Error fetching stop ETA:', error);
            return [];
        }
    }

    // Function to update ETA display for a stop
    async function updateStopETA(stopItem, stopId, route, serviceType) {
        const etaContainer = stopItem.querySelector('.stop-eta');
        if (!etaContainer) return;

        try {
            console.log(`Fetching ETA for stop ${stopId}...`);
            const etas = await fetchStopETA(stopId, route, serviceType);
            console.log(`ETAs received for stop ${stopId}:`, etas);
            
        etaContainer.innerHTML = '';

            if (etas && etas.length > 0) {
            const nextThreeEtas = etas
                .map(eta => formatETA(eta.eta))
                .filter(time => time !== null)
                .slice(0, 3);

            if (nextThreeEtas.length > 0) {
                    nextThreeEtas.forEach(time => {
                        const etaBadge = document.createElement('div');
                        etaBadge.className = time === 'Arriving' ? 'eta-badge arriving' : 'eta-badge';
                        etaBadge.innerHTML = `<span>${time}</span>`;
                        etaContainer.appendChild(etaBadge);
                    });
                } else {
                    etaContainer.innerHTML = '<div class="eta-badge no-eta">No ETA available</div>';
                }
            } else {
                etaContainer.innerHTML = '<div class="eta-badge no-eta">No ETA available</div>';
            }
        } catch (error) {
            console.error(`Error updating ETA for stop ${stopId}:`, error);
            etaContainer.innerHTML = '<div class="eta-badge error">Error fetching ETA</div>';
        }
    }

    // Function to refresh all ETAs
    async function refreshAllETAs(route, direction, serviceType) {
        const stopItems = document.querySelectorAll('.stop-item');
        stopItems.forEach(stopItem => {
            const stopId = stopItem.dataset.stopId;
            updateStopETA(stopItem, stopId, route, serviceType);
        });
    }

    // Function to display route direction options
    function displayDirectionOptions(routes) {
        const resultsContainer = document.getElementById('route-results');
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('active');

        if (!routes || routes.length === 0) {
            resultsContainer.innerHTML = `
                <div class="route-header">No routes found</div>
                <div class="route-details">
                    <div class="route-path">No bus routes found for number ${busInput.value.trim()}</div>
                </div>
                <div class="button-container">
                    <button class="back-button">← Back to Search</button>
                </div>
            `;
            
            const backButton = resultsContainer.querySelector('.back-button');
            backButton.addEventListener('click', () => {
                resultsContainer.classList.remove('active');
                resultsContainer.innerHTML = '';
                const placeholderText = document.querySelector('.placeholder-text');
                placeholderText.style.display = 'block';
                placeholderText.style.opacity = '1';
                busInput.value = '';
                updateSearchButtonState();
            });
            return;
        }

        // Group routes by direction
        const firstRoute = routes[0];
        resultsContainer.innerHTML = `
            <div class="route-header">
                <div>${firstRoute.route}</div>
                <div class="route-path">${firstRoute.orig_tc} ↔ ${firstRoute.dest_tc}</div>
                <div class="route-path">${firstRoute.orig_en} ↔ ${firstRoute.dest_en}</div>
            </div>
            <div class="direction-options">
                ${routes.map(route => `
                    <div class="direction-option" data-route="${route.route}" data-bound="${route.bound}" data-service-type="${route.service_type}">
                        <div class="direction-header">${route.bound === 'O' ? 'Outbound' : 'Inbound'}</div>
                        <div class="direction-details">
                            <div>${route.orig_tc} → ${route.dest_tc}</div>
                            <div>${route.orig_en} → ${route.dest_en}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="button-container">
                <button class="back-button">← Back to Search</button>
            </div>
            <style>
                .direction-options {
                    margin-top: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .direction-option {
                    background: white;
                    padding: 15px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid #eee;
                }
                .direction-option:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .direction-header {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #1fd655;
                }
                .direction-details {
                    font-size: 14px;
                    color: #666;
                }
                .button-container {
                    margin-top: 20px;
                    text-align: left;
                }
                .back-button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    background: #f5f5f5;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 16px;
                    font-weight: normal;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .back-button:hover {
                    background: #e8e8e8;
                }
            </style>
        `;

        // Add click handlers for direction options
        const directionOptions = resultsContainer.querySelectorAll('.direction-option');
        directionOptions.forEach(option => {
            option.addEventListener('click', () => {
                const route = option.dataset.route;
                const bound = option.dataset.bound;
                const serviceType = option.dataset.service_type;
                showRouteETAs(route, bound, serviceType);
            });
        });

        // Add click handler for back button
        const backButton = resultsContainer.querySelector('.back-button');
        backButton.addEventListener('click', () => {
            resultsContainer.classList.remove('active');
            resultsContainer.innerHTML = '';
            const placeholderText = document.querySelector('.placeholder-text');
            placeholderText.style.display = 'block';
            placeholderText.style.opacity = '1';
            busInput.value = '';
            updateSearchButtonState();
        });
    }

    // Function to normalize route number (ensure capital letters)
    function normalizeRouteNumber(route) {
        return route.toUpperCase();
    }

    // Function to fetch suggestions from KMB API
    async function fetchSuggestions(query) {
        try {
            const data = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/');
            const routes = data.data || [];
            
            // Normalize the search query (ensure capital letters)
            const searchQuery = normalizeRouteNumber(query);
            
            // Filter routes based on bus number
            const filteredRoutes = routes.filter(route => {
                const routeNumber = normalizeRouteNumber(route.route);
                return routeNumber.includes(searchQuery);
            });
            
            console.log('Found matching routes:', filteredRoutes);
            
            // Limit results to top 10 matches
            return filteredRoutes.slice(0, 10);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    }

    // Handle search button click
    searchButton.addEventListener('click', async () => {
        const busNumber = normalizeRouteNumber(busInput.value.trim());
        
        if (busNumber) {
            try {
                searchButton.textContent = 'Searching...';
                searchButton.disabled = true;
                
                const data = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/');
                const routes = data.data || [];
                
                // Get all matching routes for the bus number
                const matchingRoutes = routes.filter(route => 
                    normalizeRouteNumber(route.route) === busNumber
                );
                
                // Show direction options
                displayDirectionOptions(matchingRoutes);
                
                searchButton.textContent = 'Search Bus';
                searchButton.disabled = false;
                searchContainer.classList.remove('active');
                    
                    // Hide the placeholder text
                const placeholderText = document.querySelector('.placeholder-text');
                placeholderText.style.display = 'none';
                placeholderText.style.opacity = '0';
            } catch (error) {
                console.error('Error fetching route details:', error);
                const resultsContainer = document.getElementById('route-results');
                resultsContainer.innerHTML = `
                    <div class="route-header">Error</div>
                    <div class="route-details">
                        <div class="route-path">Failed to fetch route details: ${error.message}</div>
                        <div class="route-path">Please try again or check your network connection.</div>
                    </div>
                `;
                resultsContainer.classList.add('active');
                searchButton.textContent = 'Search Bus';
                searchButton.disabled = false;
            }
        }
    });

    // Function to show ETAs for a selected route
    async function showRouteETAs(route, direction, serviceType) {
        const resultsContainer = document.getElementById('route-results');
        resultsContainer.innerHTML = `
            <div class="route-header">Loading route ${route}...</div>
            <div class="route-details">
                <div class="stop-list">
                    <div class="loading">Fetching route information...</div>
                </div>
            </div>
        `;
        resultsContainer.classList.add('active');
        
        try {
            // First try to fetch route information
            console.log('Fetching route information...');
            const routeData = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/');
            console.log('Route data received:', routeData);
            
            const routes = routeData.data || [];
            
            // Find all matching routes first (using normalized route numbers)
            const normalizedRoute = normalizeRouteNumber(route);
            const matchingRoutes = routes.filter(r => 
                normalizeRouteNumber(r.route) === normalizedRoute
            );
            console.log('Matching routes:', matchingRoutes);
            
            if (matchingRoutes.length === 0) {
                throw new Error(`No route found for ${route}`);
            }

            // If direction and service type are provided, use them to find exact match
            let matchingRoute;
            if (direction && serviceType) {
                matchingRoute = matchingRoutes.find(r => 
                    r.bound === direction && 
                    r.service_type === serviceType
                );
            } else {
                // Otherwise, just take the first route
                matchingRoute = matchingRoutes[0];
                direction = matchingRoute.bound;
                serviceType = matchingRoute.service_type;
            }

            if (!matchingRoute) {
                throw new Error(`No route found for ${route} with specified direction and service type`);
            }

            // Update header with route info
            resultsContainer.innerHTML = `
                <div class="route-header">
                    <div>${matchingRoute.route}</div>
                    <div class="route-path">${matchingRoute.orig_tc} → ${matchingRoute.dest_tc}</div>
                    <div class="route-path">${matchingRoute.orig_en} → ${matchingRoute.dest_en}</div>
                </div>
                <div class="route-details">
                    <div class="stop-list">
                        <div class="loading">Loading stops...</div>
                    </div>
                    <div class="button-container">
                        <button class="refresh-all-button">↻ Refresh All ETAs</button>
                        <button class="back-button">← Back to Search</button>
                    </div>
                </div>
            `;

            // Fetch and display stops
            console.log('Fetching route stops...');
            const stops = await fetchRouteStops(route, direction, serviceType);
            console.log('Stops received:', stops);
            
            const stopList = resultsContainer.querySelector('.stop-list');
            
            if (!stops || stops.length === 0) {
                stopList.innerHTML = '<div class="no-stops">No stops found for this route</div>';
                return;
            }

            // Display stops and fetch ETAs
            stopList.innerHTML = '';
            const stopPromises = stops.map(async stop => {
                const stopItem = document.createElement('div');
                stopItem.className = 'stop-item';
                stopItem.dataset.stopId = stop.stop;
                
                stopItem.innerHTML = `
                    <div class="stop-name">${stop.name_en}</div>
                    <div class="stop-name-tc">${stop.name_tc}</div>
                    <div class="stop-eta">
                        <div class="loading">Loading ETA...</div>
                    </div>
                `;
                
                stopList.appendChild(stopItem);
                
                try {
                    await updateStopETA(stopItem, stop.stop, route, serviceType);
                } catch (error) {
                    console.error(`Failed to update ETA for stop ${stop.stop}:`, error);
                }
            });

            // Wait for all ETAs to be fetched
            await Promise.all(stopPromises);

            // Set up refresh functionality
            const refreshInterval = setInterval(() => {
                refreshAllETAs(route, direction, serviceType);
            }, 30000);

            // Add click event listeners
            const refreshButton = resultsContainer.querySelector('.refresh-all-button');
            refreshButton.addEventListener('click', () => {
                refreshAllETAs(route, direction, serviceType);
            });

            const backButton = resultsContainer.querySelector('.back-button');
            backButton.addEventListener('click', () => {
                clearInterval(refreshInterval);
                resultsContainer.classList.remove('active');
                resultsContainer.innerHTML = '';
                const placeholderText = document.querySelector('.placeholder-text');
                placeholderText.style.display = 'block';
                placeholderText.style.opacity = '1';
                busInput.value = '';
                updateSearchButtonState();
            });

        } catch (error) {
            console.error('Error in showRouteETAs:', error);
            resultsContainer.innerHTML = `
                <div class="route-header">Error</div>
                <div class="route-details">
                    <div class="route-path">Failed to fetch route details: ${error.message}</div>
                    <div class="route-path">Please try again or check your network connection.</div>
                </div>
                <div class="button-container">
                    <button class="back-button">← Back to Search</button>
                </div>
                <style>
                    .button-container {
                        margin-top: 20px;
                        text-align: left;
                    }
                    .back-button {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        background: #f5f5f5;
                        color: #333;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-size: 16px;
                        font-weight: normal;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .back-button:hover {
                        background: #e8e8e8;
                    }
                </style>
            `;

            // Add click handler for back button
            const backButton = resultsContainer.querySelector('.back-button');
            backButton.addEventListener('click', () => {
                resultsContainer.classList.remove('active');
                resultsContainer.innerHTML = '';
                const placeholderText = document.querySelector('.placeholder-text');
                placeholderText.style.display = 'block';
                placeholderText.style.opacity = '1';
                busInput.value = '';
                updateSearchButtonState();
            });
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
            
            div.innerHTML = `
                <div class="location-name">${route.route}</div>
                <div class="location-details">${route.orig_tc} ↔ ${route.dest_tc}</div>
                <div class="location-details">${route.orig_en} ↔ ${route.dest_en}</div>
            `;
            
            div.addEventListener('click', () => {
                busInput.value = route.route;
                container.classList.remove('active');
                searchButton.textContent = 'Searching...';
                searchButton.disabled = true;
                searchContainer.classList.remove('active');
                
                // Hide the placeholder text
                const placeholderText = document.querySelector('.placeholder-text');
                placeholderText.style.display = 'none';
                placeholderText.style.opacity = '0';
                
                // Go directly to showing ETAs for this route
                showRouteETAs(route.route, route.bound, route.service_type);
                
                // Reset search button
                searchButton.textContent = 'Search Bus';
                searchButton.disabled = false;
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
