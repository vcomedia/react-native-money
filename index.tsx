import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import {
  findNodeHandle,
  NativeModules,
  TextInput,
  TextInputProps,
} from 'react-native'

const {RNMoneyInput} = NativeModules as {RNMoneyInput: NativeExports}
export const {
  initializeMoneyInput,
  extractValue,
  formatMoney,
} = RNMoneyInput

if (!RNMoneyInput) {
  throw new Error(`NativeModule: RNMoneyInput is null.
To fix this issue try these steps:
  • Rebuild and restart the app.
  • Run the packager with \`--clearCache\` flag.
  • If happening on iOS, run \`pod install\` in the \`ios\` directory and then rebuild and re-run the app.
`)
}

type NativeExports = {
  initializeMoneyInput: (reactNode: Number, options: any) => void
  formatMoney: (value: Number, locale?: string) => string
  extractValue: (label: string, locale?: string) => number
}

type MoneyInputProps = TextInputProps & {
  value?: number
  defaultValue?: number
  locale?: string
  onChangeText?: (value: number, label: string) => void
}

interface Handles {
  focus: () => void
  blur: () => void
}

const MoneyInput = forwardRef<Handles, MoneyInputProps>(
  ({defaultValue, value, onChangeText, locale, onFocus, ...rest}, ref) => {
    // Create a default input
    const [ defaultMoney ] = useState(defaultValue ?? value)
    const [ defaultLabel ] = useState(defaultMoney != null ? formatMoney(
      defaultMoney,
      locale
    ) : '')

    // Keep a reference to the actual text input
    const input = useRef<TextInput>(null)
    const [rawValue, setValue] = useState<number|undefined>(defaultMoney)
    const [label, setLabel] = useState<string>(defaultLabel)

    // Keep numeric prop in sync with out state
    useEffect(() => {
        if (value != null && value != rawValue) {
            setValue(value)
            setLabel(formatMoney(value, locale));
        } 
        // else if(value == null && value != rawValue) {
        //     setValue(undefined);
        //     setLabel('');
        // }
    }, [value, rawValue])

    // Convert TextInput to MoneyInput native type
    useEffect(() => {
      const nodeId = findNodeHandle(input.current)
      if (nodeId) initializeMoneyInput(nodeId, { locale })
    }, [locale])

    // Create a false ref interface
    useImperativeHandle(ref, () => ({
      focus: () => {
        input.current?.focus()
      },
      blur: () => {
        input.current?.blur()
      },
    }))

    return (
      <TextInput
        {...rest}
        ref={input}
        value={label}
        onFocus={e => {
          if (defaultLabel == "" && !rawValue) {
            setValue(0)
            setLabel(formatMoney(0, locale));
          }

          onFocus?.(e)
        }}
        onChangeText={async label => {
          const computedValue = extractValue(label, locale)
          setLabel(label)
          setValue(computedValue)
          onChangeText?.(computedValue, label)
        }}
      />
    )
  }
)

export default MoneyInput
