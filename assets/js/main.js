(function () {
  'use strict';

  var D = window.RC_DATA;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Time, always in London ---------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function parseIso(iso) { var p = iso.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function dowOf(iso) { return parseIso(iso).getUTCDay(); }
  function addDays(iso, n) {
    var dt = parseIso(iso);
    dt.setUTCDate(dt.getUTCDate() + n);
    return isoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  function toMins(hhmm) { var p = hhmm.split(':').map(Number); return p[0] * 60 + p[1]; }

  function fmtTime(mins) {
    if (mins === 0 || mins === 1440) return 'midnight';
    var h = Math.floor(mins / 60), m = mins % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ':' + pad(m) : '') + suffix;
  }
  function fmtDate(iso) {
    var dt = parseIso(iso);
    return DAYS_SHORT[dt.getUTCDay()] + ' ' + dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()];
  }

  // Add ?at=YYYY-MM-DDTHH:MM to the URL to preview the page at another London time.
  function londonNow() {
    var at = new URLSearchParams(window.location.search).get('at');
    if (at && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at)) {
      var t = at.split('T')[1].split(':').map(Number);
      return moment(at.split('T')[0], t[0] * 60 + t[1]);
    }
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    var get = function (type) {
      for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return Number(parts[i].value);
      return 0;
    };
    return moment(isoDate(get('year'), get('month'), get('day')), (get('hour') % 24) * 60 + get('minute'));
  }
  function moment(iso, mins) { return { iso: iso, mins: mins, dow: dowOf(iso) }; }

  /* ---------- Open now / Opens at ---------- */

  function statusAt(now) {
    var h = D.hours[now.dow];
    var open = toMins(h.open), close = toMins(h.close);
    if (now.mins >= open && now.mins < close) {
      var kFrom = toMins(h.kitchen.from);
      var kUntil = h.kitchen.until ? toMins(h.kitchen.until) : close;
      // Only Mon and Sun have a stated kitchen finish, so other days just say when it starts.
      var kitchen;
      if (now.mins < kFrom || !h.kitchen.until) kitchen = 'Kitchen from ' + fmtTime(kFrom);
      else if (now.mins < kUntil) kitchen = 'Kitchen till ' + fmtTime(kUntil);
      else kitchen = 'Kitchen closed';
      return { open: true, main: 'Open now', sub: 'till ' + fmtTime(close), kitchen: kitchen };
    }
    if (now.mins < open) {
      return { open: false, main: 'Opens at ' + fmtTime(open), sub: 'today' };
    }
    var next = D.hours[(now.dow + 1) % 7];
    return { open: false, main: 'Opens at ' + fmtTime(toMins(next.open)), sub: 'tomorrow' };
  }

  function renderStatus(now) {
    var s = statusAt(now);
    $$('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      $('[data-status-main]', el).textContent = s.main;
      $('[data-status-sub]', el).textContent = s.open ? s.sub + ' · ' + s.kitchen : s.sub;
    });
    var line = s.open
      ? 'Open now, ' + s.sub + '. ' + s.kitchen + '.'
      : 'Closed now. ' + s.main + ' ' + s.sub + '.';
    $$('[data-status-line]').forEach(function (el) {
      el.textContent = line;
      el.classList.toggle('is-open', s.open);
    });
  }

  /* ---------- Today, highlighted ---------- */

  function renderToday(now) {
    var mondayOffset = (now.dow + 6) % 7;
    var monday = addDays(now.iso, -mondayOffset);

    $$('[data-day-strip] li').forEach(function (li) {
      var dow = Number(li.dataset.dow);
      var iso = addDays(monday, (dow + 6) % 7);
      if (!$('.d-date', li)) {
        var date = document.createElement('span');
        date.className = 'd-date';
        li.insertBefore(date, li.children[1]);
        li.insertAdjacentHTML('beforeend', '<svg class="d-ring" aria-hidden="true"><use href="#ill-ring"/></svg>');
      }
      $('.d-date', li).textContent = parseIso(iso).getUTCDate();
      var isToday = dow === now.dow;
      li.classList.toggle('is-today', isToday);
      li.classList.toggle('has-event', !!D.week[dow]);
      if (isToday) li.setAttribute('aria-current', 'date'); else li.removeAttribute('aria-current');
    });

    var event = D.week[now.dow];
    $$('[data-poster-day]').forEach(function (p) {
      var d = p.dataset.posterDay;
      p.classList.toggle('is-today', d === 'every' ? !event : Number(d) === now.dow);
    });

    var line = $('[data-today-line]');
    if (line) {
      var day = DAYS[now.dow];
      if (now.dow === 1) line.textContent = "It's Monday: Highpress pizza, £8.50.";
      else if (now.dow === 5) line.textContent = "It's Friday: shots night, from about 9pm.";
      else if (now.dow === 0) line.textContent = "It's Sunday: quiz at 7pm. Book to be sure of a table.";
      else line.textContent = "It's " + day + ': £5.50 cocktail, any time.';
    }

    $$('[data-hours-table] tbody tr').forEach(function (tr) {
      var isToday = Number(tr.dataset.dow) === now.dow;
      tr.classList.toggle('is-today', isToday);
      var th = $('th', tr);
      var tag = $('.today-tag', th);
      if (isToday && !tag) th.insertAdjacentHTML('beforeend', ' <span class="today-tag">Today</span>');
      if (!isToday && tag) tag.remove();
    });
  }

  /* ---------- Menu: tabs and v / ve filter ---------- */

  var menuState = { diet: 'all' };

  function itemHTML(section, it) {
    var diet = it.diet
      ? ' <abbr class="diet-tag" title="' + (it.diet === 've' ? 'Vegan' : 'Vegetarian') + '">' + it.diet + '</abbr>'
      : '';
    var inline = section.id === 'pizza';
    var html = '<li class="menu-item' + (it.num ? ' has-num' : '') + '" data-diet="' + (it.diet || '') + '">';
    if (it.num) html += '<span class="item-num">' + esc(it.num) + '</span>';
    html += '<div class="item-body">';
    if (inline) {
      html += '<p class="item-line"><strong>' + esc(it.name) + '</strong>' + (it.desc ? ', ' + esc(it.desc) : '') + diet + '</p>';
    } else {
      html += '<p class="item-name">' + esc(it.name) + diet + '</p>';
      if (it.desc) html += '<p class="item-desc">' + esc(it.desc) + '</p>';
    }
    if (it.options) {
      html += '<ul class="item-options">' + it.options.map(function (o) {
        return '<li><span>' + esc(o.name) + '</span><span class="item-price">' + esc(o.price) + '</span></li>';
      }).join('') + '</ul>';
    }
    if (it.extra) html += '<p class="item-extra">' + esc(it.extra) + '</p>';
    html += '</div>';
    html += '<span class="item-price">' + (it.price ? esc(it.price) : '') + '</span>';
    return html + '</li>';
  }

  function renderMenu() {
    var tabs = $('[data-menu-tabs]'), panels = $('[data-menu-panels]');
    if (!tabs || !panels) return;
    panels.innerHTML = '';
    D.menu.forEach(function (section, i) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.id = 'tab-' + section.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'panel-' + section.id);
      tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      tab.tabIndex = i === 0 ? 0 : -1;
      tab.innerHTML = '<span>' + esc(section.title) + '</span><span class="tab-count" hidden></span>';
      tabs.appendChild(tab);

      var panel = document.createElement('div');
      panel.id = 'panel-' + section.id;
      panel.className = 'menu-panel';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      panel.hidden = i !== 0;
      panel.innerHTML =
        (section.note ? '<p class="menu-note">' + esc(section.note) + '</p>' : '') +
        '<ul class="menu-list">' + section.items.map(function (it) { return itemHTML(section, it); }).join('') + '</ul>' +
        '<p class="menu-empty" hidden></p>';
      panels.appendChild(panel);
    });

    tabs.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) selectTab(tab);
    });
    tabs.addEventListener('keydown', function (e) {
      var all = $$('[role="tab"]', tabs);
      var i = all.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === 'ArrowRight') next = all[(i + 1) % all.length];
      else if (e.key === 'ArrowLeft') next = all[(i - 1 + all.length) % all.length];
      else if (e.key === 'Home') next = all[0];
      else if (e.key === 'End') next = all[all.length - 1];
      if (next) { e.preventDefault(); selectTab(next); next.focus(); }
    });

    $$('[data-diet-filter] button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        menuState.diet = btn.dataset.diet;
        $$('[data-diet-filter] button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        applyDiet();
      });
    });
  }

  function selectTab(tab) {
    $$('[data-menu-tabs] [role="tab"]').forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function applyDiet() {
    var diet = menuState.diet;
    var label = diet === 've' ? 'vegan' : 'veggie';
    D.menu.forEach(function (section) {
      var panel = document.getElementById('panel-' + section.id);
      var tab = document.getElementById('tab-' + section.id);
      var shown = 0;
      $$('.menu-item', panel).forEach(function (li) {
        var d = li.dataset.diet;
        var show = diet === 'all' || (diet === 'v' ? (d === 'v' || d === 've') : d === 've');
        li.hidden = !show;
        if (show) shown++;
      });
      var empty = $('.menu-empty', panel);
      empty.hidden = shown > 0;
      if (!shown) {
        var others = D.menu.filter(function (s) {
          return s.items.some(function (it) { return diet === 'v' ? (it.diet === 'v' || it.diet === 've') : it.diet === 've'; });
        }).map(function (s) { return s.title; });
        var list = others.length > 1 ? others.slice(0, -1).join(', ') + ' or ' + others[others.length - 1] : others[0];
        empty.textContent = 'Nothing marked ' + label + ' in ' + section.title + '. Try ' + list + '.';
      }
      var count = $('.tab-count', tab);
      count.hidden = diet === 'all';
      count.textContent = shown;
    });
  }

  /* ---------- Sample fixtures, placed on this week ---------- */

  function renderFixtures(now) {
    var list = $('[data-fixtures]');
    if (!list) return;
    // Sample fixtures are keyed by weekday and laid out over the next seven days, starting today.
    var rows = D.fixtures.map(function (f) {
      var offset = (f.dow - now.dow + 7) % 7;
      return { f: f, iso: addDays(now.iso, offset), offset: offset, order: offset * 1440 + toMins(f.time) };
    }).sort(function (a, b) { return a.order - b.order; });

    var html = '', lastIso = null;
    rows.forEach(function (r) {
      if (r.iso !== lastIso) {
        if (lastIso) html += '</ul></li>';
        html += '<li class="fx-day' + (r.offset === 0 ? ' is-today' : '') + '"><p class="fx-date">' + fmtDate(r.iso) +
          (r.offset === 0 ? ' <span class="today-tag">Today</span>' : '') + '</p><ul>';
        lastIso = r.iso;
      }
      var state = '';
      if (now.mins >= r.order + 120) state = 'is-done';
      else if (now.mins >= r.order) state = 'is-live';
      html += '<li class="fx ' + state + '">' +
        '<span class="fx-time">' + fmtTime(toMins(r.f.time)) + '</span>' +
        '<span class="fx-match">' + esc(r.f.home) + ' <span class="fx-v">v</span> ' + esc(r.f.away) + '</span>' +
        '<span class="fx-comp">' + esc(r.f.comp) +
        (state === 'is-live' ? ' · <b>On now</b>' : state === 'is-done' ? ' · Full time' : '') + '</span>' +
        '</li>';
    });
    if (lastIso) html += '</ul></li>';
    list.innerHTML = html;
  }

  /* ---------- Booking (front end only, nothing is sent) ---------- */

  function initBooking(getNow) {
    var form = $('[data-book-form]');
    if (!form) return;
    var nameEl = $('#bk-name'), dateEl = $('#bk-date'), timeEl = $('#bk-time'), sizeEl = $('#bk-size');
    var hintEl = $('[data-form-hint]');
    var confirmEl = $('[data-book-confirm]');

    function purpose() { var c = $('input[name="purpose"]:checked', form); return c ? c.value : 'food'; }

    function slotsFor(iso, p) {
      var now = getNow();
      var dow = dowOf(iso), h = D.hours[dow];
      var open = toMins(h.open), last = toMins(h.close) - 60;
      var from = open, until = last;
      if (p === 'quiz') { from = until = 19 * 60; if (dow !== 0) return []; }
      if (p === 'food') {
        from = Math.max(open, toMins(h.kitchen.from));
        until = h.kitchen.until ? Math.min(last, toMins(h.kitchen.until) - 30) : last;
      }
      var out = [];
      for (var m = from; m <= until; m += 30) {
        if (iso === now.iso && m <= now.mins + 15) continue;
        out.push(m);
      }
      return out;
    }

    function nextDow(dow) {
      var now = getNow();
      var offset = (dow - now.dow + 7) % 7;
      var iso = addDays(now.iso, offset);
      if (offset === 0 && !slotsFor(iso, dow === 0 ? 'quiz' : 'food').length) iso = addDays(iso, 7);
      return iso;
    }

    function refresh() {
      var now = getNow();
      dateEl.min = now.iso;
      dateEl.max = addDays(now.iso, 90);
      var iso = dateEl.value, p = purpose();
      var prev = timeEl.value;
      timeEl.innerHTML = '';
      var slots = iso && iso >= now.iso ? slotsFor(iso, p) : [];
      if (!slots.length) {
        timeEl.innerHTML = '<option value="">No times</option>';
      } else {
        timeEl.innerHTML = slots.map(function (m) {
          var label = fmtTime(m) + (p === 'quiz' ? ', quiz starts' : '');
          return '<option value="' + m + '">' + label + '</option>';
        }).join('');
        var keep = slots.indexOf(Number(prev)) > -1 ? Number(prev) : (slots.indexOf(19 * 60) > -1 ? 19 * 60 : slots[0]);
        timeEl.value = String(keep);
      }
      timeEl.disabled = !slots.length;

      var hint = '';
      if (iso) {
        var dow = dowOf(iso), h = D.hours[dow];
        if (p === 'quiz' && dow !== 0) {
          var sun = nextDow(0);
          hint = 'The quiz is Sundays at 7pm. <button type="button" class="link-btn" data-make-sunday="' + sun + '">Make it ' + fmtDate(sun) + '</button>';
        } else if (p === 'quiz') {
          hint = 'Quiz starts at 7pm. Book to be sure of a table.';
        } else if (!slots.length && iso === now.iso) {
          hint = "That's us done for today. Try tomorrow?";
        } else if (p === 'food') {
          var k = h.kitchen, kFrom = toMins(k.from);
          hint = 'Kitchen ' + (k.until ? fmtTime(kFrom) + '–' + fmtTime(toMins(k.until)) : 'from ' + fmtTime(kFrom)) + ' on ' + DAYS[dow] + 's.';
          if (kFrom > toMins(h.open) + 60) hint += ' Just drinks? Pick Drinks for earlier times.';
        } else {
          hint = 'Open ' + fmtTime(toMins(h.open)) + ' till ' + fmtTime(toMins(h.close)) + ' on ' + DAYS[dow] + 's.';
        }
      }
      hintEl.innerHTML = hint;
    }

    function setError(field, msg) {
      var el = $('[data-error-for="' + field + '"]', form);
      var input = form.elements[field];
      if (el) el.textContent = msg || '';
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      }
    }

    function validate() {
      var now = getNow();
      var ok = true, first = null;
      var errs = { name: '', date: '', time: '' };
      if (!nameEl.value.trim()) errs.name = 'We need a name for the table.';
      if (!dateEl.value) errs.date = 'Pick a date.';
      else if (dateEl.value < now.iso) errs.date = 'Pick a date from today on.';
      else if (purpose() === 'quiz' && dowOf(dateEl.value) !== 0) errs.date = 'The quiz is Sundays only.';
      if (!errs.date && !timeEl.value) errs.time = 'No times left that day. Try another date.';
      Object.keys(errs).forEach(function (k) {
        setError(k, errs[k]);
        if (errs[k]) { ok = false; if (!first) first = form.elements[k]; }
      });
      if (first) first.focus();
      return ok;
    }

    function clampSize(v) {
      var n = parseInt(v, 10);
      if (isNaN(n)) n = 2;
      return Math.min(20, Math.max(1, n));
    }

    form.addEventListener('change', function (e) {
      if (e.target.name === 'purpose' || e.target === dateEl) refresh();
      if (e.target === sizeEl) sizeEl.value = clampSize(sizeEl.value);
      if (e.target.name && e.target.getAttribute('aria-invalid')) setError(e.target.name, '');
    });
    nameEl.addEventListener('input', function () { if (nameEl.value.trim()) setError('name', ''); });

    $$('[data-step]', form).forEach(function (b) {
      b.addEventListener('click', function () { sizeEl.value = clampSize(Number(sizeEl.value) + Number(b.dataset.step)); });
    });

    hintEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-make-sunday]');
      if (!b) return;
      dateEl.value = b.dataset.makeSunday;
      setError('date', '');
      refresh();
      timeEl.focus();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var p = purpose();
      var first = nameEl.value.trim().split(/\s+/)[0];
      var size = clampSize(sizeEl.value);
      $('[data-confirm-title]', confirmEl).textContent = 'Sorted, ' + first + '.';
      var rows = [
        ['When', fmtDate(dateEl.value) + ', ' + fmtTime(Number(timeEl.value))],
        ['Table for', size + (size === 1 ? ' (just you)' : '')],
        ['For', { food: 'Food', drinks: 'Drinks', quiz: 'The quiz' }[p]],
        ['Name', nameEl.value.trim()]
      ];
      $('[data-confirm-details]', confirmEl).innerHTML = rows.map(function (r) {
        return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>';
      }).join('');
      form.hidden = true;
      confirmEl.hidden = false;
      confirmEl.focus();
    });

    $('[data-book-again]', confirmEl).addEventListener('click', function () {
      form.reset();
      Object.keys({ name: 1, date: 1, time: 1 }).forEach(function (k) { setError(k, ''); });
      setDefaultDate();
      refresh();
      confirmEl.hidden = true;
      form.hidden = false;
      nameEl.focus();
    });

    // Buttons on the week posters pre-fill the form.
    $$('[data-book-preset]').forEach(function (a) {
      a.addEventListener('click', function () {
        var p = a.dataset.bookPreset;
        var radio = $('input[name="purpose"][value="' + p + '"]', form);
        if (radio) radio.checked = true;
        dateEl.value = nextDow(Number(a.dataset.bookDow));
        confirmEl.hidden = true;
        form.hidden = false;
        refresh();
        window.setTimeout(function () { nameEl.focus({ preventScroll: true }); }, reduceMotion ? 0 : 600);
      });
    });

    function setDefaultDate() {
      var now = getNow();
      dateEl.value = slotsFor(now.iso, 'drinks').length ? now.iso : addDays(now.iso, 1);
    }

    setDefaultDate();
    refresh();
  }

  /* ---------- Festoon lights over the terrace ---------- */

  function renderFestoon() {
    var host = $('[data-festoon]');
    if (!host) return;
    var W = 1200, top = 6, sag = 34, swags = 3, perSwag = 9;
    var cords = '', bulbs = '';
    for (var s = 0; s < swags; s++) {
      var x0 = (W / swags) * s, x2 = (W / swags) * (s + 1), cx = (x0 + x2) / 2, cy = top + sag * 2;
      cords += 'M' + x0 + ' ' + top + 'Q' + cx + ' ' + cy + ' ' + x2 + ' ' + top;
      for (var i = 1; i < perSwag; i++) {
        var t = i / perSwag;
        var x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2;
        var y = (1 - t) * (1 - t) * top + 2 * (1 - t) * t * cy + t * t * top;
        bulbs += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' +
          '<circle class="glow" cy="13" r="11"/><path class="cap" d="M-2.5 0h5v5h-5z"/>' +
          '<ellipse class="bulb" cy="11" rx="4.2" ry="6"/></g>';
      }
    }
    host.innerHTML = '<svg viewBox="0 0 ' + W + ' 90" preserveAspectRatio="xMidYMin slice">' +
      '<path class="cord" d="' + cords + '"/>' + bulbs + '</svg>';
  }

  /* ---------- Header, nav, reveal ---------- */

  function initHeader() {
    var header = $('[data-header]');
    var toggle = $('[data-nav-toggle]');
    var nav = $('[data-nav]');
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    }
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 960px)').addEventListener('change', function () { setOpen(false); });
  }

  function initReveal() {
    var items = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Go ---------- */

  function tick() {
    var now = londonNow();
    renderStatus(now);
    renderToday(now);
    renderFixtures(now);
  }

  renderMenu();
  applyDiet();
  renderFestoon();
  initHeader();
  initReveal();
  tick();
  initBooking(londonNow);
  window.setInterval(tick, 30000);
})();
