import ExpoModulesCore
import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity
import SwiftUI

public class SovereignShieldModule: Module {
  private let store = ManagedSettingsStore()
  private let activityCenter = DeviceActivityCenter()
  private let appGroupName = "group.com.sovereign.app"
  private var selection = FamilyActivitySelection()

  public func definition() -> ModuleDefinition {
    Name("SovereignShield")

    // Request Screen Time authorization (for: .individual)
    AsyncFunction("requestAuthorizationAsync") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        Task {
          do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            promise.resolve(true)
          } catch {
            promise.reject("AUTH_FAILED", "Failed to authorize FamilyControls: \(error.localizedDescription)")
          }
        }
      } else {
        promise.resolve(false)
      }
    }

    // Check authorization status
    AsyncFunction("isAuthorizedAsync") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        let status = AuthorizationCenter.shared.authorizationStatus
        promise.resolve(status == .approved)
      } else {
        promise.resolve(false)
      }
    }

    // Present FamilyActivityPicker to let user pick trigger apps (privacy-preserving opaque tokens)
    AsyncFunction("presentAppPickerAsync") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        DispatchQueue.main.async {
          guard let rootVC = UIApplication.shared.windows.first?.rootViewController else {
            promise.reject("NO_ROOT_VC", "Cannot find root view controller")
            return
          }

          // FamilyActivityPicker SwiftUI container
          let pickerVC = UIHostingController(
            rootView: FamilyPickerView(selection: self.selection) { updatedSelection in
              self.selection = updatedSelection
              self.saveSelectionToAppGroup(updatedSelection)
              rootVC.dismiss(animated: true) {
                promise.resolve(updatedSelection.applicationTokens.count)
              }
            }
          )

          rootVC.present(pickerVC, animated: true, completion: nil)
        }
      } else {
        promise.resolve(0)
      }
    }

    // Activate Emergency Shield (ManagedSettingsStore + 15 min DeviceActivity)
    AsyncFunction("activateShieldAsync") { (durationMinutes: Int, promise: Promise) in
      if #available(iOS 16.0, *) {
        DispatchQueue.main.async {
          // 1. Lock trigger apps with ManagedSettingsStore
          self.store.shield.applications = self.selection.applicationTokens

          // 2. Enable Adult Web Content Filter at the OS kernel level
          self.store.webContent.blockedByFilter = .auto()

          // 3. Register DeviceActivity schedule so OS drops shield automatically even if app is terminated
          let scheduleMinutes = max(1, durationMinutes)
          let activityName = DeviceActivityName("com.sovereign.emergencyDefense")
          let now = Calendar.current.dateComponents([.hour, .minute, .second], from: Date())
          let end = Calendar.current.dateComponents(
            [.hour, .minute, .second],
            from: Date().addingTimeInterval(TimeInterval(scheduleMinutes * 60))
          )

          let schedule = DeviceActivitySchedule(
            intervalStart: now,
            intervalEnd: end,
            repeats: false
          )

          do {
            try self.activityCenter.startMonitoring(activityName, during: schedule)
          } catch {
            print("[SovereignShield] DeviceActivity scheduling notice: \(error.localizedDescription)")
          }

          promise.resolve(true)
        }
      } else {
        promise.resolve(false)
      }
    }

    // Drop Active Shield
    AsyncFunction("dropShieldAsync") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        DispatchQueue.main.async {
          self.store.shield.applications = nil
          self.activityCenter.stopMonitoring([DeviceActivityName("com.sovereign.emergencyDefense")])
          promise.resolve(true)
        }
      } else {
        promise.resolve(false)
      }
    }

    // Adult Content Filter toggle
    AsyncFunction("setAdultContentFilterAsync") { (enabled: Bool, promise: Promise) in
      if #available(iOS 16.0, *) {
        DispatchQueue.main.async {
          if enabled {
            self.store.webContent.blockedByFilter = .auto()
          } else {
            self.store.webContent.blockedByFilter = nil
          }
          promise.resolve(true)
        }
      } else {
        promise.resolve(false)
      }
    }

    // Get current shield state
    AsyncFunction("getShieldStatusAsync") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        let isShielded = (self.store.shield.applications != nil && !(self.store.shield.applications?.isEmpty ?? true))
        let isWebFiltered = self.store.webContent.blockedByFilter != nil
        let appCount = self.selection.applicationTokens.count

        let result: [String: Any] = [
          "isActive": isShielded,
          "appCount": appCount,
          "isWebFilterActive": isWebFiltered
        ]
        promise.resolve(result)
      } else {
        promise.resolve([
          "isActive": false,
          "appCount": 0,
          "isWebFilterActive": false
        ])
      }
    }
  }

  private func saveSelectionToAppGroup(_ selection: FamilyActivitySelection) {
    if let userDefaults = UserDefaults(suiteName: appGroupName) {
      if let encoded = try? JSONEncoder().encode(selection) {
        userDefaults.set(encoded, forKey: "sovereign_family_selection")
      }
    }
  }
}

// Minimal SwiftUI sheet hosting FamilyActivityPicker
@available(iOS 16.0, *)
struct FamilyPickerView: View {
  @State var selection: FamilyActivitySelection
  var onSave: (FamilyActivitySelection) -> Void

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Shielded Apps")
        .toolbar {
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              onSave(selection)
            }
          }
        }
    }
  }
}
