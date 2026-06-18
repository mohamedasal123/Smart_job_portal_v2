import ErrorPageShell from '../../components/ErrorPageShell';
import { ROUTES } from '../../utils/constants';

export default function NotFoundPage() {
  return (
    <ErrorPageShell
      code="404"
      icon="find_in_page"
      title="Page Not Found"
      description="Oops! The page you're looking for doesn't exist or has been moved. Let's get you back to finding your next career opportunity."
      primaryAction={{ label: 'Search Jobs', to: ROUTES.JOBS, icon: 'search' }}
      secondaryAction={{ label: 'Go to Home', to: ROUTES.HOME, icon: 'home' }}
    />
  );
}
