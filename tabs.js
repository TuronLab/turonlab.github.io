/**
 * Main script for handling tabs, popups, and dynamic content loading.
 * This version is a refactored and organized version of the original.
 */
(async () => {
    // --- Constants and DOM elements ---
    const TABS_JSON = './display_conf/tabs.json';
    const ABOUT_JSON = './display_conf/about.json';
    const PROJECTS_JSON = './display_conf/projects.json';

    const tabsContainer = document.querySelector('.tabs');
    const contentContainer = document.querySelector('.content');
    const tabsHamburger = document.querySelector(".tabs-hamburger");
    const tabsContainerEl = document.querySelector('.tabs-container');

    if (!tabsContainer || !contentContainer || !tabsHamburger || !tabsContainerEl) {
        console.error('Required DOM elements not found.');
        return;
    }

    // --- Utility Functions ---
    const isPathLike = str => typeof str === 'string' && /[\/\\].+\.[a-zA-Z0-9]+$/.test(str);

    async function fetchJson(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
            return await response.json();
        } catch (err) {
            console.error(`Error fetching JSON from ${path}:`, err);
            return null;
        }
    }

    async function fetchText(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
            return await response.text();
        } catch (err) {
            console.error(`Error fetching text from ${path}:`, err);
            return null;
        }
    }

    // --- Tab System Initialization ---

    let tabsConfig;
    try {
        const response = await fetch(TABS_JSON);
        if (!response.ok) throw new Error(`Failed to load ${TABS_JSON}: ${response.status}`);
        tabsConfig = await response.json();
        if (!Array.isArray(tabsConfig)) throw new Error('tabs.json must be an array.');
    } catch (err) {
        console.error(err);
        tabsContainer.innerHTML = '<div class="tab-error">Failed to load tabs configuration.</div>';
        return;
    }

    const loadedTabs = new Set();

    tabsConfig.forEach((tab, idx) => {
        const id = tab.id || `tab-${idx}`;
        const name = tab.name || id;
        const file = tab.file || null;

        const btn = document.createElement('button');
        btn.className = 'tab-button';
        if (idx === 0) btn.classList.add('active');
        btn.type = 'button';
        btn.dataset.tab = id;
        if (file) btn.dataset.file = file;
        btn.textContent = name;
        tabsContainer.appendChild(btn);

        const tabDiv = document.createElement('div');
        tabDiv.className = 'tab-content';
        tabDiv.id = id;
        tabDiv.style.display = idx === 0 ? 'block' : 'none';
        contentContainer.appendChild(tabDiv);
    });

    // --- Dynamic Content Loading (Lazy) ---
    async function loadTabContent(tabId) {
        if (loadedTabs.has(tabId)) return;
        const tabDiv = document.getElementById(tabId);
        if (!tabDiv) return;

        const btn = tabsContainer.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const file = btn && btn.dataset.file;

        if (file) {
            const html = await fetchText(file);
            tabDiv.innerHTML = html || '<p>Error loading content.</p>';
        } else {
            tabDiv.innerHTML = '<p>No associated file for this tab.</p>';
        }
        loadedTabs.add(tabId);

        if (tabId === 'projects') {
            initProjects(tabDiv).catch(err => console.error(err));
        }
    }

    // --- Centralized Hamburger Menu Logic ---
    function setupHamburgerMenu() {
        tabsContainerEl.addEventListener("click", () => {
            const expanded = tabsHamburger.getAttribute("aria-expanded") === "true";
            tabsHamburger.setAttribute("aria-expanded", !expanded);
            tabsContainer.classList.toggle("show");
        });

        tabsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.tab-button')) {
                tabsHamburger.setAttribute("aria-expanded", "false");
                tabsContainer.classList.remove("show");
            }
        });

        document.addEventListener('click', (e) => {
            const isClickInsideMenu = tabsContainerEl.contains(e.target) || tabsHamburger.contains(e.target);
            if (!isClickInsideMenu && tabsContainer.classList.contains('show')) {
                tabsHamburger.setAttribute("aria-expanded", "false");
                tabsContainer.classList.remove("show");
            }
        });
    }

    setupHamburgerMenu();

    // --- Tab Switching Logic (separate from hamburger) ---
    tabsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('.tab-button');
        if (!btn) return;

        tabsContainer.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        contentContainer.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        const target = document.getElementById(tabId);
        if (target) {
            target.style.display = 'block';
            await loadTabContent(tabId);
            history.replaceState(null, '', `#${tabId}`);
        }

        if (window.matchMedia('(max-width: 768px)').matches) {
            tabsContainer.classList.remove('show');
            tabsHamburger.setAttribute('aria-expanded', 'false');
        }
    });


    // --- Tab Switching Logic (separate from hamburger) ---
    tabsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('.tab-button');
        if (!btn) return;

        tabsContainer.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        contentContainer.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        const target = document.getElementById(tabId);
        if (target) {
            target.style.display = 'block';
            await loadTabContent(tabId);
            history.replaceState(null, '', `#${tabId}`);
        }
    });

    // --- Initial State and URL Handling ---
    const openHashTab = async () => {
        const hash = location.hash.replace('#', '');
        const btn = tabsContainer.querySelector(`.tab-button[data-tab="${hash}"]`);

        if (btn) {
            btn.click();
        } else {
            // If it's no valid option, it will default to the first tab
            const defaultBtn = tabsContainer.querySelector('.tab-button');
            if (defaultBtn) defaultBtn.click();
        }
    };
    await openHashTab();

    // --- About Popup Logic ---
    let aboutGlobal = null;
    (async () => {
        aboutGlobal = await fetchJson(ABOUT_JSON);
    })();

    const aboutPopup = document.getElementById('about-popup');
    const aboutTitleEl = aboutPopup ? aboutPopup.querySelector('#about-popup-title') : null;
    const aboutContentEl = aboutPopup ? aboutPopup.querySelector('#about-popup-content') : null;
    const aboutPrevBtn = aboutPopup ? document.getElementById('about-prev') : null;
    const aboutNextBtn = aboutPopup ? document.getElementById('about-next') : null;
    const aboutCloseBtn = aboutPopup ? aboutPopup.querySelector('.popup-close') : null;

    let aboutPages = [];
    let aboutCurrent = 0;

    const updateAboutNav = () => {
        if (aboutPrevBtn) aboutPrevBtn.style.display = aboutCurrent > 0 ? 'inline-block' : 'none';
        if (aboutNextBtn) aboutNextBtn.style.display = aboutCurrent < aboutPages.length - 1 ? 'inline-block' : 'none';
    };

    async function loadAboutPage(index) {
        const page = aboutPages[index];
        if (!page) {
            if (aboutContentEl) aboutContentEl.innerHTML = '<p>Content not available.</p>';
            updateAboutNav();
            return;
        }

        try {
            if (isPathLike(page)) {
                const html = await fetchText(page);
                aboutContentEl.innerHTML = html || '<p>Error loading page.</p>';
            } else {
                aboutContentEl.innerHTML = page;
            }
        } catch (err) {
            console.error(err);
            aboutContentEl.innerHTML = '<p>Error loading page.</p>';
        }
        updateAboutNav();
    }

    document.addEventListener('click', async (e) => {
        const link = e.target.closest('.about-link');
        if (!link) return;
        e.preventDefault();

        const title = link.dataset.title || link.getAttribute('title') || 'About';
        if (aboutTitleEl) aboutTitleEl.textContent = title;

        aboutPages = [];
        aboutCurrent = 0;

        if (link.dataset.pages) {
            try {
                aboutPages = JSON.parse(link.dataset.pages);
            } catch (err) {
                try {
                    const json = await fetchJson(link.dataset.pages);
                    if (json) aboutPages = json;
                } catch (err2) {
                    console.error('Could not parse inline JSON or load file:', err2);
                }
            }
        } else if (link.dataset.pagesFile) {
            const json = await fetchJson(link.dataset.pagesFile);
            if (json) aboutPages = json;
        } else if (aboutGlobal) {
            const storyId = link.dataset.story || 'story';
            if (Array.isArray(aboutGlobal)) {
                const found = aboutGlobal.find(x => x.id === storyId);
                if (found && Array.isArray(found.pages)) aboutPages = found.pages;
            } else if (aboutGlobal[storyId] && Array.isArray(aboutGlobal[storyId])) {
                aboutPages = aboutGlobal[storyId];
            } else if (Array.isArray(aboutGlobal.pages)) {
                aboutPages = aboutGlobal.pages;
            }
        }

        if (!Array.isArray(aboutPages) || aboutPages.length === 0) {
            aboutPages = ['No content available.'];
        }

        if (aboutPopup) {
            aboutPopup.classList.add('is-open');
            await loadAboutPage(aboutCurrent);
        } else {
            alert(typeof aboutPages[0] === 'string' ? aboutPages[0].replace(/<[^>]*>/g, '') : 'View content');
        }
    });

    if (aboutPrevBtn) aboutPrevBtn.addEventListener('click', async () => {
        if (aboutCurrent > 0) {
            aboutCurrent--;
            await loadAboutPage(aboutCurrent);
        }
    });
    if (aboutNextBtn) aboutNextBtn.addEventListener('click', async () => {
        if (aboutCurrent < aboutPages.length - 1) {
            aboutCurrent++;
            await loadAboutPage(aboutCurrent);
        }
    });
    if (aboutCloseBtn) aboutCloseBtn.addEventListener('click', () => aboutPopup.classList.remove('is-open'));
    window.addEventListener('click', (e) => {
        if (e.target === aboutPopup) aboutPopup.classList.remove('is-open');
    });


    // --- Project Popup Logic ---
    async function initProjects(tabDiv) {
        let container = tabDiv.querySelector('#projects-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'projects-container';
            container.className = 'projects-grid';
            tabDiv.appendChild(container);
        }

        const projects = await fetchJson(PROJECTS_JSON);
        if (!projects || !Array.isArray(projects)) {
            container.innerHTML = '<p>No projects available.</p>';
            return;
        }

        container.innerHTML = '';
        projects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.tabIndex = 0;
            card.dataset.title = proj.title || '';
            card.dataset.content = proj.content || '';
            card.innerHTML = `
              ${proj.thumbnail ? `<img src="${proj.thumbnail}" alt="${proj.title}">` : ''}
              <h3>${proj.title || 'Untitled'}</h3>
          `;
            container.appendChild(card);
        });

        const popup = document.getElementById('project-popup');
        if (!popup) {
            console.warn('#project-popup not found in index.html');
            return;
        }
        const popupImage = popup.querySelector('#popup-image');
        const popupTitle = popup.querySelector('#popup-title');
        const popupDescription = popup.querySelector('#popup-description');
        const popupClose = popup.querySelector('.popup-close');

        container.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', async () => {
                const title = card.dataset.title || '';
                const contentPath = card.dataset.content || '';
                const thumbnail = card.dataset.thumbnail || '';

                if (popupTitle) popupTitle.textContent = title;
                if (popupImage && thumbnail) {
                    popupImage.src = thumbnail;
                    popupImage.alt = title;
                    popupImage.style.display = '';
                } else if (popupImage) {
                    popupImage.style.display = 'none';
                }
                if (contentPath && isPathLike(contentPath)) {
                    const html = await fetchText(contentPath);
                    if (popupDescription) popupDescription.innerHTML = html || '<p>Error loading content.</p>';
                } else {
                    if (popupDescription) popupDescription.textContent = contentPath || 'No description.';
                }
                if (popup) popup.classList.add('is-open');
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });

        if (popupClose) {
            popupClose.addEventListener('click', () => {
                popup.classList.remove('is-open');
                stopAudios(popup);
            });
        }
        window.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.classList.remove('is-open');
                stopAudios(popup);
            }
        });

        function stopAudios(container) {
            const audios = container.querySelectorAll("audio");
            audios.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
        }

    }

    // --- Contact Toggle Logic ---
    const initContactToggleCorner = () => {
        const sidebar = document.querySelector('.sidebar');
        const profile = sidebar?.querySelector('.profile');
        const contact = sidebar?.querySelector('.contact-info');
        if (!profile || !contact) return;

        if (!contact.id) contact.id = 'contact-info';
        if (profile.querySelector('.contact-toggle.corner')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'contact-toggle corner';
        btn.setAttribute('aria-controls', contact.id);
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Show contact');
        btn.innerHTML = '<span class="arrow" aria-hidden="true">▾</span>';
        profile.appendChild(btn);

        const setInitialState = () => {
            if (window.matchMedia('(max-width: 768px)').matches) {
                contact.classList.add('collapsed');
                btn.setAttribute('aria-expanded', 'false');
                btn.setAttribute('aria-label', 'Show contact');
            } else {
                contact.classList.remove('collapsed');
                btn.setAttribute('aria-expanded', 'true');
                btn.setAttribute('aria-label', 'Hide contact');
            }
        };

        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            contact.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', !expanded);
            btn.setAttribute('aria-label', expanded ? 'Show contact' : 'Hide contact');
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setInitialState, 120);
        });

        setInitialState();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContactToggleCorner);
    } else {
        initContactToggleCorner();
    }
})();