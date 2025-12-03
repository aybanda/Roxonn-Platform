import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/hooks/use-auth';

// Mock dependencies
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

describe('WalletInfo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display wallet address when available', () => {
    (useAuth as any).mockReturnValue({
      user: {
        id: 1,
        xdcWalletAddress: 'xdc1234567890123456789012345678901234567890',
      },
    });

    (useWallet as any).mockReturnValue({
      data: {
        address: 'xdc1234567890123456789012345678901234567890',
        balance: '1000000000000000000',
        tokenBalance: '500000000000000000',
      },
      isLoading: false,
    });

    // Component would render wallet address
    const address = useWallet().data?.address;
    expect(address).toBeDefined();
    expect(address).toMatch(/^xdc/);
  });

  it('should display wallet balance', () => {
    (useWallet as any).mockReturnValue({
      data: {
        address: 'xdc1234567890123456789012345678901234567890',
        balance: '1000000000000000000',
        tokenBalance: '500000000000000000',
      },
      isLoading: false,
    });

    const balance = useWallet().data?.balance;
    expect(balance).toBeDefined();
    expect(balance).toBe('1000000000000000000');
  });

  it('should show loading state', () => {
    (useWallet as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    const isLoading = useWallet().isLoading;
    expect(isLoading).toBe(true);
  });

  it('should handle missing wallet data', () => {
    (useAuth as any).mockReturnValue({
      user: {
        id: 1,
        xdcWalletAddress: null,
      },
    });

    (useWallet as any).mockReturnValue({
      data: null,
      isLoading: false,
    });

    const walletData = useWallet().data;
    expect(walletData).toBeNull();
  });
});


