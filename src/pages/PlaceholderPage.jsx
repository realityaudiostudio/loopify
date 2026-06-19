import './PlaceholderPage.css';

export default function PlaceholderPage({ title = 'Coming Soon' }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">🚧</div>
      <h2 className="headline-lg-mobile">{title}</h2>
      <p className="body-sm">This screen is under construction.</p>
    </div>
  );
}
