// Cloudflare Worker: reverse-proxy Ko-fi and strip framing headers
// so it can be iframed on hopeforus.help

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // Map /kofi/* to https://ko-fi.com/*
    const targetPath = url.pathname.replace(/^\/kofi/, '') || '/';
    const target = 'https://ko-fi.com' + targetPath + url.search;

    const resp = await fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow'
    });

    const newHeaders = new Headers(resp.headers);
    // Strip framing blocks
    newHeaders.delete('x-frame-options');
    newHeaders.delete('content-security-policy');
    newHeaders.delete('content-security-policy-report-only');
    // Allow framing from our site
    newHeaders.set('content-security-policy', "frame-ancestors 'self' https://hopeforus.help https://*.hopeforus.help");

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: newHeaders
    });
  }
};
