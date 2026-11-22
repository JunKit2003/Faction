import { Link } from 'react-router';
import { PageHero } from '../PageHero';

export default function NotFound() {
  return (
    <>
      <PageHero title="Page not found" intro="That trail doesn’t exist. Let’s get you back on track." />
      <div className="container-x pb-32"><Link to="/" className="btn btn-primary">Back to home</Link></div>
    </>
  );
}
