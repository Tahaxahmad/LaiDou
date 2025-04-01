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

    // Function to fetch suggestions from KMB API
    async function fetchSuggestions(query) {
        try {
            // KMB API endpoint for all stops
            const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop');
            const data = await response.json();
            const stops = data.data || [];
            
            // Filter stops based on user input
            const filteredStops = stops.filter(stop => {
                const nameEn = stop.name_en.toLowerCase();
                const nameTc = stop.name_tc.toLowerCase();
                const searchQuery = query.toLowerCase();
                
                return nameEn.includes(searchQuery) || nameTc.includes(searchQuery);
            });
            
            // Limit results to top 10 matches
            return filteredStops.slice(0, 10);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    }

    // Function to display suggestions
    function displaySuggestions(suggestions, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (suggestions.length === 0) {
            container.classList.remove('active');
            return;
        }

        suggestions.forEach(stop => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            // Highlight the matching text
            const query = (containerId === 'from-suggestions' ? 
                document.querySelector('input[placeholder="From"]') :
                document.querySelector('input[placeholder="To"]')).value.trim();
                
            const nameEn = stop.name_en;
            const nameTc = stop.name_tc;
            
            div.innerHTML = `
                <div class="location-name">${nameEn}</div>
                <div class="location-details">${nameTc}</div>
            `;
            
            div.addEventListener('click', () => {
                const input = containerId === 'from-suggestions' ? 
                    document.querySelector('input[placeholder="From"]') :
                    document.querySelector('input[placeholder="To"]');
                input.value = nameEn;
                container.classList.remove('active');
            });
            
            container.appendChild(div);
        });
        
        container.classList.add('active');
    }

    // Handle search button visibility and functionality
    const searchButton = document.getElementById('search-routes');
    const searchContainer = searchButton.parentElement;
    const fromInput = document.querySelector('input[placeholder="From"]');
    const toInput = document.querySelector('input[placeholder="To"]');

    function updateSearchButtonState() {
        const fromValue = fromInput.value.trim();
        const toValue = toInput.value.trim();
        const placeholderText = document.querySelector('.placeholder-text');
        
        if (fromValue && toValue) {
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

    // Add input handlers for text overflow
    fromInput.addEventListener('input', () => {
        handleInputOverflow(fromInput);
        updateSearchButtonState();
    });

    toInput.addEventListener('input', () => {
        handleInputOverflow(toInput);
        updateSearchButtonState();
    });

    // Handle search button click
    searchButton.addEventListener('click', () => {
        const from = fromInput.value.trim();
        const to = toInput.value.trim();
        
        if (from && to) {
            // Here you can add the logic to search for routes
            console.log(`Searching for routes from ${from} to ${to}`);
            // For now, we'll just show an alert
            alert(`Searching for bus routes from ${from} to ${to}`);
        }
    });

    // Handle input for From field
    const handleFromInput = debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            document.getElementById('from-suggestions').classList.remove('active');
            return;
        }
        
        const suggestions = await fetchSuggestions(query);
        displaySuggestions(suggestions, 'from-suggestions');
    }, 300);

    fromInput.addEventListener('input', handleFromInput);

    // Handle input for To field
    const handleToInput = debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            document.getElementById('to-suggestions').classList.remove('active');
            return;
        }
        
        const suggestions = await fetchSuggestions(query);
        displaySuggestions(suggestions, 'to-suggestions');
    }, 300);

    toInput.addEventListener('input', handleToInput);

    // Update search button state when selecting a suggestion
    const originalDisplaySuggestions = displaySuggestions;
    function displaySuggestionsWithButtonUpdate(suggestions, containerId) {
        originalDisplaySuggestions(suggestions, containerId);
        updateSearchButtonState();
    }
    displaySuggestions = displaySuggestionsWithButtonUpdate;

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const fromSuggestions = document.getElementById('from-suggestions');
        const toSuggestions = document.getElementById('to-suggestions');
        
        if (!fromInput.contains(e.target) && !fromSuggestions.contains(e.target)) {
            fromSuggestions.classList.remove('active');
        }
        
        if (!toInput.contains(e.target) && !toSuggestions.contains(e.target)) {
            toSuggestions.classList.remove('active');
        }
    });
}); 