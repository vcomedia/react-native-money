import Foundation

@objc(RNMoneyInput)
class TextInputMask: NSObject, RCTBridgeModule, MoneyInputListener {
    static func moduleName() -> String {
        "MoneyInput"
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        true
    }

    // Change from implicitly unwrapped to optional
    var bridge: RCTBridge?

    var methodQueue: DispatchQueue {
        if let queue = bridge?.uiManager.methodQueue {
            return queue
        } else {
            // Fallback to main queue or other appropriate default
            return DispatchQueue.main
        }
    }

    var masks: [String: MoneyInputDelegate] = [:]
    var listeners: [String: MoneyInputListener] = [:]
    
    @objc(formatMoney:locale:)
    func formatMoney(value: NSNumber, locale: NSString?) -> String {
        let (format, _) = MoneyMask.mask(value: value.doubleValue, locale: String(locale ?? "en_US"))
        return format
    }
    
    @objc(extractValue:locale:)
    func extractValue(value: NSString, locale: NSString?) -> NSNumber {
        return NSNumber(value: MoneyMask.unmask(input: String(value), locale: String(locale ?? "en_US")))
    }
    
    @objc(initializeMoneyInput:options:)
    func initializeMoneyInput(reactNode: NSNumber, options: NSDictionary) {
        bridge?.uiManager.addUIBlock { (uiManager, viewRegistry) in
            DispatchQueue.main.async {
                guard let view = viewRegistry?[reactNode] as? RCTBaseTextInputView else { return }
                guard let textView = view.backedTextInputView as? RCTUITextField else { return }
            
                let locale = options["locale"] as? String
                let maskedDelegate = MoneyInputDelegate(localeIdentifier: locale) { (_, value) in
                    guard let textField = textView as? UITextField else { return }
                    view.onChange?([
                        "text": value,
                        "target": view.reactTag,
                        "eventCount": view.nativeEventCount,
                    ])
                }
                let key = reactNode.stringValue
                self.listeners[key] = MaskedRCTBackedTextFieldDelegateAdapter(textField: textView)
                maskedDelegate.listener = self.listeners[key]
                self.masks[key] = maskedDelegate

                textView.delegate = self.masks[key]
            }
        }
    }
}

class MaskedRCTBackedTextFieldDelegateAdapter : RCTBackedTextFieldDelegateAdapter, MoneyInputListener {}
