// Branch-scoped dashboard statistics and the full region table.
// Returns a Response when it handles the request, or undefined to fall through
// to the next handler. Order is significant and fixed by worker/index.js.
export async function handleBranchStats(c) {
  const {
    env, err, json, method, pathname, requireBankAuth, url
  } = c;

  // =========================================================================
  // 10. BRANCH-SCOPED STATISTICS (Dashboard per branch)
  // =========================================================================
  if (pathname.match(/^\/api\/bank\/branches\/[a-zA-Z0-9_-]+\/dashboard$/) && method === 'GET') {
    const session = await requireBankAuth();
    const branchId = pathname.split('/')[4];
    const branch = await env.DB.prepare(`SELECT * FROM bank_branches WHERE id = ? AND bank_id = ?`).bind(branchId, session.bank_id).first();
    if (!branch) return err('Branch not found or access denied.', 404);

    const stats = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM assets WHERE branch_id = ?) as totalAssets,
        (SELECT COALESCE(SUM(reserve_price), 0) FROM assets WHERE branch_id = ?) as totalPortfolioValue,
        (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND status = 'Live') as liveListings,
        (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND status IN ('Submitted by Bank', 'Submitted', 'Under Review')) as pendingReview,
        (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND legal_hold_active = 1) as legalHolds,
        (SELECT COUNT(*) FROM assets WHERE branch_id = ? AND status = 'Sold') as completedSales,
        (SELECT COUNT(*) FROM users WHERE branch_id = ?) as staffCount
    `).bind(branchId, branchId, branchId, branchId, branchId, branchId, branchId).first();

    return json({
      success: true,
      branch: { id: branch.id, name: branch.name, region: branch.region, district: branch.district, town: branch.town },
      data: stats
    });
  }

  // GET /api/regions - All 16 Ghana regions with their constituencies (used as districts)
  // District dropdown MUST be filtered by region selection
  if (pathname === '/api/regions' && method === 'GET') {
    const requestedRegion = url.searchParams.get('region');
    const GHANA_REGIONS = {
      'Ahafo': ['Asunafo North','Asunafo South','Asutifi North','Asutifi South','Tano North','Tano South'],
      'Ashanti': ['Adansi-Asokwa','Fomena','New Edubiase','Afigya Kwabre North','Afigya Kwabre South','Ahafo Ano North','Ahafo Ano South East','Ahafo Ano South West','Akrofuom','Odotobri','Manso Nkwanta','Manso Edubia','Asante Akim Central','Asante Akim North','Asante Akim South','Asawase','Asokwa','Atwima-Kwanwoma','Atwima Mponua','Atwima-Nwabiagya South','Atwima-Nwabiagya North','Bekwai','Bosome-Freho','Bosomtwe','Ejisu','Ejura-Sekyedumase','Juaben','Bantama','Manhyia North','Manhyia South','Nhyiaeso','Subin','Kwabre East','Kwadaso','Mampong','Obuasi East','Obuasi West','Offinso South','Offinso North','Oforikrom','Old Tafo','Sekyere Afram Plains','Nsuta-Kwamang-Beposo','Afigya Sekyere East','Kumawu','Effiduase-Asokore','Suame'],
      'Bono': ['Banda','Berekum East','Berekum West','Dormaa Central','Dormaa East','Dormaa West','Jaman North','Jaman South','Sunyani East','Sunyani West','Tain','Wenchi'],
      'Bono East': ['Atebubu-Amantin','Kintampo North','Kintampo South','Nkoranza North','Nkoranza South','Pru East','Pru West','Sene East','Sene West','Techiman South','Techiman North'],
      'Central': ['Abura-Asebu-Kwamankese','Agona East','Agona West','Ajumako-Enyan-Essiam','Asikuma-Odoben-Brakwa','Assin Central','Assin North','Assin South','Awutu-Senya East','Awutu-Senya West','Cape Coast North','Cape Coast South','Effutu','Ekumfi','Gomoa East','Gomoa Central','Gomoa West','Komenda-Edina-Eguafo-Abirem','Mfantseman','Twifo-Atii Morkwaa','Hemang Lower Denkyira','Upper Denkyira East','Upper Denkyira West'],
      'Eastern': ['Abuakwa North','Abuakwa South','Achiase','Akropong','Akuapem South','Ofoase-Ayirebi','Asene Akroso Manso','Asuogyaman','Atiwa East','Atiwa West','Ayensuano','Akim Oda','Abirem','Akim Swedru','Akwatia','Fanteakwa North','Fanteakwa South','Kade','Afram Plains North','Afram Plains South','Abetifi','Mpraeso','Nkawkaw','Lower Manya Krobo','New Juaben North','New Juaben South','Nsawam Adoagyiri','Okere','Suhum','Upper Manya Krobo','Upper West Akim','Lower West Akim','Yilo Krobo'],
      'Greater Accra': ['Ablekuma Central','Ablekuma North','Ablekuma West','Ablekuma South','Odododiodioo','Okaikwei Central','Okaikwei South','Ada','Sege','Adenta','Ashaiman','Ayawaso Central','Ayawaso East','Ayawaso North','Ayawaso West Wuogon','Anyaa-Sowutuom','Dome-Kwabenya','Trobu','Bortianor-Ngleshie-Amanfro','Amasaman','Korle Klottey','Kpone-Katamanso','Krowor','Dade Kotopon','Abokobi-Madina','Ledzokuku','Ningo-Prampram','Okaikwei North','Shai-Osudoku','Tema East','Tema Central','Tema West','Weija-Gbawe','Domeabra-Obom'],
      'North East': ['Bunkpurugu','Chereponi','Nalerigu','Yagaba-Kubori','Walewale','Yunyoo'],
      'Northern': ['Gushegu','Karaga','Kpandai','Kumbungu','Mion','Nanton','Bimbilla','Wulensi','Saboba','Sagnarigu','Savelugu','Tamale Central','Tamale North','Tamale South','Tatale-Sanguli','Tolon','Yendi','Zabzugu'],
      'Oti': ['Biakoye','Guan','Buem','Akan','Krachi East','Krachi Nchumuru','Krachi West','Nkwanta North','Nkwanta South'],
      'Savannah': ['Bole','Yapei-Kusawgu','Salaga South','Salaga North','Daboya-Mankarigu','Sawla-Tuna-Kalba','Damongo'],
      'Upper East': ['Bawku Central','Zebilla','Binduri','Bolgatanga East','Bolgatanga Central','Bongo','Builsa North','Builsa South','Garu','Navrongo Central','Chiana-Paga','Nabdam','Pusiga','Talensi','Tempane'],
      'Upper West': ['Daffiama-Bussie-Issa','Jirapa','Lambussie','Lawra','Nadowli-Kaleo','Nandom','Sissala East','Sissala West','Wa East','Wa Central','Wa West'],
      'Volta': ['Adaklu','Afadjato South','Agotime-Ziope','Akatsi North','Akatsi South','Anlo','Central Tongu','Ho Central','Ho West','Hohoe','Keta','Ketu North','Ketu South','Kpando','North Dayi','North Tongu','South Dayi','South Tongu'],
      'Western': ['Ahanta West','Amenfi Central','Amenfi West','Amenfi East','Effia','Kwesimintsim','Ellembelle','Jomoro','Mpohor','Evalue Gwira','Prestea-Huni Valley','Essikado-Ketan','Sekondi','Takoradi','Shama','Tarkwa-Nsuaem','Wassa East'],
      'Western North': ['Aowin','Bia East','Bia West','Bibiani-Anhwiaso-Bekwai','Bodi','Juaboso','Sefwi-Akontombra','Sefwi-Wiawso','Suaman']
    };

    if (requestedRegion) {
      const constituencies = GHANA_REGIONS[requestedRegion];
      if (!constituencies) return err(`Unknown region: ${requestedRegion}`, 404);
      return json({ success: true, region: requestedRegion, constituencies, count: constituencies.length });
    }

    // Return all regions with summary
    const summary = Object.entries(GHANA_REGIONS).map(([region, constituencies]) => ({
      region, constituency_count: constituencies.length, constituencies
    }));
    return json({ success: true, total_regions: 16, total_constituencies: 276, data: summary });
  }
}
