document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        header: document.querySelector('.header.fade-in'),
        locationCard: document.querySelector('.location-card.fade-in-second'),
        placeholderText: document.querySelector('.placeholder-text.slide-up'),
        typingText: document.querySelector('.typing-text'),
        searchButton: document.getElementById('search-routes'),
        searchContainer: document.getElementById('search-routes').parentElement,
        busInput: document.getElementById('bus-input'),
        busSuggestions: document.getElementById('bus-suggestions'),
        resultsContainer: document.getElementById('route-results'),
        infoContainer: document.querySelector('.info-container'),
    };

    const textToType = "Please input a bus number to see the ETA information for all stops along that route.";
    let charIndex = 0;
    let currentRefreshInterval = null;

    const urlParams = new URLSearchParams(window.location.search);
    const routeParam = urlParams.get('route');
    const directionParam = urlParams.get('direction');
    const serviceTypeParam = urlParams.get('serviceType');

    const animateWithDelay = (element, delay) => {
        if (element) setTimeout(() => element.classList.add('active'), delay);
    };

    const typeText = () => {
        if (elements.typingText && charIndex < textToType.length) {
            elements.typingText.textContent += textToType.charAt(charIndex++);
            setTimeout(typeText, 15);
        }
    };

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const updateSearchButtonState = () => {
        const busValue = elements.busInput.value.trim();
        
        if (busValue) {
            elements.searchContainer.classList.add('active');
            setTimeout(() => {
                elements.searchButton.classList.add('active');
                elements.placeholderText?.classList.add('search-active');
            }, 100);
        } else {
            elements.searchButton.classList.remove('active');
            elements.placeholderText?.classList.remove('search-active');
            setTimeout(() => elements.searchContainer.classList.remove('active'), 300);
        }
    };

    const handleInputOverflow = input => {
        if (input) input.title = input.value.length > 30 ? input.value : '';
    };

    const formatETA = etaTime => {
        if (!etaTime) return null;
        const diffMinutes = Math.round((new Date(etaTime) - new Date()) / (1000 * 60));
        return diffMinutes < 1 ? 'Arriving' : `${diffMinutes} mins`;
    };

    const fetchAPI = async url => {
        const fetchOptions = { method: 'GET', headers: { 'Accept': 'application/json' } };
        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (!data?.data) throw new Error('Invalid API response format');
            return data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            throw error;
        }
    };

    const fetchWithRetry = async (fn, retries = 4, delay = 1000) => {
        for (let i = 0; i <= retries; i++) {
            try {
                console.log(`API Call Attempt ${i + 1} of ${retries + 1}...`);
                return await fn();
            } catch (error) {
                console.warn(`Attempt ${i + 1} failed:`, error.message);
                if (i === retries) {
                    console.error(`All ${retries + 1} attempts failed.`);
                    throw error;
                }
                const waitTime = delay * Math.pow(2, i);
                console.log(`Waiting ${waitTime}ms before next retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        throw new Error("Retry mechanism failed unexpectedly.");
    };

    const resetToSearchView = () => {
        if (currentRefreshInterval) clearInterval(currentRefreshInterval);
        elements.resultsContainer.classList.remove('active');
        elements.resultsContainer.innerHTML = '';
        if (elements.placeholderText) {
             elements.placeholderText.style.display = '';
             elements.placeholderText.style.opacity = '1';
        }
        if (elements.busInput) elements.busInput.value = '';
        updateSearchButtonState();
        window.history.replaceState({}, '', window.location.pathname);
    };

    const fetchRouteStops = async (route, direction, serviceType) => {
        const [routeStopData, stopData] = await fetchWithRetry(() => 
            Promise.all([
                fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route-stop'),
                fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/stop')
            ])
        );
        const routeStops = routeStopData.data.filter(stop => 
            stop.route === route && stop.bound === direction && stop.service_type === serviceType
        );
        if (!routeStops.length) return [];
        return routeStops.map(routeStop => {
            const stopDetail = stopData.data.find(s => s.stop === routeStop.stop);
            return stopDetail ? { ...stopDetail, seq: routeStop.seq } : null;
        }).filter(Boolean).sort((a, b) => a.seq - b.seq);
    };

    const fetchStopETA = async (stopId, route, serviceType) => {
        try {
            const data = await fetchWithRetry(() => 
                fetchAPI(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${serviceType}`)
            );
            return data.data || [];
        } catch (error) {
            console.error('Error fetching stop ETA:', error);
            return [];
        }
    };

    const updateStopETA = async (stopItem, stopId, route, serviceType) => {
        const etaContainer = stopItem.querySelector('.stop-eta');
        if (!etaContainer) return;
        try {
            const etas = await fetchStopETA(stopId, route, serviceType);
            const nextThreeEtas = etas.map(eta => formatETA(eta.eta)).filter(Boolean).slice(0, 3);
            etaContainer.innerHTML = nextThreeEtas.length ? 
                nextThreeEtas.map(time => 
                    `<div class="eta-badge${time === 'Arriving' ? ' arriving' : ''}"><span>${time}</span></div>`
                ).join('') :
                '<div class="eta-badge no-eta">No ETA available</div>';
        } catch (error) {
            console.error('Error updating stop ETA:', error);
            etaContainer.innerHTML = '<div class="eta-badge error">Error fetching ETA</div>';
        }
    };

    const refreshAllETAs = (route, direction, serviceType) => {
        document.querySelectorAll('.stop-item[data-stop-id]').forEach(stopItem => {
            updateStopETA(stopItem, stopItem.dataset.stopId, route, serviceType);
        });
    };

    const displayDirectionOptions = routes => {
        elements.resultsContainer.innerHTML = '';
        elements.resultsContainer.classList.add('active');
        if (!routes?.length) {
            elements.resultsContainer.innerHTML = `
                <div class="route-header">No routes found for ${elements.busInput.value.trim()}</div>
                <div class="route-details" style="flex-grow: 1; padding: 20px;">
                    <div class="route-path">Please check the bus number and try again.</div>
                </div>
                <div class="button-group"><button class="back-button">Back to Search</button></div>
            `;
            elements.resultsContainer.querySelector('.back-button').addEventListener('click', resetToSearchView);
            return;
        }
        const firstRoute = routes[0];
        elements.resultsContainer.innerHTML = `
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
            <div class="button-group"><button class="back-button">Back to Search</button></div>
            <style>
                .direction-options { display: flex; flex-direction: column; gap: 15px; padding: 20px 25px 80px; flex-grow: 1; overflow-y: auto; }
                .direction-option { background: white; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s ease; border: 1px solid #eee; }
                .direction-option:hover { transform: translateY(-2px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
                .direction-header { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #1fd655; }
                .direction-details { font-size: 14px; color: #666; }
            </style>
        `;
        elements.resultsContainer.querySelectorAll('.direction-option').forEach(option => {
            option.addEventListener('click', () => {
                showRouteETAs(option.dataset.route, option.dataset.bound, option.dataset.service_type);
            });
        });
        elements.resultsContainer.querySelector('.back-button').addEventListener('click', resetToSearchView);
    };

    const normalizeRouteNumber = route => route.toUpperCase();

    const fetchSuggestions = async query => {
        try {
            const data = await fetchWithRetry(() => fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/'));
            const searchQuery = normalizeRouteNumber(query);
            return (data.data || []).filter(route => normalizeRouteNumber(route.route).includes(searchQuery)).slice(0, 10);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    };

    const displaySuggestions = suggestions => {
        elements.busSuggestions.innerHTML = '';
        if (!suggestions.length) {
            elements.busSuggestions.classList.remove('active');
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
                elements.busInput.value = route.route;
                elements.busSuggestions.classList.remove('active');
                elements.searchButton.textContent = 'Searching...';
                elements.searchButton.disabled = true;
                elements.searchContainer.classList.remove('active');
                if (elements.placeholderText) {
                    elements.placeholderText.style.display = 'none';
                    elements.placeholderText.style.opacity = '0';
                }
                showRouteETAs(route.route, route.bound, route.service_type);
                elements.searchButton.textContent = 'Search Bus';
                elements.searchButton.disabled = false;
            });
            elements.busSuggestions.appendChild(div);
        });
        elements.busSuggestions.classList.add('active');
    };

    const showRouteETAs = async (route, direction, serviceType) => {
        const newUrlParams = new URLSearchParams();
        newUrlParams.set('route', route);
        if (direction) newUrlParams.set('direction', direction);
        if (serviceType) newUrlParams.set('serviceType', serviceType);
        window.history.replaceState({}, '', `${window.location.pathname}?${newUrlParams.toString()}`);

        elements.resultsContainer.innerHTML = `
            <div class="route-header">Loading route ${route}...</div>
            <div class="route-details" style="flex-grow: 1; display: flex; justify-content: center; align-items: center;">
                 <div class="loading">Fetching route information...</div>
            </div>
        `;
        elements.resultsContainer.classList.add('active');
        
        try {
            const routeData = await fetchWithRetry(() => fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/'));
            const normalizedRoute = normalizeRouteNumber(route);
            const matchingRoutes = routeData.data.filter(r => normalizeRouteNumber(r.route) === normalizedRoute);
            if (!matchingRoutes.length) throw new Error(`No route found for ${route}`);

            const matchingRoute = direction && serviceType ?
                matchingRoutes.find(r => r.bound === direction && r.service_type === serviceType) :
                matchingRoutes[0];
            if (!matchingRoute) throw new Error(`No route found for ${route} with specified direction/service`);

            const finalServiceType = serviceType || matchingRoute.service_type;
            const finalDirection = direction || matchingRoute.bound;

            elements.resultsContainer.innerHTML = `
                <div class="route-header">
                    <div>${matchingRoute.route}</div>
                    <div class="route-path">${matchingRoute.orig_tc} → ${matchingRoute.dest_tc}</div>
                    <div class="route-path">${matchingRoute.orig_en} → ${matchingRoute.dest_en}</div>
                </div>
                <div class="route-details" style="flex-grow: 1; overflow-y: auto;">
                    <div class="stop-list"><div class="loading">Loading stops...</div></div>
                </div>
                <div class="button-group">
                    <button class="refresh-all-button">Refresh ETAs</button>
                    <button class="back-button">Back to Search</button>
                </div>
            `;

            const stops = await fetchRouteStops(route, finalDirection, finalServiceType);
            const stopList = elements.resultsContainer.querySelector('.stop-list');
            if (!stopList) return; 

            if (!stops?.length) {
                stopList.innerHTML = '<div class="no-stops" style="padding: 20px; text-align: center;">No stops found for this route direction.</div>';
                elements.resultsContainer.querySelector('.refresh-all-button').disabled = true;
            } else {
                stopList.innerHTML = '';
                await Promise.all(stops.map(async stop => {
                    const stopItem = document.createElement('div');
                    stopItem.className = 'stop-item';
                    stopItem.dataset.stopId = stop.stop;
                    stopItem.innerHTML = `
                        <div class="stop-info">
                            <div class="stop-name">${stop.name_en}</div>
                            <div class="stop-name-tc">${stop.name_tc}</div>
                        </div>
                        <div class="stop-eta"><div class="loading">Loading ETA...</div></div>
                    `;
                    stopList.appendChild(stopItem);
                    await updateStopETA(stopItem, stop.stop, route, finalServiceType);
                }));

                if (currentRefreshInterval) clearInterval(currentRefreshInterval);
                currentRefreshInterval = setInterval(() => {
                    refreshAllETAs(route, finalDirection, finalServiceType);
                }, 30000);

                elements.resultsContainer.querySelector('.refresh-all-button').addEventListener('click', () => {
                    refreshAllETAs(route, finalDirection, finalServiceType);
                });
            }
            elements.resultsContainer.querySelector('.back-button').addEventListener('click', resetToSearchView);
        } catch (error) {
            console.error('Error in showRouteETAs:', error);
            elements.resultsContainer.innerHTML = `
                <div class="route-header">Error</div>
                <div class="route-details" style="flex-grow: 1; padding: 20px 25px 80px;">
                    <div class="route-path">Failed to fetch route details: ${error.message}</div>
                    <div class="route-path">Please try again or check your network connection.</div>
                </div>
                <div class="button-group"><button class="back-button">Back to Search</button></div>
            `;
            elements.resultsContainer.querySelector('.back-button').addEventListener('click', resetToSearchView);
        }
    };

    if (elements.busInput) {
        elements.busInput.addEventListener('input', debounce(async e => {
            handleInputOverflow(elements.busInput);
            updateSearchButtonState();
            const query = e.target.value.trim();
            if (query.length < 1) {
                elements.busSuggestions.classList.remove('active');
                return;
            }
            displaySuggestions(await fetchSuggestions(query));
        }, 300));
    }

    if (elements.searchButton) {
        elements.searchButton.addEventListener('click', async () => {
            const busNumber = normalizeRouteNumber(elements.busInput.value.trim());
            if (busNumber) {
                try {
                    elements.searchButton.textContent = 'Searching...';
                    elements.searchButton.disabled = true;
                    const data = await fetchWithRetry(() => fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/'));
                    const matchingRoutes = (data.data || []).filter(route => normalizeRouteNumber(route.route) === busNumber);
                    
                    if (matchingRoutes.length === 0) {
                         displayDirectionOptions([]);
                    } else if (matchingRoutes.length === 1) {
                        const route = matchingRoutes[0];
                        showRouteETAs(route.route, route.bound, route.service_type);
                    } else {
                        displayDirectionOptions(matchingRoutes);
                    }
                    
                    elements.searchButton.textContent = 'Search Bus';
                    elements.searchButton.disabled = false;
                    elements.searchContainer.classList.remove('active');
                    if (elements.placeholderText) {
                        elements.placeholderText.style.display = 'none';
                        elements.placeholderText.style.opacity = '0';
                    }
                } catch (error) {
                    console.error('Error fetching route details:', error);
                    elements.resultsContainer.innerHTML = `
                        <div class="route-header">Error</div>
                        <div class="route-details" style="flex-grow: 1; padding: 20px 25px 80px;">
                            <div class="route-path">Failed to fetch route details: ${error.message}</div>
                            <div class="route-path">Please try again or check your network connection.</div>
                        </div>
                        <div class="button-group"><button class="back-button">Back to Search</button></div>
                    `;
                    elements.resultsContainer.classList.add('active');
                    elements.resultsContainer.querySelector('.back-button').addEventListener('click', resetToSearchView);
                    elements.searchButton.textContent = 'Search Bus';
                    elements.searchButton.disabled = false;
                }
            }
        });
    }

    document.addEventListener('click', e => {
        if (elements.busSuggestions && elements.busInput && !elements.busInput.contains(e.target) && !elements.busSuggestions.contains(e.target)) {
            elements.busSuggestions.classList.remove('active');
        }
    });

    if (routeParam) {
        showRouteETAs(routeParam, directionParam, serviceTypeParam);
    } else {
        animateWithDelay(elements.header, 100);
        animateWithDelay(elements.locationCard, 600);
        animateWithDelay(elements.placeholderText, 800);
        if (elements.typingText) setTimeout(typeText, 1600);
    }
});
