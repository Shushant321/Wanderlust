const axios = require('axios');

async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'WanderlustApp/1.0 (shushantupadhyay770@gmail.com)'
      }
    });

    if (response.data && response.data.length > 0) {
      const lat = parseFloat(response.data[0].lat);
      const lng = parseFloat(response.data[0].lon);
      return { lat, lng };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

module.exports = { geocodeAddress };
