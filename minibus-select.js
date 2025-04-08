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

    const animateWithDelay = (element, delay) => setTimeout(() => element.classList.add('active'), delay);

    const typeText = () => {
        let charIndex = 0;
        const type = () => {
            if (charIndex < textToType.length) {
                elements.typingText.textContent += textToType.charAt(charIndex++);
                setTimeout(type, 15); // Match train view speed
            }
        };
        type();
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
        const proxyUrls = [
            "https://api.allorigins.win/raw?url=",
            "https://corsproxy.io/?"
        ];

        for (const proxyUrl of proxyUrls) {
            try {
                const encodedUrl = encodeURIComponent(`${API_BASE_URL}${endpoint}`);
                const response = await fetch(`${proxyUrl}${encodedUrl}`, {
                    method: 'GET',
                    headers: {'Accept': 'application/json'}
                });
                
                if (response.ok) return response.json();
            } catch (error) {
                console.error("Proxy attempt failed:", error);
            }
        }

        const directResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {'Accept': 'application/json'},
            mode: 'cors'
        });
        
        if (!directResponse.ok) throw new Error(`HTTP error: ${directResponse.status}`);
        return directResponse.json();
    };

    const fetchAllRoutes = async () => {
        const response = await fetchAPI('/route');
        const data = response.data;
        
        if (data?.routes) {
            const allRoutes = [
                ...(data.routes.HKI || []).map(code => ({region: 'HKI', route_code: code})),
                ...(data.routes.KLN || []).map(code => ({region: 'KLN', route_code: code})),
                ...(data.routes.NT || []).map(code => ({region: 'NT', route_code: code}))
            ];
            
            if (allRoutes.length) {
                state.routes = allRoutes;
                return allRoutes;
            }
        }

        const regions = ['HKI', 'KLN', 'NT'];
        const allRoutes = [];

        for (const region of regions) {
            const response = await fetchAPI(`/route/${region}`);
            const routes = response.data?.routes || [];
            allRoutes.push(...routes.map(code => ({region, route_code: code})));
        }

        if (!allRoutes.length) {
            throw new Error('No routes found. Please check your connection and try again.');
        }

        state.routes = allRoutes;
        return allRoutes;
    };

    const fetchRouteDetails = async (route) => {
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
    };

    const fetchRouteStops = async (routeId, routeSeq) => {
        const response = await fetchAPI(`/route-stop/${routeId}/${routeSeq}`);
        const stops = response.data?.route_stops;
        if (!stops?.length) throw new Error('No stops found');

        return stops.map(stop => ({
            stop_id: stop.stop_id,
            stop_seq: stop.stop_seq,
            name_tc: stop.name_tc || '',
            name_en: stop.name_en || '',
            name_sc: stop.name_sc || ''
        }));
    };

    const fetchWithRetry = async (fn, retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    };

    const fetchStopETA = async (routeId, stopId, stopSeq) => {
        const fetchETA = async () => {
            const response = await fetchAPI(`/eta/route-stop/${routeId}/1/${stopSeq}`);
            return response.data?.enabled ? response.data?.eta || [] : [];
        };
        return fetchWithRetry(fetchETA);
    };

    const formatETA = (eta) => {
        if (!eta?.diff) return 'No ETA';
        const minutes = eta.diff;
        if (minutes <= 0) return 'Arriving';
        return eta.remarks_en === "Scheduled" ? `${minutes} mins (Scheduled)` : `${minutes} mins`;
    };

    const updateSearchButtonState = () => {
        const routeCode = elements.minibusInput.value.trim().split(' (')[0].trim();
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
        
        const groupedSuggestions = suggestions.reduce((acc, route) => {
            (acc[route.route_code] = acc[route.route_code] || []).push(route);
            return acc;
        }, {});

        Object.entries(groupedSuggestions).forEach(([routeCode, routes]) => {
            routes.forEach((route, index) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `<div class="location-name">${routes.length > 1 ? `${route.route_code} (No. ${index + 1})` : route.route_code}</div>`;
                
                div.addEventListener('click', async () => {
                    elements.minibusInput.value = div.textContent;
                    elements.minibusInputSuggestions.style.display = 'none';
                    
                    if (!route.orig_tc) {
                        const detailedRoute = await fetchRouteDetails(route);
                        const index = state.routes.findIndex(r => r.route_code === route.route_code);
                        if (index !== -1) state.routes[index] = detailedRoute;
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
            const suggestions = query ? state.routes.filter(route => route.route_code.includes(query)) : [];

            if (suggestions.length) {
                const detailPromises = suggestions.slice(0, 5).map(async route => {
                    if (!route.orig_tc) {
                        const detailedRoute = await fetchRouteDetails(route);
                        const index = state.routes.findIndex(r => r.route_code === route.route_code);
                        if (index !== -1) state.routes[index] = detailedRoute;
                        return detailedRoute;
                    }
                    return route;
                });

                await Promise.all(detailPromises);
            }
            
            displaySuggestions(suggestions);
            updateSearchButtonState();
        });

        elements.minibusInput.addEventListener('focus', () => {
            const query = elements.minibusInput.value.trim().toUpperCase();
            if (query) {
                displaySuggestions(state.routes.filter(route => route.route_code.includes(query)));
            }
        });
    };

    const displayRouteStops = async (route) => {
        elements.searchButton.classList.remove('active');
        elements.searchContainer.classList.remove('active');
        elements.placeholderText.style.opacity = '0';
        elements.placeholderText.classList.add('hidden');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        elements.searchButton.style.display = 'none';
        elements.searchContainer.style.display = 'none';
        
        elements.resultsContainer.innerHTML = `
            <div class="route-header">
                <div class="route-title">${route.orig_en} → ${route.dest_en}</div>
            </div>
            <div class="stop-list"></div>
            <div class="button-group">
                <button class="refresh-all-button">Refresh ETAs</button>
                <button class="back-button">Back to Search</button>
            </div>
        `;

        const stopList = elements.resultsContainer.querySelector('.stop-list');
        (state.routeStops || []).forEach(stop => {
            const stopDiv = document.createElement('div');
            stopDiv.className = 'stop-item';
            stopDiv.innerHTML = `
                <div class="stop-info">
                    <div class="stop-name">${stop.name_en}</div>
                    <div class="stop-name-tc">${stop.name_tc}</div>
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
            document.querySelectorAll('.eta-badge').forEach(badge => badge.textContent = 'Updating...');
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

        await Promise.all(Array.from(etaBadges).map(async badge => {
            const {stopId, routeId, stopSeq} = badge.dataset;
            if (!stopId || !routeId || !stopSeq) {
                badge.textContent = 'No ETA';
                return;
            }

            try {
                const etas = await fetchStopETA(routeId, stopId, stopSeq);
                if (etas?.length) {
                    const nextEta = etas.sort((a, b) => (a.diff || 999) - (b.diff || 999))[0];
                    badge.textContent = formatETA(nextEta);
                    badge.classList.remove('error');
                } else {
                    badge.textContent = 'No ETA';
                    badge.classList.remove('error');
                }
            } catch {
                badge.textContent = 'Retry...';
                badge.classList.add('error');
                hasErrors = true;
            }
        }));

        if (hasErrors) setTimeout(refreshAllETAs, 5000);
    };

    elements.searchButton.addEventListener('click', async () => {
        const routeCode = elements.minibusInput.value.trim().split(' (')[0].trim().toUpperCase();
        let route = state.routes.find(r => r.route_code === routeCode);
        
        if (!route) {
            showError('Please select a valid route number from the suggestions.');
            return;
        }

        try {
            route = await fetchRouteDetails(route);
            state.selectedRoute = route;
            state.routeStops = await fetchRouteStops(route.route_id || route.route_code, route.route_seq);
            
            if (!state.routeStops?.length) {
                showError('No stops found for this route. Please try another route.');
                return;
            }

            displayRouteStops(route);
        } catch {
            showError('Failed to fetch route information. Please try again.');
        }
    });

    elements.searchContainer.style.display = 'none';
    elements.searchButton.style.display = 'none';
    elements.searchButton.disabled = true;
    elements.placeholderText.style.opacity = '1';
    elements.placeholderText.classList.remove('hidden');
    elements.typingText.textContent = '';
    elements.minibusInputContainer.classList.add('loaded');
    elements.minibusInput.disabled = false;

    fetchAllRoutes()
        .then(() => {
            typeText(); // Start typing immediately
            handleInput();
        })
        .catch((error) => {
            console.error('Error in fetchAllRoutes:', error);
            showError('Failed to load route information. Please try refreshing the page.');
        });

    document.addEventListener('click', (e) => {
        if (!elements.minibusInputContainer.contains(e.target)) {
            elements.minibusInputSuggestions.style.display = 'none';
        }
    });
});
