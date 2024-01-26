/// <reference lib="deno.unstable" />

const KV_KEY_FEEDS = ['feeds'];

const config = {
    "host": "0.0.0.0",
    "port": 8291
};

const api_to_mode = {
    '~getfeeds': 'get',
    '~feed': 'hit'
}

function extname(path: string) {
    const segs = path.split('.');
    if (segs.length === 1) return '';
    return segs[segs.length - 1];
}

const Mime = {
    'html': 'text/html;charset=utf-8',
    'svg': 'image/svg+xml;charset=utf-8',
    'css': 'text/css;charset=utf-8',
    'js': 'text/javascript;charset=utf-8',
    'json': 'text/json;charset=utf-8',
    'ico': 'image/vnd.microsoft.icon'
};

Deno.serve({
    hostname: config.host,
    port: config.port
}, async function (request: Request) {
    const url = new URL(request.url);
    let path = url.pathname.slice(1);
    if (path === '')
        path = 'index.html';
    if (path === 'nait-fun.html')
        return new Response(null, {
            status: 301,
            headers: { 'Location': '/' }
        });
    if (path.startsWith('~')) {
        const mode = api_to_mode[path as keyof typeof api_to_mode];
        if (mode === undefined)
            return new Response(null, { status: 400 });
        const kv = await Deno.openKv();
        const entry_feeds = await kv.get<number>(KV_KEY_FEEDS);
        let feeds;
        if (entry_feeds.value === null)
            await kv.set(KV_KEY_FEEDS, feeds = 0);
        else
            feeds = entry_feeds.value;
        switch (mode) {
            case 'hit':
                await kv.set(KV_KEY_FEEDS, feeds += 1);
                return new Response(null, {
                    status: Status.NoContent
                });
            case 'get':
                return new Response(JSON.stringify({ 'value': feeds }), {
                    headers: { 'Content-Type': Mime['json'] }
                });
        }
    }
    return fetch(new URL(path, import.meta.url)).then(r => r.body).then(stream => new Response(stream, {
        headers: { 'Content-Type': Mime[extname(path)] || 'text/plain' }
    })).catch(_ => new Response('not found', { status: 404 }));
});
