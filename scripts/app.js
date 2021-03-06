(function() {
    'use strict';

    var app = {
        isLoading: true,
        selectedTags: [],
        spinner: document.querySelector('.loader'),
        noPics: document.querySelector('.no-pictures'),
        container: document.querySelector('.content'),
        db: null,
        gallerySelector: '#flickrGallery',
        about: document.querySelector('.aboutTemplate'),
        contact: document.querySelector('.contactTemplate'),
        addButtonTemplate: document.querySelector('.addTemplate'),
        addButton: document.querySelector('.addButton'),
        tagDialog: document.querySelector('.dialog-container'),
        tagText: document.querySelector('#tagToAdd'),
        gallerySettings: {
            randomize: true,
            lastRow: 'justify'
        }
    }

    app.showNoPictures = () => {
        let card = app.noPics.cloneNode(true);
        card.classList.remove('no-pictures');
        card.removeAttribute('hidden');
        app.container.innerHTML = '';
        app.container.appendChild(card);
        app.addAddButton();
        if(app.isLoading)
            app.setLoading(false);
    };

    app.addAddButton = () => {
        let addButton = app.addButtonTemplate.cloneNode(true);
        addButton.classList.remove('addTemplate');
        addButton.addEventListener('click', app.toggleTagDialog);
        app.container.appendChild(addButton);
    };

    app.toggleTagDialog = function() {
        if(app.tagDialog.hasAttribute('hidden')) {
            app.tagDialog.removeAttribute('hidden');
            app.tagText.focus();
        } else
            app.tagDialog.setAttribute('hidden', true);
    };

    app.loadFlickr = function() {
        if(app.selectedTags.length == 0)
            app.showNoPictures();
        else {
            app.getPicsByTags(app.selectedTags);
        }
    };

    app.setLoading = function(on) {
        if(on){
            app.container.innerHTML = '';
            app.spinner.setAttribute('hidden', false);
            app.isLoading = true;
        } else {
            app.spinner.setAttribute('hidden', true);
            app.isLoading = false;
        }
    };

    app.createCard = function(item){
        let card = document.querySelector('.imageTemplate').cloneNode(true);
        card.classList.remove('imageTemplate');
        card.setAttribute('href', item.link);
        card.querySelector('.image').setAttribute('alt', item.title);
        card.querySelector('.image').setAttribute('src', item.media.m);
        card.removeAttribute('hidden');
        document.querySelector(app.gallerySelector).appendChild(card);
    }

    app.getPicsByTags = function(tags) {
        app.setLoading(true);
        let url = 'https://api.flickr.com/services/feeds/photos_public.gne';
        let originalGallery = document.querySelector('.originalGallery');
        originalGallery.innerHTML = '';        
        tags.forEach(function(tag) {
            $.ajax({
                data: {'tags': tag, 'format': 'json'},
                dataType: 'jsonp',
                jsonpCallback: 'jsonFlickrFeed',
                url: url,
                success: function(response){
                    response.items.map(function(item, idx) {
                        app.createCard(item);
                    });
                    let gallery = originalGallery.cloneNode(true);
                    gallery.removeAttribute('hidden');
                    app.setLoading(false);
                    app.container.appendChild(gallery);
                    app.addAddButton();
                    $(app.gallerySelector).justifiedGallery(app.gallerySettings);
                },
                error: function() {
                    app.showNoPictures
                }
            }); 
        });
        
    };

    app.loadAbout = function(){
        let about = app.about.cloneNode(true);
        about.classList.remove('aboutTemplate');
        about.removeAttribute('hidden');
        app.container.innerHTML = '';
        app.container.appendChild(about);
        if(app.isLoading)
            app.setLoading(false);
    };

    app.loadContact = function() {
        let contact = app.contact.cloneNode(true);
        contact.classList.remove('contactTemplate');
        contact.removeAttribute('hidden');
        app.container.innerHTML = '';
        app.container.appendChild(contact);
        if(app.isLoading)
            app.setLoading(false);
    };

    app.updatePage = () => {
        let hash = window.location.hash;
        if(hash === '')
            app.loadFlickr();
        else {
            hash = hash.substr(1);
            if(hash == 'flickr')
                app.loadFlickr();
            else if(hash == 'about')
                app.loadAbout();
            else if(hash == 'contact')
                app.loadContact();
        }
    };

    app.saveTags = () => {
        app.selectedTags.forEach((tag) => {
            app.db.tags.add({tag: tag})
                .catch((e) => {console.log(e.message)});
        });
    };

    window.addEventListener('hashchange', app.updatePage);
    app.tagDialog.addEventListener('click', function(e) {
        if(!document.querySelector('.dialog').contains(e.target))
            app.toggleTagDialog();
    });
    document.querySelector('#addTag').addEventListener('click', function() {
        let tag = app.tagText.value.trim();
        if(!app.selectedTags) { app.selectedTags = []; }
        if(tag != '' && !app.selectedTags.includes(tag)) {
            app.selectedTags.push(tag);
            app.loadFlickr();
            app.saveTags();
        }
        app.toggleTagDialog();
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function () { console.log('Service Worker Registered'); });
    }

    app.db = new Dexie('tags');
    app.db.version(1).stores({tags: '&tag'});
    app.db.open().then(() => {
        app.db.tags.each(function (tag) {
            app.selectedTags.push(tag.tag);
        }).then(() => { app.updatePage(); });
    });
})();