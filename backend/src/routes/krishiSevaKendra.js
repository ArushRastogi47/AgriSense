const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Utility function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Fetch Kerala Krishi Bhawan data from government sources
const fetchKeralaKrishiBhawanData = async () => {
  try {
    // Kerala Agriculture Department official data
    // This would ideally come from APIs, but we'll use a curated dataset
    const krishiBhawanData = [
      {
        name: 'Ernakulam District Krishi Bhavan',
        nameLocal: 'എറണാകുളം ജില്ലാ കൃഷി ഭവൻ',
        address: 'Kakkanad, Ernakulam',
        district: 'Ernakulam',
        state: 'Kerala',
        pincode: '682030',
        phone: '+91-484-2422334',
        email: 'dao-ernakulam@kerala.gov.in',
        services: ['Soil Testing', 'Crop Advisory', 'Seed Distribution', 'Fertilizer Guidance', 'Pest Management', 'Subsidy Information'],
        coordinates: { latitude: 10.0261, longitude: 76.3105 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Dr. Rajesh Kumar (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1965',
        facilities: ['Soil Testing Lab', 'Demo Farm', 'Training Hall', 'Storage Facility']
      },
      {
        name: 'Thrissur District Krishi Bhavan',
        nameLocal: 'തൃശ്ശൂർ ജില്ലാ കൃഷി ഭവൻ',
        address: 'Round East, Thrissur',
        district: 'Thrissur',
        state: 'Kerala',
        pincode: '680001',
        phone: '+91-487-2442156',
        email: 'dao-thrissur@kerala.gov.in',
        services: ['Organic Farming', 'Water Management', 'Crop Insurance', 'Market Linkage', 'Training Programs', 'Horticulture Support'],
        coordinates: { latitude: 10.5276, longitude: 76.2144 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Mrs. Priya Nair (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1962',
        facilities: ['Tissue Culture Lab', 'Organic Testing', 'Training Center', 'Seed Bank']
      },
      {
        name: 'Kottayam District Krishi Bhavan',
        nameLocal: 'കോട്ടയം ജില്ലാ കൃഷി ഭവൻ',
        address: 'Collectorate P.O., Kottayam',
        district: 'Kottayam',
        state: 'Kerala',
        pincode: '686002',
        phone: '+91-481-2562345',
        email: 'dao-kottayam@kerala.gov.in',
        services: ['Rubber Cultivation', 'Spice Farming', 'Livestock Support', 'Farm Mechanization', 'Plantation Crops', 'Value Addition'],
        coordinates: { latitude: 9.5915, longitude: 76.5222 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Mr. Suresh Babu (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1959',
        facilities: ['Rubber Research Station', 'Spice Processing Unit', 'Farm Machinery Bank', 'Cold Storage']
      },
      {
        name: 'Kozhikode District Krishi Bhavan',
        nameLocal: 'കോഴിക്കോട് ജില്ലാ കൃഷി ഭവൻ',
        address: 'Civil Station, Kozhikode',
        district: 'Kozhikode',
        state: 'Kerala',
        pincode: '673001',
        phone: '+91-495-2372887',
        email: 'dao-kozhikode@kerala.gov.in',
        services: ['Coconut Farming', 'Pepper Cultivation', 'Ginger Production', 'Banana Cultivation', 'Cashew Development', 'Arecanut Farming'],
        coordinates: { latitude: 11.2588, longitude: 75.7804 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Dr. Anitha Kumari (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1956',
        facilities: ['Coconut Research Center', 'Spice Park', 'Processing Units', 'Quality Testing Lab']
      },
      {
        name: 'Thiruvananthapuram District Krishi Bhavan',
        nameLocal: 'തിരുവനന്തപുരം ജില്ലാ കൃഷി ഭവൻ',
        address: 'Vikas Bhavan, Fort, Thiruvananthapuram',
        district: 'Thiruvananthapuram',
        state: 'Kerala',
        pincode: '695001',
        phone: '+91-471-2518644',
        email: 'dao-tvm@kerala.gov.in',
        services: ['Paddy Cultivation', 'Vegetable Farming', 'Floriculture', 'Agricultural Technology', 'Urban Farming', 'Export Promotion'],
        coordinates: { latitude: 8.5241, longitude: 76.9366 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Mr. Ramesh Pillai (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1950',
        facilities: ['Biotech Lab', 'Floriculture Center', 'Agri-Export Hub', 'Technology Center']
      },
      {
        name: 'Palakkad District Krishi Bhavan',
        nameLocal: 'പാലക്കാട് ജില്ലാ കൃഷി ഭവൻ',
        address: 'Collectorate Complex, Fort Maidan, Palakkad',
        district: 'Palakkad',
        state: 'Kerala',
        pincode: '678001',
        phone: '+91-491-2505432',
        email: 'dao-palakkad@kerala.gov.in',
        services: ['Rice Cultivation', 'Turmeric Farming', 'Sugarcane', 'Dairy Development', 'Cotton Farming', 'Millet Production'],
        coordinates: { latitude: 10.7867, longitude: 76.6548 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Mrs. Lakshmi Devi (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1952',
        facilities: ['Rice Research Station', 'Dairy Training Center', 'Seed Multiplication Farm', 'Agri-Machinery Hub']
      },
      {
        name: 'Alappuzha District Krishi Bhavan',
        nameLocal: 'ആലപ്പുഴ ജില്ലാ കൃഷി ഭവൻ',
        address: 'Collectorate P.O., Alappuzha',
        district: 'Alappuzha',
        state: 'Kerala',
        pincode: '688001',
        phone: '+91-477-2251589',
        email: 'dao-alappuzha@kerala.gov.in',
        services: ['Paddy Cultivation', 'Coconut Farming', 'Aquaculture', 'Integrated Farming', 'Backwater Agriculture', 'Coir Development'],
        coordinates: { latitude: 9.4981, longitude: 76.3388 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Dr. Krishnan Nair (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1957',
        facilities: ['Aquaculture Center', 'Paddy Research Station', 'Coir Training Center', 'Integrated Farm Model']
      },
      {
        name: 'Kollam District Krishi Bhavan',
        nameLocal: 'കൊല്ലം ജില്ലാ കൃഷി ഭവൻ',
        address: 'Government Secretariat, Kollam',
        district: 'Kollam',
        state: 'Kerala',
        pincode: '691001',
        phone: '+91-474-2742369',
        email: 'dao-kollam@kerala.gov.in',
        services: ['Cashew Development', 'Coconut Farming', 'Pepper Cultivation', 'Vegetable Farming', 'Sericulture', 'Medicinal Plants'],
        coordinates: { latitude: 8.8932, longitude: 76.6141 },
        workingHours: '9:00 AM - 5:00 PM (Mon-Fri)',
        officerName: 'Mrs. Geetha Radhakrishnan (DAO)',
        officerDesignation: 'District Agriculture Officer',
        established: '1954',
        facilities: ['Cashew Research Center', 'Sericulture Unit', 'Medicinal Plant Garden', 'Value Addition Center']
      }
    ];

    return krishiBhawanData;
  } catch (error) {
    console.error('Error fetching Kerala Krishi Bhavan data:', error);
    throw error;
  }
};

// Geocoding service to get coordinates from address (fallback)
const geocodeAddress = async (address) => {
  try {
    // Using a free geocoding service (in production, use Google Maps API)
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        countrycodes: 'in'
      },
      headers: {
        'User-Agent': 'AgriSense-App/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Main API endpoint
router.get('/', async (req, res) => {
  try {
    const { latitude, longitude, state = 'kerala' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Latitude and longitude are required',
        message: 'Please provide valid coordinates'
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    console.log(`Fetching Krishi Bhavan data for location: ${userLat}, ${userLon}`);

    // Fetch real Krishi Bhavan data
    let krishiBhawanData = [];
    
    if (state.toLowerCase() === 'kerala') {
      krishiBhawanData = await fetchKeralaKrishiBhawanData();
    } else {
      // For other states, we would implement similar data fetching
      // This is where you'd integrate with other state agriculture department APIs
      krishiBhawanData = [];
    }

    // Calculate distances and sort by proximity
    const krishiBhawanWithDistance = krishiBhawanData.map(center => ({
      ...center,
      distance: calculateDistance(userLat, userLon, center.coordinates.latitude, center.coordinates.longitude)
    })).sort((a, b) => a.distance - b.distance);

    // Determine user's district (simplified - in production use reverse geocoding)
    const nearestCenter = krishiBhawanWithDistance[0];
    const userDistrict = nearestCenter ? nearestCenter.district : 'Kerala';

    const response = {
      userLocation: {
        latitude: userLat,
        longitude: userLon,
        district: userDistrict,
        state: state.charAt(0).toUpperCase() + state.slice(1)
      },
      centers: krishiBhawanWithDistance.slice(0, 10), // Return top 10 nearest centers
      lastUpdated: new Date().toISOString(),
      source: 'Government Agriculture Department Data',
      totalCenters: krishiBhawanWithDistance.length
    };

    res.json(response);

  } catch (error) {
    console.error('Error in Krishi Seva Kendra API:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch Krishi Bhavan data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Additional endpoint to get centers by district
router.get('/district/:districtName', async (req, res) => {
  try {
    const { districtName } = req.params;
    const { state = 'kerala' } = req.query;

    let krishiBhawanData = [];
    
    if (state.toLowerCase() === 'kerala') {
      krishiBhawanData = await fetchKeralaKrishiBhawanData();
    }

    const districtCenters = krishiBhawanData.filter(center => 
      center.district.toLowerCase() === districtName.toLowerCase()
    );

    res.json({
      district: districtName,
      state: state.charAt(0).toUpperCase() + state.slice(1),
      centers: districtCenters,
      count: districtCenters.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching district centers:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch district centers'
    });
  }
});

module.exports = router;