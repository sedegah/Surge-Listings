// Region and district lookup.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleRegions(c) {
  const { json, method, pathname } = c;

  // =========================================================================
  // 8. REGIONS & DISTRICTS LOOKUP
  // Ghana administrative boundaries for branch creation and asset registration
  // =========================================================================
  if (['/api/regions', '/api/v1/regions', '/api/admin/regions', '/api/bank/regions'].includes(pathname) && method === 'GET') {
    const ghanaRegions = {
      'Greater Accra': ['Accra Metropolitan', 'Tema Metropolitan', 'Ga East', 'Ga West', 'Ga South', 'Ga Central', 'Ga North', 'Ledzokuku', 'Krowor', 'La Dade Kotopon', 'La Nkwantanang Madina', 'Adentan', 'Ablekuma North', 'Ablekuma West', 'Ablekuma Central', 'Ayawaso East', 'Ayawaso West', 'Ayawaso North', 'Ayawaso Central', 'Okaikwei North', 'Korle Klottey', 'Weija Gbawe', 'Ada East', 'Ada West', 'Ningo Prampram', 'Shai Osudoku'],
      'Ashanti': ['Kumasi Metropolitan', 'Oforikrom', 'Asokwa', 'Suame', 'Bantama', 'Kwadaso', 'Old Tafo', 'Manhyia North', 'Manhyia South', 'Atwima Nwabiagya North', 'Atwima Nwabiagya South', 'Atwima Kwanwoma', 'Bosomtwe', 'Ejisu', 'Juaben', 'Kwabre East', 'Afigya Kwabre North', 'Afigya Kwabre South', 'Bekwai', 'Bosome Freho', 'Adansi North', 'Adansi South', 'Obuasi', 'Amansie Central', 'Amansie South', 'Amansie West', 'Ahafo Ano North', 'Ahafo Ano South East', 'Ahafo Ano South West', 'Mampong', 'Sekyere East', 'Sekyere South', 'Sekyere Central', 'Sekyere Afram Plains', 'Offinso North', 'Offinso South', 'Asante Akim North', 'Asante Akim South', 'Asante Akim Central', 'Ejura Sekyedumase'],
      'Western': ['Sekondi-Takoradi Metropolitan', 'Effia Kwesimintsim', 'Essikado-Ketan', 'Shama', 'Ahanta West', 'Nzema East', 'Ellembelle', 'Jomoro', 'Tarkwa-Nsuaem', 'Prestea-Huni Valley', 'Wassa Amenfi East', 'Wassa Amenfi Central', 'Wassa Amenfi West', 'Mpohor'],
      'Western North': ['Sefwi Wiawso', 'Sefwi Akontombra', 'Sefwi Bibiani-Anhwiaso-Bekwai', 'Juaboso', 'Bia East', 'Bia West', 'Bodi', 'Suaman', 'Aowin'],
      'Central': ['Cape Coast Metropolitan', 'Komenda-Edina-Eguafo-Abirem', 'Mfantsiman', 'Abura-Asebu-Kwamankese', 'Ajumako-Enyan-Essiam', 'Gomoa East', 'Gomoa West', 'Gomoa Central', 'Effutu', 'Awutu Senya East', 'Awutu Senya West', 'Agona East', 'Agona West', 'Asikuma-Odoben-Brakwa', 'Assin North', 'Assin South', 'Twifo-Atti Morkwa', 'Twifo Hemang Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West', 'Ekumfi'],
      'Eastern': ['New Juaben South', 'New Juaben North', 'Koforidua', 'Suhum', 'Nsawam-Adoagyiri', 'Akuapim South', 'Akuapim North', 'Abuakwa South', 'Abuakwa North', 'Denkyembour', 'Kwaebibirem', 'Atiwa East', 'Atiwa West', 'Birim North', 'Birim South', 'Birim Central', 'West Akim', 'Achiase', 'Upper West Akim', 'Ayensuano', 'Lower Manya Krobo', 'Upper Manya Krobo', 'Yilo Krobo', 'Fanteakwa North', 'Fanteakwa South', 'Kwahu East', 'Kwahu West', 'Kwahu South', 'Kwahu Afram Plains North', 'Kwahu Afram Plains South', 'Akyemansa'],
      'Volta': ['Ho Municipal', 'Ho West', 'South Dayi', 'North Dayi', 'Keta', 'Ketu South', 'Ketu North', 'Akatsi South', 'Akatsi North', 'South Tongu', 'North Tongu', 'Adaklu', 'Afadzato South', 'Central Tongu', 'Anloga', 'Hohoe'],
      'Oti': ['Krachi East', 'Krachi West', 'Krachi Nchumuru', 'Nkwanta South', 'Nkwanta North', 'Biakoye', 'Jasikan', 'Kadjebi', 'Guan'],
      'Northern': ['Tamale Metropolitan', 'Sagnarigu', 'Mion', 'Yendi', 'Nanumba North', 'Nanumba South', 'Zabzugu', 'Tatale-Sanguli', 'Saboba', 'Gushegu', 'Karaga', 'Kpandai', 'Tolon', 'Kumbungu', 'Savelugu', 'Nanton'],
      'Savannah': ['Damongo', 'West Gonja', 'Central Gonja', 'East Gonja', 'North Gonja', 'North East Gonja', 'Bole', 'Sawla-Tuna-Kalba'],
      'North East': ['Nalerigu-Gambaga', 'East Mamprusi', 'West Mamprusi', 'Mamprugu-Moagduri', 'Bunkpurugu-Nyankpanduri', 'Yunyoo-Nasuan', 'Chereponi'],
      'Upper East': ['Bolgatanga Municipal', 'Bolgatanga East', 'Bongo', 'Talensi', 'Nabdam', 'Kassena-Nankana West', 'Kassena-Nankana East', 'Bawku Municipal', 'Bawku West', 'Garu', 'Tempane', 'Pusiga', 'Binduri', 'Builsa North', 'Builsa South'],
      'Upper West': ['Wa Municipal', 'Wa East', 'Wa West', 'Daffiama-Bussie-Issa', 'Nadowli-Kaleo', 'Jirapa', 'Lambussie-Karni', 'Lawra', 'Nandom', 'Sissala East', 'Sissala West'],
      'Bono': ['Sunyani Municipal', 'Sunyani West', 'Dormaa East', 'Dormaa Central', 'Dormaa West', 'Berekum East', 'Berekum West', 'Jaman North', 'Jaman South', 'Tain', 'Banda', 'Wenchi'],
      'Bono East': ['Techiman Municipal', 'Techiman North', 'Nkoranza North', 'Nkoranza South', 'Kintampo North', 'Kintampo South', 'Atebubu-Amantin', 'Sene East', 'Sene West', 'Pru East', 'Pru West'],
      'Ahafo': ['Goaso', 'Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South']
    };
    return json({ success: true, data: ghanaRegions });
  }
}
