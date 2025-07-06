import { render, screen } from '@testing-library/react';
import { MockAuthProvider, useMockAuth } from './MockAuthContext';

const ProdProbe = () => (
  <MockAuthProvider>
    <div>probe</div>
  </MockAuthProvider>
);

// eslint-disable-next-line jest/expect-expect -- This test checks for thrown error
describe('MockAuthProvider', () => {
  it('throws in prod without flag', () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, NODE_ENV: 'production', NEXT_PUBLIC_USE_MOCK_AUTH: 'false' };
    expect(() => render(<ProdProbe />)).toThrow();
    process.env = originalEnv;
  });

  const ShowUser = () => {
    const { user } = useMockAuth();
    return <span>{user?.id}</span>;
  };

  it('returns the fixed mock user', () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, NODE_ENV: 'test', NEXT_PUBLIC_USE_MOCK_AUTH: 'true' };
    render(
      <MockAuthProvider>
        <ShowUser />
      </MockAuthProvider>
    );
    expect(screen.getByText('00000000-0000-4000-8000-000000000001')).toBeInTheDocument();
    process.env = originalEnv;
  });
});
