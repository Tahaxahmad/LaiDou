document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://data.etagmb.gov.hk';

    const elements = {
        header: document.querySelector('.header'),
        locationCard: document.querySelector('.location-card'),
        placeholderText: document.querySelector('.placeholder-text'),
        typingText: document.querySelector('.typing-text'),
        searchButton: document.getElementById('search-routes'),
        minibusInput: document.getElementById('minibus-input'),
        minibusInputContainer: document.querySelector('.input-group'),
        minibusInputSuggestions: document.getElementById('minibus-suggestions'),
        resultsContainer: document.getElementById('route-results'),
        searchContainer: document.querySelector('.search-container'),
        errorMessage: document.querySelector('.error-message')
    };

    const state = {
        routes: [],
        selectedRoute: null,
        routeStops: null,
        stopETAs: {},
        refreshInterval: null,
        isLoading: false
    };

    const textToType = "Please input a bus number to see the ETA information for all stops along that route.";
    let charIndex = 0;

    const animateWithDelay = (element, delay) => {
        setTimeout(() => element.classList.add('active'), delay);
    };

    const typeText = () => {
        if (charIndex < textToType.length) {
            elements.typingText.textContent += textToType.charAt(charIndex++);
            setTimeout(typeText, 15);
        }
    };

    const showError = (message) => {
        elements.resultsContainer.style.display = 'none';
        elements.placeholderText.classList.remove('hidden');
        elements.placeholderText.style.opacity = '1';
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
        elements.typingText.textContent = 'Please try again later.';
    };

    const hideError = () => {
        elements.errorMessage.style.display = 'none';
        elements.errorMessage.textContent = '';
    };

    const fetchAPI = async (endpoint) => {
        try {
            const url = `${API_BASE_URL}${endpoint}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    };

    const fetchAllRoutes = async () => {
        try {
            // First try to get all routes at once
            try {
                const response = await fetchAPI('/route');
                const data = response.data;
                if (data && data.routes) {
                    const allRoutes = [];
                    if (data.routes.HKI) allRoutes.push(...data.routes.HKI.map(code => ({ region: 'HKI', route_code: code })));
                    if (data.routes.KLN) allRoutes.push(...data.routes.KLN.map(code => ({ region: 'KLN', route_code: code })));
                    if (data.routes.NT) allRoutes.push(...data.routes.NT.map(code => ({ region: 'NT', route_code: code })));
                    
                    if (allRoutes.length > 0) {
                        state.routes = allRoutes;
                        return allRoutes;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch all routes, trying individual regions:', error);
            }

            // If that fails, try each region individually
            const regions = ['HKI', 'KLN', 'NT'];
            let allRoutes = [];

            for (const region of regions) {
                try {
                    const response = await fetchAPI(`/route/${region}`);
                    const routes = response.data?.routes || [];
                    
                    if (routes.length > 0) {
                        const regionRoutes = routes.map(code => ({
                            region,
                            route_code: code
                        }));
                        allRoutes = [...allRoutes, ...regionRoutes];
                    }
                } catch (error) {
                    console.warn(`Failed to fetch ${region} routes:`, error);
                }
            }

            if (allRoutes.length === 0) {
                throw new Error('No routes found in any region');
            }

            state.routes = allRoutes;
            return allRoutes;
        } catch (error) {
            console.error('Failed to fetch routes:', error);
            showError('Failed to load route information. Please refresh the page.');
            throw error;
        }
    };

    const fetchRouteDetails = async (route) => {
        try {
            const response = await fetchAPI(`/route/${route.region}/${route.route_code}`);
            const routeData = response.data?.[0];
            
            if (!routeData) return route;

            return {
                ...route,
                route_id: routeData.route_id,
                orig_tc: routeData.directions?.[0]?.orig_tc || '',
                dest_tc: routeData.directions?.[0]?.dest_tc || '',
                orig_en: routeData.directions?.[0]?.orig_en || '',
                dest_en: routeData.directions?.[0]?.dest_en || '',
                route_seq: routeData.directions?.[0]?.route_seq || '1'
            };
        } catch (error) {
            console.warn(`Failed to fetch details for route ${route.route_code}:`, error);
            return route;
        }
    };

    const fetchRouteStops = async (routeId, routeSeq) => {
        try {
            const response = await fetchAPI(`/route-stop/${routeId}/${routeSeq}`);
            const stops = response.data?.route_stops;

            if (!Array.isArray(stops) || stops.length === 0) {
                throw new Error('No stops found');
            }

            return stops.map(stop => ({
                stop_id: stop.stop_id,
                stop_seq: stop.stop_seq,
                name_tc: stop.name_tc || '',
                name_en: stop.name_en || '',
                name_sc: stop.name_sc || ''
            }));
        } catch (error) {
            console.error('Failed to fetch route stops:', error);
            showError('Failed to load stop information. Please try again.');
            throw error;
        }
    };

    const fetchWithRetry = async (fn, retries = 3, delay = 1000) => {
        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        throw lastError;
    };

    const fetchStopETA = async (routeId, stopId, stopSeq) => {
        try {
            const fetchETA = async () => {
                const etaResponse = await fetchAPI(`/eta/route-stop/${routeId}/1/${stopSeq}`);
                if (!etaResponse.data?.enabled) {
                    return [];
                }
                return etaResponse.data?.eta || [];
            };

            return await fetchWithRetry(fetchETA);
        } catch (error) {
            console.warn(`Failed to fetch ETA for route ${routeId}, stop ${stopId}, seq ${stopSeq}:`, error);
            return [];
        }
    };

    const formatETA = (eta) => {
        if (!eta || typeof eta.diff !== 'number') return 'No ETA';
        
        const minutes = eta.diff;
        if (minutes <= 0) return 'Arriving';
        if (eta.remarks_en === "Scheduled") return `${minutes} mins (Scheduled)`;
        return `${minutes} mins`;
    };

    const updateSearchButtonState = () => {
        const minibusValue = elements.minibusInput.value.trim();
        
        // Extract the route code from the input value (handle both simple and labeled formats)
        const routeCode = minibusValue.split(' (')[0].trim();
        
        const isValid = state.routes.some(route => route.route_code === routeCode);
        
        elements.searchButton.disabled = !isValid;
        elements.searchContainer.style.display = isValid ? 'block' : 'none';
        elements.searchButton.style.display = isValid ? 'block' : 'none';
        
        if (isValid) {
            setTimeout(() => {
                elements.searchContainer.classList.add('active');
                elements.searchButton.classList.add('active');
            }, 10);
        } else {
            elements.searchButton.classList.remove('active');
            elements.searchContainer.classList.remove('active');
        }
    };

    const displaySuggestions = (suggestions) => {
        elements.minibusInputSuggestions.innerHTML = '';
        
        if (!suggestions.length) {
            elements.minibusInputSuggestions.style.display = 'none';
            return;
        }

        elements.minibusInputSuggestions.style.display = 'block';
        
        // Group suggestions by route_code to handle duplicates
        const groupedSuggestions = suggestions.reduce((acc, route) => {
            if (!acc[route.route_code]) {
                acc[route.route_code] = [];
            }
            acc[route.route_code].push(route);
            return acc;
        }, {});

        Object.entries(groupedSuggestions).forEach(([routeCode, routes]) => {
            routes.forEach((route, index) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                
                // Create display text based on whether there are duplicates
                const displayText = routes.length > 1 
                    ? `${route.route_code} (No. ${index + 1})`
                    : route.route_code;
                
                div.innerHTML = `<div class="location-name">${displayText}</div>`;
                
                div.addEventListener('click', async () => {
                    // Use the same display text for the input field
                    elements.minibusInput.value = displayText;
                    elements.minibusInputSuggestions.style.display = 'none';
                    
                    // If we don't have route details yet, fetch them
                    if (!route.orig_tc) {
                        try {
                            const detailedRoute = await fetchRouteDetails(route);
                            const index = state.routes.findIndex(r => r.route_code === route.route_code);
                            if (index !== -1) {
                                state.routes[index] = detailedRoute;
                            }
                        } catch (error) {
                            console.warn('Failed to fetch route details:', error);
                        }
                    }
                    
                    updateSearchButtonState();
                });
                elements.minibusInputSuggestions.appendChild(div);
            });
        });
    };

    const handleInput = () => {
        elements.minibusInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim().toUpperCase();
            
            const suggestions = query === '' ? [] : 
                state.routes.filter(route => route.route_code.includes(query));

            // Fetch details for all matching routes
            if (suggestions.length > 0) {
                const detailPromises = suggestions.slice(0, 5).map(async (route) => {
                    if (!route.orig_tc) {
                        try {
                            const detailedRoute = await fetchRouteDetails(route);
                            const index = state.routes.findIndex(r => r.route_code === route.route_code);
                            if (index !== -1) {
                                state.routes[index] = detailedRoute;
                            }
                            return detailedRoute;
                        } catch (error) {
                            console.warn(`Failed to fetch details for route ${route.route_code}:`, error);
                            return route;
                        }
                    }
                    return route;
                });

                try {
                    await Promise.all(detailPromises);
                    // Update suggestions with fetched details
                    displaySuggestions(suggestions);
                } catch (error) {
                    console.warn('Failed to fetch some route details:', error);
                    displaySuggestions(suggestions);
                }
            } else {
                displaySuggestions(suggestions);
            }

            updateSearchButtonState();
        });

        elements.minibusInput.addEventListener('focus', () => {
            const query = elements.minibusInput.value.trim().toUpperCase();
            if (query) {
                const suggestions = state.routes.filter(route => route.route_code.includes(query));
                displaySuggestions(suggestions);
            }
        });
    };

    const displayRouteStops = async (route) => {
        // Fade out search button, container and placeholder text simultaneously
        elements.searchButton.classList.remove('active');
        elements.searchContainer.classList.remove('active');
        elements.placeholderText.style.opacity = '0';
        elements.placeholderText.classList.add('hidden');
        
        // Wait for animation to complete before hiding
        await new Promise(resolve => setTimeout(resolve, 300));
        elements.searchButton.style.display = 'none';
        elements.searchContainer.style.display = 'none';
        
        elements.resultsContainer.innerHTML = `
            <div class="route-header">
                Route ${route.route_code}: ${route.orig_tc} ↔ ${route.dest_tc}
                <div class="route-header-en">${route.orig_en} ↔ ${route.dest_en}</div>
            </div>
            <div class="stop-list"></div>
            <div class="button-container">
                <button class="refresh-all-button">Refresh ETAs</button>
                <button class="back-button">Back to Search</button>
            </div>
            <style>
                .button-container {
                    position: fixed;
                    bottom: 20px;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.9);
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                }
                .refresh-all-button, .back-button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .refresh-all-button {
                    background: #1fd655;
                    color: white;
                }
                .refresh-all-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                .back-button {
                    background: #f0f0f0;
                    color: #333;
                }
                .refresh-all-button:hover:not(:disabled),
                .back-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .stop-list {
                    padding-bottom: 80px;
                }
                .eta-badge.error {
                    color: #666;
                    font-style: italic;
                }
                .stop-item {
                    padding: 15px;
                    border-bottom: 1px solid #eee;
                    margin: 5px 0;
                }
                .stop-info {
                    margin-bottom: 8px;
                }
                .eta-badge {
                    color: #1fd655;
                    font-weight: bold;
                }
            </style>
        `;

        const stopList = elements.resultsContainer.querySelector('.stop-list');
        const stops = state.routeStops || [];

        stops.forEach(stop => {
            const stopDiv = document.createElement('div');
            stopDiv.className = 'stop-item';
            stopDiv.innerHTML = `
                <div class="stop-info">
                    <div class="stop-name">${stop.name_en}</div>
                    <div class="stop-name-tc">${stop.name_tc}</div>
                    ${stop.name_sc ? `<div class="stop-name-sc">${stop.name_sc}</div>` : ''}
                </div>
                <div class="eta-badge" 
                    data-stop-id="${stop.stop_id}" 
                    data-route-id="${route.route_id}" 
                    data-stop-seq="${stop.stop_seq}">Loading...</div>
            `;
            stopList.appendChild(stopDiv);
        });

        elements.resultsContainer.classList.add('active');

        const refreshButton = elements.resultsContainer.querySelector('.refresh-all-button');
        const backButton = elements.resultsContainer.querySelector('.back-button');

        let isRefreshing = false;
        refreshButton.addEventListener('click', async () => {
            if (isRefreshing) return;
            isRefreshing = true;
            refreshButton.disabled = true;
            refreshButton.textContent = 'Updating...';
            const etaBadges = document.querySelectorAll('.eta-badge');
            etaBadges.forEach(badge => badge.textContent = 'Updating...');
            await refreshAllETAs();
            refreshButton.textContent = 'Refresh ETAs';
            refreshButton.disabled = false;
            isRefreshing = false;
        });

        backButton.addEventListener('click', () => {
            clearInterval(state.refreshInterval);
            elements.resultsContainer.classList.remove('active');
            elements.placeholderText.classList.remove('hidden');
            elements.placeholderText.style.opacity = '1';
            elements.searchContainer.classList.add('active');
            elements.searchContainer.style.display = 'block';
            elements.minibusInput.value = '';
            elements.resultsContainer.innerHTML = '';
            updateSearchButtonState();
        });

        await refreshAllETAs();
        state.refreshInterval = setInterval(refreshAllETAs, 20000);
    };

    const refreshAllETAs = async () => {
        const etaBadges = document.querySelectorAll('.eta-badge');
        let hasErrors = false;

        const updatePromises = Array.from(etaBadges).map(async (badge) => {
            const stopId = badge.dataset.stopId;
            const routeId = badge.dataset.routeId;
            const stopSeq = badge.dataset.stopSeq;
            
            if (!stopId || !routeId || !stopSeq) {
                console.warn('Missing required data attributes for ETA badge');
                badge.textContent = 'No ETA';
            return;
        }

            try {
                const etas = await fetchStopETA(routeId, stopId, stopSeq);
                if (etas && etas.length > 0) {
                    const sortedEtas = etas.sort((a, b) => (a.diff || 999) - (b.diff || 999));
                    const nextEta = sortedEtas[0];
                    badge.textContent = formatETA(nextEta);
                    badge.classList.remove('error');
        } else {
                    badge.textContent = 'No ETA';
                    badge.classList.remove('error');
                }
            } catch (error) {
                console.warn(`Error fetching ETA for stop ${stopId}:`, error);
                badge.textContent = 'Retry...';
                badge.classList.add('error');
                hasErrors = true;
            }
        });

        try {
            await Promise.all(updatePromises);
            
            // If there were errors, schedule a quick retry
            if (hasErrors) {
                setTimeout(refreshAllETAs, 5000);
            }
        } catch (error) {
            console.error('Error updating ETAs:', error);
        }
    };

    elements.searchButton.addEventListener('click', async () => {
        const routeNumber = elements.minibusInput.value.trim();
        // Extract the route code from the input value
        const routeCode = routeNumber.split(' (')[0].trim().toUpperCase();
        
        let route = state.routes.find(r => r.route_code === routeCode);
        
        if (!route) {
            showError('Please select a valid route number from the suggestions.');
            return;
        }

        try {
            route = await fetchRouteDetails(route);
            state.selectedRoute = route;
            state.routeStops = await fetchRouteStops(
                route.route_id || route.route_code,
                route.route_seq
            );
            
            if (!state.routeStops || state.routeStops.length === 0) {
                showError('No stops found for this route. Please try another route.');
                return;
            }

            displayRouteStops(route);
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to fetch route information. Please try again.');
        }
    });

    // Initialize
    elements.searchContainer.style.display = 'none';
    elements.searchButton.style.display = 'none';
    elements.searchButton.disabled = true;
            elements.placeholderText.style.opacity = '1';
            elements.placeholderText.classList.remove('hidden');
    elements.typingText.textContent = '';
    elements.minibusInputContainer.classList.add('loaded');
    elements.minibusInput.disabled = false;

    // Start fetching routes
    fetchAllRoutes()
        .then(() => {
            typeText();
            handleInput();
        })
        .catch(error => {
            console.error('Failed to initialize routes:', error);
            showError('Failed to load route information. Please refresh the page.');
        });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.minibusInputContainer.contains(e.target)) {
            elements.minibusInputSuggestions.style.display = 'none';
        }
    });
});
