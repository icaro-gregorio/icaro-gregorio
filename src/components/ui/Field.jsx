/** Labelled form controls sharing consistent styling. */

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextInput({ prefix, ...props }) {
  if (prefix) {
    return (
      <span className="input-wrap">
        <span className="input-prefix">{prefix}</span>
        <input className="input has-prefix" {...props} />
      </span>
    );
  }
  return <input className="input" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="input" {...props}>
      {children}
    </select>
  );
}

export function Button({ variant = 'primary', children, ...props }) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}
