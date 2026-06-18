import ErrorPageShell from '../../components/ErrorPageShell';
import { ROUTES } from '../../utils/constants';

export default function UnauthorizedPage() {
  return (
    <ErrorPageShell
      code="401"
      icon="lock"
      title="Unauthorized"
      description="You must be logged in to access this page. Please log in or register."
      primaryAction={{ label: 'Login', to: ROUTES.LOGIN, icon: 'login' }}
      secondaryAction={{ label: 'Go to Home', to: ROUTES.HOME, icon: 'home' }}
    />
  );
}
