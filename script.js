(() => {
    'use strict';
    const K = { tx: 'spendly.tx', rem: 'spendly.rem', bud: 'spendly.bud' };
    const EXP = ['Shopping', 'Education', 'Food', 'Bill & Utility', 'Transport', 'Health', 'Entertainment', 'Credit Card', 'Other'], INC = ['Salary', 'Allowance', 'Gift', 'Other'];
    const ICON = { Shopping: '🛒', Education: '🎓', Food: '🍴', 'Bill & Utility': '🧾', Transport: '🚌', Health: '💊', Entertainment: '🎬', 'Credit Card': '💳', Other: '•••', Salary: '💰', Allowance: '👛', Gift: '🎁' };
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], MAX = 1e7;
    const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    const peso = n => (n < 0 ? '-' : '') + '₱' + Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10), today = () => iso(new Date()), ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); }, thisYM = () => today().slice(0, 7);
    const D = (s, o) => new Date(s + 'T00:00:00').toLocaleDateString('en-PH', o), shortD = s => D(s, { day: 'numeric', month: 'short' }), longD = s => D(s, { day: 'numeric', month: 'short', year: 'numeric' });
    const monthName = ym => new Date(ym + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const shift = (ym, n) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5) - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
    const t12 = t => { const [h, m] = t.split(':').map(Number); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM'); };
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7), sum = l => l.reduce((a, t) => a + t.amount, 0), isE = t => t.type === 'expense';
    const byDate = (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id), r2 = v => Math.round(Number(v) * 100) / 100;
    let warned = false;
    const get = (k, f) => { try {
        const v = JSON.parse(localStorage.getItem(k));
        return v === null ? f : v;
    }
    catch (e) {
        return f;
    } };
    const put = (k, v) => { try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
    }
    catch (e) {
        if (!warned) {
            warned = true;
            toast('Browser storage is unavailable, so changes will be lost when you close this page.', 'warn');
        }
        return false;
    } };
    function toast(m, k = '') { const e = document.createElement('div'); e.className = 'toast ' + k; e.setAttribute('role', 'status'); e.textContent = m; $('#toasts').appendChild(e); setTimeout(() => e.remove(), 3400); }
    const ask = m => new Promise(r => { const d = $('#dlg'); $('#dmsg').textContent = m; d.returnValue = ''; d.onclose = () => r(d.returnValue === 'ok'); d.showModal(); });
    function seed() {
        const t = (type, category, desc, amount, d) => ({ id: uid(), type, date: ago(d), category, desc, amount, images: [null, null] });
        return { tx: [t('income', 'Salary', 'Part-time pay', 30000, 12), t('expense', 'Shopping', 'Clothes and watch', 1101, 0), t('expense', 'Shopping', 'Laptop bag', 1800, 2), t('expense', 'Education', 'Books and stationery', 500, 3), t('expense', 'Food', 'Groceries', 1102, 4), t('expense', 'Bill & Utility', 'Electric bill', 2400, 6), t('expense', 'Transport', 'Monthly pass', 800, 7), t('expense', 'Health', 'Vitamins', 480, 9), t('expense', 'Entertainment', 'Movie night', 350, 11), t('income', 'Allowance', 'Weekly allowance', 2500, 20), t('expense', 'Food', 'Dining out', 650, 24), t('expense', 'Shopping', 'Study table', 3200, 38), t('income', 'Salary', 'Part-time pay', 12000, 42), t('expense', 'Bill & Utility', 'Water bill', 900, 45), t('expense', 'Education', 'School fee', 4500, 60)],
            rem: [{ id: uid(), date: ago(-1), category: 'Bill & Utility', desc: 'Water tax', time: '09:30' }, { id: uid(), date: ago(-3), category: 'Education', desc: 'School fee', time: '05:30' }, { id: uid(), date: ago(-6), category: 'Credit Card', desc: 'Debt payment', time: '17:00' }],
            bud: { Shopping: 5000, Food: 3000, 'Bill & Utility': 4000, Transport: 1500 } };
    }
    let tx = get(K.tx, null), rem, bud;
    if (!Array.isArray(tx)) {
        const s = seed();
        tx = s.tx;
        rem = s.rem;
        bud = s.bud;
        put(K.tx, tx);
        put(K.rem, rem);
        put(K.bud, bud);
    }
    else {
        rem = get(K.rem, []);
        bud = get(K.bud, {});
        if (!Array.isArray(rem))
            rem = [];
        if (!bud || typeof bud !== 'object' || Array.isArray(bud))
            bud = {};
    }
    /* shared UI helpers */
    function err(id, msg) { const el = $('#' + id), e = $('#e-' + id); if (el)
        el.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (e) {
        e.textContent = msg || '';
        if (el && msg)
            el.setAttribute('aria-describedby', 'e-' + id);
    } return !msg; }
    const amtMsg = v => v === '' ? 'Enter an amount.' : isNaN(v) ? 'Amount must be a number.' : Number(v) <= 0 ? 'Amount must be greater than 0.' : Number(v) > MAX ? 'Amount is too large.' : '';
    const opts = l => '<option value="">Choose a category</option>' + l.map(c => `<option>${esc(c)}</option>`).join('');
    function chart(el, ym, list, pick) {
        const y = ym.slice(0, 4), sel = +ym.slice(5) - 1, v = MON.map((_, i) => sum(list.filter(t => t.date.startsWith(y + '-' + String(i + 1).padStart(2, '0'))))), mx = Math.max(...v, 1);
        el.innerHTML = v.map((x, i) => `<button type="button" class="bar${i === sel ? ' on' : ''}" data-i="${i}" aria-pressed="${i === sel}" aria-label="${MON[i]} ${y}: ${peso(x)}"><i style="height:${Math.max(x / mx * 105, 6)}px"></i><span>${MON[i]}</span></button>`).join('');
        el.onclick = e => { const b = e.target.closest('.bar'); if (b)
            pick(y + '-' + String(+b.dataset.i + 1).padStart(2, '0')); };
    }
    const dayL = d => d === today() ? 'Today' : d === ago(1) ? 'Yesterday' : shortD(d);
    function grouped(list, empty) {
        if (!list.length)
            return `<p class="empty">${empty}</p>`;
        let o = '', last = '';
        [...list].sort(byDate).forEach(t => {
            if (t.date !== last) {
                last = t.date;
                o += `<h3 class="day">${dayL(t.date)}</h3>`;
            }
            o += `<button type="button" class="tx" data-edit="${t.id}" aria-label="Edit ${esc(t.category)} ${peso(t.amount)}"><span class="ic" aria-hidden="true">${ICON[t.category] || '•••'}</span><span class="g"><strong>${esc(t.category)}</strong><small>${esc(t.desc || 'No description')}</small></span><b class="${t.type}">${t.type === 'income' ? '+' : ''}${peso(t.amount)}</b></button>`;
        });
        return o;
    }
    function editFrom(e) { const b = e.target.closest('[data-edit]'); if (b) {
        editId = b.dataset.edit;
        location.hash = '#add';
    } }
    /* routing */
    let editId = null, hYM = thisYM(), tab = 'today', selR = null, sCat = 'All', sYM = thisYM(), imgs = [null, null], remEdit = null;
    const V = ['home', 'add', 'receipts', 'statistics', 'reminders'], TT = { home: 'Home', add: 'Add Transaction', receipts: 'Receipts', statistics: 'Statistics', reminders: 'Reminders' };
    function route() {
        let v = location.hash.slice(1);
        if (!V.includes(v))
            v = 'home';
        if (v !== 'add' && editId)
            editId = null;
        $$('.view').forEach(e => e.hidden = e.id !== 'v-' + v);
        $$('.nav a').forEach(a => { const on = a.dataset.v === v; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
        const due = rem.filter(r => r.date <= today()).length;
        $('#dueN').hidden = !due;
        $('#dueN').textContent = due;
        $('#ttl').textContent = v === 'add' && editId ? 'Edit Transaction' : TT[v];
        document.title = TT[v] + ' | Spendly';
        ({ home: rHome, add: rAdd, receipts: rRec, statistics: rStat, reminders: rRem })[v]();
        window.scrollTo(0, 0);
    }
    $('#newBtn').addEventListener('click', () => { editId = null; });
    window.addEventListener('hashchange', route);
    /* home */
    function rHome() {
        const m = tx.filter(t => t.date.startsWith(hYM)), e = sum(m.filter(isE)), i = sum(m.filter(t => !isE(t)));
        $('#bal').textContent = peso(sum(tx.filter(t => !isE(t))) - sum(tx.filter(isE)));
        $('#mT').textContent = monthName(hYM);
        $('#mE').textContent = peso(e);
        $('#mI').textContent = peso(i);
        $('#mB').textContent = peso(i - e);
        chart($('#ch1'), hYM, tx.filter(isE), v => { hYM = v; rHome(); });
        $$('#tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tab));
        const l = tab === 'today' ? tx.filter(t => t.date === today()) : tab === 'weekly' ? tx.filter(t => t.date >= ago(6) && t.date <= today()) : m;
        $('#hT').textContent = tab === 'today' ? 'Today' : tab === 'weekly' ? 'Last 7 days' : monthName(hYM);
        $('#hList').innerHTML = grouped(l, tab === 'today' ? 'No transactions today. Use "Add transaction" to record one.' : 'No transactions in this period.');
    }
    $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) {
        tab = b.dataset.t;
        rHome();
    } });
    $('#hList').addEventListener('click', editFrom);
    /* add / edit */
    const fill = () => { const c = $('#a-cat'), k = c.value; c.innerHTML = opts($('#tI').checked ? INC : EXP); c.value = [...c.options].some(o => o.value === k) ? k : ''; };
    const paint = i => { $('#d' + i).innerHTML = imgs[i] ? `<img src="${imgs[i]}" alt="Receipt image ${i + 1} preview">` : '<span aria-hidden="true">⊕</span>Add image'; $('#x' + i).hidden = !imgs[i]; };
    function rAdd() {
        const t = editId && tx.find(x => x.id === editId);
        if (editId && !t)
            editId = null;
        imgs = t ? [...t.images] : [null, null];
        $('#aH').textContent = t ? 'Edit transaction' : 'Add new transaction';
        $('#tE').checked = !t || t.type === 'expense';
        $('#tI').checked = !!t && t.type === 'income';
        fill();
        $('#a-cat').value = t ? t.category : '';
        $('#a-date').max = today();
        $('#a-date').value = t ? t.date : today();
        $('#a-desc').value = t ? t.desc : '';
        $('#a-amt').value = t ? t.amount : '';
        ['a-date', 'a-cat', 'a-desc', 'a-amt', 'img'].forEach(x => err(x, ''));
        paint(0);
        paint(1);
        $('#aSave').disabled = false;
    }
    $$('[name=atype]').forEach(r => r.addEventListener('change', fill));
    const shrink = f => new Promise((ok, no) => { const r = new FileReader(); r.onerror = no; r.onload = () => { const im = new Image(); im.onerror = no; im.onload = () => { const s = Math.min(1, 700 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .7)); }; im.src = r.result; }; r.readAsDataURL(f); });
    [0, 1].forEach(i => {
        $('#f' + i).addEventListener('change', async (e) => {
            const f = e.target.files[0];
            if (!f)
                return;
            if (!f.type.startsWith('image/'))
                err('img', 'Choose an image file (JPG, PNG or WEBP).');
            else if (f.size > 5242880)
                err('img', 'Image must be 5 MB or smaller.');
            else {
                try {
                    imgs[i] = await shrink(f);
                    err('img', '');
                    paint(i);
                }
                catch (x) {
                    err('img', 'That image could not be read. Try another file.');
                }
            }
            e.target.value = '';
        });
        $('#x' + i).addEventListener('click', () => { imgs[i] = null; paint(i); });
    });
    $('#aCancel').addEventListener('click', () => { editId = null; location.hash = '#home'; });
    $('#aF').addEventListener('submit', e => {
        e.preventDefault();
        const d = { type: $('#tI').checked ? 'income' : 'expense', date: $('#a-date').value, category: $('#a-cat').value, desc: $('#a-desc').value.trim(), amount: $('#a-amt').value.trim() };
        const oks = [err('a-date', !d.date ? 'Pick a date.' : d.date > today() ? 'Date cannot be in the future.' : ''), err('a-cat', d.category ? '' : 'Choose a category.'), err('a-desc', d.desc.length > 80 ? 'Keep the description under 80 characters.' : ''), err('a-amt', amtMsg(d.amount))];
        if (!oks.every(Boolean)) {
            const bad = ['a-date', 'a-cat', 'a-desc', 'a-amt'].find((x, i) => !oks[i]);
            $('#' + bad).focus();
            toast('Please fix the highlighted fields.', 'bad');
            return;
        }
        const rec = { ...d, amount: r2(d.amount), images: imgs };
        tx = editId ? tx.map(t => t.id === editId ? { ...t, ...rec } : t) : [...tx, { id: uid(), ...rec }];
        put(K.tx, tx);
        toast(editId ? 'Transaction updated.' : 'Transaction saved.');
        editId = null;
        location.hash = '#home';
    });
    /* receipts */
    function rRec() {
        const q = $('#q').value.trim().toLowerCase(), l = [...tx].sort(byDate).filter(t => !q || (t.category + ' ' + t.desc + ' ' + t.date + ' ' + longD(t.date)).toLowerCase().includes(q));
        if (!l.some(t => t.id === selR))
            selR = l[0] ? l[0].id : null;
        $('#cnt').textContent = `${l.length} of ${tx.length} records`;
        $('#rcL').innerHTML = l.length ? l.map(t => `<button type="button" class="rc${t.id === selR ? ' on' : ''}" data-id="${t.id}" aria-pressed="${t.id === selR}"><span class="th">${t.images[0] ? `<img src="${t.images[0]}" alt="">` : '<span aria-hidden="true">⊕</span>'}</span><span class="g"><strong>${esc(t.category)}</strong><small>${longD(t.date)} · ${esc(t.desc || 'No description')}</small></span><b class="${t.type}">${peso(t.amount)}</b></button>`).join('') : '<p class="empty">No receipts match your search.</p>';
        const t = tx.find(x => x.id === selR);
        $('#det').innerHTML = t ? `<div class="row sb" style="align-items:flex-start"><div><h2>${esc(t.category)}</h2><p class="mut">${longD(t.date)}<br>${esc(t.desc || 'No description')}</p></div><strong style="font-size:1.4rem" class="${t.type}">${peso(t.amount)}</strong></div>
<div class="two" style="margin-bottom:1.4rem">${[0, 1].map(i => t.images[i] ? `<img class="rimg" src="${t.images[i]}" alt="Receipt image ${i + 1} for ${esc(t.category)}">` : '<div class="rno">No image</div>').join('')}</div>
<div class="two"><button type="button" class="btn" id="rcEdit">Edit</button><button type="button" class="btn out" id="rcDel">Delete</button></div>` : '<p class="empty">Select a receipt to see its details.</p>';
    }
    $('#q').addEventListener('input', rRec);
    $('#rcL').addEventListener('click', e => { const b = e.target.closest('.rc'); if (b) {
        selR = b.dataset.id;
        rRec();
    } });
    $('#det').addEventListener('click', async (e) => {
        if (e.target.id === 'rcEdit') {
            editId = selR;
            location.hash = '#add';
        }
        if (e.target.id === 'rcDel' && await ask('Delete this record? This cannot be undone.')) {
            tx = tx.filter(t => t.id !== selR);
            put(K.tx, tx);
            selR = null;
            rRec();
            toast('Record deleted.');
        }
    });
    /* reminders */
    const rReset = () => { remEdit = null; $('#r-cat').value = 'Bill & Utility'; $('#r-date').value = today(); $('#r-time').value = '09:00'; $('#r-desc').value = ''; $('#rSave').textContent = 'Save'; $('#rH').textContent = 'Add reminder'; $('#rCancel').hidden = true; ['r-date', 'r-cat', 'r-desc', 'r-time'].forEach(x => err(x, '')); };
    function rRem() { $('#r-cat').innerHTML = opts(EXP); rReset(); drawRem(); }
    function drawRem() {
        const l = [...rem].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        $('#rL').innerHTML = l.length ? l.map(r => `<li class="rem"><span class="ck" aria-hidden="true">⏰</span><span class="g"><strong>${esc(r.category)}</strong>${r.date < today() ? '<span class="pill">Overdue</span>' : r.date === today() ? '<span class="pill">Today</span>' : ''}<small>${longD(r.date)} at ${t12(r.time)}${r.desc ? ' · ' + esc(r.desc) : ''}</small></span><span class="acts"><button type="button" class="btn out sm" data-e="${r.id}" aria-label="Edit reminder ${esc(r.category)}">Edit</button><button type="button" class="btn sm" data-d="${r.id}" aria-label="Delete reminder ${esc(r.category)}">Delete</button></span></li>`).join('') : '<li class="empty">No reminders yet. Add one using the form.</li>';
        const due = rem.filter(r => r.date <= today()).length;
        $('#dueN').hidden = !due;
        $('#dueN').textContent = due;
    }
    $('#rF').addEventListener('submit', e => {
        e.preventDefault();
        const d = { date: $('#r-date').value, category: $('#r-cat').value, desc: $('#r-desc').value.trim(), time: $('#r-time').value };
        const oks = [err('r-date', d.date ? '' : 'Pick a date.'), err('r-cat', d.category ? '' : 'Choose a category.'), err('r-desc', d.desc.length > 80 ? 'Keep the description under 80 characters.' : ''), err('r-time', d.time ? '' : 'Pick a time.')];
        if (!oks.every(Boolean)) {
            $('#' + ['r-date', 'r-cat', 'r-desc', 'r-time'].find((x, i) => !oks[i])).focus();
            toast('Please fix the highlighted fields.', 'bad');
            return;
        }
        rem = remEdit ? rem.map(r => r.id === remEdit ? { ...r, ...d } : r) : [...rem, { id: uid(), ...d }];
        put(K.rem, rem);
        toast(remEdit ? 'Reminder updated.' : 'Reminder saved.');
        rReset();
        drawRem();
    });
    $('#rCancel').addEventListener('click', rReset);
    $('#rL').addEventListener('click', async (e) => {
        const ed = e.target.closest('[data-e]'), de = e.target.closest('[data-d]');
        if (ed) {
            const r = rem.find(x => x.id === ed.dataset.e);
            if (!r)
                return;
            remEdit = r.id;
            $('#r-date').value = r.date;
            $('#r-cat').value = r.category;
            $('#r-desc').value = r.desc;
            $('#r-time').value = r.time;
            $('#rSave').textContent = 'Save changes';
            $('#rH').textContent = 'Edit reminder';
            $('#rCancel').hidden = false;
            $('#r-desc').focus();
        }
        if (de && await ask('Delete this reminder?')) {
            rem = rem.filter(x => x.id !== de.dataset.d);
            put(K.rem, rem);
            if (remEdit === de.dataset.d)
                rReset();
            drawRem();
            toast('Reminder deleted.');
        }
    });
    /* statistics */
    $('#chips').innerHTML = ['All', ...EXP].map(c => `<button type="button" class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join('');
    $('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) {
        sCat = b.dataset.c;
        err('b-in', '');
        rStat();
    } });
    $('#prev').addEventListener('click', () => { sYM = shift(sYM, -1); rStat(); });
    $('#next').addEventListener('click', () => { if (sYM < thisYM()) {
        sYM = shift(sYM, 1);
        rStat();
    } });
    function rStat() {
        const l = tx.filter(t => isE(t) && (sCat === 'All' || t.category === sCat)), m = l.filter(t => t.date.startsWith(sYM)), sp = sum(m), b = sCat === 'All' ? Object.values(bud).reduce((a, v) => a + Number(v), 0) : Number(bud[sCat]) || 0;
        $$('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.c === sCat));
        $('#sT').textContent = monthName(sYM) + (sCat === 'All' ? '' : ` (${sCat})`);
        $('#sE').textContent = peso(sp);
        $('#sU').textContent = b ? peso(b) : 'Not set';
        $('#sB').textContent = b ? peso(b - sp) : '-';
        $('#next').disabled = sYM >= thisYM();
        chart($('#ch2'), sYM, l, v => { sYM = v; rStat(); });
        $('#bC').textContent = sCat === 'All' ? 'a category' : sCat;
        $('#b-in').value = sCat === 'All' ? '' : (bud[sCat] || '');
        [$('#b-in'), $('#bSave'), $('#bClr')].forEach(x => x.disabled = sCat === 'All');
        $('#bH').textContent = sCat === 'All' ? 'Select a category above to set its budget. "All" adds up every category budget.' : '';
        $('#sH').textContent = sCat === 'All' ? 'All spending' : sCat;
        $('#sList').innerHTML = grouped(m, 'No spending recorded for this month.');
    }
    $('#sList').addEventListener('click', editFrom);
    $('#bF').addEventListener('submit', e => {
        e.preventDefault();
        if (sCat === 'All')
            return;
        if (!err('b-in', amtMsg($('#b-in').value.trim()))) {
            $('#b-in').focus();
            return;
        }
        bud = { ...bud, [sCat]: r2($('#b-in').value) };
        put(K.bud, bud);
        toast('Budget saved.');
        rStat();
    });
    $('#bClr').addEventListener('click', () => { if (sCat === 'All')
        return; bud = { ...bud }; delete bud[sCat]; put(K.bud, bud); err('b-in', ''); toast('Budget removed.'); rStat(); });
    /* settings menu */
    const gb = $('#gearBtn'), menu = $('#menu'), closeM = () => { menu.hidden = true; gb.setAttribute('aria-expanded', 'false'); };
    gb.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; gb.setAttribute('aria-expanded', String(!menu.hidden)); });
    document.addEventListener('click', e => { if (!menu.contains(e.target))
        closeM(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape')
        closeM(); });
    $('#sampleBtn').addEventListener('click', async () => { closeM(); if (await ask('Replace all data with the sample data?')) {
        const s = seed();
        tx = s.tx;
        rem = s.rem;
        bud = s.bud;
        put(K.tx, tx);
        put(K.rem, rem);
        put(K.bud, bud);
        route();
        toast('Sample data loaded.');
    } });
    $('#clearBtn').addEventListener('click', async () => { closeM(); if (await ask('Delete ALL transactions, reminders and budgets? This cannot be undone.')) {
        tx = [];
        rem = [];
        bud = {};
        put(K.tx, tx);
        put(K.rem, rem);
        put(K.bud, bud);
        route();
        toast('All data deleted.');
    } });
    route();
    {
        const due = rem.filter(r => r.date <= today()).length;
        if (due)
            toast(`You have ${due} reminder${due > 1 ? 's' : ''} due.`, 'warn');
    }
})();
