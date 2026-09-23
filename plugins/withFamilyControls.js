const { withEntitlementsPlist, withXcodeProject, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Injects the com.apple.developer.family-controls entitlement into the iOS Entitlements plist.
 */
const withFamilyControlsEntitlement = (config) => {
  return withEntitlementsPlist(config, (modConfig) => {
    modConfig.modResults['com.apple.developer.family-controls'] = true;
    return modConfig;
  });
};

/**
 * Links the required Apple Screen Time frameworks in Xcode target:
 * - FamilyControls.framework
 * - DeviceActivity.framework
 * - ManagedSettings.framework
 */
const withFamilyControlsFrameworks = (config) => {
  return withXcodeProject(config, (modConfig) => {
    const xcodeProject = modConfig.modResults;
    const frameworks = [
      'FamilyControls.framework',
      'DeviceActivity.framework',
      'ManagedSettings.framework',
    ];

    frameworks.forEach((fw) => {
      try {
        xcodeProject.addFramework(fw, { weak: true });
      } catch (err) {
        // Framework may already be linked
      }
    });

    return modConfig;
  });
};

const withFamilyControls = (config) => {
  config = withFamilyControlsEntitlement(config);
  config = withFamilyControlsFrameworks(config);
  return config;
};

module.exports = createRunOncePlugin(withFamilyControls, 'withFamilyControls', '1.0.0');
