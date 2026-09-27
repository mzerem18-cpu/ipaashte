export default async function handler(req, res) {
    const { ipa, bundle_url, app } = req.query;
    if (!ipa || !app) return res.status(400).send('Invalid Request');

    // لۆگۆی بنەڕەتی (ئەگەر بەرنامەکە ئایکۆنی نەبوو ئەمە دادەنێت)
    let iconUrl = 'https://raw.githubusercontent.com/mzereashte94/Mzere/main/icons/Ashtemobile.jpeg';

    try {
        // هێنانی زانیارییەکان لە سۆرسەکەتەوە بۆ ئەوەی ئایکۆنی ڕاستەقینەی بەرنامەکە دەربهێنێت
        const sourceRes = await fetch('https://ashtemobile.site/Ashtemobile.json');
        if (sourceRes.ok) {
            const data = await sourceRes.json();
            const apps = Array.isArray(data) ? data : (data.apps || data.data || []);
            
            // گەڕان بۆ بەرنامەکە بەپێی ناوەکەی
            const foundApp = apps.find(a => (a.name || a.title || '').toLowerCase() === app.toLowerCase());
            
            // ئەگەر بەرنامەکە دۆزرایەوە و ئایکۆنی هەبوو، ئایکۆنەکەی دەگۆڕێت
            if (foundApp && (foundApp.iconURL || foundApp.icon || foundApp.image)) {
                iconUrl = foundApp.iconURL || foundApp.icon || foundApp.image;
            }
        }
    } catch (error) {
        console.error("Failed to fetch custom icon from source");
    }

    // گۆڕینی Bundle ID بۆ AshteMobile (بە لابردنی بۆشاییەکانی ناوەکە)
    let actualBundleId = `com.ashtemobile.${app.replace(/\s+/g, '').toLowerCase()}`;

    try {
        if (bundle_url) {
            const bundleRes = await fetch(bundle_url);
            if (bundleRes.ok) {
                actualBundleId = (await bundleRes.text()).trim();
            }
        }
    } catch (e) {
        console.error("Failed to fetch bundle ID");
    }

    const manifestXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${ipa}</string>
                </dict>
                <dict>
                    <key>kind</key>
                    <string>display-image</string>
                    <key>needs-shine</key>
                    <true/>
                    <key>url</key>
                    <string>${iconUrl}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${actualBundleId}</string>
                <key>bundle-version</key>
                <string>1.0.0</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${app} - AshteMobile</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(manifestXML);
}
