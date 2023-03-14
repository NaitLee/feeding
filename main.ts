
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.177.0/http/file_server.ts";
import { Status, STATUS_TEXT } from "https://deno.land/std@0.177.0/http/http_status.ts";

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

serve(async function(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === '/')
        return new Response(null, {
            status: Status.Found,
            headers: {
                'Location': 'nait-fun.html'
            }
        });
    if (url.pathname.startsWith('/~')) {
        const mode = api_to_mode[url.pathname];
        if (mode === undefined)
            return new Response(STATUS_TEXT[Status.NotImplemented], {
                status: Status.NotImplemented
            });
        const response = await fetch(config.countapi + mode + '/' + config.namespace + '/' + config.key);
        if (response.ok) {
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
