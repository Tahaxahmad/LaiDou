document.addEventListener('DOMContentLoaded', () => {
    const stations = [
        // Kwun Tong Line
        { name: "Whampoa", nameZh: "黃埔", lines: ["Kwun Tong"] }, { name: "Ho Man Tin", nameZh: "何文田", lines: ["Kwun Tong"] }, { name: "Yau Ma Tei", nameZh: "油麻地", lines: ["Kwun Tong", "Tsuen Wan"] }, { name: "Mong Kok", nameZh: "旺角", lines: ["Kwun Tong", "Tsuen Wan"] }, { name: "Prince Edward", nameZh: "太子", lines: ["Kwun Tong", "Tsuen Wan"] }, { name: "Shek Kip Mei", nameZh: "石硤尾", lines: ["Kwun Tong"] }, { name: "Kowloon Tong", nameZh: "九龍塘", lines: ["Kwun Tong", "East Rail"] }, { name: "Lok Fu", nameZh: "樂富", lines: ["Kwun Tong"] }, { name: "Wong Tai Sin", nameZh: "黃大仙", lines: ["Kwun Tong"] }, { name: "Diamond Hill", nameZh: "鑽石山", lines: ["Kwun Tong"] }, { name: "Choi Hung", nameZh: "彩虹", lines: ["Kwun Tong"] }, { name: "Kowloon Bay", nameZh: "九龍灣", lines: ["Kwun Tong"] }, { name: "Ngau Tau Kok", nameZh: "牛頭角", lines: ["Kwun Tong"] }, { name: "Kwun Tong", nameZh: "觀塘", lines: ["Kwun Tong"] }, { name: "Lam Tin", nameZh: "藍田", lines: ["Kwun Tong"] }, { name: "Yau Tong", nameZh: "油塘", lines: ["Kwun Tong", "Tseung Kwan O"] }, { name: "Tiu Keng Leng", nameZh: "調景嶺", lines: ["Kwun Tong", "Tseung Kwan O"] },
        // Tsuen Wan Line
        { name: "Tsuen Wan", nameZh: "荃灣", lines: ["Tsuen Wan"] }, { name: "Tai Wo Hau", nameZh: "大窩口", lines: ["Tsuen Wan"] }, { name: "Kwai Hing", nameZh: "葵興", lines: ["Tsuen Wan"] }, { name: "Kwai Fong", nameZh: "葵芳", lines: ["Tsuen Wan"] }, { name: "Lai King", nameZh: "荔景", lines: ["Tsuen Wan", "Tung Chung"] }, { name: "Mei Foo", nameZh: "美孚", lines: ["Tsuen Wan", "West Rail"] }, { name: "Lai Chi Kok", nameZh: "荔枝角", lines: ["Tsuen Wan"] }, { name: "Cheung Sha Wan", nameZh: "長沙灣", lines: ["Tsuen Wan"] }, { name: "Sham Shui Po", nameZh: "深水埗", lines: ["Tsuen Wan"] }, { name: "Jordan", nameZh: "佐敦", lines: ["Tsuen Wan"] }, { name: "Tsim Sha Tsui", nameZh: "尖沙咀", lines: ["Tsuen Wan"] }, { name: "Admiralty", nameZh: "金鐘", lines: ["Tsuen Wan", "Island"] }, { name: "Central", nameZh: "中環", lines: ["Tsuen Wan", "Island"] },
        // Island Line
        { name: "Kennedy Town", nameZh: "堅尼地城", lines: ["Island"] }, { name: "HKU", nameZh: "香港大學", lines: ["Island"] }, { name: "Sai Ying Pun", nameZh: "西營盤", lines: ["Island"] }, { name: "Sheung Wan", nameZh: "上環", lines: ["Island"] }, { name: "Wan Chai", nameZh: "灣仔", lines: ["Island"] }, { name: "Causeway Bay", nameZh: "銅鑼灣", lines: ["Island"] }, { name: "Tin Hau", nameZh: "天后", lines: ["Island"] }, { name: "Fortress Hill", nameZh: "炮台山", lines: ["Island"] }, { name: "North Point", nameZh: "北角", lines: ["Island", "Tseung Kwan O"] }, { name: "Quarry Bay", nameZh: "鰂魚涌", lines: ["Island", "Tseung Kwan O"] }, { name: "Tai Koo", nameZh: "太古", lines: ["Island"] }, { name: "Sai Wan Ho", nameZh: "西灣河", lines: ["Island"] }, { name: "Shau Kei Wan", nameZh: "筲箕灣", lines: ["Island"] }, { name: "Heng Fa Chuen", nameZh: "杏花邨", lines: ["Island"] }, { name: "Chai Wan", nameZh: "柴灣", lines: ["Island"] },
        // Tseung Kwan O Line
        { name: "Po Lam", nameZh: "寶琳", lines: ["Tseung Kwan O"] }, { name: "Hang Hau", nameZh: "坑口", lines: ["Tseung Kwan O"] }, { name: "LOHAS Park", nameZh: "康城", lines: ["Tseung Kwan O"] }, { name: "Tseung Kwan O", nameZh: "將軍澳", lines: ["Tseung Kwan O"] },
        // Tung Chung Line
        { name: "Tung Chung", nameZh: "東涌", lines: ["Tung Chung"] }, { name: "Sunny Bay", nameZh: "欣澳", lines: ["Tung Chung"] }, { name: "Tsing Yi", nameZh: "青衣", lines: ["Tung Chung"] }, { name: "Olympic", nameZh: "奧運", lines: ["Tung Chung"] }, { name: "Kowloon", nameZh: "九龍", lines: ["Tung Chung"] }, { name: "Hong Kong", nameZh: "香港", lines: ["Tung Chung"] },
        // East Rail Line
        { name: "Lo Wu", nameZh: "羅湖", lines: ["East Rail"] }, { name: "Sheung Shui", nameZh: "上水", lines: ["East Rail"] }, { name: "Fanling", nameZh: "粉嶺", lines: ["East Rail"] }, { name: "Tai Wo", nameZh: "太和", lines: ["East Rail"] }, { name: "Tai Po Market", nameZh: "大埔墟", lines: ["East Rail"] }, { name: "University", nameZh: "大學", lines: ["East Rail"] }, { name: "Fo Tan", nameZh: "火炭", lines: ["East Rail"] }, { name: "Sha Tin", nameZh: "沙田", lines: ["East Rail"] }, { name: "Tai Wai", nameZh: "大圍", lines: ["East Rail", "Tuen Ma"] }, { name: "Hung Hom", nameZh: "紅磡", lines: ["East Rail"] }, { name: "Exhibition Centre", nameZh: "會展", lines: ["East Rail"] },
        // Tuen Ma Line
        { name: "Wu Kai Sha", nameZh: "烏溪沙", lines: ["Tuen Ma"] }, { name: "Ma On Shan", nameZh: "馬鞍山", lines: ["Tuen Ma"] }, { name: "Heng On", nameZh: "恆安", lines: ["Tuen Ma"] }, { name: "Tai Shui Hang", nameZh: "大水坑", lines: ["Tuen Ma"] }, { name: "Shek Mun", nameZh: "石門", lines: ["Tuen Ma"] }, { name: "City One", nameZh: "第一城", lines: ["Tuen Ma"] }, { name: "Che Kung Temple", nameZh: "車公廟", lines: ["Tuen Ma"] }, { name: "Sha Tin Wai", nameZh: "沙田圍", lines: ["Tuen Ma"] }, { name: "Hin Keng", nameZh: "顯徑", lines: ["Tuen Ma"] }, { name: "Kai Tak", nameZh: "啟德", lines: ["Tuen Ma"] }, { name: "Diamond Hill", nameZh: "鑽石山", lines: ["Tuen Ma"] }, { name: "To Kwa Wan", nameZh: "土瓜灣", lines: ["Tuen Ma"] }, { name: "Sung Wong Toi", nameZh: "宋皇臺", lines: ["Tuen Ma"] }, { name: "Ho Man Tin", nameZh: "何文田", lines: ["Tuen Ma"] }, { name: "Hung Hom", nameZh: "紅磡", lines: ["Tuen Ma"] }, { name: "East Tsim Sha Tsui", nameZh: "尖東", lines: ["Tuen Ma"] }, { name: "Austin", nameZh: "柯士甸", lines: ["Tuen Ma", "West Rail"] }, { name: "Nam Cheong", nameZh: "南昌", lines: ["Tuen Ma", "West Rail"] }, { name: "Sham Shui Po", nameZh: "深水埗", lines: ["Tuen Ma"] }, { name: "Cheung Sha Wan", nameZh: "長沙灣", lines: ["Tuen Ma"] }, { name: "Lai Chi Kok", nameZh: "荔枝角", lines: ["Tuen Ma"] }, { name: "Mei Foo", nameZh: "美孚", lines: ["Tuen Ma"] }, { name: "Tsuen Wan West", nameZh: "荃灣西", lines: ["Tuen Ma"] }, { name: "Kam Sheung Road", nameZh: "錦上路", lines: ["Tuen Ma"] }, { name: "Yuen Long", nameZh: "元朗", lines: ["Tuen Ma"] }, { name: "Long Ping", nameZh: "朗屏", lines: ["Tuen Ma"] }, { name: "Tin Shui Wai", nameZh: "天水圍", lines: ["Tuen Ma"] }, { name: "Siu Hong", nameZh: "兆康", lines: ["Tuen Ma"] }, { name: "Tuen Mun", nameZh: "屯門", lines: ["Tuen Ma"] }
    ];

    const elements = {
        header: document.querySelector('.fade-in'),
        locationCard: document.querySelector('.fade-in-second'), 
        placeholderText: document.querySelector('.slide-up'),
        typingText: document.querySelector('.typing-text'),
        searchButton: document.getElementById('search-routes'),
        fromInput: document.querySelector('[placeholder="From"]'),
        toInput: document.querySelector('[placeholder="To"]'),
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
        elements.routeInfo.classList.remove('visible');
        setTimeout(() => elements.routeInfo.classList.add('hidden'), 300);
        elements.placeholderText.style.opacity = '1';
        elements.placeholderText.classList.remove('hidden');
        elements.typingText.textContent = message;
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
            elements.placeholderText.classList.remove('search-active');
            return;
        }

        elements.searchContainer.classList.add('active');
        elements.searchContainer.style.height = '85px';
        elements.searchButton.classList.add('active');
        elements.searchButton.disabled = false;
        elements.placeholderText.classList.add('search-active');
    };

    const displaySuggestions = (suggestions, container) => {
        container.innerHTML = '';
        if (suggestions.length === 0) {
            container.classList.remove('active');
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
                container.classList.remove('active');
                updateSearchButtonState();
            });
            container.appendChild(div);
        });
        container.classList.add('active');
    };

    const fetchSuggestions = (query) => {
        query = query.toLowerCase();
        return stations
            .filter(station => station.name.toLowerCase().includes(query) || station.nameZh.includes(query))
            .slice(0, 8)
            .map(station => ({
                name: station.name,
                nameZh: station.nameZh,
                lines: station.lines
            }));
    };

    const handleInput = (input, container, validState, lastValidValue) => {
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            state[validState] = false;

            if (query === '') {
                container.classList.remove('active');
                updateSearchButtonState();
                return;
            }

            const suggestions = fetchSuggestions(query);
            displaySuggestions(suggestions, container);
            updateSearchButtonState();
        });

        input.addEventListener('focus', () => {
            if (!input.value.trim()) {
                displaySuggestions(stations, container);
            }
        });

        input.addEventListener('blur', () => {
            if (!state[validState] && input.value.trim() !== '') {
                input.value = state[lastValidValue];
                showError('Please select a station from the suggestions list');
            }
            setTimeout(() => container.classList.remove('active'), 200);
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
        const fromStationData = stations.find(s => s.name === fromStation);
        const toStationData = stations.find(s => s.name === toStation);

        if (!fromStationData || !toStationData) return null;

        const commonLines = fromStationData.lines.filter(line => 
            toStationData.lines.includes(line)
        );

        if (commonLines.length > 0) {
            return {
                type: "direct",
                line: commonLines[0],
                stations: [fromStation, toStation]
            };
        }

        const interchanges = [
            { station: "Mei Foo", lines: ["Tsuen Wan", "Tuen Ma"] },
            { station: "Central", lines: ["Island", "Tsuen Wan"] },
            { station: "Admiralty", lines: ["Island", "Tsuen Wan"] },
            { station: "North Point", lines: ["Island", "Tseung Kwan O"] },
            { station: "Yau Ma Tei", lines: ["Kwun Tong", "Tsuen Wan"] },
            { station: "Mong Kok", lines: ["Kwun Tong", "Tsuen Wan"] },
            { station: "Prince Edward", lines: ["Kwun Tong", "Tsuen Wan"] },
            { station: "Kowloon Tong", lines: ["Kwun Tong", "East Rail"] },
            { station: "Tai Wai", lines: ["East Rail", "Tuen Ma"] }
        ];

        for (const interchange of interchanges) {
            const fromStationToInterchange = fromStationData.lines.find(line => 
                interchange.lines.includes(line)
            );
            
            const interchangeToDestination = toStationData.lines.find(line => 
                interchange.lines.includes(line)
            );

            if (fromStationToInterchange && interchangeToDestination && 
                fromStationToInterchange !== interchangeToDestination) {
                return {
                    type: "interchange",
                    routes: [
                        {
                            line: fromStationToInterchange,
                            from: fromStation,
                            to: interchange.station
                        },
                        {
                            line: interchangeToDestination,
                            from: interchange.station,
                            to: toStation
                        }
                    ]
                };
            }
        }

        for (const firstInterchange of interchanges) {
            const fromStationToFirstInterchange = fromStationData.lines.find(line => 
                firstInterchange.lines.includes(line)
            );

            if (!fromStationToFirstInterchange) continue;

            for (const secondInterchange of interchanges) {
                if (firstInterchange.station === secondInterchange.station) continue;

                const connectingLine = firstInterchange.lines.find(line => 
                    secondInterchange.lines.includes(line)
                );

                if (!connectingLine) continue;

                const secondInterchangeToDestination = toStationData.lines.find(line => 
                    secondInterchange.lines.includes(line) && line !== connectingLine
                );

                if (secondInterchangeToDestination) {
                    return {
                        type: "interchange",
                        routes: [
                            {
                                line: fromStationToFirstInterchange,
                                from: fromStation,
                                to: firstInterchange.station
                            },
                            {
                                line: connectingLine,
                                from: firstInterchange.station,
                                to: secondInterchange.station
                            },
                            {
                                line: secondInterchangeToDestination,
                                from: secondInterchange.station,
                                to: toStation
                            }
                        ]
                    };
                }
            }
        }

        return null;
    };

    const calculateRouteDetails = (route) => {
        if (!route) return {
            duration: 'N/A',
            price: 'N/A',
            steps: [{
                type: 'error',
                icon: 'error.png',
                title: 'No Route Available',
                details: 'Could not find a route between these stations.'
            }]
        };

        if (route.type === "direct") {
            return {
                duration: '15-20 mins',
                price: '12.50',
                steps: [
                    { type: 'walk', icon: 'walk.png', title: 'Walk to platform', details: `Head to Platform - ${route.line}` },
                    { type: 'train', icon: 'train2.png', title: `Take ${route.line}`, details: 'Direct route to destination' },
                    { type: 'walk', icon: 'walk.png', title: 'Exit station', details: 'Follow exit signs to your destination' }
                ]
            };
        } else {
            const routes = route.routes;
            const steps = [
                { type: 'walk', icon: 'walk.png', title: 'Walk to platform', details: `Head to Platform - ${routes[0].line}` }
            ];

            routes.forEach((segment, index) => {
                steps.push({ 
                    type: 'train', 
                    icon: 'train2.png', 
                    title: `Take ${segment.line}`, 
                    details: `Travel to ${segment.to} station` 
                });

                if (index < routes.length - 1) {
                    steps.push({
                        type: 'transfer',
                        icon: 'walk.png',
                        title: 'Change lines',
                        details: `Transfer to ${routes[index + 1].line} at ${segment.to}`
                    });
                }
            });

            steps.push({ 
                type: 'walk', 
                icon: 'walk.png', 
                title: 'Exit station', 
                details: 'Follow exit signs to your destination' 
            });

            const duration = routes.length > 2 ? '35-45 mins' : '25-30 mins';
            const price = routes.length > 2 ? '18.50' : '15.50';

            return {
                duration: duration,
                price: price,
                steps: steps
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
            elements.placeholderText.classList.remove('search-active');

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

    animateWithDelay(elements.header, 100);
    animateWithDelay(elements.locationCard, 600);
    animateWithDelay(elements.placeholderText, 800);
    setTimeout(typeText, 1600);

    document.addEventListener('click', (e) => {
        if (!elements.fromInput.contains(e.target) && !elements.fromSuggestions.contains(e.target)) {
            elements.fromSuggestions.classList.remove('active');
        }
        if (!elements.toInput.contains(e.target) && !elements.toSuggestions.contains(e.target)) {
            elements.toSuggestions.classList.remove('active');
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
