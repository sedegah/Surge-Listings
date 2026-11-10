const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// 1. Add _parseAsset, _parseOffer, and targeted fetch methods to Store
const parseHelpers = `  _parseAsset(d, portal = '') {
    if (!d) return null;
    if (portal === 'public') {
      return {
        id: d.id,
        ref: d.public_ref,
        bankId: '',
        bankName: '',
        category: d.category_code,
        assetType: d.asset_type,
        title: d.title,
        region: d.region,
        district: d.district || '',
        town: d.town || '',
        publicLocation: d.public_location,
        description: d.description,
        reserve: d.reserve_price,
        showReserve: !!d.show_reserve_publicly,
        status: d.status,
        publicationStatus: d.status === 'Live' ? 'Published' : 'Unpublished',
        legalHold: false,
        exteriorImage: (d.image_count || 0) > 0,
        primaryImage: d.primary_image || '',
        images: d.image_count || 0,
        beds: d.beds || null,
        baths: d.baths || null,
        occupancyStatus: d.occupancy_status || '',
        landGuardRisk: d.land_guard_risk || '',
        priceDisplay: d.price_display || 'Price on Application',
        legalStatus: 'Cleared',
        titleVerified: true,
        legalSubstate: { clearanceIssued: true, instrumentsVerified: true }
      };
    }
    return {
      id: d.id,
      ref: d.public_ref,
      bankId: d.bank_id,
      bankName: d.bank_name || '',
      ownershipType: d.ownership_type || 'bank',
      ownerBankId: d.owner_bank_id || '',
      ownerBankName: d.owner_bank_name || '',
      ownerName: d.owner_name || '',
      category: d.category_code,
      assetType: d.asset_type,
      region: d.region,
      district: d.district || '',
      town: d.town || '',
      publicLocation: d.public_location,
      exactAddress: d.exact_address,
      description: d.description,
      reserve: d.reserve_price,
      minOffer: d.minimum_offer,
      showReserve: !!d.show_reserve_publicly,
      status: d.status,
      publicationStatus: d.status === 'Live' ? 'Published' : (d.status === 'Approved' ? 'Pending Approval' : 'Unpublished'),
      legalStatus: d.legal_hold_active ? 'On Hold' : (d.enforcement_case_status === 'Cleared' ? 'Cleared' : (d.enforcement_case_number ? 'Pending' : 'Not Started')),
      valuationAmount: d.valuation_market_value || 0,
      forcedSaleValue: d.valuation_forced_sale_value || 0,
      valuationDate: d.valuation_date || null,
      valuationExpiry: d.valuation_expiry_date || null,
      valuationValidityDays: d.valuation_validity_period_days || 180,
      valuerName: d.valuation_valuer_name || '',
      valuationStatus: d.valuation_status || '',
      valuationReviewRequired: !!d.valuation_review_required,
      valuationDocumentId: d.valuation_document_id || d.latest_valuation_document_id || '',
      landSearchValid: !d.legal_hold_active,
      injunctionActive: !!d.active_injunction,
      legalHold: !!d.legal_hold_active,
      legalHoldReason: d.legal_hold_reason || '',
      exteriorImage: (d.image_count || 0) > 0,
      titleNumber: d.title_certificate_number || '',
      titleType: d.title_type || '',
      titleRegistry: d.title_registry || '',
      titleOwner: d.title_registered_owner || '',
      titlePerfection: d.title_perfection_status || '',
      titleVerificationStatus: d.title_verification_status || '',
      titleDocumentId: d.title_document_id || d.latest_title_document_id || '',
      titleVerified: d.title_verification_status === 'Verified',
      titleDetails: !!d.title_certificate_number,
      caseRef: d.enforcement_case_number || d.internal_bank_ref || '',
      branchId: d.branch_id || '',
      branchName: d.branch_name || '',
      enforcementBasis: d.enforcement_basis || '',
      images: d.image_count || 0,
      documents: d.document_count || 0,
      activeOffers: d.offer_count || 0,
      deletionRequested: !!d.deletion_requested,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      createdBy: d.created_by || 'Not recorded',
      legalSubstate: {
        enforcementRecorded: !!d.enforcement_case_number,
        instrumentsVerified: (d.legal_instruments || []).length > 0 &&
          d.legal_instruments.every(instrument => instrument.verification_status === 'Verified'),
        injunctionClear: !d.active_injunction,
        clearanceIssued: d.enforcement_case_status === 'Cleared'
      },
      legalNotes: [],
      instruments: (d.legal_instruments || []).map(instrument => ({
        id: instrument.id,
        type: instrument.instrument_type,
        ref: instrument.instrument_ref,
        status: instrument.verification_status,
        documentId: instrument.document_id || '',
        uploadedBy: instrument.uploaded_by_name || 'Not recorded',
        uploadedAt: instrument.uploaded_at || '',
        uploadedByPublicId: instrument.uploaded_by_public_id || ''
      })),
      activity: [{ when: d.created_at, who: d.created_by || 'Not recorded', what: 'Asset created' }]
    };
  },

  _parseOffer(o) {
    if (!o) return null;
    let ghanaCard = '';
    let phone = '';
    let email = '';
    const notes = o.notes || '';
    const gcMatch = notes.match(/Ghana Card:\\s*([^\\s·]+)/i);
    if (gcMatch) ghanaCard = gcMatch[1];
    const phoneMatch = notes.match(/Contact:\\s*([^\\s(]+)/i);
    if (phoneMatch) phone = phoneMatch[1];
    const emailMatch = notes.match(/\\(([^)]+@[^)]+)\\)/i);
    if (emailMatch) email = emailMatch[1];

    return {
      id: o.id,
      ref: o.offer_ref,
      assetId: o.asset_id,
      assetRef: o.asset_ref || '',
      assetTitle: o.asset_title || '',
      bankName: o.bank_name || '',
      buyer: o.buyer_name,
      amount: o.amount,
      status: o.status,
      belowReserve: !!o.below_reserve,
      date: o.created_at,
      validity: o.validity_date,
      notes: o.notes || '',
      conditions: o.conditions || 'Cash / Direct Bank Transfer',
      ghanaCard: ghanaCard || '',
      phone: phone || '',
      email: email || '',
      surgeVerified: !!o.surge_verified,
      surgeVerifiedBy: o.surge_verified_by || '',
      surgeVerifiedAt: o.surge_verified_at || null,
      rejectionReason: o.rejection_reason || ''
    };
  },

  async fetchAssets() {
    try {
      const headers = this.getAuthHeaders();
      const portal = document.body?.dataset.portal;
      const scopeParam = portal === 'admin' ? '?scope=all' : portal === 'bank' ? '?scope=bank' : '';
      const assetsEndpoint = portal === 'admin' ? '/api/admin/assets' : portal === 'public' ? '/api/marketplace/assets' : '/api/v1/assets' + scopeParam;
      const res = await fetch(this.API_BASE + assetsEndpoint, { headers, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.assets = json.data.map(d => this._parseAsset(d, portal));
          return true;
        }
      }
    } catch (e) {}
    return false;
  },

  async fetchOffers() {
    try {
      const headers = this.getAuthHeaders();
      const portal = document.body?.dataset.portal;
      const scopeParam = portal === 'admin' ? '?scope=all' : portal === 'bank' ? '?scope=bank' : '';
      const res = await fetch(this.API_BASE + '/api/v1/offers' + scopeParam, { headers, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.offers = json.data.map(o => this._parseOffer(o));
          return true;
        }
      }
    } catch (e) {}
    return false;
  },

  async fetchAuditLogs() {
    try {
      const headers = this.getAuthHeaders();
      const portal = document.body?.dataset.portal;
      const scopeParam = portal === 'admin' ? '?scope=all' : '';
      const res = await fetch(this.API_BASE + '/api/v1/audit-logs' + (scopeParam ? scopeParam : ''), { headers, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.auditLog = json.data
            .filter(a => ['Asset', 'Document', 'TitleRecord', 'Valuation', 'LegalInstrument', 'AssetImage', 'Offer', 'Invoice', 'EnforcementCase'].includes(a.entity_type) && !a.action_type?.startsWith('SESSION_'))
            .map(a => ({
              id: a.id,
              when: a.created_at,
              who: a.actor_name,
              actorRole: a.actor_role,
              organization: a.organization,
              action: a.action_type,
              entity: a.entity_type,
              entityRef: a.entity_id,
              detail: a.delta_summary
            }));
          return true;
        }
      }
    } catch (e) {}
    return false;
  },

  async fetchDocuments() {
    try {
      const headers = this.getAuthHeaders();
      const portal = document.body?.dataset.portal;
      const endpoint = portal === 'admin' ? '/api/admin/documents' : '/api/bank/documents';
      const res = await fetch(this.API_BASE + endpoint, { headers, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.documents = json.data.map(d => ({
            id: d.id, asset_id: d.asset_id, asset_ref: d.asset_ref || '',
            title: d.title, category: d.category,
            filename: d.filename, file_size: d.file_size,
            uploaded_at: d.uploaded_at, uploaded_by_name: d.uploaded_by_name
          }));
          return true;
        }
      }
    } catch (e) {}
    return false;
  },
`;

// Insert parseHelpers before `async fetchRemote()`
code = code.replace('  async fetchRemote() {', parseHelpers + '\n  fetchRemote() {\n    if (this._fetchPromise) return this._fetchPromise;\n    this._fetchPromise = this._doFetchRemote().finally(() => { this._fetchPromise = null; });\n    return this._fetchPromise;\n  },\n\n  async _doFetchRemote() {');

// In fetchRemote, replace the asset and offer mapping to use _parseAsset and _parseOffer
code = code.replace(
  'if (assetsRes.status === \'fulfilled\' && assetsRes.value.ok) {\n        const json = await assetsRes.value.json();\n        if (json.success && Array.isArray(json.data)) {\n          // Public marketplace API returns a simpler shape — map it into the same Store.assets format\n          if (portal === \'public\') {\n            this.assets = json.data.map(d => ({\n              id: d.id,\n              ref: d.public_ref,\n              bankId: \'\',\n              bankName: \'\',\n              category: d.category_code,\n              assetType: d.asset_type,\n              title: d.title,\n              region: d.region,\n              district: d.district || \'\',\n              town: d.town || \'\',\n              publicLocation: d.public_location,\n              description: d.description,\n              reserve: d.reserve_price,\n              showReserve: !!d.show_reserve_publicly,\n              status: d.status,\n              publicationStatus: d.status === \'Live\' ? \'Published\' : \'Unpublished\',\n              legalHold: false,\n              exteriorImage: (d.image_count || 0) > 0,\n              primaryImage: d.primary_image || \'\',\n              images: d.image_count || 0,\n              beds: d.beds || null,\n              baths: d.baths || null,\n              occupancyStatus: d.occupancy_status || \'\',\n              landGuardRisk: d.land_guard_risk || \'\',\n              priceDisplay: d.price_display || \'Price on Application\',\n              legalStatus: \'Cleared\',\n              titleVerified: true,\n              legalSubstate: { clearanceIssued: true, instrumentsVerified: true },\n            }));\n          } else {\n          this.assets = json.data.map(d => ({\n            id: d.id,\n            ref: d.public_ref,\n            bankId: d.bank_id,\n            bankName: d.bank_name || \'\',\n            ownershipType: d.ownership_type || \'bank\',\n            ownerBankId: d.owner_bank_id || \'\',\n            ownerBankName: d.owner_bank_name || \'\',\n            ownerName: d.owner_name || \'\',\n            category: d.category_code,\n            assetType: d.asset_type,\n            region: d.region,\n            district: d.district || \'\',\n            town: d.town || \'\',\n            publicLocation: d.public_location,\n            exactAddress: d.exact_address,\n            description: d.description,\n            reserve: d.reserve_price,\n            minOffer: d.minimum_offer,\n            showReserve: !!d.show_reserve_publicly,\n            status: d.status,\n            publicationStatus: d.status === \'Live\' ? \'Published\' : (d.status === \'Approved\' ? \'Pending Approval\' : \'Unpublished\'),\n            legalStatus: d.legal_hold_active ? \'On Hold\' : (d.enforcement_case_status === \'Cleared\' ? \'Cleared\' : (d.enforcement_case_number ? \'Pending\' : \'Not Started\')),\n            valuationAmount: d.valuation_market_value || 0,\n            forcedSaleValue: d.valuation_forced_sale_value || 0,\n            valuationDate: d.valuation_date || null,\n            valuationExpiry: d.valuation_expiry_date || null,\n            valuationValidityDays: d.valuation_validity_period_days || 180,\n            valuerName: d.valuation_valuer_name || \'\',\n            valuationStatus: d.valuation_status || \'\',\n            valuationReviewRequired: !!d.valuation_review_required,\n            valuationDocumentId: d.valuation_document_id || d.latest_valuation_document_id || \'\',\n            landSearchValid: !d.legal_hold_active,\n            injunctionActive: !!d.active_injunction,\n            legalHold: !!d.legal_hold_active,\n            legalHoldReason: d.legal_hold_reason || \'\',\n            exteriorImage: (d.image_count || 0) > 0,\n            titleNumber: d.title_certificate_number || \'\',\n            titleType: d.title_type || \'\',\n            titleRegistry: d.title_registry || \'\',\n            titleOwner: d.title_registered_owner || \'\',\n            titlePerfection: d.title_perfection_status || \'\',\n            titleVerificationStatus: d.title_verification_status || \'\',\n            titleDocumentId: d.title_document_id || d.latest_title_document_id || \'\',\n            titleVerified: d.title_verification_status === \'Verified\',\n            titleDetails: !!d.title_certificate_number,\n            caseRef: d.enforcement_case_number || d.internal_bank_ref || \'\',\n            branchId: d.branch_id || \'\',\n            branchName: d.branch_name || \'\',\n            enforcementBasis: d.enforcement_basis || \'\',\n            images: d.image_count || 0,\n            documents: d.document_count || 0,\n            activeOffers: d.offer_count || 0,\n            deletionRequested: !!d.deletion_requested,\n            createdAt: d.created_at,\n            updatedAt: d.updated_at,\n            createdBy: d.created_by || \'Not recorded\',\n            legalSubstate: {\n              enforcementRecorded: !!d.enforcement_case_number,\n              instrumentsVerified: (d.legal_instruments || []).length > 0 &&\n                d.legal_instruments.every(instrument => instrument.verification_status === \'Verified\'),\n              injunctionClear: !d.active_injunction,\n              clearanceIssued: d.enforcement_case_status === \'Cleared\'\n            },\n            legalNotes: [],\n            instruments: (d.legal_instruments || []).map(instrument => ({\n              id: instrument.id,\n              type: instrument.instrument_type,\n              ref: instrument.instrument_ref,\n              status: instrument.verification_status,\n              documentId: instrument.document_id || \'\',\n              uploadedBy: instrument.uploaded_by_name || \'Not recorded\',\n              uploadedAt: instrument.uploaded_at || \'\',\n              uploadedByPublicId: instrument.uploaded_by_public_id || \'\'\n            })),\n            activity: [{ when: d.created_at, who: d.created_by || \'Not recorded\', what: \'Asset created\' }]\n          }));\n          } // end else (non-public portal)\n        }\n      }',
  'if (assetsRes.status === \'fulfilled\' && assetsRes.value.ok) {\n        const json = await assetsRes.value.json();\n        if (json.success && Array.isArray(json.data)) {\n          this.assets = json.data.map(d => this._parseAsset(d, portal));\n        }\n      }'
);

fs.writeFileSync('app.js', code, 'utf8');
console.log('Store parsed helpers added successfully');

