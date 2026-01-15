export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        console.error('[API] Missing URL parameter');
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    // Sanitize and validate the URL
    const cleanUrl = url.split('?')[0]; // Remove query params like ?usp=header
    
    if (!cleanUrl.includes('docs.google.com/forms') && !cleanUrl.includes('forms.gle')) {
        console.error('[API] Invalid Google Form URL:', cleanUrl);
        return res.status(400).json({ error: 'Invalid Google Form URL' });
    }

    // Expand shortened forms.gle URLs
    let targetUrl = cleanUrl;
    if (cleanUrl.includes('forms.gle')) {
        try {
            console.log('[API] Expanding shortened URL:', cleanUrl);
            const expandResponse = await fetch(cleanUrl, {
                method: 'HEAD',
                redirect: 'follow'
            });
            targetUrl = expandResponse.url;
            console.log('[API] Expanded to:', targetUrl);
        } catch (e) {
            console.warn('[API] Failed to expand URL, using original:', e.message);
            targetUrl = cleanUrl;
        }
    }

    // Try multiple user agents for better compatibility
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    let lastError;
    
    for (const userAgent of userAgents) {
        try {
            console.log('[API] Attempting to fetch with User-Agent:', userAgent.substring(0, 50) + '...');
            
            const response = await fetch(targetUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            
            // Validate that we got actual form data
            if (!html.includes('FB_PUBLIC_LOAD_DATA_') && !html.includes('docs.google.com')) {
                throw new Error('Response does not contain valid Google Form data');
            }

            console.log('[API] Successfully fetched form data');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
            
        } catch (error) {
            console.warn(`[API] Failed with User-Agent ${userAgent.substring(0, 30)}:`, error.message);
            lastError = error;
        }
    }

    // All attempts failed
    console.error('[API] All fetch attempts failed:', lastError?.message);
    return res.status(500).json({ 
        error: 'Failed to fetch form data',
        details: lastError?.message || 'Unknown error',
        url: targetUrl
    });
}
