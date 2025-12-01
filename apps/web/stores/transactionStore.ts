import { create } from 'zustand';
import { Address } from 'viem';
import { PendingTransaction } from '@shungerfund/shared/types';

interface TransactionStore {
  pendingTransactions: Map<string, PendingTransaction>;
  addPendingTransaction: (tx: PendingTransaction) => void;
  removePendingTransaction: (hash: `0x${string}`) => void;
  isTransactionPending: (hash: `0x${string}`) => boolean;
  hasPendingTransaction: (type: PendingTransaction['type'], campaignAddress?: Address) => boolean;
  clearPendingTransactions: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  pendingTransactions: new Map(),

  addPendingTransaction: (tx: PendingTransaction) => {
    set((state) => {
      const newMap = new Map(state.pendingTransactions);
      newMap.set(tx.hash, tx);
      return { pendingTransactions: newMap };
    });
  },

  removePendingTransaction: (hash: `0x${string}`) => {
    set((state) => {
      const newMap = new Map(state.pendingTransactions);
      newMap.delete(hash);
      return { pendingTransactions: newMap };
    });
  },

  isTransactionPending: (hash: `0x${string}`) => {
    return get().pendingTransactions.has(hash);
  },

  hasPendingTransaction: (type: PendingTransaction['type'], campaignAddress?: Address) => {
    const transactions = Array.from(get().pendingTransactions.values());
    return transactions.some(
      (tx) => tx.type === type && (!campaignAddress || tx.campaignAddress === campaignAddress)
    );
  },

  clearPendingTransactions: () => {
    set({ pendingTransactions: new Map() });
  },
}));

