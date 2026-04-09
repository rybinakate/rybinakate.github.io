// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let map;
let populationData;
let currentIsochroneLayer = null;
let isHexLayerVisible = true;
let poiData = null;
let popperpoi_data;


// ========== ЦВЕТА ДЛЯ РАЗНЫХ ТИПОВ POI ==========
const poiColors = {
    'cafe': '#FF6B35',        // оранжевый
    'bakery': '#F7C35C',      // золотистый
    'bar': '#9B5DE5',         // фиолетовый
    'pub': '#9B5DE5',         // фиолетовый
    'restaurant': '#F15BB5',  // розовый
    'fast_food': '#00BBF9',   // голубой
    'food_court': '#00F5D4',  // бирюзовый
    'convenience': '#00BBF9', // голубой (магазины)
    'default': '#0a2a4a'      // синий по умолчанию
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');
    
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [37.6173, 55.7558],
        zoom: 9
        //maxBounds: [[35, 50], [40, 60]],
        //hash: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Загружаем PopPerPoi
fetch('../data/popperpoi.geojson')
    .then(response => response.json())
    .then(data => {
        popperpoi_data = data;
        console.log('✅ popperpoi загружены! Найдено объектов:', data.features.length);
        // Добавляем слой после загрузки
        if (map.isStyleLoaded()) {
            addPopperpoiLayer();
        } else {
            map.on('load', addPopperpoiLayer);
        }
    })
    .catch(error => {
        console.error('❌ Ошибка загрузки popperpoi:', error);
    });



    // Загружаем POI
fetch('../data/poi.geojson')
    .then(response => response.json())
    .then(data => {
        poiData = data;  // ← ИСПРАВЛЕНО: poiData вместо poi
        console.log('✅ POI загружены! Найдено объектов:', data.features.length);
    })
    .catch(error => {
        console.error('❌ Ошибка загрузки POI:', error);
    });

    // Загружаем данные о населении
    fetch('../data/population.geojson')
        .then(response => response.json())
        .then(data => {
            populationData = data;
            console.log('Данные загружены, объектов:', data.features.length);
            
            const totalPopulation = data.features.reduce((sum, feature) => {
                return sum + (feature.properties.population || 0);
            }, 0);

            const totalEl = document.getElementById('total-population');
            if (totalEl) totalEl.textContent = totalPopulation.toLocaleString();
            
            const avgDensity = (totalPopulation / data.features.length).toFixed(0);
            const avgEl = document.getElementById('avg-density');
            if (avgEl) avgEl.textContent = avgDensity;

            map.on('load', () => {
               // addPopulationLayer();
                 addPopperpoiLayer();
                addHexagonInteraction();
                createIsochroneResultBlock();
                addPOILayer();  // Добавляем POI после загрузки карты
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.innerHTML = '<p style="padding: 2rem; text-align: center;">Ошибка загрузки данных</p>';
            }
        });
    
    // ЕДИНСТВЕННЫЙ обработчик клика
    map.on('click', (e) => {
        if (populationData) {
            calculateIsochrone(e.lngLat, 5);
        }
        
        if (poiData) {
            const count = countCompetitors(e.lngLat, 400);
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`🏪 Конкурентов в 400м: ${count}`)
                .addTo(map);
        } else {
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`⏳ Загрузка данных...`)
                .addTo(map);
        }
    });
});

// ========== ДОБАВЛЕНИЕ СЛОЯ НАСЕЛЕНИЯ ==========
// function addPopulationLayer() {
//     map.addSource('population', {
//         type: 'geojson',
//         data: populationData
//     });
    
    // map.addLayer({
    //     id: 'population-hex',
    //     type: 'fill',
    //     source: 'population',
    //     paint: {
    //         'fill-color': [
    //             'interpolate',
    //             ['linear'],
    //             ['get', 'population'],
    //             0, '#fee5d9',
    //             5000, '#fcae91',
    //             15000, '#fb6a4a',
    //             30000, '#de2d26',
    //             50000, '#a50f15'
    //         ],
    //         'fill-opacity': 0.7,
    //         'fill-outline-color': '#ffffff'
    //     }
    // });
//}


// ========== ДОБАВЛЕНИЕ СЛОЯ Popperpoi С РАСКРАСКОЙ ПО ТИПАМ ==========

   // ========== ДОБАВЛЕНИЕ СЛОЯ Popperpoi С РАСКРАСКОЙ ==========
f// ========== ДОБАВЛЕНИЕ СЛОЯ Popperpoi С РАСКРАСКОЙ ==========
function addPopperpoiLayer() {
    if (!popperpoi_data) {
        console.warn('⚠️ popperpoi_data ещё не загружены');
        return;
    }
    
    if (!map.getSource('popperpoi')) {
        map.addSource('popperpoi', {
            type: 'geojson',
            data: popperpoi_data
        });
        
        map.addLayer({
            id: 'popperpoi_layer',
            type: 'fill',
            source: 'popperpoi',
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'popperpoi'],   // ← ИСПРАВЛЕНО: поле popperpoi
                    0, '#af0508',
                    300, '#D7191C',
                    750, '#FDAE61',
                    1500, '#F4EEA5',
                    2500, '#AFE570',
                    16100, '#1A9641'
                ],
                'fill-opacity': 0.7,
                'fill-outline-color': '#ffffff'
            }
        });
        
        console.log('✅ Слой popperpoi добавлен на карту');
    }
}

// ========== ДОБАВЛЕНИЕ СЛОЯ POI С РАСКРАСКОЙ ПО ТИПАМ ==========
function addPOILayer() {
    if (!poiData) return;
    
    // Проверяем, что карта загружена и источник ещё не добавлен
    if (!map.getSource('poi')) {
        map.addSource('poi', {
            type: 'geojson',
            data: poiData
        });
        
        map.addLayer({
            id: 'poi',
            type: 'circle',
            source: 'poi',
             minzoom: 11,
            paint: {
                'circle-color': [
                    'match',
                    ['get', 'fclass'],
                    'cafe', poiColors['cafe'],
                    'bakery', poiColors['bakery'],
                    'bar', poiColors['bar'],
                    'pub', poiColors['pub'],
                    'restaurant', poiColors['restaurant'],
                    'fast_food', poiColors['fast_food'],
                    'food_court', poiColors['food_court'],
                    'convenience', poiColors['convenience'],
                    poiColors['default']
                ],
                'circle-radius': 3,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            }
           
        });
        
        console.log('✅ Слой POI добавлен на карту');
    }
}

// ========== ВЗАИМОДЕЙСТВИЕ С ГЕКСАГОНАМИ ==========
function addHexagonInteraction() {
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
}

// ========== ПОДСЧЁТ КОНКУРЕНТОВ ==========
function countCompetitors(lngLat, radius = 400) {
    if (!poiData) {
        console.warn('⚠️ POI ещё не загружены');
        return 0;
    }
    
    const center = turf.point([lngLat.lng, lngLat.lat]);
    const buffer = turf.buffer(center, radius / 1000, { units: 'kilometers' });
    
    let count = 0;
    
    poiData.features.forEach(feature => {
        if (!feature.geometry) return;
        if (feature.geometry.type !== 'Point') return;
        
        const pointCoords = feature.geometry.coordinates;
        
        if (!Array.isArray(pointCoords) || pointCoords.length < 2) return;
        if (typeof pointCoords[0] !== 'number' || typeof pointCoords[1] !== 'number') return;
        
        try {
            const point = turf.point(pointCoords);
            if (turf.booleanPointInPolygon(point, buffer)) {
                count++;
            }
        } catch (e) {
            // Пропускаем проблемные точки
        }
    });
    
    return count;
}

// ========== ИЗОХРОНЫ ==========
function calculateIsochrone(center, minutes, speed = 80) {
    if (!populationData) return;
    
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
}

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
            <div class="stat-label">👣 Жителей в 5 мин ходьбы</div>
            <small>кликните на карту</small>
        `;
        statsPanel.appendChild(resultBlock);
    }
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
                <div class="stat-label">👣 Жителей в 5 мин ходьбы</div>
                <small>кликните на карту</small>
            `;
        }
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

// ========== НАСТРОЙКА КНОПОК ==========
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