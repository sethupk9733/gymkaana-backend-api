const http = require('http');
http.get('http://localhost:5000/api/gyms', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const gyms = JSON.parse(data);
            console.log(`Found ${gyms.length} gyms:`);
            gyms.forEach(g => {
                console.log(`  - ${g.name}: maxBaseDiscount=${g.maxBaseDiscount}, bestDiscount=${g.bestDiscount}`);
            });
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
        process.exit();
    });
});
