/// <reference lib="deno.unstable" />

import { Status, STATUS_TEXT } from "https://deno.land/std@0.192.0/http/http_status.ts";

const KV_KEY_FEEDS = ['feeds'];

const config = JSON.parse(await Deno.readTextFile('config.json'));

const api_to_mode = {
    '~getfeeds': 'get',
    '~feed': 'hit'
}

Deno.serve({
    hostname: config.host,
    port: config.port
}, async function (request: Request) {
    const url = new URL(request.url);
    if (!['HEAD', 'GET', 'POST'].includes(request.method))
        return new Response(null, {
            status: Status.MethodNotAllowed,
            statusText: STATUS_TEXT[Status.MethodNotAllowed]
        });
    let path = url.pathname.slice(1);
    if (path === '')
        path = 'index.html';
    if (/\.(ts|jsx|tsx|tsm|exe|msi|chm|bat|cmd|php|jsp|aspx?)$/.test(path) || path.includes('/..')) {
        return new Response(null, {
            status: Status.Teapot,
            statusText: STATUS_TEXT[Status.Teapot]
        });
    }
    if (path === 'nait-fun.html')
        return new Response(null, {
            status: Status.MovedPermanently,
            statusText: STATUS_TEXT[Status.MovedPermanently],
            headers: {
                'Location': '/'
            }
        });
    if (path.startsWith('~')) {
        const mode = api_to_mode[path as keyof typeof api_to_mode];
        if (mode === undefined)
            return new Response(STATUS_TEXT[Status.NotImplemented], {
                status: Status.NotImplemented
            });
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
                return new Response(JSON.stringify({
                    'value': feeds
                }), {
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    }
                });
        }
    }
    return fetch(new URL(path, import.meta.url));
});
