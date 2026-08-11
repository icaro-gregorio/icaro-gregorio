import { Info } from 'lucide-react';

/**
 * Banner shown on editable pages while the app runs in demo mode (no Firebase /
 * not signed in). Explains that changes won't be saved until Firebase is set up.
 */
export default function DemoNotice() {
  return (
    <div className="demo-notice">
      <Info size={17} />
      <span>
        <strong>Demo mode</strong> — you’re viewing sample data. Connect Firebase and sign in
        (see the README) to save your own entries.
      </span>
    </div>
  );
}
