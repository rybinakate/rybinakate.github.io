// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let map;
let populationData;
let currentIsochroneLayer = null;
let isHexLayerVisible = true;

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');
    
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [37.6173, 55.7558],
        zoom: 11
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    fetch('../data/population.geojson')
        .then(response => response.json())
        .then(data => {
            populationData = data;
            console.log('Данные загружены, объектов:', data.features.length);
            
            const totalPopulation = data.features.reduce((sum, feature) => {
                return sum + (feature.properties.population || 0);
            }, 0);

            // Безопасное обновление элементов
            const totalEl = document.getElementById('total-population');
            if (totalEl) totalEl.textContent = totalPopulation.toLocaleString();
            
            const avgDensity = (totalPopulation / data.features.length).toFixed(0);
            const avgEl = document.getElementById('avg-density');
            if (avgEl) avgEl.textContent = avgDensity;

            map.on('load', () => {
                map.addSource('population', {
                    type: 'geojson',
                    data: populationData
                });

                map.addLayer({
                    id: 'population-hex',
                    type: 'fill',
                    source: 'population',
                    paint: {
                        'fill-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'population'],
                            0, '#fee5d9',
                            5000, '#fcae91',
                            15000, '#fb6a4a',
                            30000, '#de2d26',
                            50000, '#a50f15'
                        ],
                        'fill-opacity': 0.7,
                        'fill-outline-color': '#ffffff'
                    }
                });

                const popup = new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: false
                });

                map.on('mousemove', 'population-hex', (e) => {
                    if (e.features.length > 0 && isHexLayerVisible) {
                        const feature = e.features[0];
                        const population = feature.properties.population || 0;
                        const name = feature.properties.name || 'Район';
                        
                        map.getCanvas().style.cursor = 'pointer';
                        popup.setLngLat(e.lngLat)
                            .setHTML(`<strong>${name}</strong><br/>Население: ${population.toLocaleString()} чел.`)
                            .addTo(map);
                    }
                });

                map.on('mouseleave', 'population-hex', () => {
                    map.getCanvas().style.cursor = '';
                    popup.remove();
                });

                map.on('click', 'population-hex', (e) => {
                    if (e.features.length > 0 && isHexLayerVisible) {
                        const population = e.features[0].properties.population || 0;
                        const selectedEl = document.getElementById('selected-population');
                        if (selectedEl) {
                            selectedEl.textContent = population.toLocaleString();
                        }
                    }
                });

                createIsochroneResultBlock();
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.innerHTML = '<p style="padding: 2rem; text-align: center;">Ошибка загрузки данных</p>';
            }
        });
    
    map.on('click', (e) => {
        if (populationData) {
            calculateIsochrone(e.lngLat, 15);
        }
    });
});

function createIsochroneResultBlock() {
    const statsPanel = document.getElementById('stats-panel');
    if (statsPanel && !document.getElementById('isochrone-result')) {
        const resultBlock = document.createElement('div');
        resultBlock.id = 'isochrone-result';
        resultBlock.className = 'stat-card';
        resultBlock.style.background = '#f0f0f0';
        resultBlock.style.transition = 'all 0.3s ease';
        resultBlock.innerHTML = `
            <div class="stat-value">—</div>
            <div class="stat-label">👣 Жителей в 15 мин ходьбы</div>
            <small>кликните на карту</small>
        `;
        statsPanel.appendChild(resultBlock);
    }
}

function toggleHexLayer() {
    const toggleBtn = document.getElementById('toggle-hex-layer');
    if (map && map.getLayer('population-hex')) {
        if (isHexLayerVisible) {
            map.setLayoutProperty('population-hex', 'visibility', 'none');
            isHexLayerVisible = false;
            if (toggleBtn) toggleBtn.textContent = 'Показать районы';
            if (toggleBtn) toggleBtn.classList.add('active');
        } else {
            map.setLayoutProperty('population-hex', 'visibility', 'visible');
            isHexLayerVisible = true;
            if (toggleBtn) toggleBtn.textContent = 'Скрыть районы';
            if (toggleBtn) toggleBtn.classList.remove('active');
        }
    }
}

function calculateIsochrone(center, minutes, speed = 80) {
    if (!populationData) {
        console.warn('Данные о населении ещё не загружены');
        return;
    }
    
    const radius = minutes * speed;
    const point = turf.point([center.lng, center.lat]);
    const isochrone = turf.buffer(point, radius / 1000, { units: 'kilometers' });
    
    const { totalPopulation, intersectingCount } = sumPopulationInArea(isochrone);
    displayIsochrone(isochrone, center, minutes, totalPopulation, intersectingCount);
}

function sumPopulationInArea(polygon) {
    if (!populationData) return { totalPopulation: 0, intersectingCount: 0 };
    
    let totalPopulation = 0;
    let intersectingCount = 0;
    
    populationData.features.forEach(feature => {
        if (turf.booleanIntersects(polygon, feature.geometry)) {
            totalPopulation += feature.properties.population || 0;
            intersectingCount++;
        }
    });
    
    return { totalPopulation, intersectingCount };
}

function displayIsochrone(isochrone, center, minutes, population, intersectingCount) {
    if (currentIsochroneLayer) {
        try {
            if (map.getLayer('isochrone-fill')) map.removeLayer('isochrone-fill');
            if (map.getLayer('isochrone-outline')) map.removeLayer('isochrone-outline');
            if (map.getSource('isochrone')) map.removeSource('isochrone');
        } catch(e) {
            console.warn('Ошибка при удалении слоёв:', e);
        }
    }
    
    map.addSource('isochrone', {
        type: 'geojson',
        data: isochrone
    });
    
    map.addLayer({
        id: 'isochrone-fill',
        type: 'fill',
        source: 'isochrone',
        paint: {
            'fill-color': '#ff6b6b',
            'fill-opacity': 0.25
        }
    });
    
    map.addLayer({
        id: 'isochrone-outline',
        type: 'line',
        source: 'isochrone',
        paint: {
            'line-color': '#ff0000',
            'line-width': 3,
            'line-dasharray': [5, 5]
        }
    });
    
    currentIsochroneLayer = true;
    
    const resultBlock = document.getElementById('isochrone-result');
    if (resultBlock) {
        resultBlock.style.background = '#e8f4f8';
        resultBlock.innerHTML = `
            <div class="stat-value">${population.toLocaleString()}</div>
            <div class="stat-label">👣 Жителей в ${minutes} мин ходьбы</div>
            <small>охвачено ${intersectingCount} кварталов</small>
        `;
    }
    
    new maplibregl.Popup()
        .setLngLat(center)
        .setHTML(`
            <div style="text-align: center;">
                <strong>🚶‍♀️ ${minutes} минут пешком</strong><br>
                👥 ${population.toLocaleString()} человек
            </div>
        `)
        .addTo(map);
    
    setTimeout(() => {
        const popup = document.querySelector('.maplibregl-popup');
        if (popup) popup.remove();
    }, 5000);
}

function resetIsochrone() {
    if (currentIsochroneLayer) {
        try {
            if (map.getLayer('isochrone-fill')) map.removeLayer('isochrone-fill');
            if (map.getLayer('isochrone-outline')) map.removeLayer('isochrone-outline');
            if (map.getSource('isochrone')) map.removeSource('isochrone');
        } catch(e) {
            console.warn('Ошибка при удалении:', e);
        }
        currentIsochroneLayer = null;
        
        const resultBlock = document.getElementById('isochrone-result');
        if (resultBlock) {
            resultBlock.style.background = '#f0f0f0';
            resultBlock.innerHTML = `
                <div class="stat-value">—</div>
                <div class="stat-label">👣 Жителей в 15 мин ходьбы</div>
                <small>кликните на карту</small>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('reset-analytics');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetIsochrone);
    }
    
    const toggleBtn = document.getElementById('toggle-hex-layer');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleHexLayer);
    }
});