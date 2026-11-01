import Foundation

/// Private mode: new copies and screen captures are skipped while it is on.
///
/// Existing history is never touched, and anything copied during the pause is
/// remembered as seen so turning capture back on does not import it. A missing
/// preference means capture is running.
enum CapturePause {
    private static let key = "capturePaused"

    static var isPaused: Bool {
        get { UserDefaults.standard.bool(forKey: key) }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }
}
