// ============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================================

let map;                          // Объект карты MapLibre
let populationData;              // Данные о населении (гексагоны)
let popperpoiData;              // Данные о количестве потенциальных клиентов
let poiData;                    // Данные о точках питания (кафе, рестораны и т.д.)
let currentIsochroneLayer = null; // Текущая изохрона (для удаления)
let isPopulationLayerVisible = true;   // Видимость слоя населения
let isPopperpoiLayerVisible = true;    // Видимость слоя popperpoi

// ============================================================================
// ЦВЕТА ДЛЯ РАЗНЫХ ТИПОВ ТОЧЕК ПИТАНИЯ (POI)
// ============================================================================

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

// ============================================================================
// ЦВЕТА ДЛЯ СЛОЯ POPPERPOI (градиент от красного к зелёному)
// ============================================================================
// Значения: чем больше число, тем больше потенциальных клиентов
// 0 → красный (плохо), 16100 → зелёный (отлично)

const popperpoiGradient = [
    0, '#af0508',      // тёмно-красный
    300, '#D7191C',    // красный
    750, '#FDAE61',    // оранжевый
    1500, '#F4EEA5',   // жёлтый
    2500, '#AFE570',   // салатовый
    16100, '#1A9641'   // зелёный
];

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ КАРТЫ
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== ИНИЦИАЛИЗАЦИЯ КАРТЫ ===');
    
    // Создаём карту с базовым стилем OpenFreeMap
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [37.6173, 55.7558],  // Москва, центр
        zoom: 9,
        maxZoom: 18,
        minZoom: 8,
        maxBounds: [
        [36, 55],   // юго-запад
        [39.0, 57] 
        ]   // северо-восток
    });

    // Добавляем элементы управления
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // ========================================================================
    // ЗАГРУЗКА ДАННЫХ
    // ========================================================================
    
    // 1. Загружаем данные POPPERPOI (количество потенциальных клиентов)
    fetch('../data/popperpoi.geojson')
        .then(response => response.json())
        .then(data => {
            popperpoiData = data;
            console.log('✅ POPPERPOI загружены! Объектов:', data.features.length);
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки POPPERPOI:', error);
        });

    // 2. Загружаем данные POI (точки питания)
    fetch('../data/poi.geojson')
        .then(response => response.json())
        .then(data => {
            poiData = data;
            console.log('✅ POI загружены! Объектов:', data.features.length);
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки POI:', error);
        });

    // 3. Загружаем данные о населении (гексагоны)
    fetch('../data/population.geojson')
        .then(response => response.json())
        .then(data => {
            populationData = data;
            console.log('✅ Данные о населении загружены! Объектов:', data.features.length);
            
            // Обновляем статистику в панели
            updatePopulationStatistics(data);
            
            // После загрузки карты добавляем все слои
            map.on('load', () => {
                addPopulationLayer();      // Слой населения
                addPopperpoiLayer();       // Слой потенциальных клиентов
                addPOILayer();             // Слой точек питания
                addHexagonInteraction();   // Интерактивность с гексагонами
                createIsochroneResultBlock(); // Панель для изохроны
                setupLayerToggleButtons(); // Кнопки переключения слоёв
            });
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки данных о населении:', error);
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.innerHTML = '<p style="padding: 2rem; text-align: center;">❌ Ошибка загрузки данных</p>';
            }
        });
    
    // ========================================================================
    // ОБРАБОТЧИК КЛИКА ПО КАРТЕ
    // ========================================================================
    
    map.on('click', (e) => {
        // 1. Рисуем изохрону (5 минут пешком)
        if (populationData) {
            calculateIsochrone(e.lngLat, 5);
        }
        
        // 2. Показываем количество конкурентов в радиусе 400м
        if (poiData) {
            const count = countCompetitors(e.lngLat, 400);
            showCompetitorsPopup(e.lngLat, count);
        } else {
            showLoadingPopup(e.lngLat);
        }
    });
});

// ============================================================================
// ОБНОВЛЕНИЕ СТАТИСТИКИ НАСЕЛЕНИЯ
// ============================================================================

function updatePopulationStatistics(data) {
    const totalPopulation = data.features.reduce((sum, feature) => {
        return sum + (feature.properties.population || 0);
    }, 0);

    const totalEl = document.getElementById('total-population');
    if (totalEl) totalEl.textContent = totalPopulation.toLocaleString();
    
    const avgDensity = (totalPopulation / data.features.length).toFixed(0);
    const avgEl = document.getElementById('avg-density');
    if (avgEl) avgEl.textContent = avgDensity;
}


// ============================================================================
// СЛОЙ НАСЕЛЕНИЯ (гексагоны с градиентом)
// ============================================================================

function addPopulationLayer() {
    if (!populationData) return;
    
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
                0, '#fee5d9',      // очень светлый (мало людей)
                5000, '#fcae91',   // светло-оранжевый
                15000, '#fb6a4a',  // оранжевый
                30000, '#de2d26',  // красный
                50000, '#a50f15'   // тёмно-красный (много людей)
            ],
            'fill-opacity': 0.7,
            'fill-outline-color': '#ffffff'
        }
    });
    
    console.log('✅ Слой населения добавлен');
}

// ============================================================================
// СЛОЙ POPPERPOI (количество потенциальных клиентов)
// ============================================================================

function addPopperpoiLayer() {
    if (!popperpoiData) return;
    
    map.addSource('popperpoi', {
        type: 'geojson',
        data: popperpoiData
    });
    
    map.addLayer({
        id: 'popperpoi-layer',
        type: 'fill',
        source: 'popperpoi',
        paint: {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'popperpoi'],
                ...popperpoiGradient
            ],
            'fill-opacity': 0.7,
            'fill-outline-color': '#ffffff'
        }
    });
    
    console.log('✅ Слой POPPERPOI добавлен');
}

// ============================================================================
// СЛОЙ ТОЧЕК ПИТАНИЯ (POI)
// ============================================================================

function addPOILayer() {
    if (!poiData) return;
    
    map.addSource('poi', {
        type: 'geojson',
        data: poiData
    });
    
    map.addLayer({
        id: 'poi-layer',
        type: 'circle',
        source: 'poi',
        minzoom: 12,
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
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });
    
    console.log('✅ Слой POI добавлен');
}

// ============================================================================
// ИНТЕРАКТИВНОСТЬ С ГЕКСАГОНАМИ (без попапа при наведении)
// ============================================================================

function addHexagonInteraction() {
    // Только клик по гексагону (убрали попап при наведении)
    map.on('click', 'population-hex', (e) => {
        if (e.features.length > 0 && isPopulationLayerVisible) {
            const population = e.features[0].properties.population || 0;
            const selectedEl = document.getElementById('selected-population');
            if (selectedEl) {
                selectedEl.textContent = population.toLocaleString();
            }
        }
    });
    
    // Меняем курсор при наведении на гексагон (без попапа)
    map.on('mousemove', 'population-hex', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'population-hex', () => {
        map.getCanvas().style.cursor = '';
    });
}

// ============================================================================
// КНОПКИ ВКЛЮЧЕНИЯ/ВЫКЛЮЧЕНИЯ СЛОЁВ
// ============================================================================

function setupLayerToggleButtons() {
    // Кнопка для слоя населения
    const togglePopulationBtn = document.getElementById('toggle-population');
    if (togglePopulationBtn) {
        togglePopulationBtn.addEventListener('click', () => {
            if (map.getLayer('population-hex')) {
                if (isPopulationLayerVisible) {
                    map.setLayoutProperty('population-hex', 'visibility', 'none');
                    isPopulationLayerVisible = false;
                    togglePopulationBtn.textContent = 'Показать население';
                    togglePopulationBtn.classList.add('active');
                } else {
                    map.setLayoutProperty('population-hex', 'visibility', 'visible');
                    isPopulationLayerVisible = true;
                    togglePopulationBtn.textContent = 'Скрыть население';
                    togglePopulationBtn.classList.remove('active');
                }
            }
        });
    }
    
    // Кнопка для слоя popperpoi
    const togglePopperpoiBtn = document.getElementById('toggle-popperpoi');
    if (togglePopperpoiBtn) {
        togglePopperpoiBtn.addEventListener('click', () => {
            if (map.getLayer('popperpoi-layer')) {
                if (isPopperpoiLayerVisible) {
                    map.setLayoutProperty('popperpoi-layer', 'visibility', 'none');
                    isPopperpoiLayerVisible = false;
                    togglePopperpoiBtn.textContent = 'Показать клиентов';
                    togglePopperpoiBtn.classList.add('active');
                } else {
                    map.setLayoutProperty('popperpoi-layer', 'visibility', 'visible');
                    isPopperpoiLayerVisible = true;
                    togglePopperpoiBtn.textContent = 'Скрыть клиентов';
                    togglePopperpoiBtn.classList.remove('active');
                }
            }
        });
    }
}

// ============================================================================
// ПОДСЧЁТ КОНКУРЕНТОВ В РАДИУСЕ
// ============================================================================

function countCompetitors(lngLat, radius = 400) {
    if (!poiData) return 0;
    
    const center = turf.point([lngLat.lng, lngLat.lat]);
    const buffer = turf.buffer(center, radius / 1000, { units: 'kilometers' });
    
    let count = 0;
    
    poiData.features.forEach(feature => {
        if (!feature.geometry || feature.geometry.type !== 'Point') return;
        
        const coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;
        if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return;
        
        try {
            const point = turf.point(coords);
            if (turf.booleanPointInPolygon(point, buffer)) count++;
        } catch (e) {}
    });
    
    return count;
}

// ============================================================================
// ВСПЛЫВАЮЩИЕ ОКНА
// ============================================================================

function showCompetitorsPopup(lngLat, count) {
    new maplibregl.Popup()
        .setLngLat(lngLat)
        .setHTML(`🏪 Конкурентов в 400м: ${count}`)
        .addTo(map);
    
    setTimeout(() => {
        const popup = document.querySelector('.maplibregl-popup');
        if (popup) popup.remove();
    }, 3000);
}

function showLoadingPopup(lngLat) {
    new maplibregl.Popup()
        .setLngLat(lngLat)
        .setHTML(`⏳ Загрузка данных...`)
        .addTo(map);
    
    setTimeout(() => {
        const popup = document.querySelector('.maplibregl-popup');
        if (popup) popup.remove();
    }, 2000);
}

// ============================================================================
// ИЗОХРОНА (пешеходная доступность)
// ============================================================================

function calculateIsochrone(center, minutes, speed = 80) {
    if (!populationData) return;
    
    const radius = minutes * speed;
    const point = turf.point([center.lng, center.lat]);
    const isochrone = turf.buffer(point, radius / 1000, { units: 'kilometers' });
    
    const { totalPopulation, intersectingCount } = sumPopulationInAreaProportional(isochrone);
    displayIsochrone(isochrone, center, minutes, totalPopulation, intersectingCount);
}

// ============================================================================
// ПРОПОРЦИОНАЛЬНЫЙ ПОДСЧЁТ НАСЕЛЕНИЯ (с учётом доли площади)
// ============================================================================
// Это ключевое улучшение! Теперь учитывается, какую часть гексагона
// захватывает изохрона, и население берётся пропорционально.

function sumPopulationInAreaProportional(polygon) {
    if (!populationData) return { totalPopulation: 0, intersectingCount: 0 };
    
    let totalPopulation = 0;
    let intersectingCount = 0;
    
    populationData.features.forEach(feature => {
        const hexGeometry = feature.geometry;
        
        // Проверяем пересечение
        if (turf.booleanIntersects(polygon, hexGeometry)) {
            intersectingCount++;
            
            // Вычисляем площадь пересечения
            let intersectionArea = 0;
            let hexArea = 0;
            
            try {
                // Находим площадь пересечения
                const intersection = turf.intersect(polygon, hexGeometry);
                if (intersection) {
                    intersectionArea = turf.area(intersection);
                }
                
                // Площадь гексагона
                hexArea = turf.area(hexGeometry);
                
                // Пропорция захваченной площади
                const proportion = hexArea > 0 ? intersectionArea / hexArea : 0;
                
                // Берём пропорциональную часть населения
                const population = feature.properties.population || 0;
                totalPopulation += population * proportion;
                
            } catch (e) {
                // Если ошибка при расчёте пересечения, берём всё население
                console.warn('Ошибка при расчёте пересечения:', e);
                totalPopulation += feature.properties.population || 0;
            }
        }
    });
    
    return { 
        totalPopulation: Math.round(totalPopulation), 
        intersectingCount 
    };
}

function displayIsochrone(isochrone, center, minutes, population, intersectingCount) {
    // Удаляем предыдущую изохрону
    if (currentIsochroneLayer) {
        try {
            if (map.getLayer('isochrone-fill')) map.removeLayer('isochrone-fill');
            if (map.getLayer('isochrone-outline')) map.removeLayer('isochrone-outline');
            if (map.getSource('isochrone')) map.removeSource('isochrone');
        } catch(e) {}
    }
    
    // Добавляем новую изохрону
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
    
    // ========== ОБНОВЛЯЕМ БОКОВУЮ ПАНЕЛЬ СТАТИСТИКИ ==========
    const isochronePanelEl = document.getElementById('isochrone-population');
    if (isochronePanelEl) {
        isochronePanelEl.textContent = population.toLocaleString();
    }
    
    // ========== ПОДСВЕЧИВАЕМ КАРТОЧКУ ИЗОХРОНЫ ==========
    const statIsochroneCard = document.getElementById('stat-isochrone');
    if (statIsochroneCard) {
        statIsochroneCard.classList.add('active');
    }
    
    // ========== ОБНОВЛЯЕМ СТАРЫЙ БЛОК (для обратной совместимости) ==========
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
        } catch(e) {}
        currentIsochroneLayer = null;
        
        // ========== СБРАСЫВАЕМ БОКОВУЮ ПАНЕЛЬ ==========
        const isochronePanelEl = document.getElementById('isochrone-population');
        if (isochronePanelEl) {
            isochronePanelEl.textContent = '—';
        }
        
        // ========== УБИРАЕМ ПОДСВЕТКУ ==========
        const statIsochroneCard = document.getElementById('stat-isochrone');
        if (statIsochroneCard) {
            statIsochroneCard.classList.remove('active');
        }
        
        // ========== СБРАСЫВАЕМ СТАРЫЙ БЛОК ==========
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

// ============================================================================
// НАСТРОЙКА КНОПОК
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('reset-analytics');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetIsochrone);
    }
});