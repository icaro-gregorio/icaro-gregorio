import { Card } from './Card.jsx';

/**
 * Placeholder body for modules that are scaffolded but not yet built out. Shows
 * the module's purpose and the planned capabilities so the navigation shell is
 * reviewable end-to-end.
 */
export default function ModulePlaceholder({ icon: Icon, title, description, features = [] }) {
  return (
    <Card>
      <div className="placeholder-page">
        {Icon && (
          <div className="placeholder-icon">
            <Icon size={26} strokeWidth={1.9} />
          </div>
        )}
        <div className="placeholder-title">{title}</div>
        <p style={{ maxWidth: 460, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
          {description}
        </p>
        {features.length > 0 && (
          <ul className="placeholder-list">
            {features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        )}
        <span className="pill" style={{ marginTop: 8 }}>Coming next</span>
      </div>
    </Card>
  );
}
