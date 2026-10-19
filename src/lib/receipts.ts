import { RECEIPTS_STORAGE_KEY as WALLET_RECEIPTS_STORAGE_KEY } from '../hooks/useFreighterWallet'
import { RECEIPTS_STORAGE_KEY as SEARCH_RECEIPTS_STORAGE_KEY } from './searchPrivacy'

export function clearReceipts(): void {
  try {
    window.localStorage.removeItem(SEARCH_RECEIPTS_STORAGE_KEY)
    window.localStorage.removeItem(WALLET_RECEIPTS_STORAGE_KEY)
  } catch {
    // localStorage unavailable
  }
}
