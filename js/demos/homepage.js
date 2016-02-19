'use strict';

var Shuffle = window.shuffle;

var Demo = function (element) {
  this.element = element;

  // Log out events.
  this.addShuffleEventListeners();

  this.shuffle = new Shuffle(element, {
    itemSelector: '.picture-item',
    sizer: element.querySelector('.shuffle__sizer'),
  });

  this._activeFilters = [];

  this.addFilterButtons();
  this.addSorting();
  this.addSearchFilter();
  this.listenForImageLoads();

  this.mode = 'exclusive';
};

Demo.prototype.toArray = function (arrayLike) {
  return Array.prototype.slice.call(arrayLike);
};

Demo.prototype.toggleMode = function () {
  if (this.mode === 'additive') {
    this.mode = 'exclusive';
  } else {
    this.mode = 'additive';
  }
};

/**
 * Shuffle uses the CustomEvent constructor to dispatch events. You can listen
 * for them like you normally would (with jQuery for example). The extra event
 * data is in the `detail` property.
 */
Demo.prototype.addShuffleEventListeners = function () {
  var handler = function (event) {
    console.log('type: %s', event.type, 'detail:', event.detail);
  };

  this.element.addEventListener(Shuffle.EventType.LOADING, handler, false);
  this.element.addEventListener(Shuffle.EventType.DONE, handler, false);
  this.element.addEventListener(Shuffle.EventType.LAYOUT, handler, false);
  this.element.addEventListener(Shuffle.EventType.REMOVED, handler, false);
};

Demo.prototype.addFilterButtons = function () {
  var options = document.querySelector('.filter-options');

  if (!options) {
    return;
  }

  var filterButtons = this.toArray(
    options.children
  );

  filterButtons.forEach(function (button) {
    button.addEventListener('click', this._handleFilterClick.bind(this), false);
  }, this);
};

Demo.prototype._handleFilterClick = function (evt) {
  var btn = evt.currentTarget;
  var isActive = btn.classList.contains('active');
  var btnGroup = btn.getAttribute('data-group');

  // You don't need _both_ of these modes. This is only for the demo.

  // For this custom 'additive' mode in the demo, clicking on filter buttons
  // doesn't remove any other filters.
  if (this.mode === 'additive') {
    // If this button is already active, remove it from the list of filters.
    if (isActive) {
      this._activeFilters.splice(this._activeFilters.indexOf(btnGroup));
    } else {
      this._activeFilters.push(btnGroup);
    }

    btn.classList.toggle('active');

    // Filter elements
    this.shuffle.filter(this._activeFilters);

  // 'exclusive' mode lets only one filter button be active at a time.
  } else {
    this._removeActiveClassFromChildren(btn.parentNode);

    var filterGroup;
    if (isActive) {
      btn.classList.remove('active');
      filterGroup = Shuffle.ALL_ITEMS;
    } else {
      btn.classList.add('active');
      filterGroup = btnGroup;
    }

    this.shuffle.filter(filterGroup);
  }
};

Demo.prototype._removeActiveClassFromChildren = function (parent) {
  var children = parent.children;
  for (var i = children.length - 1; i >= 0; i--) {
    children[i].classList.remove('active');
  }
};

Demo.prototype.addSorting = function () {
  var menu = document.querySelector('.sort-options');

  if (!menu) {
    return;
  }

  menu.addEventListener('change', this._handleSortChange.bind(this));
};

Demo.prototype._handleSortChange = function (evt) {
  var value = evt.target.value;
  var options = {};

  function sortByDate(element) {
    return element.getAttribute('data-created');
  }

  function sortByTitle(element) {
    return element.getAttribute('data-title').toLowerCase();
  }

  if (value === 'date-created') {
    options = {
      reverse: true,
      by: sortByDate,
    };
  } else if (value === 'title') {
    options = {
      by: sortByTitle,
    };
  }

  this.shuffle.sort(options);
};

// Advanced filtering
Demo.prototype.addSearchFilter = function () {
  var searchInput = document.querySelector('.js-shuffle-search');

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener('keyup', this._handleSearchKeyup.bind(this));
};

Demo.prototype._handleSearchKeyup = function (evt) {
  var searchText = evt.target.value.toLowerCase();

  this.shuffle.filter(function (element, shuffle) {
    // Get the item's groups.
    var groups = JSON.parse(element.getAttribute('data-groups'));

    // Only search elements in the current group
    if (shuffle.group !== 'all' && groups.indexOf(shuffle.group) === -1) {
      return false;
    }

    var title = element.querySelector('.picture-item__title');
    var titleText = title.textContent.toLowerCase().trim();

    return titleText.indexOf(searchText) !== -1;
  });
};

/**
 * Re-layout shuffle when images load. This is only needed below 768 pixels
 * because the .picture-item height is auto and therefore the height of the
 * picture-item is dependent on the image. I recommend using imagesloaded by
 * desandro to determine when all your images have loaded.
 */
Demo.prototype.listenForImageLoads = function () {
  var imgs = this.element.querySelectorAll('img');
  var handler = function () {
    this.shuffle.update();
  }.bind(this);

  for (var i = imgs.length - 1; i >= 0; i--) {
    imgs[i].addEventListener('load', handler, false);
  }
};

document.addEventListener('DOMContentLoaded', function () {
  window.demo = new Demo(document.getElementById('grid'));
});
