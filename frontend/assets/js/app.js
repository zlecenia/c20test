const API = window.location.origin + '/api';
let currentMenu = 'system_menu';
let currentUser = null;
let menuData = null;

// Ensure iframe loads pages correctly with URL routing
function loadPage(pageNumber) {
    const iframe = document.getElementById('viewer');
    iframe.src = '/pages/' + pageNumber + '.html';

    // Update URL hash for routing
    const newHash = `#/page/${pageNumber}.html`;
    if (window.location.hash !== newHash) {
        window.location.hash = newHash;
    }

    console.log('📄 PAGE LOADED:', pageNumber, 'URL:', newHash);
}

// Handle hash changes for direct URL navigation
function handleHashChange() {
    const hash = window.location.hash;
    console.log('🔗 HASH CHANGED:', hash);

    if (hash.startsWith('#/page/')) {
        const pageMatch = hash.match(/#\/page\/(\d+)\.html/);
        if (pageMatch) {
            const pageNumber = parseInt(pageMatch[1]);
            console.log('🧭 NAVIGATING TO PAGE FROM URL:', pageNumber);
            const iframe = document.getElementById('viewer');
            iframe.src = '/pages/' + pageNumber + '.html';
        }
    }
}

// Listen for hash changes
window.addEventListener('hashchange', handleHashChange);

// Handle initial hash on page load
window.addEventListener('load', handleHashChange);

// Display mode management for different screen types
let currentDisplayMode = 'auto';

function setDisplayMode(mode) {
    currentDisplayMode = mode;
    const body = document.body;

    // Remove existing mode classes
    body.classList.remove('mode-auto', 'mode-mobile', 'mode-desktop', 'mode-waveshare');

    // Add new mode class
    body.classList.add(`mode-${mode}`);

    // Update CSS variables based on mode
    const root = document.documentElement;

    switch(mode) {
        case 'waveshare':
            // Optimized for Waveshare 7.9" LCD 400x1280
            root.style.setProperty('--header-height', '30px');
            root.style.setProperty('--content-gap', '2px');
            root.style.setProperty('--card-padding', '4px');
            root.style.setProperty('--font-size-base', '11px');
            root.style.setProperty('--font-size-header', '12px');
            root.style.setProperty('--touch-target', '36px');
            break;
        case 'mobile':
            // Mobile optimized
            root.style.setProperty('--header-height', '45px');
            root.style.setProperty('--content-gap', '6px');
            root.style.setProperty('--card-padding', '10px');
            root.style.setProperty('--font-size-base', '16px');
            root.style.setProperty('--font-size-header', '18px');
            root.style.setProperty('--touch-target', '48px');
            break;
        case 'desktop':
            // Desktop optimized
            root.style.setProperty('--header-height', '50px');
            root.style.setProperty('--content-gap', '12px');
            root.style.setProperty('--card-padding', '12px');
            root.style.setProperty('--font-size-base', '14px');
            root.style.setProperty('--font-size-header', '16px');
            root.style.setProperty('--touch-target', '44px');
            break;
        default: // 'auto'
            // Auto-detect based on screen size
            if (window.innerWidth <= 420 && window.innerHeight >= 1200) {
                setDisplayMode('waveshare');
                return;
            } else if (window.innerWidth <= 768) {
                setDisplayMode('mobile');
                return;
            } else {
                setDisplayMode('desktop');
                return;
            }
    }

    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });

    console.log('🎮 DISPLAY MODE CHANGED:', mode);
    localStorage.setItem('displayMode', mode);
}

// Auto-detect display mode on load
function detectDisplayMode() {
    const savedMode = localStorage.getItem('displayMode');
    if (savedMode && savedMode !== 'auto') {
        setDisplayMode(savedMode);
    } else {
        setDisplayMode('auto');
    }
}

// Initialize display mode
setTimeout(detectDisplayMode, 100);

async function loadConfig(){
    try {
        const res = await fetch(API + '/config');
        return res.json();
    } catch(e) {
        console.error('Config error:', e);
        return {};
    }
}

async function loadMenu(){
    try {
        const res = await fetch(API + '/menu');
        menuData = await res.json();
        return menuData;
    } catch(e) {
        console.error('Menu error:', e);
        return {};
    }
}

function renderMenu(data, menuId = 'system_menu'){
    console.log('🔄 RENDER MENU CALLED:', {
        menuId,
        hasData: !!data,
        hasMenuStructure: !!(data && data.menu_structure),
        currentUser: currentUser,
        timestamp: new Date().toLocaleTimeString()
    });

    const root = document.getElementById('menuRoot');
    console.log('🎯 MENU ROOT ELEMENT:', root);
    root.innerHTML = '';

    if(!data || !data.menu_structure) {
        console.error('❌ RENDER MENU FAILED: No data or menu_structure', { data, menuId });
        return;
    }

    // Store current menu
    currentMenu = menuId;
    console.log('📝 CURRENT MENU SET TO:', currentMenu);

    const menuSection = data.menu_structure.find(m => m.id === menuId);
    console.log('🔍 MENU SECTION FOUND:', {
        menuId,
        found: !!menuSection,
        sectionName: menuSection?.name,
        requiresLogin: menuSection?.requires_login,
        itemCount: menuSection?.items?.length
    });

    if(!menuSection) {
        console.error('❌ MENU SECTION NOT FOUND:', menuId);
        console.log('📋 AVAILABLE MENU SECTIONS:', data.menu_structure.map(m => m.id));
        return;
    }

    // Add menu title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'menu-title';
    titleDiv.textContent = menuSection.name;
    root.appendChild(titleDiv);

    // Add menu items
    console.log('📋 RENDERING MENU ITEMS...');
    menuSection.items.forEach((item, idx) => {
        console.log(`📄 ITEM ${idx + 1}:`, {
            name: item.name,
            key: item.key,
            page: item.page,
            action: item.action
        });

        const div = document.createElement('div');
        div.className = 'option';

        // Check if disabled (requires login)
        const isDisabled = menuSection.requires_login && !currentUser;
        console.log(`🔒 ITEM ${idx + 1} ACCESS CHECK:`, {
            requiresLogin: menuSection.requires_login,
            hasCurrentUser: !!currentUser,
            isDisabled: isDisabled
        });

        if(isDisabled){
            div.classList.add('disabled');
        }

        // Format label
        let labelHTML = item.name;
        if(item.name.includes('...')){
            labelHTML = `<span class="back-arrow">←</span> ${item.name}`;
        }

        div.innerHTML = labelHTML;

        div.onclick = () => {
            console.log(`🖱️ MENU ITEM CLICKED:`, {
                name: item.name,
                key: item.key,
                isDisabled: div.classList.contains('disabled')
            });

            if(div.classList.contains('disabled')) {
                console.log('⚠️ DISABLED ITEM CLICKED - Showing alert');
                alert('Wymagane logowanie');
                return;
            }

            // Mark active
            root.querySelectorAll('.option').forEach(n=>n.classList.remove('active'));
            div.classList.add('active');
            console.log('✨ ITEM MARKED AS ACTIVE');

            // Handle navigation
            if(item.action === 'back_to_user_menu'){
                renderMenu(menuData, 'user_menu');
                return;
            }
            if(item.action === 'back_to_menu'){
                renderMenu(menuData, 'system_menu');
                return;
            }

            // Load page
            if(item.page){
                console.log('📄 LOADING PAGE:', item.page);
                loadPage(item.page);
            }

            // Handle menu transitions
            if(item.key === 'test_menu'){
                console.log('📋 TRANSITIONING TO TEST MENU');
                renderMenu(menuData, 'test_menu');
            } else if(item.key === 'service_menu'){
                console.log('🔧 TRANSITIONING TO SERVICE MENU');
                renderMenu(menuData, 'service_menu');
            } else if(item.key === 'autodiagnostic'){
                console.log('🔍 TRANSITIONING TO AUTODIAGNOSTIC MENU');
                renderMenu(menuData, 'autodiagnostic_menu');
            } else if(item.key === 'qr_barcode'){
                console.log('📱 LOADING QR SCANNER LOGIN');
                loadPage(3);
            } else if(item.key === 'manual_login'){
                console.log('⌨️ LOADING MANUAL LOGIN');
                loadPage(8);
            }

            // Handle actions
            if(item.action){
                console.log('⚡ HANDLING ACTION:', item.action);
                handleAction(item.action);
            }
        };

        root.appendChild(div);
    });

    // Auto-select first item for system_menu only
    if(menuId === 'system_menu' && root.children[1]){
        setTimeout(() => root.children[1].click(), 100);
    }
}

function handleAction(action){
    console.log('⚡ HANDLE ACTION CALLED:', {
        action,
        currentUser: currentUser,
        timestamp: new Date().toLocaleTimeString()
    });

    switch(action){
        case 'logout_user':
            console.log('🚪 LOGGING OUT USER');
            currentUser = null;
            document.getElementById('userRole').textContent = '- - -';
            console.log('🔄 RENDERING LOGIN MENU AFTER LOGOUT');
            renderMenu(menuData, 'login_menu');
            loadPage(3); // Go to login page
            break;

        case 'system_calibration':
            console.log('⚙️ STARTING SYSTEM CALIBRATION - 10s');
            document.getElementById('status').textContent = 'System calibration in Progress ...';
            setTimeout(() => {
                console.log('✅ SYSTEM CALIBRATION COMPLETE');
                document.getElementById('status').textContent = 'System Ready';
                // Don't redirect if user is logged in - stay in current menu
                if(!currentUser) {
                    console.log('📋 NO USER LOGGED IN - RETURNING TO LOGIN MENU');
                    renderMenu(menuData, 'login_menu');
                } else {
                    console.log('👤 USER LOGGED IN - STAYING IN CURRENT MENU');
                }
            }, 10000); // 10s as specified
            break;

        case 'run_diagnostic':
            console.log('🔍 STARTING AUTODIAGNOSTIC - 6s');
            document.getElementById('status').textContent = 'Autodiagnostyka...';
            setTimeout(() => {
                console.log('✅ AUTODIAGNOSTIC COMPLETE');
                document.getElementById('status').textContent = 'System Ready';
                // Don't redirect if user is logged in - stay in current menu
                if(!currentUser) {
                    console.log('📋 NO USER LOGGED IN - RETURNING TO LOGIN MENU');
                    renderMenu(menuData, 'login_menu');
                } else {
                    console.log('👤 USER LOGGED IN - STAYING IN CURRENT MENU');
                }
            }, 6000); // 6s as specified
            break;

        default:
            console.log('⚠️ UNKNOWN ACTION:', action);
    }
}

async function updateSensors(){
    try{
        const res = await fetch(API + '/sensors');
        const d = await res.json();

        // Use static values as shown in images
        document.getElementById('valLow').textContent = '10';
        document.getElementById('valMid').textContent = '20';
        document.getElementById('valHigh').textContent = '30';

        document.getElementById('deviceInfo').textContent = `${d.device.name}`;
        document.getElementById('endpoint').textContent = d.device.endpoint;
        document.getElementById('status').textContent = d.status || 'System Ready';
    }catch(e){
        document.getElementById('status').textContent = 'Connection Error';
    }
}

function updateDateTime(){
    const now = new Date();
    document.getElementById('dateTime').textContent =
        '12.12.2025 - 12:05:01'; // Static as in images
    document.getElementById('dateTimeHeader').textContent =
        '8/19/2025, 10:14:35 PM'; // Static as in header
}

// Listen for messages from iframes
window.addEventListener('message', (e) => {
    console.log('📨 RECEIVED MESSAGE:', e.data);
    console.log('📊 MESSAGE DETAILS:', {
        type: e.data.type,
        success: e.data.success,
        username: e.data.username,
        role: e.data.role,
        timestamp: new Date().toLocaleTimeString(),
        currentUser: currentUser
    });

    if(e.data.type === 'login' && e.data.success){
        console.log('🚀 PROCESSING LOGIN SUCCESS...');
        
        currentUser = {
            username: e.data.username || 'r.arendt',
            role: e.data.role || 'OPERATOR'
        };
        
        console.log('👤 USER SET:', currentUser);
        document.getElementById('userRole').textContent = currentUser.username;
        console.log('🏷️ USER ROLE UPDATED IN UI:', currentUser.username);

        console.log('🎯 TRANSITIONING TO USER MENU...');
        // Transition to user menu after successful login
        renderMenu(menuData, 'user_menu');
        console.log('✅ USER MENU RENDERED');

        // Load first page of user menu (now first item is Test Menu, not Logout)
        setTimeout(() => {
            console.log('🔍 LOOKING FOR FIRST MENU ITEM...');
            const firstItem = document.querySelector('.option:not(.disabled)');
            console.log('📋 FIRST ITEM FOUND:', firstItem?.textContent);
            if(firstItem) {
                console.log('🖱️ CLICKING FIRST ITEM...');
                firstItem.click();
            } else {
                console.log('⚠️ NO MENU ITEMS FOUND, SKIPPING AUTO-CLICK');
            }
        }, 100);
    }

    if(e.data.type === 'navigate'){
        console.log('🧭 NAVIGATION REQUEST:', e.data.page);
        loadPage(e.data.page);
    }

    // Handle device kind selection with automatic navigation
    if(e.data.type === 'device_kind_selected'){
        console.log('🛡️ DEVICE KIND SELECTED:', e.data.device);
        if(e.data.navigate) {
            console.log('🧭 AUTO-NAVIGATING TO PAGE:', e.data.navigate);
            loadPage(e.data.navigate);
        }
    }

    // Handle device type selection with automatic navigation
    if(e.data.type === 'device_type_selected'){
        console.log('⚙️ DEVICE TYPE SELECTED:', e.data.deviceType);
        if(e.data.navigate) {
            console.log('🧭 AUTO-NAVIGATING TO PAGE:', e.data.navigate);
            loadPage(e.data.navigate);
        }
    }

    // Handle test flow selection
    if(e.data.type === 'test_flow_selected'){
        console.log('🔄 TEST FLOW SELECTED:', e.data.flow);
    }

    // Handle user info requests
    if(e.data.type === 'request_user_info'){
        console.log('👤 USER INFO REQUESTED');
        // Send current user info back to iframe
        if(currentUser) {
            e.source.postMessage({
                type: 'user_info_response',
                user: currentUser
            }, '*');
        }
    }
});

async function boot(){
    // Start with blank iframe
    document.getElementById('viewer').src = 'about:blank';

    try{
        const cfg = await loadConfig();
        const menu = await loadMenu();

        // Start with system menu
        renderMenu(menu, 'system_menu');

        updateSensors();
        setInterval(updateSensors, 1000);
        updateDateTime(); // Set once as static
    }catch(e){
        console.error('Boot error:', e);
    }
}

boot();
