document.addEventListener('DOMContentLoaded', () => {
    // Real Hong Kong minibus routes and stops data
    const minibusStops = [
        // Hong Kong Island Routes
        {
            stop_id: "HKI01",
            name: "Causeway Bay (Pennington Street)",
            nameZh: "銅鑼灣 (邊寧頓街)",
            lines: ["4C", "5", "14M", "21A"]
        },
        {
            stop_id: "HKI02",
            name: "North Point (King's Road)",
            nameZh: "北角 (英皇道)",
            lines: ["4C", "2", "14M", "21A", "31"]
        },
        {
            stop_id: "HKI03",
            name: "Sai Wan Ho (Shau Kei Wan Road)",
            nameZh: "西灣河 (筲箕灣道)",
            lines: ["20M", "32", "2", "31"]
        },
        {
            stop_id: "HKI04",
            name: "Wan Chai (Johnston Road)",
            nameZh: "灣仔 (莊士敦道)",
            lines: ["4C", "5", "14M", "24A"]
        },
        {
            stop_id: "HKI05",
            name: "Central (Des Voeux Road)",
            nameZh: "中環 (德輔道中)",
            lines: ["4C", "5", "24A", "31"]
        },
        {
            stop_id: "HKI06",
            name: "Kennedy Town (Belcher's Street)",
            nameZh: "堅尼地城 (卑路乍街)",
            lines: ["10", "58", "8"]
        },
        {
            stop_id: "HKI07",
            name: "Shek Tong Tsui (Hill Road)",
            nameZh: "石塘咀 (山道)",
            lines: ["10", "8", "58"]
        },
        {
            stop_id: "HKI08",
            name: "Sai Ying Pun (Queen's Road West)",
            nameZh: "西營盤 (皇后大道西)",
            lines: ["10", "8", "24A"]
        },

        // Kowloon Routes
        {
            stop_id: "KLN01",
            name: "Mong Kok (Dundas Street)",
            nameZh: "旺角 (登打士街)",
            lines: ["1A", "2", "3", "6", "12"]
        },
        {
            stop_id: "KLN02",
            name: "Jordan (Nathan Road)",
            nameZh: "佐敦 (彌敦道)",
            lines: ["1A", "3", "6", "12", "77M"]
        },
        {
            stop_id: "KLN03",
            name: "Tsim Sha Tsui (Canton Road)",
            nameZh: "尖沙咀 (廣東道)",
            lines: ["1A", "2", "77M", "78"]
        },
        {
            stop_id: "KLN04",
            name: "Wong Tai Sin (Sha Tin Pass Road)",
            nameZh: "黃大仙 (沙田坳道)",
            lines: ["18M", "19M", "65", "66"]
        },
        {
            stop_id: "KLN05",
            name: "Diamond Hill (Lung Poon Street)",
            nameZh: "鑽石山 (龍蟠街)",
            lines: ["18M", "20M", "65", "67"]
        },
        {
            stop_id: "KLN06",
            name: "Kwun Tong (Hip Wo Street)",
            nameZh: "觀塘 (協和街)",
            lines: ["13M", "15", "16M", "17"]
        },
        {
            stop_id: "KLN07",
            name: "Kowloon City (Junction Road)",
            nameZh: "九龍城 (聯合道)",
            lines: ["22", "23", "25", "27"]
        },
        {
            stop_id: "KLN08",
            name: "To Kwa Wan (Ma Tau Wai Road)",
            nameZh: "土瓜灣 (馬頭圍道)",
            lines: ["22", "23", "25", "28"]
        },

        // New Territories Routes
        {
            stop_id: "NT01",
            name: "Tsuen Wan (Castle Peak Road)",
            nameZh: "荃灣 (青山公路)",
            lines: ["95K", "96M", "89", "90"]
        },
        {
            stop_id: "NT02",
            name: "Kwai Fong (Kwai Foo Road)",
            nameZh: "葵芳 (葵富路)",
            lines: ["95K", "87M", "89", "91"]
        },
        {
            stop_id: "NT03",
            name: "Tai Po Central",
            nameZh: "大埔中心",
            lines: ["20C", "21K", "25K", "26"]
        },
        {
            stop_id: "NT04",
            name: "Sheung Shui (San Wan Road)",
            nameZh: "上水 (新運路)",
            lines: ["52K", "54K", "55K", "56K"]
        },
        {
            stop_id: "NT05",
            name: "Yuen Long (Castle Peak Road)",
            nameZh: "元朗 (青山公路)",
            lines: ["44", "45", "46", "47"]
        },
        {
            stop_id: "NT06",
            name: "Tuen Mun (Tuen Mun Heung Sze Wui Road)",
            nameZh: "屯門 (屯門鄉事會路)",
            lines: ["44", "45", "48", "49"]
        },
        {
            stop_id: "NT07",
            name: "Sha Tin (Lion Rock Tunnel Road)",
            nameZh: "沙田 (獅子山隧道公路)",
            lines: ["65", "66", "67", "68A"]
        },
        {
            stop_id: "NT08",
            name: "Ma On Shan (Sai Sha Road)",
            nameZh: "馬鞍山 (西沙路)",
            lines: ["66", "67", "68A", "69"]
        },
        {
            stop_id: "NT09",
            name: "Tseung Kwan O (Po Lam Road)",
            nameZh: "將軍澳 (寶琳路)",
            lines: ["101M", "102", "103", "104"]
        },
        {
            stop_id: "NT10",
            name: "LOHAS Park",
            nameZh: "日出康城",
            lines: ["101M", "102", "103M"]
        }
    ];

    const elements = {
        header: document.querySelector('.fade-in'),
        locationCard: document.querySelector('.fade-in-second'),
        placeholderText: document.querySelector('.slide-up'),
        typingText: document.querySelector('.typing-text'),
        searchButton: document.getElementById('search-routes'),
        fromInput: document.getElementById('from-input'),
        toInput: document.getElementById('to-input'),
        routeInfo: document.querySelector('.route-info'),
        routeMeta: document.querySelector('.route-meta'),
        stepsContainer: document.getElementById('route-steps'),
        fromSuggestions: document.getElementById('from-suggestions'),
        toSuggestions: document.getElementById('to-suggestions'),
        searchContainer: document.querySelector('.search-container')
    };

    const state = {
        fromInputValid: false,
        toInputValid: false,
        lastValidFromValue: '',
        lastValidToValue: ''
    };

    const textToType = "Please input the location you're currently at and the destination you'd like to reach to show the routes.";
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
        if (elements.routeInfo) {
            elements.routeInfo.classList.remove('visible');
            elements.routeInfo.classList.add('hidden');
        }
        
        if (elements.placeholderText) {
            elements.placeholderText.classList.remove('hidden');
            elements.placeholderText.style.opacity = '1';
            elements.typingText.textContent = message;
        }
    };

    const updateSearchButtonState = () => {
        const fromValue = elements.fromInput.value.trim();
        const toValue = elements.toInput.value.trim();
        const isValid = state.fromInputValid && state.toInputValid;
        const shouldDisable = !isValid || (fromValue === toValue && fromValue !== '');

        if (shouldDisable) {
            if (fromValue === toValue && fromValue !== '') {
                showError('From and To stations cannot be the same');
            } else if (fromValue || toValue) {
                showError('Please select stations from the suggestions list');
            }
            elements.searchButton.disabled = true;
            elements.searchContainer.classList.remove('active');
            elements.searchContainer.style.height = '0';
            return;
        }

        elements.searchContainer.classList.add('active');
        elements.searchContainer.style.height = '85px';
        elements.searchButton.classList.add('active');
        elements.searchButton.disabled = false;
    };

    const displaySuggestions = (suggestions, container) => {
        if (!container) return;
        
        container.innerHTML = '';
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        suggestions.forEach(station => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <div class="location-name">${station.name}</div>
                <div class="location-details">${station.nameZh} • ${station.lines.join(' • ')}</div>
            `;
            div.addEventListener('click', () => {
                const input = container === elements.fromSuggestions ? elements.fromInput : elements.toInput;
                const otherInput = container === elements.fromSuggestions ? elements.toInput : elements.fromInput;

                if (station.name === otherInput.value) {
                    showError('You cannot select the same station for both From and To');
                    return;
                }

                input.value = station.name;
                if (container === elements.fromSuggestions) {
                    state.fromInputValid = true;
                    state.lastValidFromValue = station.name;
                } else {
                    state.toInputValid = true;
                    state.lastValidToValue = station.name;
                }
                container.style.display = 'none';
                updateSearchButtonState();
            });
            container.appendChild(div);
        });
        container.style.display = 'block';
    };

    const fetchSuggestions = (query) => {
        query = query.toLowerCase();
        const suggestions = minibusStops.filter(station => 
            station.name.toLowerCase().includes(query) || 
            station.nameZh.includes(query)
        ).slice(0, 8);
        return suggestions;
    };

    const handleInput = (input, container, validState, lastValidValue) => {
        if (!input || !container) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            state[validState] = false;

            if (query === '') {
                container.style.display = 'none';
                updateSearchButtonState();
                return;
            }

            const suggestions = fetchSuggestions(query);
            displaySuggestions(suggestions, container);
            updateSearchButtonState();
        });

        input.addEventListener('focus', () => {
            if (!input.value.trim()) {
                const suggestions = fetchSuggestions('');
                displaySuggestions(suggestions, container);
            }
        });

        input.addEventListener('blur', () => {
            if (!state[validState] && input.value.trim() !== '') {
                input.value = state[lastValidValue];
                showError('Please select a station from the suggestions list');
            }
            setTimeout(() => container.style.display = 'none', 200);
        });
    };

    handleInput(elements.fromInput, elements.fromSuggestions, 'fromInputValid', 'lastValidFromValue');
    handleInput(elements.toInput, elements.toSuggestions, 'toInputValid', 'lastValidToValue');

    elements.searchButton.addEventListener('click', () => {
        const fromStation = elements.fromInput.value.trim();
        const toStation = elements.toInput.value.trim();

        if (fromStation === toStation) {
            showError('From and To stations cannot be the same');
            return;
        }

        if (!state.fromInputValid || !state.toInputValid) {
            showError('Please select stations from the suggestions list');
            return;
        }

        const route = findRoute(fromStation, toStation);
        if (route) {
            const routeDetails = calculateRouteDetails(route);
            showRouteInfo(fromStation, toStation, routeDetails);
        } else {
            showRouteInfo(fromStation, toStation, {
                duration: 'N/A',
                price: 'N/A',
                steps: [{
                    type: 'error',
                    icon: 'error.png',
                    title: 'No Route Available',
                    details: 'No direct route found between these stations. Please try different stations.'
                }]
            });
        }
    });

    const findRoute = (fromStation, toStation) => {
        const fromStop = minibusStops.find(s => s.name === fromStation);
        const toStop = minibusStops.find(s => s.name === toStation);

        if (!fromStop || !toStop) return null;

        // Check if stops share a line (direct route)
        const commonLines = fromStop.lines.filter(line => 
            toStop.lines.includes(line)
        );

        if (commonLines.length > 0) {
            return {
                type: "direct",
                line: commonLines[0],
                stops: [fromStation, toStation]
            };
        }

        // Find route with one interchange
        for (const fromLine of fromStop.lines) {
            for (const toLine of toStop.lines) {
                // Find interchange stops between these lines
                const interchangeStops = minibusStops.filter(stop => 
                    stop.lines.includes(fromLine) && stop.lines.includes(toLine)
                );

                if (interchangeStops.length > 0) {
                    return {
                        type: "interchange",
                        routes: [
                            { line: fromLine, from: fromStation, to: interchangeStops[0].name },
                            { line: toLine, from: interchangeStops[0].name, to: toStation }
                        ]
                    };
                }
            }
        }

        return null;
    };

    const calculateRouteDetails = (route) => {
        const getPrice = (line) => {
            const prices = {
                '4C': '7.90', '5': '7.90', '2': '8.20',
                '20M': '8.50', '32': '8.50', '1A': '7.00',
                '3': '7.00', '95K': '9.30', '96M': '9.30',
                '87M': '9.30', '20C': '8.90', '21K': '8.90',
                '52K': '9.70', '54K': '9.70', '18M': '7.50',
                '19M': '7.50'
            };
            return prices[line] || '7.50';
        };

        if (route.type === "direct") {
            return {
                duration: '15-20 mins',
                price: getPrice(route.line),
                steps: [
                    { type: 'walk', icon: 'walk.png', title: 'Walk to minibus stop', details: `Head to ${route.stops[0]} minibus stop` },
                    { type: 'minibus', icon: 'minibus.png', title: `Take minibus ${route.line}`, details: 'Direct route to destination' },
                    { type: 'walk', icon: 'walk.png', title: 'Exit stop', details: 'Walk to your destination' }
                ]
            };
        } else {
            const firstRoute = route.routes[0];
            const secondRoute = route.routes[1];
            const totalPrice = (parseFloat(getPrice(firstRoute.line)) + parseFloat(getPrice(secondRoute.line))).toFixed(2);
            
            return {
                duration: '25-35 mins',
                price: totalPrice,
                steps: [
                    { type: 'walk', icon: 'walk.png', title: 'Walk to minibus stop', details: `Head to ${firstRoute.from} minibus stop` },
                    { type: 'minibus', icon: 'minibus.png', title: `Take minibus ${firstRoute.line}`, details: `Travel to ${firstRoute.to}` },
                    { type: 'transfer', icon: 'walk.png', title: 'Change minibus', details: `Transfer to route ${secondRoute.line} at ${firstRoute.to}` },
                    { type: 'minibus', icon: 'minibus.png', title: `Take minibus ${secondRoute.line}`, details: `Continue to ${secondRoute.to}` },
                    { type: 'walk', icon: 'walk.png', title: 'Exit stop', details: 'Walk to your destination' }
                ]
            };
        }
    };

    const showRouteInfo = (fromStation, toStation, routeDetails) => {
        elements.searchButton.innerHTML = '<span class="loading-dots">Searching</span>';
        elements.searchButton.disabled = true;

        setTimeout(() => {
            elements.searchContainer.classList.remove('active');
            elements.searchButton.classList.remove('active');
            elements.searchContainer.style.height = '0';

            if (routeDetails.steps[0].type === 'error') {
                elements.placeholderText.style.opacity = '1';
                elements.placeholderText.classList.remove('hidden');
                elements.typingText.textContent = 'No routes available between these stations. Please try different stations.';
                elements.routeInfo.classList.remove('visible');
                setTimeout(() => elements.routeInfo.classList.add('hidden'), 300);
                elements.searchButton.innerHTML = 'Search Routes';
                elements.searchButton.disabled = false;
                return;
            }

            elements.placeholderText.style.opacity = '0';
            setTimeout(() => {
                elements.placeholderText.classList.add('hidden');
                document.getElementById('from-station').textContent = fromStation;
                document.getElementById('to-station').textContent = toStation;

                const metaItems = [
                    {icon: 'time.png', text: routeDetails.duration},
                    {icon: 'coin.png', text: `HK$${routeDetails.price}`}
                ].map(({icon, text}, i) => {
                    const div = document.createElement('div');
                    div.className = 'meta-item';
                    div.style.cssText = 'opacity: 0; transform: translateY(10px)';
                    div.innerHTML = `<img src="Assets/${icon}" alt="${icon.split('.')[0]}" class="meta-icon"><span>${text}</span>`;
                    setTimeout(() => {
                        div.style.transition = 'all 0.3s ease-out';
                        div.style.opacity = '1';
                        div.style.transform = 'translateY(0)';
                    }, 50 + i * 100);
                    return div;
                });

                elements.routeMeta.innerHTML = '';
                metaItems.forEach(item => elements.routeMeta.appendChild(item));

                elements.stepsContainer.innerHTML = routeDetails.steps.map(step => `
                    <div class="step">
                        <img src="Assets/${step.icon}" alt="${step.type}" class="step-icon">
                        <div class="step-content">
                            <div class="step-title">${step.title}</div>
                            <div class="step-details">${step.details}</div>
                        </div>
                    </div>
                `).join('');

                elements.routeInfo.classList.remove('hidden');
                setTimeout(() => {
                    elements.routeInfo.classList.add('visible');
                    elements.searchButton.innerHTML = 'Search Routes';
                    elements.searchButton.disabled = false;
                }, 50);
            }, 300);
        }, 500);
    };

    // Initial animation setup
    animateWithDelay(elements.header, 100);
    animateWithDelay(elements.locationCard, 600);
    
    // Show initial placeholder text with animation
    setTimeout(() => {
        if (elements.placeholderText) {
            elements.placeholderText.style.opacity = '1';
            elements.placeholderText.classList.remove('hidden');
            typeText();
        }
    }, 800);

    document.addEventListener('click', (e) => {
        if (!elements.fromInput.contains(e.target) && !elements.fromSuggestions.contains(e.target)) {
            elements.fromSuggestions.style.display = 'none';
        }
        if (!elements.toInput.contains(e.target) && !elements.toSuggestions.contains(e.target)) {
            elements.toSuggestions.style.display = 'none';
        }
    });

    const style = document.createElement('style');
    style.textContent = `
        .loading-dots::after {
            content: '...';
            animation: dots 1.5s steps(4, end) infinite;
            display: inline-block;
            width: 0;
            overflow: hidden;
            vertical-align: bottom;
        }
        @keyframes dots {
            to { width: 1.25em; }
        }
        .search-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
});