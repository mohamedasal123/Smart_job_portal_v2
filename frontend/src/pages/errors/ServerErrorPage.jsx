import ErrorPageShell from '../../components/ErrorPageShell';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

export default function ServerErrorPage() {
  return (
    <ErrorPageShell
      code="500"
      icon="dns"
      title="Something went wrong"
      description="We're experiencing an internal server issue. Our team has been notified and is working to fix it. Please try again in a few minutes."
      primaryAction={{ label: 'Try Again', icon: 'refresh', onClick: () => window.location.reload() }}
      secondaryAction={{ label: 'Go to Home', to: ROUTES.HOME, icon: 'home' }}
    >
      <p className="font-body-md text-body-md text-on-surface-variant">
        If the issue persists, please{' '}
        <Link className="text-secondary hover:underline font-semibold" to={ROUTES.CONTACT}>
          contact support
        </Link>
        .
      </p>
    </ErrorPageShell>
  );
}
