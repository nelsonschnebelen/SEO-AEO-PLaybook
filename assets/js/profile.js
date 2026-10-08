/* ==========================================================================
   Your restaurant's details

   Replaces the old 37-question audit. Nobody should be typing facts into a
   form that an assistant could already read off their website, so these come
   from the site check: the analyser hands back an identity block and we keep
   it. The six fields below exist only as a fallback for the owner whose site
   is not live yet, and so anything the check got wrong can be corrected.

   Used by the schema generator and to personalise the AI prompts. Stored in
   the visitor's own browser and nowhere else.
   ========================================================================== */

const PROFILE_KEY = 'dineline-profile-v1';

const Profile = {
  data: {},

  init() {
    this.load();
    const form = document.getElementById('profile-form');
    if (!form) return;

    // restore anything saved on a previous visit
    Object.entries(this.data).forEach(([k, v]) => {
      const el = form.querySelector('[name="' + k + '"]');
      if (el && v) el.value = v;
    });

    const read = e => {
      if (!e.target.name) return;
      this.data[e.target.name] = e.target.value.trim();
      this.save();
      this.changed();
    };
    form.addEventListener('input', read);
    form.addEventListener('change', read);

    const clear = document.getElementById('btn-clear-profile');
    if (clear) clear.addEventListener('click', () => {
      if (!confirm('Clear your restaurant details?')) return;
      this.data = {};
      try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
      form.reset();
      this.changed();
    });

    this.changed();
  },

  load() {
    try { this.data = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; }
    catch (e) { this.data = {}; }
  },

  save() {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(this.data)); } catch (e) {}
  },

  /* Fill in from a completed site check. Anything the owner has already typed
     wins — we are topping up blanks, not overwriting their corrections. */
  applyIdentity(id, finalUrl) {
    if (!id) return;
    const city = [id.locality, id.region].filter(Boolean).join(', ') +
                 (id.postal ? ' ' + id.postal : '');
    const from = {
      name: id.name,
      address: id.address,
      city: city.trim(),
      phone: id.phone,
      url: finalUrl || (id.domain ? 'https://' + id.domain : '')
    };
    let touched = false;
    Object.entries(from).forEach(([k, v]) => {
      if (v && !this.data[k]) { this.data[k] = v; touched = true; }
    });
    if (!touched) return;
    this.save();

    const form = document.getElementById('profile-form');
    if (form) Object.entries(this.data).forEach(([k, v]) => {
      const el = form.querySelector('[name="' + k + '"]');
      if (el && !el.value) el.value = v;
    });
    this.changed();
  },

  changed() {
    if (window.App && App.onProfileChange) App.onProfileChange();
  }
};

window.Profile = Profile;
