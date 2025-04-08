document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.fade-in');
    const locationCard = document.querySelector('.fade-in-second');
    const placeholderText = document.querySelector('.slide-up');
    const typingText = document.querySelector('.typing-text');
    const textToType = "Please input a bus number to see the ETA information for all stops along that route.";
    let charIndex = 0;

    // Check URL parameters on page load
    const urlParams = new URLSearchParams(window.location.search);
    const routeParam = urlParams.get('route');
    const directionParam = urlParams.get('direction');
    const serviceTypeParam = urlParams.get('serviceType');

    if (routeParam) {
        // If route parameter exists, fetch route information immediately
        showRouteETAs(routeParam, directionParam, serviceTypeParam);
    } else {
        // Otherwise, show the normal animation
        const animateWithDelay = (element, delay) => {
            setTimeout(() => element.classList.add('active'), delay);
        };

        const typeText = () => {
            if (charIndex < textToType.length) {
                typingText.textContent += textToType.charAt(charIndex++);
                setTimeout(typeText, 15);
            }
        };

        animateWithDelay(header, 100);
        animateWithDelay(locationCard, 600);
        animateWithDelay(placeholderText, 800);
        setTimeout(typeText, 1600);
    }

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const searchButton = document.getElementById('search-routes');
    const searchContainer = searchButton.parentElement;
    const busInput = document.querySelector('input[placeholder="Bus Number"]');

    const updateSearchButtonState = () => {
        const busValue = busInput.value.trim();
        const placeholderText = document.querySelector('.placeholder-text');
        
        if (busValue) {
            searchContainer.classList.add('active');
            setTimeout(() => {
                searchButton.classList.add('active');
                placeholderText.classList.add('search-active');
            }, 100);
        } else {
            searchButton.classList.remove('active');
            placeholderText.classList.remove('search-active');
            setTimeout(() => searchContainer.classList.remove('active'), 300);
        }
    };

    const handleInputOverflow = input => {
        input.title = input.value.length > 30 ? input.value : '';
    };

    busInput.addEventListener('input', () => {
        handleInputOverflow(busInput);
        updateSearchButtonState();
    });

    const formatETA = etaTime => {
        if (!etaTime) return null;
        const diffMinutes = Math.round((new Date(etaTime) - new Date()) / (1000 * 60));
        return diffMinutes < 1 ? 'Arriving' : `${diffMinutes} mins`;
    };

    const fetchAPI = async url => {
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

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

    const fetchRouteStops = async (route, direction, serviceType) => {
        const [routeStopData, stopData] = await Promise.all([
            fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route-stop'),
            fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/stop')
        ]);

        const routeStops = routeStopData.data.filter(stop => 
            stop.route === route && 
            stop.bound === direction && 
            stop.service_type === serviceType
        );

        if (!routeStops.length) return [];

        return routeStops
            .map(routeStop => {
                const stopDetail = stopData.data.find(s => s.stop === routeStop.stop);
                return stopDetail ? {
                    stop: routeStop.stop,
                    name_en: stopDetail.name_en,
                    name_tc: stopDetail.name_tc,
                    seq: routeStop.seq
                } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.seq - b.seq);
    };

    const fetchStopETA = async (stopId, route, serviceType) => {
        try {
            console.log(`Fetching ETA for stop ${stopId}, route ${route}, serviceType ${serviceType}`);
            const data = await fetchAPI(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${serviceType}`);
            console.log('ETA response:', data);
            if (!data.data || data.data.length === 0) {
                console.log('No ETA data available for this stop');
                return [];
            }
            return data.data;
        } catch (error) {
            console.error('Error fetching stop ETA:', error);
            return [];
        }
    };

    const updateStopETA = async (stopItem, stopId, route, serviceType) => {
        const etaContainer = stopItem.querySelector('.stop-eta');
        if (!etaContainer) return;

        try {
            console.log(`Updating ETA for stop ${stopId}, route ${route}, serviceType ${serviceType}`);
            const etas = await fetchStopETA(stopId, route, serviceType);
            console.log('ETAs received:', etas);
            
            const nextThreeEtas = etas
                .map(eta => {
                    const formattedTime = formatETA(eta.eta);
                    console.log(`ETA time: ${eta.eta}, formatted: ${formattedTime}`);
                    return formattedTime;
                })
                .filter(Boolean)
                .slice(0, 3);

            console.log('Next three ETAs:', nextThreeEtas);

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
        document.querySelectorAll('.stop-item').forEach(stopItem => {
            updateStopETA(stopItem, stopItem.dataset.stopId, route, serviceType);
        });
    };

    const displayDirectionOptions = routes => {
        const resultsContainer = document.getElementById('route-results');
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('active');

        if (!routes?.length) {
            resultsContainer.innerHTML = `
                <div class="route-header">No routes found</div>
                <div class="route-details">
                    <div class="route-path">No bus routes found for number ${busInput.value.trim()}</div>
                </div>
                <div class="button-container">
                    <button class="back-button">← Back to Search</button>
                </div>
            `;
            
            resultsContainer.querySelector('.back-button').addEventListener('click', () => {
                resultsContainer.classList.remove('active');
                resultsContainer.innerHTML = '';
                document.querySelector('.placeholder-text').style.display = 'block';
                document.querySelector('.placeholder-text').style.opacity = '1';
                busInput.value = '';
                updateSearchButtonState();
            });
            return;
        }

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

        resultsContainer.querySelectorAll('.direction-option').forEach(option => {
            option.addEventListener('click', () => {
                showRouteETAs(option.dataset.route, option.dataset.bound, option.dataset.service_type);
            });
        });

        resultsContainer.querySelector('.back-button').addEventListener('click', () => {
            resultsContainer.classList.remove('active');
            resultsContainer.innerHTML = '';
            document.querySelector('.placeholder-text').style.display = 'block';
            document.querySelector('.placeholder-text').style.opacity = '1';
            busInput.value = '';
            updateSearchButtonState();
        });
    };

    const normalizeRouteNumber = route => route.toUpperCase();

    const fetchSuggestions = async query => {
        try {
            const data = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/');
            const searchQuery = normalizeRouteNumber(query);
            return (data.data || [])
                .filter(route => normalizeRouteNumber(route.route).includes(searchQuery))
                .slice(0, 10);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    };

    searchButton.addEventListener('click', async () => {
        const busNumber = normalizeRouteNumber(busInput.value.trim());
        
        if (busNumber) {
            try {
                searchButton.textContent = 'Searching...';
                searchButton.disabled = true;
                
                const data = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/');
                const matchingRoutes = (data.data || []).filter(route => 
                    normalizeRouteNumber(route.route) === busNumber
                );
                
                if (matchingRoutes.length === 1) {
                    // If there's only one route, show ETAs directly
                    const route = matchingRoutes[0];
                    showRouteETAs(route.route, route.bound, route.service_type);
                } else {
                    // If there are multiple routes, show direction options
                    displayDirectionOptions(matchingRoutes);
                }
                
                searchButton.textContent = 'Search Bus';
                searchButton.disabled = false;
                searchContainer.classList.remove('active');
                document.querySelector('.placeholder-text').style.display = 'none';
                document.querySelector('.placeholder-text').style.opacity = '0';
            } catch (error) {
                console.error('Error fetching route details:', error);
                const resultsContainer = document.getElementById('route-results');
                resultsContainer.innerHTML = `
                    <div class="route-header">Error</div>
                    <div class="route-details">
                        <div class="route-path">Failed to fetch route details: ${error.message}</div>
                        <div class="route-path">Please try again or check your network connection.</div>
                    </div>
                    <div class="button-container">
                        <button class="back-button">← Back to Search</button>
                    </div>
                `;
                resultsContainer.classList.add('active');
                searchButton.textContent = 'Search Bus';
                searchButton.disabled = false;

                resultsContainer.querySelector('.back-button').addEventListener('click', () => {
                    resultsContainer.classList.remove('active');
                    resultsContainer.innerHTML = '';
                    document.querySelector('.placeholder-text').style.display = 'block';
                    document.querySelector('.placeholder-text').style.opacity = '1';
                    busInput.value = '';
                    updateSearchButtonState();
                });
            }
        }
    });

    const showRouteETAs = async (route, direction, serviceType) => {
        // Update URL with route parameters
        const urlParams = new URLSearchParams();
        urlParams.set('route', route);
        if (direction) urlParams.set('direction', direction);
        if (serviceType) urlParams.set('serviceType', serviceType);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);

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
            const routeData = await fetchAPI('https://data.etabus.gov.hk/v1/transport/kmb/route/');
            const normalizedRoute = normalizeRouteNumber(route);
            const matchingRoutes = routeData.data.filter(r => 
                normalizeRouteNumber(r.route) === normalizedRoute
            );

            if (!matchingRoutes.length) {
                throw new Error(`No route found for ${route}`);
            }

            const matchingRoute = direction && serviceType ?
                matchingRoutes.find(r => r.bound === direction && r.service_type === serviceType) :
                matchingRoutes[0];

            if (!matchingRoute) {
                throw new Error(`No route found for ${route} with specified direction and service type`);
            }

            // Use the service type from the matching route if not provided
            const finalServiceType = serviceType || matchingRoute.service_type;
            const finalDirection = direction || matchingRoute.bound;

            console.log('Using route details:', {
                route: matchingRoute.route,
                direction: finalDirection,
                serviceType: finalServiceType
            });

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

            const stops = await fetchRouteStops(route, finalDirection, finalServiceType);
            const stopList = resultsContainer.querySelector('.stop-list');
            
            if (!stops?.length) {
                stopList.innerHTML = '<div class="no-stops">No stops found for this route</div>';
                return;
            }

            stopList.innerHTML = '';
            await Promise.all(stops.map(async stop => {
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
                await updateStopETA(stopItem, stop.stop, route, finalServiceType);
            }));

            const refreshInterval = setInterval(() => {
                refreshAllETAs(route, finalDirection, finalServiceType);
            }, 30000);

            resultsContainer.querySelector('.refresh-all-button').addEventListener('click', () => {
                refreshAllETAs(route, finalDirection, finalServiceType);
            });

            resultsContainer.querySelector('.back-button').addEventListener('click', () => {
                clearInterval(refreshInterval);
                resultsContainer.classList.remove('active');
                resultsContainer.innerHTML = '';
                document.querySelector('.placeholder-text').style.display = 'block';
                document.querySelector('.placeholder-text').style.opacity = '1';
                busInput.value = '';
                updateSearchButtonState();
                // Clear URL parameters
                window.history.replaceState({}, '', window.location.pathname);
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
            `;

            resultsContainer.querySelector('.back-button').addEventListener('click', () => {
                resultsContainer.classList.remove('active');
                resultsContainer.innerHTML = '';
                document.querySelector('.placeholder-text').style.display = 'block';
                document.querySelector('.placeholder-text').style.opacity = '1';
                busInput.value = '';
                updateSearchButtonState();
            });
        }
    };

    const displaySuggestions = suggestions => {
        const container = document.getElementById('bus-suggestions');
        container.innerHTML = '';
        
        if (!suggestions.length) {
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
                document.querySelector('.placeholder-text').style.display = 'none';
                document.querySelector('.placeholder-text').style.opacity = '0';
                showRouteETAs(route.route, route.bound, route.service_type);
                searchButton.textContent = 'Search Bus';
                searchButton.disabled = false;
            });
            
            container.appendChild(div);
        });
        
        container.classList.add('active');
    };

    busInput.addEventListener('input', debounce(async e => {
        const query = e.target.value.trim();
        if (query.length < 1) {
            document.getElementById('bus-suggestions').classList.remove('active');
            return;
        }
        displaySuggestions(await fetchSuggestions(query));
    }, 300));

    document.addEventListener('click', e => {
        const busSuggestions = document.getElementById('bus-suggestions');
        if (!busInput.contains(e.target) && !busSuggestions.contains(e.target)) {
            busSuggestions.classList.remove('active');
        }
    });
});
