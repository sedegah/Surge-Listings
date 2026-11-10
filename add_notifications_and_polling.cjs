const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');
const hadCRLF = app.includes('\r\n');
if (hadCRLF) app = app.replace(/\r\n/g, '\n');

// 1. In Store.init, add call to this.startPeriodicSync()
const oldStoreInit = `    this.branches = [];
    this.startDeploymentVersionMonitor();
    const portal = document.body?.dataset.portal;
    if (!portal || portal === 'public') this.fetchRemote();
  },`;

const newStoreInit = `    this.branches = [];
    this.startDeploymentVersionMonitor();
    this.startPeriodicSync();
    const portal = document.body?.dataset.portal;
    if (!portal || portal === 'public') this.fetchRemote();
  },`;

if (app.includes(oldStoreInit)) {
  app = app.replace(oldStoreInit, newStoreInit);
  console.log('OK: Added startPeriodicSync to Store.init');
} else {
  console.error('MISS: oldStoreInit not found');
  process.exit(1);
}

// 2. Add startPeriodicSync and syncAndNotify methods to Store
const oldVersionNotice = `  showDeploymentUpdateNotice() {
    UI.notify.info('A newer version of Surge Listings is ready. Refresh safely to load the update.', 'Update Available', {
      persistent: true,
      action: {
        label: 'Refresh safely',
        onClick: () => window.location.reload()
      }
    });
  },`;

const newSyncMethods = `  showDeploymentUpdateNotice() {
    UI.notify.info('A newer version of Surge Listings is ready. Refresh safely to load the update.', 'Update Available', {
      persistent: true,
      action: {
        label: 'Refresh safely',
        onClick: () => window.location.reload()
      }
    });
  },

  _syncTimer: null,
  _isSyncing: false,
  _hasSyncedOnce: false,
  _snapshotAssets: new Map(),
  _snapshotOffers: new Map(),
  _snapshotLeadIds: new Set(),

  startPeriodicSync() {
    if (this._syncTimer) return;
    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      const portal = document.body?.dataset.portal;
      if (portal !== 'admin' && portal !== 'bank') return;
      await this.syncAndNotify();
    };
    // Sync every 15 seconds
    this._syncTimer = setInterval(poll, 15000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void poll();
    });
  },

  async syncAndNotify() {
    if (this._isSyncing) return;
    this._isSyncing = true;
    try {
      const portal = document.body?.dataset.portal;
      if (!portal || (portal !== 'admin' && portal !== 'bank')) return;
      if (!Auth.getToken() && !Auth.isSessionPresent()) return;

      const prevAssets = new Map(this._snapshotAssets);
      const prevOffers = new Map(this._snapshotOffers);
      const prevLeadIds = new Set(this._snapshotLeadIds);
      const hadPreviousState = this._hasSyncedOnce;

      // Fetch fresh remote data
      await this.fetchRemote();

      // Build snapshots of new state
      const currentAssets = new Map();
      (this.assets || []).forEach(a => {
        currentAssets.set(a.id, {
          id: a.id,
          ref: a.ref,
          bankId: a.bankId,
          bankName: a.bankName,
          title: a.title,
          status: a.status,
          legalStatus: a.legalStatus,
          legalHold: !!a.legalHold,
          clearanceIssued: !!a.legalSubstate?.clearanceIssued
        });
      });

      const currentOffers = new Map();
      (this.offers || []).forEach(o => {
        currentOffers.set(o.id, {
          id: o.id,
          ref: o.ref,
          assetId: o.assetId,
          assetRef: o.assetRef,
          amount: o.amount,
          buyer: o.buyer,
          status: o.status
        });
      });

      const currentLeadIds = new Set((this.leads || []).map(l => l.id));

      this._snapshotAssets = currentAssets;
      this._snapshotOffers = currentOffers;
      this._snapshotLeadIds = currentLeadIds;

      if (!hadPreviousState) {
        this._hasSyncedOnce = true;
        return;
      }

      let changesDetected = false;

      // ============================================================
      // ADMIN NOTIFICATIONS
      // ============================================================
      if (portal === 'admin') {
        // 1. New correspondence: Buyer enquiries / leads
        (this.leads || []).forEach(lead => {
          if (!prevLeadIds.has(lead.id)) {
            changesDetected = true;
            UI.notify.info(
              \`Buyer enquiry received from \${lead.name || 'Interested Buyer'} on asset \${lead.assetRef || 'portfolio listing'}.\`,
              'New Correspondence',
              {
                duration: 9000,
                action: {
                  label: 'View Assets',
                  onClick: () => AdminPortal.nav('assets')
                }
              }
            );
          }
        });

        // 2. New correspondence: Purchase offers
        currentOffers.forEach((offer, offerId) => {
          if (!prevOffers.has(offerId)) {
            changesDetected = true;
            UI.notify.info(
              \`Purchase offer of \${UI.fmtMoney(offer.amount)} received on \${offer.assetRef || 'asset'} from \${offer.buyer || 'verified buyer'}.\`,
              'New Purchase Offer',
              {
                duration: 9000,
                action: {
                  label: 'Review Offers',
                  onClick: () => AdminPortal.nav('offers')
                }
              }
            );
          }
        });

        // 3. New asset submitted for review by partner bank
        currentAssets.forEach((curr, id) => {
          const prev = prevAssets.get(id);
          const isNewlySubmitted = curr.status === 'Submitted' || curr.status === 'Submitted by Bank';
          const wasNotSubmitted = !prev || (prev.status !== 'Submitted' && prev.status !== 'Submitted by Bank');
          if (isNewlySubmitted && wasNotSubmitted) {
            changesDetected = true;
            UI.notify.info(
              \`Asset \${curr.ref} has been submitted for statutory review by \${curr.bankName || 'Partner Bank'}.\`,
              'Asset Submitted for Review',
              {
                duration: 10000,
                action: {
                  label: 'Open Review Queue',
                  onClick: () => AdminPortal.nav('review')
                }
              }
            );
          }
        });
      }

      // ============================================================
      // BANK USER NOTIFICATIONS
      // ============================================================
      if (portal === 'bank') {
        currentAssets.forEach((curr, id) => {
          const prev = prevAssets.get(id);
          if (!prev) return;

          // 1. Asset review completed (Approved)
          const wasUnderReview = ['Submitted', 'Submitted by Bank', 'Under Review'].includes(prev.status);
          if (wasUnderReview && curr.status === 'Approved') {
            changesDetected = true;
            UI.notify.success(
              \`Review complete for asset \${curr.ref}. Surge clearance granted and approved for disposition.\`,
              'Review Completed',
              {
                duration: 10000,
                action: {
                  label: 'View Asset',
                  onClick: () => BankPortal.openAsset(curr.id)
                }
              }
            );
          }

          // 2. Asset published live on marketplace
          if (prev.status !== 'Live' && curr.status === 'Live') {
            changesDetected = true;
            UI.notify.success(
              \`Asset \${curr.ref} is now published and live on the public disposition marketplace.\`,
              'Listing Live',
              {
                duration: 10000,
                action: {
                  label: 'View Listing',
                  onClick: () => BankPortal.openAsset(curr.id)
                }
              }
            );
          }

          // 3. Asset review returned (Changes required / revisions)
          if (wasUnderReview && (curr.status === 'Changes Required' || curr.status === 'Draft')) {
            changesDetected = true;
            UI.notify.warning(
              \`Review update: Asset \${curr.ref} requires adjustments before clearance can be granted.\`,
              'Review Returned',
              {
                duration: 10000,
                action: {
                  label: 'View Asset',
                  onClick: () => BankPortal.openAsset(curr.id)
                }
              }
            );
          }

          // 4. Legal clearance issued
          if (!prev.clearanceIssued && curr.clearanceIssued) {
            changesDetected = true;
            UI.notify.success(
              \`Legal clearance issued for asset \${curr.ref}. Statutory legal gate cleared.\`,
              'Legal Clearance Granted',
              { duration: 8000 }
            );
          }
        });

        // 5. Offer verified by Surge released for bank review
        currentOffers.forEach((offer, offerId) => {
          const prev = prevOffers.get(offerId);
          const isNowUnderBankReview = offer.status === 'Under Bank Review';
          const wasNotUnderBankReview = !prev || prev.status !== 'Under Bank Review';
          if (isNowUnderBankReview && wasNotUnderBankReview) {
            changesDetected = true;
            UI.notify.info(
              \`Offer \${offer.ref} on asset \${offer.assetRef} (\${UI.fmtMoney(offer.amount)}) verified by Surge and ready for decision.\`,
              'Offer Ready for Review',
              {
                duration: 10000,
                action: {
                  label: 'Review Offer',
                  onClick: () => BankPortal.nav('offers')
                }
              }
            );
          }
        });
      }

      // Automatically update the view if user is not actively editing a form input
      const activeEl = document.activeElement;
      const isUserEditing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
      if (!isUserEditing) {
        if (portal === 'admin' && typeof AdminPortal !== 'undefined' && AdminPortal.render) {
          AdminPortal.render();
        } else if (portal === 'bank' && typeof BankPortal !== 'undefined' && BankPortal.render) {
          BankPortal.render();
        }
      }
    } catch (e) {
      console.warn('[Periodic Sync] Background sync error:', e);
    } finally {
      this._isSyncing = false;
    }
  },`;

if (app.includes(oldVersionNotice)) {
  app = app.replace(oldVersionNotice, newSyncMethods);
  console.log('OK: Added periodic sync & notification engine to Store');
} else {
  console.error('MISS: oldVersionNotice not found');
  process.exit(1);
}

// 3. In BankPortal.submitForReview, trigger rich notification
const oldSubmitMsg = `      await Store.fetchRemote();
      UI.toast('Asset submitted for review. Surge disposition team notified.', 'success');
      this.render();`;

const newSubmitMsg = `      await Store.fetchRemote();
      UI.notify.success(\`Asset \${a.ref} successfully submitted for statutory 5-gate review. Surge disposition team notified.\`, 'Submitted for Review');
      this.render();`;

if (app.includes(oldSubmitMsg)) {
  app = app.replace(oldSubmitMsg, newSubmitMsg);
  console.log('OK: Updated BankPortal.submitForReview notification');
}

// 4. In AdminPortal.performAssetAction, use UI.notify
const oldPerformSuccess = `      await Store.fetchRemote();
      UI.toast(successMessage || result.message || 'Asset updated.', 'success');
      this.render();`;

const newPerformSuccess = `      await Store.fetchRemote();
      UI.notify.success(successMessage || result.message || 'Asset updated.', 'Action Completed');
      this.render();`;

if (app.includes(oldPerformSuccess)) {
  app = app.replace(oldPerformSuccess, newPerformSuccess);
  console.log('OK: Updated AdminPortal.performAssetAction notification');
}

// 5. In AdminPortal.init and BankPortal.init, ensure startPeriodicSync is called
const oldAdminInit = `    this.render();
    try {
      await Store.fetchRemote();
    } finally {
      this.render();
    }
  },`;

const newAdminInit = `    this.render();
    Store.startPeriodicSync();
    try {
      await Store.fetchRemote();
    } finally {
      this.render();
    }
  },`;

if (app.includes(oldAdminInit)) {
  app = app.replace(oldAdminInit, newAdminInit);
  console.log('OK: Added Store.startPeriodicSync to AdminPortal.init');
}

const oldBankInit = `    this.render();
    try {
      await Store.fetchRemote();
      await this.loadBranches();
    } finally {
      this.render();
    }
  },`;

const newBankInit = `    this.render();
    Store.startPeriodicSync();
    try {
      await Store.fetchRemote();
      await this.loadBranches();
    } finally {
      this.render();
    }
  },`;

if (app.includes(oldBankInit)) {
  app = app.replace(oldBankInit, newBankInit);
  console.log('OK: Added Store.startPeriodicSync to BankPortal.init');
}

if (hadCRLF) app = app.replace(/\n/g, '\r\n');
fs.writeFileSync('app.js', app, 'utf8');
fs.copyFileSync('app.js', 'public/app.js');
console.log('✓ app.js and public/app.js updated successfully.');

