
// @license magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt CC0-1.0

const foods = '🍇 🍈 🍉 🍊 🍋 🍌 🍍 🍎 🍏 🍐 🍑 🍒 🍓 🍞 🍦 🍧 🍨 🍩 🍪 🍫 🍬 🍭'.split(' ');

function mkquery(doc) { return (selector) => doc.querySelector(selector); }

const state = {
    eyebrow: 0,
    flip: 1,
    look: true,
    visor: true,
    glasses: true,
    nose: true,
    fun: false
};
const food = {
    available: false,
    x: 0,
    y: 0
};
let feeds = 0;

const moves = {
    on: false,
    start_x: 0,
    start_y: 0,
    prev_x: 0,
    prev_y: 0,
    x: 0,
    y: 0
};
document.addEventListener('DOMContentLoaded', function () {
    const docquery = mkquery(document);
    const iframe = docquery('iframe');
    const buttons_e = docquery('#buttons');
    const state_e = docquery('#state');
    const overlay_e = docquery('#overlay');
    const food_e = docquery('#food');
    const food_offset = 24;
    overlay_e.style.display = 'none';

    // let feeds = parseInt(localStorage.getItem('feeds') || '0');
    // docquery('#feeds').innerText = feeds;
    fetch('/~getfeeds').then(r => r.json())
        .catch(_ => ({ value: parseInt(localStorage.getItem('feeds') || '0') }))
        .then(j => docquery('#feeds').innerText = (feeds = j.value));

    const move_start = function(event) {
        event.preventDefault();
        const touch = event.touches ? event.touches[0] : event;
        //move_stats.x = 0;
        //move_stats.y = 0;
        moves.start_x = moves.prev_x = touch.pageX;
        moves.start_y = moves.prev_y = touch.pageY;
        moves.on = true;
    };
    const move_go = function(event) {
        event.preventDefault();
        if (!moves.on) return;
        const touch = event.touches ? event.touches[0] : event;
        const e = food_e;
        let x = moves.x;
        let y = moves.y;
        moves.x += touch.pageX - moves.prev_x;
        moves.y += touch.pageY - moves.prev_y;
        moves.prev_x = touch.pageX;
        moves.prev_y = touch.pageY;
        e.style.top = food.y + moves.y - food_offset + 'px';
        e.style.left = food.x + moves.x - food_offset + 'px';
    };
    const move_end = function(event) {
        event.preventDefault();
        food.x += moves.x;
        food.y += moves.y;
        // moves.prev_x = 0;
        // moves.prev_y = 0;
        moves.x = 0;
        moves.y = 0;
        moves.on = false;
    };
    overlay_e.addEventListener('mousedown', move_start);
    overlay_e.addEventListener('mousemove', move_go);
    overlay_e.addEventListener('mouseup', move_end);
    overlay_e.addEventListener('touchstart', move_start);
    overlay_e.addEventListener('touchmove', move_go);
    overlay_e.addEventListener('touchend', move_end);

    iframe.addEventListener('load', function () {
        // iframe.contentWindow.scroll(iframe.contentWindow.scrollMaxX / 2, 0);
        const svgdoc = iframe.contentDocument;
        const svgquery = mkquery(svgdoc);
        const mouths = {
            mouth: svgquery('#mouth'),
            tongle: svgquery('#mouth-tongle'),
            open: svgquery('#mouth-open'),
            chew: [svgquery('#mouth-chew-1'), svgquery('#mouth-chew-2'), svgquery('#mouth-chew-3')],
        };
        const eyes = [ svgquery('#look-1'), svgquery('#look-2') ];
        const all_mouth = Object.values(mouths).flat();
        let chew_interval = 0;
        let chew_index = 0;

        function initFun() {
            const margin = Math.max(128, window.innerWidth * 0.2, window.innerHeight * 0.2);
            const e = food_e;
            overlay_e.style.display = 'block';
            e.innerText = foods[Math.random() * foods.length | 0];
            food.x = 150 + (Math.random() * (window.innerWidth - margin) | 0);
            food.y = 150 + (Math.random() * (window.innerHeight - margin) | 0);
            e.style.top = food.y - food_offset + 'px';
            e.style.left = food.x - food_offset + 'px';
            e.classList.remove('disappeared');
            food.available = true;
            look_at(food.x, food.y, true);
        }
        let smooth_on = false;
        function look_at(x, y, smooth) {
            const svg_offset = iframe.getBoundingClientRect();
            const eye_0 = eyes[0].getBoundingClientRect();
            const eye_1 = eyes[1].getBoundingClientRect();
            if (smooth && !smooth_on) {
                eyes.forEach(e => e.classList.add('smooth'));
                smooth_on = true;
            } else if (!smooth && smooth_on) {
                eyes.forEach(e => e.classList.remove('smooth'));
                smooth_on = false;
            }
            eyes[0].style.transform = `translate(${
                Math.max(-1.0, Math.min(1.6, ((x + moves.x) - (svg_offset.x + eye_0.x + eye_0.width / 2)) * 0.004))
            }px, ${
                Math.max(-1.2, Math.min(1.2, ((y + moves.y) - (svg_offset.y + eye_0.y + eye_0.height / 2)) * 0.002))
            }px)`;
            eyes[1].style.transform = `translate(${
                Math.max(-0.4, Math.min(2.0, ((x + moves.x) - (svg_offset.x + eye_1.x + eye_1.width / 2)) * 0.004))
            }px, ${
                Math.max(-1.2, Math.min(1.2, ((y + moves.y) - (svg_offset.y + eye_1.y + eye_1.height / 2)) * 0.002))
            }px)`;
        }
        function look_pointer(event) {
            const touch = event.touches ? event.touches[0] : event;
            if (moves.start_x !== moves.prev_x || moves.start_y !== moves.prev_y) {
                return;
            }
            look_at(moves.start_x, moves.start_y, true);
            setTimeout(() => look_at(food.x + moves.x, food.y + moves.y, true), 800 + 800 * Math.random());
        }

        const food_detect = function(event) {
            event.preventDefault();
            if (!moves.on || !food.available) return;
            const svg_offset = iframe.getBoundingClientRect();
            let mouth = mouths.open.getBoundingClientRect();
            if (mouth.x === 0 && mouth.y === 0 && mouth.x === 0 && mouth.y === 0)
                mouth = mouths.mouth.getBoundingClientRect();
            look_at(food.x, food.y, false);
            mouths.open.style.display = (
                food.x + moves.x < mouth.x + svg_offset.x - food_offset * 4 ||
                food.y + moves.y < mouth.y + svg_offset.y - food_offset * 3 ||
                food.x + moves.x > mouth.x + svg_offset.x + mouth.width + food_offset * 4 ||
                food.y + moves.y > mouth.y + svg_offset.y + mouth.height + food_offset * 3
            ) ? 'none' : 'inline';
            mouths.mouth.style.display = mouths.open.style.display === 'none' ? 'inline': 'none';
        };
        const food_eat = function(event) {
            event.preventDefault();
            if (!food.available) return;
            const svg_offset = iframe.getBoundingClientRect();
            const mouth = mouths.open.getBoundingClientRect();
            mouths.open.style.display = 'none';
            if (
                food.x < mouth.x + svg_offset.x - food_offset ||
                food.y < mouth.y + svg_offset.y - food_offset ||
                food.x > mouth.x + svg_offset.x + mouth.width + food_offset ||
                food.y > mouth.y + svg_offset.y + mouth.height + food_offset
            ) {
                mouths.mouth.style.display = 'inline';
                return;
            }
            chew_index = 0;
            food.available = false;
            mouths.chew[chew_index].style.display = 'inline';
            // food_e.innerText = '';
            food_e.classList.add('disappeared');
            eyes[0].style.transform = eyes[1].style.transform = '';
            svgquery('#eyes').style.display = 'none';
            svgquery('#winks-down').style.display = 'inline';
            chew_interval = setInterval(function() {
                mouths.chew[chew_index].style.display = 'none';
                mouths.chew[(chew_index + 1) % mouths.chew.length].style.display = 'inline';
                chew_index = (chew_index + 1) % mouths.chew.length;
            }, 200);
            // let feeds = parseInt(localStorage.getItem('feeds') || '0');
            fetch('/~feed');
            docquery('#feeds').innerText = ++feeds;
            localStorage.setItem('feeds', feeds);
            setTimeout(function() {
                clearInterval(chew_interval);
                mouths.chew[chew_index].style.display = 'none';
                for (const e of all_mouth)
                    e.style.display = 'none';
                mouths.mouth.style.display = mouths.tongle.style.display = 'inline';
                svgquery('#eyes').style.display = 'none';
                svgquery('#winks-down').style.display = 'none';
                svgquery('#winks').style.display = 'inline';
                eyes.forEach(e => e.style.transform = '');
                setTimeout(function() {
                    mouths.tongle.style.display = 'none';
                    svgquery('#eyes').style.display = 'inline';
                    svgquery('#winks').style.display = 'none';
                    setTimeout(function() {
                        initFun();
                    }, 1000 + Math.random() * 2000);
                }, 2000);
            }, 4 * 3 * 200);
        };
        overlay_e.addEventListener('mousemove', food_detect);
        overlay_e.addEventListener('mouseup', food_eat);
        overlay_e.addEventListener('mouseup', look_pointer);
        overlay_e.addEventListener('touchmove', food_detect);
        overlay_e.addEventListener('touchend', food_eat);
        overlay_e.addEventListener('touchend', look_pointer);

        const showstate = () => state_e.innerText = JSON.stringify(state, void 0, 4);
        const addbutton = function(id, onclick, bold) {
            const button = document.createElement('button');
            if (bold) {
                const b = document.createElement('b');
                b.innerText = id;
                button.appendChild(b);
            } else
                button.innerText = id;
            button.addEventListener('click', onclick);
            button.addEventListener('click', showstate);
            buttons_e.appendChild(button);
        }
        const display = (boolean) => boolean ? 'inline' : 'none';
        const choices = {
            eyebrow: ['#eyebrow', '#eyebrow-alt'],
            mouth: ['#mouth', '#mouth-alt']
        };
        addbutton('look', function () {
            state.look = !state.look;
            svgquery('#look-1').style.transform = state.look ? '' : 'translateX(1.2px)';
            svgquery('#look-2').style.transform = state.look ? '' : 'translateX(1.6px)';
        });
        addbutton('flip', function () {
            state.flip = -state.flip;
            svgquery('#nait').style.transformOrigin = '50% 0';
            svgquery('#nait').style.transform = `scaleX(${state.flip})`;
        });
        for (const item of ['visor', 'glasses', 'nose'])
            addbutton(item, function () {
                state[item] = !state[item];
                svgquery('#' + item).style.display = display(state[item]);
            });
        for (const item of ['eyebrow'])
            addbutton(item, function () {
                for (const choice of choices[item])
                    svgquery(choice).style.display = display(false);
                state[item]++;
                state[item] %= choices[item].length;
                svgquery(choices[item][state[item]]).style.display = display(true);
            });
        /*
        addbutton('save', function () {
            const timestamp = new Date();
            Object.assign(document.createElement('a'), {
                download: `nait-b-${timestamp.getTime()}.svg`,
                href: URL.createObjectURL(new Blob([
                    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n',
                    svgdoc.rootElement.outerHTML
                ]))
            }).click();
        });
        */
        addbutton('feed', function () {
            docquery('aside').remove();
            document.body.style.textAlign = 'center';
            document.body.style.overflow = 'hidden';
            scrollTo(0, 0);
            initFun();
        }, true);
        showstate();
    });
});

// @license-end
