// Initialize map
const map = L.map('map', {
    zoomControl: false
}).setView([22.3193, 114.1694], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize map controls
const zoomInBtn = document.querySelector('.zoom-in');
const zoomOutBtn = document.querySelector('.zoom-out');
const compassBtn = document.querySelector('.compass');

zoomInBtn.addEventListener('click', () => map.setZoom(map.getZoom() + 1));
zoomOutBtn.addEventListener('click', () => map.setZoom(map.getZoom() - 1));
compassBtn.addEventListener('click', () => {
    if (userMarker) {
        map.setView(userMarker.getLatLng(), map.getZoom());
    }
});

// Initialize location handling
let userMarker = null;
let destinationMarker = null;

async function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

async function initializeLocation() {
    try {
        const position = await getCurrentPosition();
        
        // Create user marker if it doesn't exist
        if (!userMarker) {
            const userIcon = L.divIcon({
                className: 'user-marker',
                html: '📍',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            });
            userMarker = L.marker([position.lat, position.lng], { icon: userIcon }).addTo(map);
        } else {
            userMarker.setLatLng([position.lat, position.lng]);
        }

        // Center map on user location
        map.setView([position.lat, position.lng], 16);
        
        return position;
    } catch (error) {
        console.error('Error getting location:', error);
        showError('Could not get your location. Please check your location settings.');
        return null;
    }
}

// Initialize sidebar toggle
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('active') && 
        !e.target.closest('.sidebar') && 
        !e.target.closest('.sidebar-toggle')) {
        sidebar.classList.remove('active');
    }
});

// Initialize location on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeLocation();
});

// Initialize UI elements
const bottomSheet = document.querySelector('.bottom-sheet');
if (bottomSheet) {
    bottomSheet.style.display = 'none';
    bottomSheet.classList.add('hidden');
}

// Remove any existing overlays
const existingModals = document.querySelectorAll('.modal');
existingModals.forEach(modal => modal.remove());

const existingLoadingOverlays = document.querySelectorAll('.loading-overlay');
existingLoadingOverlays.forEach(overlay => overlay.remove());

// Initialize other UI components
updateFavoritesList();
populateRecentLocations();

// Then check location permission
checkLocationPermission().catch(error => {
    console.log('Location permission check failed:', error);
    // Only show error if it's not a user denial
    if (error.code !== 1) {
        showLocationError(error);
    }
});

// Location permission handling
function checkLocationPermission() {
    // Check if we already have stored permission
    const locationPermission = localStorage.getItem('locationPermission');
    
    if (locationPermission === 'granted') {
        return initializeLocation();
    } else if (locationPermission === 'denied') {
        // Center map on default location (Hong Kong)
        map.setView([22.3193, 114.1694], 11);
        return Promise.reject({ code: 1, message: 'Location access previously denied.' });
    }
    
    // If no stored preference, check browser permission status
    return navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
            if (permissionStatus.state === 'granted') {
                localStorage.setItem('locationPermission', 'granted');
                return initializeLocation();
            } else if (permissionStatus.state === 'denied') {
                localStorage.setItem('locationPermission', 'denied');
                map.setView([22.3193, 114.1694], 11);
                return Promise.reject({ code: 1, message: 'Location access denied.' });
            } else {
                // Show permission request modal
                return requestLocationPermission();
            }
        })
        .catch(() => requestLocationPermission());
}

function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        const existingModal = document.querySelector('.permission-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal permission-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="location-icon">📍</div>
                <h2>Enable Location Services</h2>
                <p>This app needs your location to:</p>
                <ul class="permission-benefits">
                    <li>📱 Show your current position</li>
                    <li>🗺️ Provide accurate directions</li>
                    <li>🎯 Calculate precise travel times</li>
                </ul>
                <div class="modal-buttons">
                    <button class="allow-btn">Enable Location</button>
                    <button class="deny-btn">Not Now</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Force reflow and add active class
        modal.offsetHeight;
        modal.classList.add('active');

        modal.querySelector('.allow-btn').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            
            initializeLocation()
                .then(() => {
                    localStorage.setItem('locationPermission', 'granted');
                    resolve();
                })
                .catch(error => {
                    localStorage.setItem('locationPermission', 'denied');
                    console.error('Location initialization error:', error);
                    reject(error);
                });
        });

        modal.querySelector('.deny-btn').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            
            localStorage.setItem('locationPermission', 'denied');
            // Center map on default location (Hong Kong)
            map.setView([22.3193, 114.1694], 11);
            reject({ code: 1, message: 'Location access denied by user.' });
        });
    });
}

let userAccuracyCircle = null;
let userBeacon = null;

function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

function hideToast() {
    const toast = document.querySelector('.toast');
    if (toast) toast.remove();
}

// Add CSS styles for new components
const style = document.createElement('style');
style.textContent = `
    .location-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
    }

    .location-input-group {
        margin: 15px 0;
    }

    .manual-location-results {
        max-height: 200px;
        overflow-y: auto;
        margin-top: 10px;
    }

    .manual-location-result {
        display: flex;
        padding: 10px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
    }

    .manual-location-result:hover {
        background: #f5f5f5;
    }

    .location-options {
        display: flex;
        gap: 10px;
        margin: 15px 0;
    }

    .toast {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 1000;
    }

    .location-edit-popup {
        padding: 10px;
    }

    .location-edit-popup button {
        width: 100%;
        margin: 5px 0;
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: #f0f0f1;
        cursor: pointer;
    }

    .location-edit-popup button:hover {
        background: #e0e0e0;
    }

    .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin-top: 8px;
        max-height: 60vh;
        overflow-y: auto;
        z-index: 1000;
        display: none;
    }

    .search-result-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s;
    }

    .search-result-item:last-child {
        border-bottom: none;
    }

    .search-result-item:hover {
        background-color: #f8f9fa;
    }

    .location-icon {
        width: 24px;
        height: 24px;
        margin-right: 12px;
        color: #007AFF;
    }

    .location-icon svg {
        width: 100%;
        height: 100%;
    }

    .location-info {
        flex: 1;
        min-width: 0;
    }

    .location-name {
        font-size: 16px;
        font-weight: 500;
        color: #000;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .location-address {
        font-size: 14px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .no-results {
        padding: 16px;
        text-align: center;
        color: #666;
        font-size: 14px;
    }

    .search-wrapper {
        position: relative;
        z-index: 1000;
    }
`;
document.head.appendChild(style);

function getBrowserLocation() {
    return new Promise((resolve, reject) => {
        const options = {
            enableHighAccuracy: true, // Enable high accuracy for better precision
            timeout: 5000, // 5 second timeout
            maximumAge: 0 // Don't use cached positions
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    source: 'browser'
                });
            },
            (error) => {
                console.log('Browser geolocation failed:', error);
                resolve(null); // Return null to try default location
            },
            options
        );
    });
}

function showLocationError(error) {
    let errorMessage = 'Unable to get your location.';
    let errorDetails = 'Please check your location settings and try again.';
    let retryButton = true;

    if (error.code === 1) {
        errorMessage = 'Location Access Denied';
        errorDetails = 'Please enable location access in your browser settings to use this feature.';
        retryButton = false; // Don't show retry button for permission errors
    } else if (error.code === 2) {
        errorMessage = 'Location Unavailable';
        errorDetails = 'Unable to determine your location. Please check your device settings.';
    } else if (error.code === 3) {
        errorMessage = 'Location Timeout';
        errorDetails = 'It took too long to get your location. Please try again.';
    }

    const existingModal = document.querySelector('.error-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const errorModal = document.createElement('div');
    errorModal.className = 'modal error-modal';
    errorModal.innerHTML = `
        <div class="error-modal-content">
            <div class="error-icon">⚠️</div>
            <h3>${errorMessage}</h3>
            <p>${errorDetails}</p>
            ${retryButton ? '<button class="error-retry-btn">Retry</button>' : ''}
            <button class="error-ok-btn">OK</button>
        </div>
    `;

    document.body.appendChild(errorModal);
    
    setTimeout(() => {
        errorModal.classList.add('active');
    }, 10);

    const okBtn = errorModal.querySelector('.error-ok-btn');
    okBtn.addEventListener('click', () => {
        errorModal.classList.remove('active');
        setTimeout(() => {
            errorModal.remove();
        }, 300);
    });

    if (retryButton) {
        const retryBtn = errorModal.querySelector('.error-retry-btn');
        retryBtn.addEventListener('click', () => {
            errorModal.classList.remove('active');
            setTimeout(() => {
                errorModal.remove();
            }, 300);
            initializeLocation();
        });
    }
}

// Recent locations storage
const MAX_RECENT_LOCATIONS = 10;

function saveRecentLocation(location) {
    let recentLocations = JSON.parse(localStorage.getItem('recentLocations') || '[]');
    
    // Remove duplicates
    recentLocations = recentLocations.filter(item => item.name !== location.name);
    
    // Add new location at the beginning
    recentLocations.unshift(location);
    
    // Keep only the last MAX_RECENT_LOCATIONS items
    if (recentLocations.length > MAX_RECENT_LOCATIONS) {
        recentLocations = recentLocations.slice(0, MAX_RECENT_LOCATIONS);
    }
    
    localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
    populateRecentLocations();
}

// Update populateRecentLocations function
function populateRecentLocations() {
    const recentList = document.querySelector('.recent-list');
    const recentLocations = JSON.parse(localStorage.getItem('recentLocations') || '[]');
    
    recentList.innerHTML = recentLocations.map(location => `
        <div class="recent-item" data-lat="${location.lat}" data-lon="${location.lon}">
            <div class="recent-icon">🎯</div>
            <div class="recent-details">
                <div class="recent-name">${location.name}</div>
                <div class="recent-address">${location.address || ''}</div>
            </div>
        </div>
    `).join('');

    // Reattach clear button event listener
    const clearRecentsBtn = document.querySelector('.clear-recents');
    if (clearRecentsBtn) {
        clearRecentsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearRecents();
        });
    }

    // Add click handlers for recent items
    document.querySelectorAll('.recent-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const name = item.querySelector('.recent-name').textContent;
            
            // Remove existing destination marker if any
            if (destinationMarker) {
                map.removeLayer(destinationMarker);
            }

            // Create destination marker
            const destinationIcon = L.divIcon({
                className: 'destination-marker',
                html: '<div class="destination-pin"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            });
            destinationMarker = L.marker([lat, lon], { icon: destinationIcon }).addTo(map);
            
            map.setView([lat, lon], 16);
            showRouteOptions({
                lat,
                lon,
                name: name
            });
        });
    });
}

// Search functionality with suggestions
let searchTimeout;
let routeLines = [];
let currentRoutes = [];
let routeLayers = [];

const searchInput = document.querySelector('.search-input');
const searchResults = document.createElement('div');
searchResults.className = 'search-results';
searchInput.parentElement.appendChild(searchResults);

async function searchLocation(query) {
    if (!query || query.length < 2) {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) searchResults.style.display = 'none';
        return;
    }

    try {
        showLoading('Searching...');
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5`);
        const results = await response.json();
        hideLoading();

        const searchResults = document.querySelector('.search-results');
        searchResults.innerHTML = '';

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No results found</div>';
            searchResults.style.display = 'block';
            return;
        }

        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            const locationIcon = document.createElement('div');
            locationIcon.className = 'location-icon';
            locationIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
            
            const locationInfo = document.createElement('div');
            locationInfo.className = 'location-info';
            
            const locationName = document.createElement('div');
            locationName.className = 'location-name';
            locationName.textContent = result.display_name.split(',')[0];
            
            const locationAddress = document.createElement('div');
            locationAddress.className = 'location-address';
            locationAddress.textContent = result.display_name.split(',').slice(1).join(',').trim();
            
            locationInfo.appendChild(locationName);
            locationInfo.appendChild(locationAddress);
            
            resultItem.appendChild(locationIcon);
            resultItem.appendChild(locationInfo);
            
            resultItem.addEventListener('click', () => {
                const location = {
                    name: result.display_name,
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                };
                
                const searchInput = document.querySelector('.search-input');
                searchInput.value = location.name;
                searchResults.style.display = 'none';
                
                // Update the map
                map.setView([location.lat, location.lng], 15);
                
                // Save to recent locations
                saveRecentLocation(location);
            });
            
            searchResults.appendChild(resultItem);
        });
        
        searchResults.style.display = 'block';
    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        showError('Failed to search location. Please try again.');
    }
}

// Update the search input event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    const searchWrapper = document.querySelector('.search-wrapper');

    const debouncedSearch = debounce((query) => {
        searchLocation(query);
    }, 300);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        debouncedSearch(query);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            searchResults.style.display = 'block';
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchWrapper.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
});

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with actual API key
const GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';

const TRANSPORT_MODES = {
    DRIVING: { id: 'driving', icon: '🚗', label: 'Drive' },
    TRANSIT: { id: 'transit', icon: '🚇', label: 'Transit' },
    CYCLING: { id: 'cycling', icon: '🚲', label: 'Bike' },
    WALKING: { id: 'walking', icon: '🚶', label: 'Walk' }
};

function createTransportModeSelector() {
    const transportModes = document.createElement('div');
    transportModes.className = 'transport-modes';
    
    Object.values(TRANSPORT_MODES).forEach(mode => {
        const button = document.createElement('button');
        button.className = 'transport-mode';
        button.dataset.mode = mode.id;
        button.innerHTML = `${mode.icon} <span>${mode.label}</span>`;
        button.onclick = () => {
            document.querySelectorAll('.transport-mode').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (currentOrigin && currentDestination) {
                fetchRouteOptions(currentOrigin, currentDestination, mode.id);
            }
        };
        transportModes.appendChild(button);
    });

    document.querySelector('.map-controls').appendChild(transportModes);
}

async function fetchRouteOptions(origin, destination, mode = 'driving') {
    try {
        showLoading('Finding routes...');
        
        // Use OSRM demo server for routing
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/${mode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&alternatives=true&steps=true`
        );

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('No routes found');
        }

        hideLoading();
        
        // Process and return routes
        return data.routes.map((route, index) => ({
            index,
            geometry: route.geometry,
            duration: Math.round(route.duration / 60),
            distance: (route.distance / 1000).toFixed(1),
            mode: mode,
            steps: route.legs[0].steps
        }));
    } catch (error) {
        hideLoading();
        console.error('Route error:', error);
        showError('Could not find routes. Please try again.');
        return [];
    }
}

// Decode Google Maps polyline
function decodePolyline(str, precision = 5) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {
        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
}

// Update showRouteOptions function to match Google Maps UI
async function showRouteOptions({ origin, destination }) {
    const bottomSheet = document.querySelector('.bottom-sheet');
    bottomSheet.style.display = 'block';
    bottomSheet.classList.remove('hidden');
    bottomSheet.classList.add('collapsed');

    try {
        // Clear previous routes
        clearRoutes();

        // Show loading state
        bottomSheet.innerHTML = `
            <div class="bottom-sheet-handle"></div>
            <div class="bottom-sheet-content">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Finding routes...</div>
                </div>
            </div>
        `;

        // Fetch both driving and walking routes in parallel
        const [drivingRoutes, walkingRoutes] = await Promise.all([
            fetchRouteOptions(origin, destination, 'driving'),
            fetchRouteOptions(origin, destination, 'walking')
        ]);

        if (drivingRoutes.length === 0 && walkingRoutes.length === 0) {
            throw new Error('No routes found');
        }

        // Store all routes
        currentRoutes = {
            driving: drivingRoutes,
            walking: walkingRoutes
        };

        // Create the Google Maps style UI
        const style = document.createElement('style');
        style.textContent = `
            .google-maps-ui {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            
            .route-input-fields {
                padding: 12px 16px;
                background: #fff;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
            }
            
            .route-input-fields input {
                width: 100%;
                padding: 12px;
                margin: 4px 0;
                border: none;
                border-radius: 4px;
                background: #f1f1f1;
                font-size: 16px;
            }
            
            .route-input-fields .swap-icon {
                width: 24px;
                height: 24px;
                margin: 4px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border-radius: 50%;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            .transport-modes-bar {
                display: flex;
                justify-content: space-around;
                padding: 0;
                margin: 0;
                background: #fff;
                border-bottom: 1px solid #eee;
                position: relative;
            }
            
            .transport-mode-option {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 0;
                color: #5f6368;
                text-decoration: none;
                position: relative;
                text-align: center;
            }
            
            .transport-mode-option.active {
                color: #1a73e8;
            }
            
            .transport-mode-option.active:after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: #1a73e8;
            }
            
            .transport-mode-icon {
                font-size: 20px;
                margin-bottom: 4px;
            }
            
            .transport-mode-icon img {
                width: 24px;
                height: 24px;
                object-fit: contain;
            }
            
            .transport-mode-label {
                font-size: 12px;
                font-weight: 500;
            }
            
            .route-options-container {
                background: #fff;
                overflow-y: auto;
                max-height: 50vh;
            }
            
            .route-option {
                padding: 16px;
                border-bottom: 1px solid #eee;
                cursor: pointer;
            }
            
            .route-option.selected {
                background-color: #e8f0fe;
            }
            
            .route-option:hover {
                background-color: #f8f9fa;
            }
            
            .route-option.selected:hover {
                background-color: #d2e3fc;
            }
            
            .route-summary {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .route-duration {
                font-size: 16px;
                font-weight: 500;
            }
            
            .route-distance {
                font-size: 14px;
                color: #5f6368;
            }
            
            .route-details {
                font-size: 13px;
                color: #5f6368;
            }
            
            .route-indicator {
                display: flex;
                align-items: center;
                position: relative;
            }
            
            .route-indicator-line {
                width: 4px;
                height: 20px;
                background-color: #1a73e8;
                margin-right: 12px;
                border-radius: 2px;
            }
            
            .indicator-driving {
                background-color: #4285f4;
            }
            
            .indicator-walking {
                background-color: #0f9d58;
            }
            
            .indicator-transit {
                background-color: #1a73e8;
            }
            
            .indicator-cycling {
                background-color: #f4b400;
            }
            
            .slider-background {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: #f1f1f1;
            }
            
            .active-slider {
                height: 3px;
                background: #1a73e8;
                width: 16.666%;
                position: absolute;
                bottom: 0;
                transition: left 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        // Update bottom sheet with Google Maps UI
        bottomSheet.innerHTML = `
            <div class="bottom-sheet-handle"></div>
            <div class="bottom-sheet-content google-maps-ui">
                <div class="route-input-fields">
                    <input type="text" placeholder="Choose starting point, or click on the map" value="${origin.name || 'Your location'}" readonly>
                    <div class="swap-icon">⇵</div>
                    <input type="text" placeholder="Choose destination" value="${destination.name}" readonly>
                </div>
                
                <div class="transport-modes-bar">
                    <div class="transport-mode-option ${currentRoutes.driving ? 'active' : ''}" data-mode="driving">
                        <div class="transport-mode-icon">🚗</div>
                        <div class="transport-mode-label">Drive</div>
                    </div>
                    <div class="transport-mode-option" data-mode="transit">
                        <div class="transport-mode-icon">🚇</div>
                        <div class="transport-mode-label">Transit</div>
                    </div>
                    <div class="transport-mode-option" data-mode="cycling">
                        <div class="transport-mode-icon">🚲</div>
                        <div class="transport-mode-label">Cycling</div>
                    </div>
                    <div class="transport-mode-option ${currentRoutes.walking ? '' : ''}" data-mode="walking">
                        <div class="transport-mode-icon">🚶</div>
                        <div class="transport-mode-label">Walk</div>
                    </div>
                    <div class="transport-mode-option" data-mode="rideshare">
                        <div class="transport-mode-icon">🚕</div>
                        <div class="transport-mode-label">Taxi</div>
                    </div>
                    <div class="transport-mode-option" data-mode="more">
                        <div class="transport-mode-icon">⋯</div>
                        <div class="transport-mode-label">More</div>
                    </div>
                    <div class="slider-background">
                        <div class="active-slider"></div>
                    </div>
                </div>
                
                <div class="route-options-container driving-routes">
                    ${drivingRoutes.map((route, index) => `
                        <div class="route-option ${index === 0 ? 'selected' : ''}" data-route-index="${index}" data-mode="driving">
                            <div class="route-summary">
                                <div class="route-indicator">
                                    <div class="route-indicator-line indicator-driving"></div>
                                    <div class="route-duration">${route.duration} min</div>
                                </div>
                                <div class="route-distance">${route.distance} km</div>
                            </div>
                            <div class="route-details">
                                Via fastest route${index === 0 ? ' - Traffic information available' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="route-options-container walking-routes" style="display: none;">
                    ${walkingRoutes.map((route, index) => `
                        <div class="route-option ${index === 0 ? 'selected' : ''}" data-route-index="${index}" data-mode="walking">
                            <div class="route-summary">
                                <div class="route-indicator">
                                    <div class="route-indicator-line indicator-walking"></div>
                                    <div class="route-duration">${route.duration} min</div>
                                </div>
                                <div class="route-distance">${route.distance} km</div>
                            </div>
                            <div class="route-details">
                                Via walking path${index === 0 ? ' - Most direct route' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="route-options-container transit-routes" style="display: none;">
                    <div class="no-routes-message" style="padding: 20px; text-align: center; color: #5f6368;">
                        Transit information not available for this route.
                    </div>
                </div>
                
                <div class="route-options-container cycling-routes" style="display: none;">
                    <div class="no-routes-message" style="padding: 20px; text-align: center; color: #5f6368;">
                        Cycling routes not available for this route.
                    </div>
                </div>
                
                <div class="route-options-container rideshare-routes" style="display: none;">
                    <div class="no-routes-message" style="padding: 20px; text-align: center; color: #5f6368;">
                        Ride services not available.
                    </div>
                </div>
            </div>
        `;

        // Add click handlers for transport tabs
        const slider = document.querySelector('.active-slider');
        document.querySelectorAll('.transport-mode-option').forEach((tab, index) => {
            tab.addEventListener('click', () => {
                // Update active tab
                document.querySelectorAll('.transport-mode-option').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update slider position
                slider.style.left = `${index * 16.666}%`;
                
                const mode = tab.dataset.mode;
                
                // Show/hide route options based on mode
                document.querySelectorAll('.route-options-container').forEach(container => {
                    container.style.display = 'none';
                });
                
                const activeContainer = document.querySelector(`.${mode}-routes`);
                if (activeContainer) {
                    activeContainer.style.display = 'block';
                }
                
                // Update route display
                if (mode === 'driving' && currentRoutes.driving) {
                    drawRouteWithAlternatives(currentRoutes.driving, 0);
                } else if (mode === 'walking' && currentRoutes.walking) {
                    drawRouteWithAlternatives(currentRoutes.walking, 0);
                } else {
                    clearRoutes();
                }
            });
        });

        // Add click handlers for route options
        document.querySelectorAll('.route-option').forEach((option) => {
            option.addEventListener('click', () => {
                const mode = option.dataset.mode;
                const index = parseInt(option.dataset.routeIndex);
                
                // Update selected route
                document.querySelectorAll(`.${mode}-routes .route-option`).forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                drawRouteWithAlternatives(currentRoutes[mode], index);
            });
        });

        // Draw initial route with alternatives
        drawRouteWithAlternatives(drivingRoutes, 0);

    } catch (error) {
        console.error('Route error:', error);
        bottomSheet.innerHTML = `
            <div class="bottom-sheet-handle"></div>
            <div class="bottom-sheet-content">
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <div class="error-message">Error finding routes</div>
                    <button class="retry-btn" onclick="showRouteOptions({origin: ${JSON.stringify(origin)}, destination: ${JSON.stringify(destination)}})">Retry</button>
                </div>
            </div>
        `;
    }
}

// Function to draw main route and alternatives
function drawRouteWithAlternatives(routes, selectedIndex) {
    clearRoutes();
    
    if (!routes || routes.length === 0) {
        showError('No routes available');
        return;
    }
    
    // Draw all routes first as grey alternatives
    routes.forEach((route, index) => {
        if (index !== selectedIndex) { // Skip the selected route for now
            drawSingleRoute(route, {
                color: '#999999',
                weight: 3,
                opacity: 0.6,
                zIndex: 100
            });
        }
    });
    
    // Draw the selected route last so it appears on top
    drawSingleRoute(routes[selectedIndex], {
        color: '#1976D2',
        weight: 5,
        opacity: 0.8,
        zIndex: 200
    });
    
    // Get bounds of the selected route
    const coordinates = decodePolyline(routes[selectedIndex].geometry);
    if (coordinates.length > 0) {
        // Swap lat/lng for Leaflet
        const latLngs = coordinates.map(coord => [coord[0], coord[1]]);
        const bounds = L.latLngBounds(latLngs);
        
        // Fit map to show entire route with padding
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16
        });
    }
}

// Function to draw a single route
function drawSingleRoute(route, style) {
    try {
        if (!route || !route.geometry) {
            return null;
        }

        // Decode the polyline from OSRM
        const coordinates = decodePolyline(route.geometry);
        
        // Swap lat/lng for Leaflet
        const latLngs = coordinates.map(coord => [coord[0], coord[1]]);

        const routeLine = L.polyline(latLngs, style).addTo(map);
        routeLayers.push(routeLine);

        return routeLine;
    } catch (error) {
        console.error('Error drawing route:', error);
        return null;
    }
}

// Update clearRoutes function
function clearRoutes() {
    routeLines.forEach(line => map.removeLayer(line));
    routeLines = [];
    
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
}

// Update drawAllRoutes function
function drawAllRoutes(routes) {
    // Clear existing routes
    clearRoutes();
    
    // Draw each route with different styles based on transport type
    routes.forEach((route, index) => {
        const colors = {
            mtr: '#E4002B',  // MTR red
            bus: '#0075FF',  // Bus blue
            walk: '#2AAE66'  // Walk green
        };
        
        const defaultColor = '#C0C0C0';
        const routeColor = colors[route.type] || defaultColor;
        
        const routeLine = L.polyline(route.coordinates, {
            color: routeColor,
            weight: index === 0 ? 6 : 4,
            opacity: index === 0 ? 1 : 0.7,
            lineCap: 'round',
            lineJoin: 'round',
            className: `route-line route-${index}`
        }).addTo(map);
        
        routeLines.push(routeLine);
    });
    
    // Fit map to show all routes
    if (routeLines.length > 0) {
        const group = new L.featureGroup(routeLines);
        map.fitBounds(group.getBounds(), {
            padding: [50, 50]
        });
    }
}

// Function to highlight selected route
function highlightRoute(selectedIndex) {
    routeLines.forEach((line, index) => {
        if (index === selectedIndex) {
            line.setStyle({
                color: '#FF3B30', // Apple Maps red color
                weight: 6,
                opacity: 1,
                zIndex: 1000
            });
        } else {
            line.setStyle({
                color: '#C0C0C0',
                weight: 4,
                opacity: 0.7,
                zIndex: 100
            });
        }
    });
}

// Filter routes based on transport mode
function filterRoutes(mode) {
    const routeOptions = document.querySelectorAll('.route-option');
    routeOptions.forEach(option => {
        const routeIndex = parseInt(option.dataset.routeIndex);
        const route = currentRoutes[routeIndex];
        
        if (mode === 'all' || route.segments.some(segment => segment.type === mode)) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}

function showRouteDetails(route) {
    // Draw route on map (simplified version)
    drawRoute(route);

    // Update bottom sheet with route details
    const bottomSheetContent = document.querySelector('.bottom-sheet-content');
    bottomSheetContent.innerHTML = `
        <div class="route-info">
            <div class="route-header">
                <div class="route-icon">${route.icon}</div>
                <div class="route-summary">
                    <div class="route-time">${route.duration}</div>
                    <div class="route-description">${route.description}</div>
                </div>
            </div>
            <div class="route-steps">
                ${route.steps.map((step, index) => `
                    <div class="route-step">
                        <div class="step-number">${index + 1}</div>
                        <div class="step-description">${step}</div>
                    </div>
                `).join('')}
            </div>
            <button class="start-route-btn">Start</button>
        </div>
    `;

    // Add click handler for start button
    document.querySelector('.start-route-btn').addEventListener('click', () => {
        startNavigation(route);
    });
}

function startNavigation(route) {
    // Update UI for navigation mode
    const bottomSheetContent = document.querySelector('.bottom-sheet-content');
    bottomSheetContent.innerHTML = `
        <div class="navigation-mode">
            <div class="nav-header">
                <div class="nav-icon">${route.icon}</div>
                <div class="nav-info">
                    <div class="nav-next-step">${route.steps[0]}</div>
                    <div class="nav-progress">${route.duration} remaining</div>
                </div>
            </div>
            <button class="end-navigation-btn">End</button>
        </div>
    `;

    // Add click handler for end navigation button
    document.querySelector('.end-navigation-btn').addEventListener('click', () => {
        endNavigation();
    });
}

function endNavigation() {
    // Clear navigation UI and return to search mode
    const bottomSheet = document.querySelector('.bottom-sheet');
    bottomSheet.classList.remove('expanded');
    
    // Clear route from map
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

// Bottom sheet drag functionality
const bottomSheetHandle = document.querySelector('.bottom-sheet-handle');
let isDragging = false;
let startY = 0;
let startTransform = 0;

bottomSheetHandle.addEventListener('mousedown', dragStart);
bottomSheetHandle.addEventListener('touchstart', dragStart);

function dragStart(e) {
    isDragging = true;
    startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    startTransform = getCurrentTranslate();
    bottomSheet.style.transition = 'none';
    document.body.style.cursor = 'grabbing';
}

document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag);

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    const deltaY = currentY - startY;
    const windowHeight = window.innerHeight;
    
    // Calculate bounds
    const maxTranslate = 0; // Fully expanded
    const minTranslate = windowHeight - 100; // Minimum height of 100px
    
    // Calculate new position with bounds
    const newTransform = Math.max(
        Math.min(maxTranslate, startTransform - deltaY),
        -minTranslate
    );
    
    bottomSheet.style.transform = `translateY(${newTransform}px)`;
}

document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', dragEnd);

function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = '';
    bottomSheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    const currentTranslate = getCurrentTranslate();
    const windowHeight = window.innerHeight;
    
    // Define snap points
    const expandedPoint = 0;
    const collapsedPoint = windowHeight - 160;
    const hiddenPoint = windowHeight;
    
    // Calculate distances to snap points
    const toExpanded = Math.abs(currentTranslate - expandedPoint);
    const toCollapsed = Math.abs(currentTranslate - (-collapsedPoint));
    const toHidden = Math.abs(currentTranslate - (-hiddenPoint));
    
    // Find nearest snap point
    const nearest = Math.min(toExpanded, toCollapsed, toHidden);
    
    if (nearest === toExpanded) {
        bottomSheet.classList.add('expanded');
        bottomSheet.classList.remove('collapsed', 'hidden');
    } else if (nearest === toCollapsed) {
        bottomSheet.classList.add('collapsed');
        bottomSheet.classList.remove('expanded', 'hidden');
    } else {
        bottomSheet.classList.add('hidden');
        bottomSheet.classList.remove('expanded', 'collapsed');
    }
}

function getCurrentTranslate() {
    const transform = window.getComputedStyle(bottomSheet).transform;
    if (transform === 'none') return 0;
    const matrix = new DOMMatrix(transform);
    return matrix.m42; // Get the Y transform value
}

// Favorites functionality
function addToFavorites(location) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Check if already in favorites
    const exists = favorites.some(fav => fav.name === location.name);
    if (!exists) {
        favorites.push(location);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    
    updateFavoritesList();
}

function removeFromFavorites(locationName) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(fav => fav.name !== locationName);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList();
}

function updateFavoritesList() {
    const favoritesList = document.querySelector('.favorites-list');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    favoritesList.innerHTML = favorites.map(location => `
        <div class="favorite-item" data-lat="${location.lat}" data-lon="${location.lon}">
            <div class="favorite-icon">⭐</div>
            <div class="favorite-details">
                <div class="favorite-name">${location.name}</div>
                <div class="favorite-address">${location.address || ''}</div>
            </div>
            <button class="remove-favorite" onclick="removeFromFavorites('${location.name}')">×</button>
        </div>
    `).join('');

    // Add click handlers for favorites
    document.querySelectorAll('.favorite-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-favorite')) {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                const name = item.querySelector('.favorite-name').textContent;
                
                if (destinationMarker) {
                    map.removeLayer(destinationMarker);
                }

                const destinationIcon = L.divIcon({
                    className: 'destination-marker',
                    html: '📍',
                    iconSize: [24, 24],
                    iconAnchor: [12, 24]
                });

                destinationMarker = L.marker([lat, lon], { icon: destinationIcon }).addTo(map);
                map.setView([lat, lon], 16);
                
                showRouteOptions({
                    lat,
                    lon,
                    name: name
                });
            }
        });
    });
}

// Move location request to be the first thing that happens
window.addEventListener('load', () => {
    // Check if we already have permission stored - use a more reliable approach
    const hasLocationPermission = sessionStorage.getItem('locationPermissionGranted') === 'true';
    
    if (hasLocationPermission) {
        initializeLocation();
    } else if (navigator.geolocation) {
        navigator.permissions && navigator.permissions.query({name: 'geolocation'})
            .then(function(permissionStatus) {
                if (permissionStatus.state === 'granted') {
                    // Permission is already granted, save this info
                    sessionStorage.setItem('locationPermissionGranted', 'true');
                    initializeLocation();
                } else if (permissionStatus.state === 'prompt') {
                    // We'll be prompted, prepare for that
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            // Permission granted just now
                            sessionStorage.setItem('locationPermissionGranted', 'true');
                            const location = {
                                lat: position.coords.latitude,
                                lon: position.coords.longitude
                            };
                            
                            updateUserLocation(location);
                        },
                        function(error) {
                            console.error('Geolocation error:', error);
                            requestLocationPermission();
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        }
                    );
                } else if (permissionStatus.state === 'denied') {
                    // Permission was denied before
                    requestLocationPermission();
                }
                
                // Listen for changes in permission state
                permissionStatus.onchange = function() {
                    if (this.state === 'granted') {
                        sessionStorage.setItem('locationPermissionGranted', 'true');
                        initializeLocation();
                    }
                };
            })
            .catch(function(error) {
                // Fallback if permissions API not supported
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        sessionStorage.setItem('locationPermissionGranted', 'true');
                        const location = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        
                        updateUserLocation(location);
                    },
                    function(error) {
                        console.error('Geolocation error:', error);
                        requestLocationPermission();
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            });
    } else {
        requestLocationPermission();
    }
});

// Helper function to update user location on map
function updateUserLocation(location) {
    // Update map and add marker
    if (userMarker) map.removeLayer(userMarker);
    
    // Create a pulsing dot for user location (iOS style)
    const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
            <div class="user-dot-container">
                <div class="user-dot"></div>
                <div class="user-dot-pulse"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    
    userMarker = L.marker([location.lat, location.lon], {
        icon: userIcon
    }).addTo(map);

    // Center map on user's location with animation and proper zoom
    map.setView([location.lat, location.lon], 16, {
        animate: true,
        duration: 1
    });

    // Store current origin
    currentOrigin = {
        lat: location.lat,
        lng: location.lon,
        name: 'Current Location'
    };
}

// Update DOMContentLoaded to not handle location
document.addEventListener('DOMContentLoaded', () => {
    // Remove My Guides section
    const guidesSection = document.querySelector('.guides-section');
    if (guidesSection) {
        guidesSection.remove();
    }
    
    // Initialize favorites
    updateFavoritesList();
    
    // Initialize bottom sheet
    const bottomSheet = document.querySelector('.bottom-sheet');
    bottomSheet.style.display = 'none';

    // Initialize recents
    populateRecentLocations();
    
    // Add styles for sidebar toggle and other iOS style elements
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-toggle {
            position: absolute;
            top: 16px;
            left: 16px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--background-primary);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow-md);
            z-index: 99;
            cursor: pointer;
            color: var(--text-primary);
        }
        
        .search-container {
            padding-left: 70px;
        }
        
        .transport-mode-selector {
            display: flex;
            flex-direction: column;
            background: transparent;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .transport-mode-selector.active {
            display: flex;
            opacity: 1;
            visibility: visible;
        }
        
        .user-dot-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        .user-dot {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            background-color: var(--primary-color);
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
            z-index: 2;
        }
        
        .user-dot-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background-color: rgba(0, 122, 255, 0.2);
            border-radius: 50%;
            z-index: 1;
            animation: pulse 2s ease-out infinite;
        }
        
        @keyframes pulse {
            0% {
                transform: translate(-50%, -50%) scale(0.5);
                opacity: 0.7;
            }
            100% {
                transform: translate(-50%, -50%) scale(1.5);
                opacity: 0;
            }
        }
        
        @media (max-width: 768px) {
            .search-container {
                padding-left: 60px;
            }
        }
    `;
    document.head.appendChild(style);
});

function clearRecents() {
    // Clear from localStorage
    localStorage.removeItem('recentLocations');
    
    // Clear the UI
    const recentList = document.querySelector('.recent-list');
    if (recentList) {
        recentList.innerHTML = '';
    }
}

// Add debounce utility function
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

let currentOrigin = null;
let currentDestination = null;

function showLoading(message = 'Loading...') {
    hideLoading(); // Remove any existing loading overlays
    
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-overlay';
    loadingEl.id = 'app-loading-overlay';
    loadingEl.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
            <div class="loading-submessage">This may take a few seconds...</div>
        </div>
    `;
    
    document.body.appendChild(loadingEl);
    
    // Force reflow and add active class
    loadingEl.offsetHeight;
    loadingEl.classList.add('active');
    
    // Set a safety timeout to auto-hide loading after 15 seconds
    window.loadingTimeout = setTimeout(() => {
        hideLoading();
    }, 15000);
}

function hideLoading() {
    if (window.loadingTimeout) {
        clearTimeout(window.loadingTimeout);
        window.loadingTimeout = null;
    }
    
    const loadingEl = document.getElementById('app-loading-overlay');
    if (loadingEl) {
        loadingEl.classList.remove('active');
        setTimeout(() => loadingEl.remove(), 300);
    }
}

function showError(message, duration = 5000) {
    // Remove any existing error toasts
    const existingToasts = document.querySelectorAll('.error-toast');
    existingToasts.forEach(toast => toast.remove());

    const errorEl = document.createElement('div');
    errorEl.className = 'error-toast';
    errorEl.innerHTML = `
        <span>⚠️</span>
        <div class="error-message">${message}</div>
    `;
    document.body.appendChild(errorEl);

    setTimeout(() => {
        errorEl.remove();
    }, duration);
}

// Show routes based on selected transport mode
function showRoutesByMode(mode) {
    // Hide all route containers
    document.querySelectorAll('.route-options-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // Show the selected mode's container
    const activeContainer = document.querySelector(`.${mode}-routes`);
    if (activeContainer) {
        activeContainer.style.display = 'block';
    }
    
    // Update route display
    if (mode === 'driving' && currentRoutes.driving) {
        drawRouteWithAlternatives(currentRoutes.driving, 0);
    } else if (mode === 'walking' && currentRoutes.walking) {
        drawRouteWithAlternatives(currentRoutes.walking, 0);
    } else if (mode === 'cycling' && currentRoutes.cycling) {
        // If we have cycling routes in the future
        if (currentRoutes.cycling) {
            drawRouteWithAlternatives(currentRoutes.cycling, 0);
        }
    } else if (mode === 'transit' && currentRoutes.transit) {
        // If we have transit routes in the future
        if (currentRoutes.transit) {
            drawRouteWithAlternatives(currentRoutes.transit, 0);
        }
    } else {
        // Clear routes if no data for this mode
        clearRoutes();
    }
}