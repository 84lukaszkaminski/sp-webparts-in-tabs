(function () {
    'use strict';

    var config, webpart;

    function isPageInEditMode() {
        return document.getElementsByClassName(config.editModeZoneClass).length != 0 
        || SP.Ribbon.PageState.Handlers.isInEditMode();
    }

    function togglePageContent(value) {
        if (value) {
            document.getElementById(config.pageClass).classList.remove(config.ghostNodeClass);
        } else {
            document.getElementById(config.pageClass).classList.add(config.ghostNodeClass);
        }
    }

    function initOnWindowLoad(fn) {
        if (window.addEventListener)
            window.addEventListener('load', fn, false);
        else if (window.attachEvent)
            window.attachEvent('onload', fn);
    }

    config = {
        hiddenNodeClass: 'insane-epsilon-display-none',
        ghostNodeClass: 'insane-epsilon-ghost',
        tabbarClass: 'insane-eplison-webpart-tabbar',
        webpartDecoratorClass: 'insane-epsilon-webpart-decorator',
        pageClass: 'DeltaPlaceHolderMain',
        webpartClass: 'ms-webpart-chrome',
        headerClass: 'ms-webpart-chrome-title',
        titleClass: 'ms-webpart-titleText',
        editModeZoneClass: 'ms-SPZone',
        tabTitleFormat: 'tab #{index}',
        isHeaderHidden: true,
        tabbarNode: 'ul',
        tabNode: 'li'
    };

    webpart = {
        createWebpartWrapper: function (options) {
            var priv, obj;

            priv = {
                headerNode: options.webpart.getElementsByClassName(config.headerClass)[0],
                titleNode: options.webpart.getElementsByClassName(config.titleClass)[0]
            };

            if (config.isHeaderHidden) {
                priv.headerNode && priv.headerNode.classList.add(config.hiddenNodeClass);
            }

            return obj = {
                getGuid: function () {
                    return options.webpart.firstChild.id;
                },
                getTitle: function () {
                    return priv.titleNode
                        ? priv.titleNode.innerText
                        : config.tabTitleFormat.replace(/\{index\}/, options.index);
                },
                show: function () {
                    options.webpart.classList.remove(config.hiddenNodeClass);
                    options.webpart.classList.add(config.webpartDecoratorClass);
                },
                hide: function () {
                    options.webpart.classList.add(config.hiddenNodeClass);
                    options.webpart.classList.remove(config.webpartDecoratorClass);
                },
                isTabbar: function () {
                    return !!options.webpart.getElementsByClassName(config.tabbarClass)[0];
                },
                getTabbarContainer: function () {
                    if (obj.isTabbar()) {
                        return options.webpart.getElementsByClassName(config.tabbarClass)[0];
                    } else {
                        throw new Error('indicated web part is not a tabbar');
                    }
                }
            };
        },

        createTabbar: function (options) {
            var priv;

            priv = {
                tabs: [],
                activateTab: function (tab) {
                    priv.tabs.forEach(function (oneTab) {
                        if (oneTab == tab) {
                            oneTab.show();
                        } else {
                            oneTab.hide();
                        }
                    });
                },
                getCookie: function (name) {
                    var rx = new RegExp('(?:(?:^|.*;\\s*)' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$');
                    return +document.cookie.replace(rx, "$1");
                }
            };

            return {
                render: function () {
                    var node;
                    node = document.createElement(config.tabbarNode);

                    priv.tabs.forEach(function (oneTab, index) {
                        oneTab.render(node, function () {
                            priv.activateTab(oneTab);
                            document.cookie = options.webpart.getGuid() + '=' + index;
                        });
                    });
                    priv.activateTab(priv.tabs[priv.getCookie(options.webpart.getGuid())]);
                    options.webpart.getTabbarContainer().appendChild(node);
                },
                addTab: function (tab) {
                    priv.tabs.push(tab);
                }
            };
        },

        createTab: function (options) {
            var priv;

            priv = {
                node: null
            };

            return {
                render: function (container, activatingFn) {
                    priv.node = document.createElement(config.tabNode);
                    priv.node.innerHTML = options.webpart.getTitle();
                    priv.node.className = config.titleClass;
                    priv.node.onclick = activatingFn;
                    container.appendChild(priv.node);
                },
                show: function () {
                    var attr;
                    attr = document.createAttribute('selected');
                    attr.value = 'selected';
                    priv.node.setAttributeNode(attr);
                    options.webpart.show();
                },
                hide: function () {
                    priv.node.removeAttribute('selected');
                    options.webpart.hide();
                }
            }
        },

        init: function () {
            var webparts, tabbar, tabbars, flag;
            tabbars = [];

            webparts = Array.prototype.slice.call(document.getElementsByClassName(config.webpartClass), 0).map(function (oneWebpart, index) {
                return webpart.createWebpartWrapper({ webpart: oneWebpart.parentNode, index: index });
            });
            webparts.forEach(function (oneWebpart) {
                if (oneWebpart.isTabbar()) {
                    tabbar = webpart.createTabbar({ webpart: oneWebpart });
                    tabbars.push(tabbar);
                    flag = true;
                } else if (flag) {
                    tabbar.addTab(webpart.createTab({ webpart: oneWebpart }));
                }
            });

            tabbars.forEach(function (oneTabbar) {
                oneTabbar.render();
            });
        }
    };

    togglePageContent(false);
    initOnWindowLoad(function () {
        if (!isPageInEditMode()) {
            webpart.init();
        }
        togglePageContent(true);
    });
})();