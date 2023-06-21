
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.192.0/http/file_server.ts";
import { Status, STATUS_TEXT } from "https://deno.land/std@0.192.0/http/http_status.ts";

const config = JSON.parse(await Deno.readTextFile('config.json'));
if (Deno.env.has('CONFIG')) {
    console.log('Starting with configuration from environment');
    [config.countapi, config.namespace, config.key] = Deno.env.get('CONFIG')!.split(';');
}

let last_known_value = 0;

const api_to_mode: Record<string, string> = {
    '/~getfeeds': 'get',
    '/~feed': 'hit'
}

serve(async function (request: Request) {
    const url = new URL(request.url);
    if (!['HEAD', 'GET', 'POST'].includes(request.method))
        return new Response(null, {
            status: Status.MethodNotAllowed,
            statusText: STATUS_TEXT[Status.MethodNotAllowed]
        });
    const pathname = url.pathname;
    if (/\.(ts|jsx|tsx|tsm|exe|msi|chm|bat|cmd|php|jsp|aspx?)$/.test(pathname) || pathname.includes('/..')) {
        return new Response(null, {
            status: Status.Teapot,
            statusText: STATUS_TEXT[Status.Teapot]
        });
    }
    if (pathname === '/nait-fun.html')
        return new Response(null, {
            status: Status.MovedPermanently,
            statusText: STATUS_TEXT[Status.MovedPermanently],
            headers: {
                'Location': '/'
            }
        });
    if (pathname.startsWith('/~')) {
        const mode = api_to_mode[pathname];
        if (mode === undefined)
            return new Response(STATUS_TEXT[Status.NotImplemented], {
                status: Status.NotImplemented
            });
        const response = config.countapi
            ? await fetch(config.countapi + mode + '/' + config.namespace + '/' + config.key)
            : null;
        if (response !== null && response.ok) {
            last_known_value = (await response.json()).value;
        } else {
            if (mode === 'hit') ++last_known_value;
        }
        return new Response(JSON.stringify({
            'value': last_known_value
        }));
    }
    return serveDir(request);
}, {
    hostname: config.host,
    port: config.port
});
