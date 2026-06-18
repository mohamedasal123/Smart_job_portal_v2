import ErrorPageShell from '../../components/ErrorPageShell';
import { ROUTES } from '../../utils/constants';

export default function ForbiddenPage() {
  return (
    <ErrorPageShell
      code="403"
      icon="gpp_bad"
      title="Forbidden"
      description="You do not have permission to view this page. This area is restricted."
      secondaryAction={{ label: 'Go to Home', to: ROUTES.HOME, icon: 'home' }}
    />
  );
}
