import { NAV_ITEMS, ADMIN_NAV_ITEMS, getVisibleNavItems, INavItem } from './nav-items';

/**
 * Property Test 13: Role-Based Navigation Filtering
 *
 * For any user with any set of roles, verify visible items equal the set union
 * of permitted items; no roles → Dashboard only.
 *
 * **Validates: Requirements 13.1, 13.7, 13.8**
 *
 * This test uses parameterized test data covering multiple role combinations
 * to validate the property across the input space.
 */
describe('Property 13: Role-Based Navigation Filtering', () => {

  describe('Core property: visible items equal set union of permitted items', () => {

    // All role combinations to test (covering single, multi, and edge cases)
    const roleCombinations: { roles: string[]; description: string }[] = [
      { roles: [], description: 'no roles' },
      { roles: ['SuperAdmin'], description: 'SuperAdmin' },
      { roles: ['AcquisitionManager'], description: 'AcquisitionManager' },
      { roles: ['LegalOfficer'], description: 'LegalOfficer' },
      { roles: ['FinanceDirector'], description: 'FinanceDirector' },
      { roles: ['PlanningManager'], description: 'PlanningManager' },
      { roles: ['ProjectManager'], description: 'ProjectManager' },
      { roles: ['SiteManager'], description: 'SiteManager' },
      { roles: ['SalesManager'], description: 'SalesManager' },
      { roles: ['PropertyManager'], description: 'PropertyManager' },
      { roles: ['CompletionManager'], description: 'CompletionManager' },
      { roles: ['ValuationAnalyst'], description: 'ValuationAnalyst' },
      { roles: ['Surveyor'], description: 'Surveyor' },
      { roles: ['Admin'], description: 'Admin' },
      { roles: ['AcquisitionManager', 'LegalOfficer'], description: 'AcquisitionManager + LegalOfficer' },
      { roles: ['FinanceDirector', 'PlanningManager'], description: 'FinanceDirector + PlanningManager' },
      { roles: ['AcquisitionManager', 'FinanceDirector', 'LegalOfficer'], description: 'three roles combined' },
      { roles: ['ProjectManager', 'SiteManager', 'SalesManager'], description: 'construction/sales roles' },
      { roles: ['SuperAdmin', 'AcquisitionManager'], description: 'SuperAdmin with another role' },
    ];

    roleCombinations.forEach(({ roles, description }) => {

      describe(`with roles: [${description}]`, () => {

        it('visible items should be exactly the union of items permitted by each role', () => {
          const visible = getVisibleNavItems(NAV_ITEMS, roles);

          // Compute expected set: union of items where user has at least one matching role
          const expected = NAV_ITEMS.filter(item => {
            if (roles.length === 0) {
              return item.roles.length === 0; // Only unrestricted items
            }
            return item.roles.length === 0 || item.roles.some(r => roles.includes(r));
          });

          // Same items (by routerLink as unique key)
          const visibleLinks = visible.map(i => i.routerLink).sort();
          const expectedLinks = expected.map(i => i.routerLink).sort();

          expect(visibleLinks).toEqual(expectedLinks);
        });

        it('should contain no duplicate items', () => {
          const visible = getVisibleNavItems(NAV_ITEMS, roles);
          const links = visible.map(i => i.routerLink);
          const uniqueLinks = [...new Set(links)];
          expect(links.length).toBe(uniqueLinks.length);
        });
      });
    });
  });

  describe('No roles → Dashboard only', () => {
    it('should show only Dashboard when user has no roles', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, []);
      expect(visible.length).toBe(1);
      expect(visible[0].routerLink).toBe('/home');
      expect(visible[0].label).toBe('Dashboard');
    });

    it('should not show any admin nav items when user has no roles', () => {
      const visible = getVisibleNavItems(ADMIN_NAV_ITEMS, []);
      expect(visible.length).toBe(0);
    });
  });

  describe('SuperAdmin sees all sections', () => {
    it('should show all NAV_ITEMS for SuperAdmin', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['SuperAdmin']);
      // SuperAdmin should see every item (all items have SuperAdmin in roles or empty roles)
      expect(visible.length).toBe(NAV_ITEMS.length);
    });

    it('should show all admin nav items for SuperAdmin', () => {
      const visible = getVisibleNavItems(ADMIN_NAV_ITEMS, ['SuperAdmin']);
      expect(visible.length).toBe(ADMIN_NAV_ITEMS.length);
    });

    it('should include Administration items: Users, Roles, Audit Logs, System Settings', () => {
      const visible = getVisibleNavItems(ADMIN_NAV_ITEMS, ['SuperAdmin']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Users');
      expect(labels).toContain('Roles');
      expect(labels).toContain('Audit Logs');
      expect(labels).toContain('System Settings');
    });
  });

  describe('AcquisitionManager sees Dashboard, Land Acquisition, Reports', () => {
    it('should include Dashboard', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['AcquisitionManager']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Dashboard');
    });

    it('should include Land Acquisition', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['AcquisitionManager']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Land Acquisition');
    });

    it('should include Reports', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['AcquisitionManager']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Reports');
    });

    it('should NOT include Legal & Compliance', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['AcquisitionManager']);
      const labels = visible.map(i => i.label);
      expect(labels).not.toContain('Legal & Compliance');
    });
  });

  describe('LegalOfficer sees Dashboard, Legal & Compliance, Reports', () => {
    it('should include Dashboard', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['LegalOfficer']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Dashboard');
    });

    it('should include Legal & Compliance', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['LegalOfficer']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Legal & Compliance');
    });

    it('should include Reports', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['LegalOfficer']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Reports');
    });

    it('should NOT include Land Acquisition', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['LegalOfficer']);
      const labels = visible.map(i => i.label);
      expect(labels).not.toContain('Land Acquisition');
    });
  });

  describe('FinanceDirector sees Dashboard, Finance, Reports, Land Acquisition', () => {
    it('should include Dashboard', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['FinanceDirector']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Dashboard');
    });

    it('should include Finance & Budget', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['FinanceDirector']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Finance & Budget');
    });

    it('should include Reports', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['FinanceDirector']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Reports');
    });

    it('should include Land Acquisition', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['FinanceDirector']);
      const labels = visible.map(i => i.label);
      expect(labels).toContain('Land Acquisition');
    });

    it('should NOT include Legal & Compliance', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['FinanceDirector']);
      const labels = visible.map(i => i.label);
      expect(labels).not.toContain('Legal & Compliance');
    });
  });

  describe('Multi-role union property', () => {
    it('AcquisitionManager + LegalOfficer sees union of both role sets', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['AcquisitionManager', 'LegalOfficer']);
      const labels = visible.map(i => i.label);

      // Should see Dashboard (all), Land Acquisition (AcqMgr), Legal (Legal), Reports (both)
      expect(labels).toContain('Dashboard');
      expect(labels).toContain('Land Acquisition');
      expect(labels).toContain('Legal & Compliance');
      expect(labels).toContain('Reports');
    });

    it('union should not contain duplicates even when both roles allow same item', () => {
      const visible = getVisibleNavItems(NAV_ITEMS, ['AcquisitionManager', 'FinanceDirector']);
      const links = visible.map(i => i.routerLink);
      const uniqueLinks = [...new Set(links)];
      // Reports is accessible to both, but should only appear once
      expect(links.length).toBe(uniqueLinks.length);
    });
  });

  describe('Non-SuperAdmin cannot see admin items', () => {
    const nonSuperAdminRoles = [
      'AcquisitionManager', 'LegalOfficer', 'FinanceDirector',
      'PlanningManager', 'ProjectManager', 'SiteManager'
    ];

    nonSuperAdminRoles.forEach(role => {
      it(`${role} should not see admin nav items`, () => {
        const visible = getVisibleNavItems(ADMIN_NAV_ITEMS, [role]);
        expect(visible.length).toBe(0);
      });
    });
  });
});
